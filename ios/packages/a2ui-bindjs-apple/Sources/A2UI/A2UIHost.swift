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

    /// The renderer, held as the JavaScript object it is.
    ///
    /// Every call out goes through `invokeMethod` on this rather than through evaluated
    /// source: arguments cross as values instead of being escaped into a string and
    /// re-parsed, which is both cheaper per render and one fewer thing to get wrong.
    ///
    /// `nil` only when the bundled renderer could not be loaded, which `diagnostics` says.
    private let bridge: JSValue?

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
        self.bridge = Self.loadRenderer(into: context.javaScriptContext)

        guard let bridge else {
            diagnostics = [A2UIDiagnostic(surfaceId: "", componentId: nil, message: "The A2UI renderer bundle is missing from the package.")]
            return
        }

        // `.bcp47`, not `identifier`: the plain one is ICU form (`en_US`), and `Intl` throws
        // `RangeError` on the underscore rather than tolerating it — so a host that left the
        // default in place would fail the first time a surface called `formatCurrency`.
        // `bindjs-android` reaches the same tag through `Locale.toLanguageTag()`.
        attach(bridge, locale: locale ?? Locale.current.identifier(.bcp47), timeZone: timeZone ?? TimeZone.current.identifier)
        observeSurfaces(bridge)
        forwardActions(bridge)
    }

    /// Loads the renderer into the context the runtime already lives in.
    ///
    /// It installs itself as the global `a2ui`, which is what comes back.
    private static func loadRenderer(into jsContext: JSContext) -> JSValue? {
        guard
            let url = Bundle.module.url(forResource: "a2ui-native", withExtension: "js"),
            let source = try? String(contentsOf: url, encoding: .utf8)
        else {
            return nil
        }

        jsContext.evaluateScript(source)

        guard let bridge = jsContext.objectForKeyedSubscript("a2ui"), !bridge.isUndefined, !bridge.isNull else {
            return nil
        }

        return bridge
    }

    /// Points the renderer at the host's runtime.
    ///
    /// Fetched by evaluating its name, not by `objectForKeyedSubscript`: it is a `const` in
    /// `BindJSRuntimeWrapper.js`, so it lives in the global *lexical* environment and is not
    /// a property of `globalThis` — a subscript lookup comes back `undefined`.
    ///
    /// It is also not the same object as the `runtime` `BindJSContext` holds. That one is
    /// the wrapper's facade (`setComponents`, `callComponent`, `willRender`); this is the
    /// `BindJSRuntime` beneath it, which is what has `registerComponent` for the catalog.
    private func attach(_ bridge: JSValue, locale: String, timeZone: String) {
        guard let runtime = context.javaScriptContext.evaluateScript("runtime"), runtime.isObject else {
            diagnostics = [A2UIDiagnostic(surfaceId: "", componentId: nil, message: "The BindJS runtime is missing from the context.")]
            return
        }

        bridge.invokeMethod("attach", withArguments: [runtime, ["locale": locale, "timeZone": timeZone]])
    }

    // MARK: - Catalog

    /// Registers BindJS components of the app's own and names the A2UI types they draw.
    ///
    /// `sources` is BindJS component name → source. `catalog` is A2UI type → BindJS
    /// component name, and it is merged over the current catalog: name only the entries
    /// you are adding or replacing, and the basic catalog stays underneath. Call it before
    /// the first surface arrives.
    ///
    /// The same call adds a type the basic catalog lacks (`["Rating": "Rating"]`) or
    /// restyles one it has (`["Button": "BrandButton"]`).
    public func useCatalog(sources: [String: String], catalog: [String: String] = [:]) {
        bridge?.invokeMethod("useCatalog", withArguments: [sources, catalog])
        collectDiagnostics()
    }

    // MARK: - Messages in

    /// Applies one agent message or an array of them, as JSON.
    public func apply(_ messages: String) {
        bridge?.invokeMethod("applyMessages", withArguments: [messages])

        // Not `objectWillChange` here: the store's own notification covers it.
        collectDiagnostics()
    }

    /// Writes into the data model, as a two-way bound control would.
    public func setValue(_ value: Any, surfaceId: String, path: String) {
        bridge?.invokeMethod("setValue", withArguments: [surfaceId, path, value])
    }

    /// Drops every surface and starts over.
    public func reset() {
        bridge?.invokeMethod("reset", withArguments: [])
        collectDiagnostics()
    }

    public var surfaceIds: [String] {
        bridge?.invokeMethod("surfaceIds", withArguments: [])?.toArray() as? [String] ?? []
    }

    // MARK: - Rendering

    /// Builds the AST for a surface.
    ///
    /// Call it inside `BindJSContext.view(id:buildingAST:)` and nowhere else: the runtime's
    /// component-path counters have to be reset immediately before this and the tree
    /// decoded immediately after, and that method is what holds the three together.
    public func ast(for surfaceId: String) -> JSValue? {
        guard let result = bridge?.invokeMethod("render", withArguments: [surfaceId]) else {
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
            guard
                let result = bridge?.invokeMethod("render", withArguments: [surfaceId]),
                let entries = result.forProperty("diagnostics")?.toArray() as? [[String: Any]]
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
    private func observeSurfaces(_ bridge: JSValue) {
        let changed: @convention(block) () -> Void = { [weak self] in
            DispatchQueue.main.async {
                self?.objectWillChange.send()
            }
        }

        bridge.invokeMethod("onChange", withArguments: [changed])
    }

    /// Delivers actions as they are dispatched.
    ///
    /// A tap happens inside JavaScript with no Swift frame beneath it to return into, so
    /// the bridge queues actions and calls back when one arrives. Polling would not do: an
    /// action need not change the data model, so there may be no redraw to notice it on.
    private func forwardActions(_ bridge: JSValue) {
        let pending: @convention(block) () -> Void = { [weak self] in
            DispatchQueue.main.async {
                self?.deliverActions()
            }
        }

        bridge.invokeMethod("onActions", withArguments: [pending])
    }

    private func deliverActions() {
        guard let entries = bridge?.invokeMethod("takeActions", withArguments: [])?.toArray() as? [[String: Any]] else {
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
