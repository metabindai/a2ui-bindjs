import SwiftUI
import JavaScriptCore
import os

private let bindJSLog = Logger(subsystem: "BindJS", category: "Runtime")

public struct BindJSPreviewInfo: Sendable, Equatable {
    public let id: String
    public let title: String
}

public class BindJSContext: ObservableObject {
    private let jsContext: JSContext
    private let runtime: JSValue
    private var actionCallback: ((ContentAction) -> Void)?

    public private(set) var renderRevision: UInt64 = 0

    private var openURL: OpenURLAction?
    private var appState: [String: Any] = [:]
    private var appStateCallback: ((String, Any) -> Void)?
    private var jsTimers: JSTimers
    private var rerenderScheduled = false
    private var mcpHost: MCPHostBridge?

    public init() {
        jsContext = JSContext()!
        jsContext.exceptionHandler = { _, exception in
            if let exception = exception {
                let message = exception.toString() ?? "<unprintable>"
                let stack = exception.forProperty("stack")?.toString() ?? ""
                bindJSLog.error("JS Error: \(message, privacy: .public)\n\(stack, privacy: .public)")
            }
        }
        jsTimers = JSTimers()
        jsTimers.install(in: jsContext)
        runtime = jsContext.evaluateScript(Self.loadRuntime())
        setupConsoleLog()
        setupNeedsRerender()
        setupWithAnimation()
        setupAction()
        setupOnOpenURL()
        setupAppStateListener()
    }

    private func setupConsoleLog() {
        let logBlock: @convention(block) () -> Void = {
            guard
                let args = JSContext.currentArguments(),
                let ctx = JSContext.current(),
                let json = ctx.objectForKeyedSubscript("JSON")
            else { return }

            let output = args.map { raw -> String in
                guard let jsVal = raw as? JSValue else {
                    return String(describing: raw)
                }
                if jsVal.isNull        { return "null" }
                if jsVal.isUndefined   { return "undefined" }
                if jsVal.isString      { return jsVal.toString() ?? "" }
                if jsVal.isBoolean     { return jsVal.toBool() ? "true" : "false" }
                if jsVal.isNumber      { return String(jsVal.toDouble()) }

                // Check if it's an Error object (has message and/or stack properties)
                if let message = jsVal.forProperty("message"), !message.isUndefined {
                    let stack = jsVal.forProperty("stack")?.toString() ?? ""
                    let errorMessage = message.toString() ?? "Unknown error"
                    if !stack.isEmpty {
                        return "\(errorMessage)\n\(stack)"
                    }
                    return errorMessage
                }

                return json
                    .invokeMethod("stringify", withArguments: [jsVal])?
                    .toString() ?? "[object]"
            }.joined(separator: " ")
            bindJSLog.info("console: \(output, privacy: .public)")
        }

        let console = JSValue(newObjectIn: jsContext)!
        console.setObject(logBlock, forKeyedSubscript: "log" as NSString)
        console.setObject(logBlock, forKeyedSubscript: "error" as NSString)
        console.setObject(logBlock, forKeyedSubscript: "warn" as NSString)
        jsContext.globalObject.setValue(console, forProperty: "console")
    }

    private func setupNeedsRerender() {
        let rerender: @convention(block) () -> Void = { [weak self] in
            guard let self, !self.rerenderScheduled else { return }
            self.rerenderScheduled = true
            DispatchQueue.main.async {
                self.rerenderScheduled = false
                self.notifyViewsChanged()
            }
        }
        jsContext.setObject(rerender, forKeyedSubscript: "needsRerender" as NSString)
        _ = jsContext.evaluateScript("runtime.needsRerender = needsRerender")
    }

    private func setupWithAnimation() {
        let withAnimationFunction: @convention(block) (JSValue, JSValue) -> Void = { [weak self] callback, options in
            guard let self = self else { return }
            let callbackId = callback.toString() ?? ""

            // 1. JSON-stringify the JSValue options dictionary:
            guard let jsonString = jsonStringify(options),
                  let data = jsonString.data(using: .utf8) else {
                // Fallback: No or invalid options; just animate with default
                withAnimation(.smooth) {
                    _ = self.callEventHandler(id: callbackId, arguments: [])
                    // Flush synchronously so SwiftUI sees the change inside the animation transaction
                    // (needsRerender dispatches async, which would miss the transaction for transitions)
                    self.rerenderScheduled = false
                    self.notifyViewsChanged()
                }
                return
            }

            // 2. Decode and apply JSAnimation
            if let jsAnimation = try? JSONDecoder().decode(JSAnimation.self, from: data) {
                jsAnimation.apply {
                    _ = self.callEventHandler(id: callbackId, arguments: [])
                    self.rerenderScheduled = false
                    self.notifyViewsChanged()
                }
            } else {
                // Could not decode, fallback to default
                withAnimation(.smooth) {
                    _ = self.callEventHandler(id: callbackId, arguments: [])
                    self.rerenderScheduled = false
                    self.notifyViewsChanged()
                }
            }
        }
        jsContext.setObject(withAnimationFunction, forKeyedSubscript: "withAnimation" as NSString)
        _ = jsContext.evaluateScript("runtime.withAnimation = withAnimation")
    }
    
    private func setupAction() {
        let actionFunction: @convention(block) (JSValue) -> Void = { [weak self] options in
            guard let self = self else { return }
            
            guard let jsonString = jsonStringify(options),
                  let data = jsonString.data(using: .utf8) else {
                print("Invalid options for action")
                return
            }
            
            // Decode ContentLink
            do {
                let contentAction = try JSONDecoder().decode(ContentAction.self, from: data)
                self.actionCallback?(contentAction)
            } catch {
                print("Error decoding ContentAction: \(error)")
            }
        }
        jsContext.setObject(actionFunction, forKeyedSubscript: "actionCallback" as NSString)
        _ = jsContext.evaluateScript("runtime.actionCallback = actionCallback")
    }
    
    private func setupOnOpenURL() {
        let onOpenURLFunction: @convention(block) (String, JSValue?) -> Void = { [weak self] urlString, resultCallback in
            guard let self = self else { return }

            let swiftResultCallback: (Bool) -> Void = { success in
                if let resultCallback = resultCallback, !resultCallback.isNull && !resultCallback.isUndefined {
                    _ = resultCallback.call(withArguments: [success])
                }
            }

            guard let url = URL(string: urlString) else {
                // Invalid URL - report failure
                swiftResultCallback(false)
                return
            }

            if let openURL = self.openURL {
                openURL(url, completion: swiftResultCallback)
            } else {
                // No openURL set - just report failure
                swiftResultCallback(false)
            }
        }

        runtime.invokeMethod("setOnOpenURL", withArguments: [onOpenURLFunction])
    }

    public func register(name: String, source: String) {
        runtime.invokeMethod("setComponents", withArguments: [[name: source]])
        notifyViewsChanged()
    }

    // MARK: - Externally Built ASTs

    /// The JavaScript context the runtime lives in.
    ///
    /// This is the seam for a host that loads an interpreter building trees of its own — an
    /// A2UI renderer, say. Such an interpreter must share *this* runtime instance: hook
    /// state and the stored functions a `handlerId` resolves to live there, so a second
    /// runtime would render correctly and then fail on the first tap. It is also the only
    /// way back into Swift, since a tap arrives inside JavaScript with no Swift frame
    /// beneath it — expose an `@convention(block)` closure here and call it.
    ///
    /// The runtime owns the globals it installs (`runtime`, `console`, timers, and the
    /// callbacks hung off `runtime`). Add to them; do not replace them.
    public var javaScriptContext: JSContext {
        jsContext
    }

    /// A view for an AST built by an interpreter of the host's own, inside this context.
    ///
    /// `build` runs between the runtime's `willRender` and the decode, which is the only
    /// ordering that works: `willRender` resets the component-path counters that hook state
    /// is keyed by, so a tree built before it — or two trees built between it and one
    /// decode — would bind hooks to the wrong paths. Taking the closure is what keeps that
    /// unstateable rather than merely documented.
    ///
    /// The AST is decoded exactly as one built by `callComponent` is, so handler ids,
    /// modifiers and `ForEach` behave identically.
    @ViewBuilder
    public func view(id: String, buildingAST build: (JSContext) -> JSValue?) -> (some View)? {
        let _ = runtime.invokeMethod("willRender", withArguments: [])

        if let ast = build(jsContext), let component = component(fromAST: ast) {
            ComponentView(component)
                .environmentObject(self)
                .id(id)
        }
    }

    private func component(fromAST value: JSValue) -> Component? {
        guard let directive = value.toDirective() else {
            return nil
        }

        guard let component = makeComponent(directive) else {
            return nil
        }

        return resolveForEachChildren(in: component)
    }

    @ViewBuilder
    public func viewForName(_ name: String, arguments: [String: Any] = [:]) -> (some View)? {

        let _ = runtime.invokeMethod("willRender", withArguments: [])

        if let component = componentForName(name, arguments: arguments) {
            ComponentView(component)
                .environmentObject(self)
                .id(name)
        }
    }

    public func componentForName(_ name: String, arguments: [String: Any] = [:]) -> Component? {
        guard let jsValue = runtime.invokeMethod("callComponent", withArguments: [[name, JSValue(object: arguments, in: jsContext)!]]) else {
            return nil
        }

        guard let directive = jsValue.toDirective() else {
            return nil
        }

        guard let component = makeComponent(directive) else {
            return nil
        }

        return resolveForEachChildren(in: component)
    }

    // MARK: - Component Previews

    public func previewsForComponent(_ name: String) -> [BindJSPreviewInfo] {
        guard let jsValue = runtime.invokeMethod("getComponentPreviewsWithMetadata", withArguments: [[name]]) else {
            return []
        }
        guard jsValue.isArray, let array = jsValue.toArray() else {
            return []
        }
        return array.enumerated().compactMap { index, item in
            guard let dict = item as? [String: Any] else { return nil }
            let title = dict["title"] as? String ?? "Preview \(index + 1)"
            return BindJSPreviewInfo(id: "\(index)", title: title)
        }
    }

    @ViewBuilder
    public func viewForPreview(_ name: String, previewIndex: Int, arguments: [String: Any] = [:]) -> (some View)? {
        let _ = runtime.invokeMethod("willRender", withArguments: [])

        if let component = componentForPreview(name, previewIndex: previewIndex, arguments: arguments) {
            ComponentView(component)
                .environmentObject(self)
                .id("\(name)_preview_\(previewIndex)")
        }
    }

    public func componentForPreview(_ name: String, previewIndex: Int, arguments: [String: Any] = [:]) -> Component? {
        guard let jsValue = runtime.invokeMethod("callComponentPreview", withArguments: [[name, previewIndex, JSValue(object: arguments, in: jsContext)!]]) else {
            return nil
        }

        guard let directive = jsValue.toDirective() else {
            return nil
        }

        guard let component = makeComponent(directive) else {
            return nil
        }

        return resolveForEachChildren(in: component)
    }

    // MARK: - ForEach Pre-computation

    private struct ForEachResolver: ComponentRewriter {
        weak let context: BindJSContext?

        mutating func visitForEach(_ forEach: ForEachComponent) -> Component {
            var copy = forEach
            copy.resolvedChildren = context?.evaluateForEachChildren(forEach)
                .map { $0.accept(visitor: &self) }
            return copy
        }
    }

    private func resolveForEachChildren(in component: Component) -> Component {
        var resolver = ForEachResolver(context: self)
        return resolver.visit(component)
    }

    private func evaluateForEachChildren(_ forEach: ForEachComponent) -> [Component] {
        guard let data = restoreForEachData(id: forEach.dataId) else { return [] }
        restoreEnvironment(id: forEach.environmentId)

        var components: [Component] = []
        for index in 0..<forEach.count {
            guard let item = data.atIndex(index),
                  let jsValue = callForEachFunction(id: forEach.functionId, element: item, index: Int32(index)),
                  let directive = jsValue.toDirective(),
                  let component = makeComponent(directive) else { continue }
            components.append(component)
        }
        return components
    }

    private func notifyViewsChanged() {
        renderRevision &+= 1
        objectWillChange.send()
    }

    public func debug() {
        let debugInfo = runtime.invokeMethod("debug", withArguments: [])
        print(debugInfo ?? "No debug info")
    }

    public func setEnvironment(_ environment: [String: Any]) -> Self {
        runtime.invokeMethod("setEnvironment", withArguments: [environment])
        return self
    }

    public func restoreFunction(id: String) -> JSValue? {
        runtime.invokeMethod("restoreFunction", withArguments: [id])
    }

    public func restoreEnvironment(id: String) {
        runtime.invokeMethod("restoreEnvironment", withArguments: [id])
    }

    public func callForEachFunction(id: String, element: JSValue, index: Int32) -> JSValue? {
        setForEachElementId(id: "\(index)")
        return runtime.invokeMethod("callForEachFunction", withArguments: [id, element, index])
    }

    public func setForEachElementId(id: String) {
        runtime.invokeMethod("setForEachElementId", withArguments: [id])
    }

    public func restoreEventHandler(id: String) -> JSValue? {
        runtime.invokeMethod("restoreEventHandler", withArguments: [id])
    }

    public func callEventHandler(id: String, arguments: Any) -> JSValue? {
        runtime.invokeMethod("callEventHandler", withArguments: [id, arguments])
    }

    public func restoreForEachData(id: String) -> JSValue? {
        runtime.invokeMethod("restoreForEachData", withArguments: [id])
    }

    public func restoreOnChangeTrigger(id: String) -> Int {
        Int(runtime.invokeMethod("restoreOnChangeTrigger", withArguments: [id])?.toInt32() ?? 0)
    }

    public func triggerOnChangeHandler(id: String) {
        _ = runtime.invokeMethod("triggerOnChangeHandler", withArguments: [id])
    }

    public func restorePickerValue(id: String) -> String? {
        runtime.invokeMethod("restorePickerValue", withArguments: [id])?.toString()
    }

    public func callPickerSetter(id: String, value: String) {
        _ = runtime.invokeMethod("callEventHandler", withArguments: [id, value])
    }

    public func restoreTextFieldValue(id: String) -> String? {
        runtime.invokeMethod("restoreTextFieldValue", withArguments: [id])?.toString()
    }

    public func callTextFieldSetter(id: String, value: String) {
        _ = runtime.invokeMethod("callEventHandler", withArguments: [id, value])
    }

    public func restoreSecureFieldValue(id: String) -> String? {
        runtime.invokeMethod("restoreSecureFieldValue", withArguments: [id])?.toString()
    }

    public func callSecureFieldSetter(id: String, value: String) {
        _ = runtime.invokeMethod("callEventHandler", withArguments: [id, value])
    }

    public func restoreToggleValue(id: String) -> Bool? {
        runtime.invokeMethod("restoreToggleValue", withArguments: [id])?.toBool()
    }

    public func callToggleSetter(id: String, value: Bool) {
        _ = runtime.invokeMethod("callEventHandler", withArguments: [id, value])
    }

    /// Test-only entry point for evaluating arbitrary JS. Not part of the
    /// public API — kept `internal` so `@testable import BindJS` tests can
    /// probe `runtime.mcpHost` and other runtime bindings directly.
    func evaluateForTesting(_ script: String) -> String? {
        let result = jsContext.evaluateScript(script)
        if let result, !result.isNull, !result.isUndefined {
            return result.toString()
        }
        return nil
    }

    public func reset() {
        runtime.invokeMethod("reset", withArguments: [])
        setupNeedsRerender()
        setupWithAnimation()
        setupAction()
        setupOnOpenURL()
        setupAppStateListener()
        if let mcpHost {
            attachMCPHost(mcpHost)
        }
    }

    // MARK: - MCP Host

    /// Attach an `MCPHostBridge` so BindJS components calling `useMCPHost()`
    /// receive a working host. Pass `nil` to detach. No-op if the same
    /// instance is already attached, to keep the JS-side reference stable
    /// across renders.
    public func setMCPHost(_ host: MCPHostBridge?) {
        if (mcpHost === host) || (mcpHost == nil && host == nil) {
            return
        }
        mcpHost = host
        if let host {
            attachMCPHost(host)
        } else {
            runtime.invokeMethod("setMCPHost", withArguments: [NSNull()])
        }
    }

    private func attachMCPHost(_ host: MCPHostBridge) {
        let hostObject = JSValue(newObjectIn: jsContext)!

        // Promise factory used to bridge async Swift work to JS.
        let makePromise: () -> (promise: JSValue, resolve: JSValue, reject: JSValue)? = { [weak self] in
            guard let self,
                  let factory = self.jsContext.evaluateScript("""
                  (function () {
                      let resolveFn, rejectFn;
                      const p = new Promise((res, rej) => { resolveFn = res; rejectFn = rej; });
                      return { promise: p, resolve: resolveFn, reject: rejectFn };
                  })
                  """),
                  let bundle = factory.call(withArguments: []),
                  let promise = bundle.forProperty("promise"),
                  let resolve = bundle.forProperty("resolve"),
                  let reject = bundle.forProperty("reject")
            else { return nil }
            return (promise, resolve, reject)
        }

        func bridgedDictionary(_ value: JSValue?) -> [String: Any] {
            guard let value, !value.isNull, !value.isUndefined,
                  let object = value.toObject() as? [String: Any]
            else { return [:] }
            return object
        }

        // sendRequest(method, params) -> Promise<any>
        let sendRequestBlock: @convention(block) (String, JSValue?) -> JSValue? = { [weak host] method, params in
            guard let host, let bundle = makePromise() else { return nil }
            let args = bridgedDictionary(params)
            Task {
                do {
                    let result = try await host.sendRequest(method: method, params: args)
                    DispatchQueue.main.async { _ = bundle.resolve.call(withArguments: [result as Any]) }
                } catch {
                    DispatchQueue.main.async { _ = bundle.reject.call(withArguments: [error.localizedDescription]) }
                }
            }
            return bundle.promise
        }

        // sendNotification(method, params)
        let sendNotificationBlock: @convention(block) (String, JSValue?) -> Void = { [weak host] method, params in
            host?.sendNotification(method: method, params: bridgedDictionary(params))
        }

        // toolCall(name, args) -> Promise<any>
        let toolCallBlock: @convention(block) (String, JSValue?) -> JSValue? = { [weak host] name, args in
            guard let host, let bundle = makePromise() else { return nil }
            let arguments = bridgedDictionary(args)
            bindJSLog.info("[host] toolCall '\(name, privacy: .public)' argKeys=\(arguments.keys.sorted().joined(separator: ","), privacy: .public)")
            Task {
                do {
                    let result = try await host.toolCall(name: name, arguments: arguments)
                    bindJSLog.info("[host] toolCall '\(name, privacy: .public)' resolved \(result == nil ? "nil" : "value", privacy: .public)")
                    DispatchQueue.main.async { _ = bundle.resolve.call(withArguments: [result as Any]) }
                } catch {
                    bindJSLog.error("[host] toolCall '\(name, privacy: .public)' rejected: \(error.localizedDescription, privacy: .public)")
                    DispatchQueue.main.async { _ = bundle.reject.call(withArguments: [error.localizedDescription]) }
                }
            }
            return bundle.promise
        }

        // sendMessage(message) -> Promise<void>
        let sendMessageBlock: @convention(block) (String) -> JSValue? = { [weak host] message in
            guard let host, let bundle = makePromise() else { return nil }
            bindJSLog.info("[host] sendMessage bytes=\(message.count, privacy: .public)")
            Task {
                do {
                    try await host.sendMessage(message)
                    DispatchQueue.main.async { _ = bundle.resolve.call(withArguments: []) }
                } catch {
                    bindJSLog.error("[host] sendMessage rejected: \(error.localizedDescription, privacy: .public)")
                    DispatchQueue.main.async { _ = bundle.reject.call(withArguments: [error.localizedDescription]) }
                }
            }
            return bundle.promise
        }

        // updateModelContext(content) -> Promise<void>
        let updateModelContextBlock: @convention(block) (JSValue?) -> JSValue? = { [weak host] content in
            guard let host, let bundle = makePromise() else { return nil }
            let payload = bridgedDictionary(content)
            bindJSLog.info("[host] updateModelContext keys=\(payload.keys.sorted().joined(separator: ","), privacy: .public)")
            Task {
                do {
                    try await host.updateModelContext(payload)
                    DispatchQueue.main.async { _ = bundle.resolve.call(withArguments: []) }
                } catch {
                    bindJSLog.error("[host] updateModelContext rejected: \(error.localizedDescription, privacy: .public)")
                    DispatchQueue.main.async { _ = bundle.reject.call(withArguments: [error.localizedDescription]) }
                }
            }
            return bundle.promise
        }

        // sizeChanged(height)
        let sizeChangedBlock: @convention(block) (Double) -> Void = { [weak host] height in
            host?.sizeChanged(height: height)
        }

        // openLink(url) -> Promise<void>
        let openLinkBlock: @convention(block) (String) -> JSValue? = { [weak host] urlString in
            guard let host, let bundle = makePromise() else { return nil }
            guard let url = URL(string: urlString) else {
                bundle.reject.call(withArguments: ["Invalid URL: \(urlString)"])
                return bundle.promise
            }
            Task {
                do {
                    try await host.openLink(url)
                    DispatchQueue.main.async { _ = bundle.resolve.call(withArguments: []) }
                } catch {
                    DispatchQueue.main.async { _ = bundle.reject.call(withArguments: [error.localizedDescription]) }
                }
            }
            return bundle.promise
        }

        // requestDisplayMode(mode) -> Promise<void>
        let requestDisplayModeBlock: @convention(block) (String) -> JSValue? = { [weak host] mode in
            guard let host, let bundle = makePromise() else { return nil }
            Task {
                do {
                    try await host.requestDisplayMode(mode)
                    DispatchQueue.main.async { _ = bundle.resolve.call(withArguments: []) }
                } catch {
                    DispatchQueue.main.async { _ = bundle.reject.call(withArguments: [error.localizedDescription]) }
                }
            }
            return bundle.promise
        }

        // log(level, message, data?)
        let logBlock: @convention(block) (String, String, JSValue?) -> Void = { [weak host] level, message, data in
            let payload: [String: Any]?
            if let data, !data.isUndefined, !data.isNull {
                payload = data.toObject() as? [String: Any]
            } else {
                payload = nil
            }
            host?.log(level: level, message: message, data: payload)
        }

        // elicit(schema, metadata?) -> Promise<{action, content?}>
        let elicitBlock: @convention(block) (JSValue?, JSValue?) -> JSValue? = { [weak host, weak self] schema, metadata in
            guard let host, let bundle = makePromise() else { return nil }
            let schemaDict = bridgedDictionary(schema)
            let metadataDict: [String: Any]? = (metadata.flatMap { v -> [String: Any]? in
                guard !v.isUndefined, !v.isNull else { return nil }
                return v.toObject() as? [String: Any]
            })
            bindJSLog.info("[host] elicit schemaKeys=\(schemaDict.keys.sorted().joined(separator: ","), privacy: .public) metadataKeys=\(metadataDict?.keys.sorted().joined(separator: ",") ?? "<none>", privacy: .public)")
            Task { [weak self] in
                do {
                    let response = try await host.elicit(schema: schemaDict, metadata: metadataDict)
                    let payload: [String: Any]
                    switch response.action {
                    case .accept:
                        payload = ["action": "accept", "content": response.content as Any]
                    case .decline:
                        payload = ["action": "decline"]
                    case .cancel:
                        payload = ["action": "cancel"]
                    }
                    await MainActor.run {
                        guard let ctx = self?.jsContext,
                              let value = JSValue(object: payload, in: ctx) else {
                            _ = bundle.resolve.call(withArguments: [NSNull()])
                            return
                        }
                        _ = bundle.resolve.call(withArguments: [value])
                    }
                } catch {
                    DispatchQueue.main.async { _ = bundle.reject.call(withArguments: [error.localizedDescription]) }
                }
            }
            return bundle.promise
        }

        hostObject.setObject(sendRequestBlock, forKeyedSubscript: "sendRequest" as NSString)
        hostObject.setObject(sendNotificationBlock, forKeyedSubscript: "sendNotification" as NSString)
        hostObject.setObject(toolCallBlock, forKeyedSubscript: "toolCall" as NSString)
        hostObject.setObject(sendMessageBlock, forKeyedSubscript: "sendMessage" as NSString)
        hostObject.setObject(updateModelContextBlock, forKeyedSubscript: "updateModelContext" as NSString)
        hostObject.setObject(elicitBlock, forKeyedSubscript: "elicit" as NSString)
        hostObject.setObject(sizeChangedBlock, forKeyedSubscript: "sizeChanged" as NSString)
        hostObject.setObject(openLinkBlock, forKeyedSubscript: "openLink" as NSString)
        hostObject.setObject(requestDisplayModeBlock, forKeyedSubscript: "requestDisplayMode" as NSString)
        hostObject.setObject(logBlock, forKeyedSubscript: "log" as NSString)

        runtime.invokeMethod("setMCPHost", withArguments: [hostObject as Any])
    }

    private static func loadRuntime() -> String {
        guard
            let coreUrl = Bundle.module.url(forResource: "BindJSRuntime", withExtension: "js"),
            let wrapperUrl = Bundle.module.url(forResource: "BindJSRuntimeWrapper", withExtension: "js"),
            let coreCode = try? String(contentsOf: coreUrl, encoding: .utf8),
            let wrapperCode = try? String(contentsOf: wrapperUrl, encoding: .utf8)
        else {
            print("Error loading JSRuntime files")
            return ""
        }
        return coreCode + "\n" + wrapperCode
    }
    
    /// JSON-encodes a JSValue using the JavaScript JSON.stringify function.
    /// - Parameters:
    ///   - value: The JSValue (dictionary/object/array/anything) to stringify.
    ///   - context: Context to use (defaults to self.context).
    /// - Returns: JSON string if successful, otherwise nil.
    private func jsonStringify(_ value: JSValue?, in context: JSContext? = nil) -> String? {
        let ctx = context ?? self.jsContext
        guard let value = value else { return nil }
        guard let json = ctx.objectForKeyedSubscript("JSON") else { return nil }
        return json.invokeMethod("stringify", withArguments: [value])?.toString()
    }
    
    // MARK: - Action Callback
    
    public func onAction(_ callback: @escaping (ContentAction) -> Void) {
        self.actionCallback = callback
    }
    
    // MARK: - OpenURL

    public func setOpenURL(_ openURL: OpenURLAction) {
        self.openURL = openURL
    }
    
    // MARK: - App State Management
    
    private func setupAppStateListener() {
        let onUpdateAppStateFunction: @convention(block) (String, JSValue, JSValue) -> Void = { [weak self] key, value, state in
            guard let self = self else { return }
            
            // Convert JSValue to Swift objects
            let swiftValue = value.toObject()
            let swiftState = state.toObject() as? [String: Any] ?? [:]
            
            // Update internal app state
            self.appState = swiftState
            
            // Trigger UI update (coalesced with needsRerender)
            if !self.rerenderScheduled {
                self.rerenderScheduled = true
                DispatchQueue.main.async {
                    self.rerenderScheduled = false
                    self.notifyViewsChanged()
                }
            }
            
            // Notify Listener
            if let swiftValue {
                self.appStateCallback?(key, swiftValue)
            }
        }
        
        jsContext.setObject(onUpdateAppStateFunction, forKeyedSubscript: "onUpdateAppState" as NSString)
        _ = jsContext.evaluateScript("runtime.onUpdateAppState = onUpdateAppState")
    }
    
    public func updateAppState(key: String, value: Any) {
        // Update runtime app state
        runtime.invokeMethod("updatedAppState", withArguments: [key, value, nil])
    }

    public func setAppState(_ state: [String: Any]) -> Self {
        runtime.invokeMethod("setAppState", withArguments: [state])
        return self
    }
    
    public func onAppStateChanged(
        _ callback: @escaping (String, Any) -> Void
    ) {
        self.appStateCallback = callback
    }
}
