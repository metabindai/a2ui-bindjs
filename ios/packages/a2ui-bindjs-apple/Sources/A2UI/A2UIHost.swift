// A2UI on a BindJS host.
//
// One `BindJSContext`, and therefore one `BindJSRuntime`, shared by the app and the A2UI
// renderer. That sharing is not an optimisation: a `handlerId` in the AST only resolves
// back to a closure inside the instance that stored it, and hook state is keyed by
// component path within that instance. A renderer carrying a second runtime would draw a
// correct-looking tree and then do nothing at all when tapped.
//
// So a host that already renders BindJS components passes its context in, and A2UI
// surfaces and hand-written components share one runtime.

import Foundation
import BindJS
import JavaScriptCore

public final class A2UIHost: ObservableObject {

    /// The context surfaces are drawn through. Pass in an existing one to share it.
    public let context: BindJSContext

    /// Called when a surface dispatches an action, on the main queue.
    ///
    /// This is the agent's half of the conversation: answer it with more A2UI and pass
    /// that back to `apply`.
    public var onAction: ((A2UIAction) -> Void)?

    /// What the renderer could not draw. Empty is the healthy case.
    @Published public private(set) var diagnostics: [A2UIDiagnostic] = []

    // MARK: - Lifecycle

    /// - Parameters:
    ///   - context: an existing context to share, or a fresh one.
    ///   - locale: BCP 47 tag used by the formatting functions. Defaults to the device's.
    ///   - timeZone: IANA identifier used by the date functions. Defaults to the device's.
    public init(context: BindJSContext = BindJSContext(), locale: String? = nil, timeZone: String? = nil) {
        self.context = context

        attachRenderer(locale: locale ?? Locale.current.identifier, timeZone: timeZone ?? TimeZone.current.identifier)
        observeSurfaces()
        forwardActions()
    }

    /// Loads the renderer into the context the runtime already lives in, and attaches it
    /// to that runtime.
    ///
    /// `runtime` is the JavaScript global `BindJSRuntimeWrapper.js` defines — the instance
    /// `BindJSContext` itself calls `callComponent` on.
    private func attachRenderer(locale: String, timeZone: String) {
        guard
            let url = Bundle.module.url(forResource: "a2ui-native", withExtension: "js"),
            let source = try? String(contentsOf: url, encoding: .utf8)
        else {
            diagnostics = [A2UIDiagnostic(surfaceId: "", componentId: nil, message: "The A2UI renderer bundle is missing from the package.")]
            return
        }

        context.evaluate(source)
        context.evaluate("a2ui.attach(runtime, { locale: \(jsLiteral(locale)), timeZone: \(jsLiteral(timeZone)) })")
    }

    // MARK: - Messages in

    /// Applies one agent message or an array of them, as JSON.
    public func apply(_ messages: String) {
        context.evaluate("a2ui.applyMessages(\(jsLiteral(messages)))")

        // Not `objectWillChange` here: the store's own notification covers it.
        collectDiagnostics()
    }

    /// Writes into the data model, as a two-way bound control would.
    public func setValue(_ value: Any, surfaceId: String, path: String) {
        context.evaluate("a2ui.setValue(\(jsLiteral(surfaceId)), \(jsLiteral(path)), \(jsValue(value)))")
    }

    /// Drops every surface and starts over.
    public func reset() {
        context.evaluate("a2ui.reset()")
        collectDiagnostics()
    }

    public var surfaceIds: [String] {
        context.evaluate("a2ui.surfaceIds()")?.toArray() as? [String] ?? []
    }

    // MARK: - Rendering

    /// Builds the AST for a surface, ready for `A2UISurfaceView` to decode.
    ///
    /// `willRender` first: it resets the runtime's component-path counters so hook state
    /// lines up with the pass about to happen, exactly as `viewForName` does.
    public func ast(for surfaceId: String) -> JSValue? {
        context.willRender()

        guard let result = context.evaluate("a2ui.render(\(jsLiteral(surfaceId)))") else {
            return nil
        }

        guard let ast = result.forProperty("ast"), !ast.isUndefined, !ast.isNull else {
            return nil
        }

        return ast
    }

    /// Renders every surface once purely to harvest diagnostics.
    ///
    /// Doing it here rather than during a SwiftUI pass keeps `@Published` writes out of
    /// view updates. It costs nothing: the render session memoises subtrees, so this is
    /// work the next redraw would have skipped anyway.
    private func collectDiagnostics() {
        var collected: [A2UIDiagnostic] = []

        for surfaceId in surfaceIds {
            let json = context.evaluate("JSON.stringify(a2ui.render(\(jsLiteral(surfaceId))).diagnostics)")

            guard
                let text = json?.toString(),
                let data = text.data(using: .utf8),
                let entries = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
            else {
                continue
            }

            for entry in entries {
                collected.append(
                    A2UIDiagnostic(
                        surfaceId: surfaceId,
                        componentId: entry["componentId"] as? String,
                        message: entry["message"] as? String ?? "unknown"
                    )
                )
            }
        }

        diagnostics = collected
    }

    // MARK: - Signals out

    /// Redraws when a surface changes.
    ///
    /// Nothing else will. A control writing back into the data model does not touch BindJS
    /// hook state — the model owns the value — so the runtime never marks itself dirty and
    /// `BindJSContext` has nothing to publish. Without this the store updates correctly and
    /// the screen keeps showing the tree it drew first.
    ///
    /// `useA2UIStore` is the web equivalent, via `useSyncExternalStore`.
    private func observeSurfaces() {
        let changed: @convention(block) () -> Void = { [weak self] in
            DispatchQueue.main.async {
                self?.objectWillChange.send()
            }
        }

        context.setGlobal(changed, forName: "a2uiSurfacesChanged")
        context.evaluate("a2ui.onChange(() => a2uiSurfacesChanged())")
    }

    /// Delivers actions as they are dispatched.
    ///
    /// A tap happens inside JavaScript with no Swift frame beneath it to return into, so
    /// the bridge queues actions and calls back when one arrives. Polling would not do: an
    /// action need not change the data model, so there may be no redraw to notice it on.
    private func forwardActions() {
        let pending: @convention(block) () -> Void = { [weak self] in
            DispatchQueue.main.async {
                self?.deliverActions()
            }
        }

        context.setGlobal(pending, forName: "a2uiActionsPending")
        context.evaluate("a2ui.onActions(() => a2uiActionsPending())")
    }

    private func deliverActions() {
        let json = context.evaluate("a2ui.takeActionsJSON()")?.toString() ?? "[]"

        guard
            let data = json.data(using: .utf8),
            let entries = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
        else {
            return
        }

        for entry in entries {
            guard let action = A2UIAction(json: entry) else {
                continue
            }

            onAction?(action)
        }
    }
}
