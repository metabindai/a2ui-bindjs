//
//  MetabindView.swift
//  Athena
//

import SwiftUI
import Combine

// MARK: - Pure Rendering View (No Networking)

/// Pure rendering view - accepts compiled content data only
/// Works like SwiftUI's Image - you provide the data, it renders
public struct BindJSView: View {
    let content: ResolvedContent
    let previewIndex: Int?
    let arguments: [String: Any]

    public init(content: ResolvedContent, arguments: [String: Any] = [:]) {
        self.content = content
        self.previewIndex = nil
        self.arguments = arguments
    }

    public init(content: ResolvedContent, previewIndex: Int?, arguments: [String: Any] = [:]) {
        self.content = content
        self.previewIndex = previewIndex
        self.arguments = arguments
    }

    public var body: some View {
        ContextHostView(content: content, previewIndex: previewIndex, arguments: arguments)
    }
}

// MARK: - Preview Preference Key

public struct BindJSPreviewsKey: PreferenceKey {
    public static let defaultValue: [BindJSPreviewInfo] = []
    public static func reduce(value: inout [BindJSPreviewInfo], nextValue: () -> [BindJSPreviewInfo]) {
        value = nextValue()
    }
}

// MARK: - Environment Values

extension EnvironmentValues {
    @Entry public var bindJS: BindJSConfiguration = .init()
}

public struct BindJSConfiguration {
    public var environment: [String: any Codable] = [:]
    public var appState: Binding<[String: Any]>?
    public var onAction: ((ContentAction) -> Void)?
    public var mcpHost: MCPHostBridge?

    public init(
        environment: [String: any Codable] = [:],
        appState: Binding<[String: Any]>? = nil,
        onAction: ((ContentAction) -> Void)? = nil,
        mcpHost: MCPHostBridge? = nil
    ) {
        self.environment = environment
        self.appState = appState
        self.onAction = onAction
        self.mcpHost = mcpHost
    }
}

public extension View {
    func bindJS(_ configuration: BindJSConfiguration) -> some View {
        environment(\.bindJS, configuration)
    }
}

// MARK: - Context Host (Rendering Engine)

private struct ContextHostView: View {
    let content: ResolvedContent
    let previewIndex: Int?
    let arguments: [String: Any]

    @StateObject private var context: BindJSContext
    @State private var registeredContentHash: Int
    @State private var availablePreviews: [BindJSPreviewInfo] = []

    @Environment(\.bindJS) private var bindJS
    @Environment(\.self) private var environment
    @Environment(\.openURL) private var openURL

    init(content: ResolvedContent, previewIndex: Int? = nil, arguments: [String: Any] = [:]) {
        self.content = content
        self.previewIndex = previewIndex
        self.arguments = arguments

        // Create and register context
        let ctx = BindJSContext()

        // Register package components
        for (name, source) in content.package.components {
            ctx.register(name: name, source: source)
        }

        // Register main content body (entry point for rendering)
        ctx.register(name: "_body", source: content.compiled)

        _context = StateObject(wrappedValue: ctx)

        // Track initial content hash
        _registeredContentHash = State(initialValue: content.hashValue)
    }

    var body: some View {
        VStack {
            RenderEffect {
                setupAction()
                setupAppState()
                setupHooks()
                setupEnvironment()
            }
            if let index = previewIndex {
                context.viewForPreview("_body", previewIndex: index)
            } else {
                context.viewForName("_body", arguments: arguments)
            }
        }
        .frame(maxWidth: .infinity)
        .preference(key: BindJSPreviewsKey.self, value: availablePreviews)
        .task {
            queryPreviews()
        }
        .onChange(of: content) { _, newContent in
            withAnimation(.snappy) {
                reregisterIfNeeded(newContent)
            }
        }
    }

    private func queryPreviews() {
        availablePreviews = context.previewsForComponent("_body")
    }

    private func reregisterIfNeeded(_ newContent: ResolvedContent) {
        let newHash = newContent.hashValue

        // Only re-register if content changed
        guard registeredContentHash != newHash else { return }
        registeredContentHash = newHash

        // Re-register package components
        for (name, source) in newContent.package.components {
            context.register(name: name, source: source)
        }

        // Re-register main content body (entry point for rendering)
        context.register(name: "_body", source: newContent.compiled)

        // Re-query previews after content update
        queryPreviews()
    }

    private func setupAction() {
        context.onAction { action in
            bindJS.onAction?(action)
        }
    }

    private func setupHooks() {
        context.setOpenURL(openURL)
        context.setMCPHost(bindJS.mcpHost)
    }

    private func setupAppState() {
        guard let appStateBinding = bindJS.appState else { return }

        context.onAppStateChanged { _, _ in
            // prevent mid-render mutations during the initial set
        }
        _ = context.setAppState(appStateBinding.wrappedValue)
        context.onAppStateChanged { key, value in
            var d = appStateBinding.wrappedValue
            d[key] = value
            appStateBinding.wrappedValue = d
        }
    }

    private func setupEnvironment() {
        let builder = EnvironmentBuilder(
            environment: environment,
            componentEnvironment: bindJS.environment
        )
        _ = context.setEnvironment(builder.build())
    }
}

private struct RenderEffect: View {
    init(perform: () -> Void) {
        perform()
    }

    var body: some View {
        EmptyView()
    }
}

// MARK: - Environment Builder

private struct EnvironmentBuilder {
    let environment: EnvironmentValues
    let componentEnvironment: [String: any Codable]

    func build() -> [String: Any] {
        var result: [String: Any] = [:]

        // Locale & Time
        result["locale"] = environment.locale.identifier
        result["timeZone"] = environment.timeZone.identifier
        result["calendar"] = environment.calendar.identifier
        result["now"] = ISO8601DateFormatter().string(from: Date())

        // Visual & Theme
        result["colorScheme"] = environment.colorScheme == .dark ? "dark" : "light"
        result["layoutDirection"] = environment.layoutDirection == .rightToLeft ? "rightToLeft" : "leftToRight"
        result["displayScale"] = environment.displayScale
        result["pixelLength"] = environment.pixelLength

        // Size Classes & Type
        result["horizontalSizeClass"] = Self.sizeClassString(environment.horizontalSizeClass)
        result["verticalSizeClass"] = Self.sizeClassString(environment.verticalSizeClass)
        result["dynamicTypeSize"] = Self.dynamicTypeSizeString(environment.dynamicTypeSize)
        result["contentSizeCategory"] = Self.sizeCategoryString(environment.sizeCategory)

        // State & Phase
        result["isEnabled"] = environment.isEnabled
        result["redactionReasons"] = Self.redactionReasonsStringArray(environment.redactionReasons)
        result["scenePhase"] = Self.scenePhaseString(environment.scenePhase)

        // Accessibility
        result["accessibility"] = buildAccessibility()

        // Platform-specific
        #if os(iOS) || os(tvOS)
        result["colorSchemeContrast"] = Self.colorSchemeContrastString(environment.colorSchemeContrast)
        #endif

        // Merge custom environment overrides
        for (key, value) in componentEnvironment {
            result[key] = Self.serializeCodable(value)
        }

        return result
    }

    /// Serializes a Codable value to a JSON-compatible type (dictionary, array, or primitive)
    private static func serializeCodable(_ value: any Codable) -> Any {
        // Helper to encode using a wrapper
        func encodeValue<T: Encodable>(_ v: T) -> Any? {
            do {
                let data = try JSONEncoder().encode(v)
                let jsonObject = try JSONSerialization.jsonObject(with: data)
                return jsonObject
            } catch {
                return nil
            }
        }

        // Try to encode if value conforms to Encodable
        if let encodable = value as? any Encodable {
            if let encoded = encodeValue(encodable) {
                return encoded
            }
        }

        // Fallback: return as-is (works for primitives that are already JSON-compatible)
        return value
    }

    private func buildAccessibility() -> [String: Any] {
        [
            "differentiateWithoutColor": environment.accessibilityDifferentiateWithoutColor,
            "reduceMotion": environment.accessibilityReduceMotion,
            "reduceTransparency": environment.accessibilityReduceTransparency,
            "invertColors": environment.accessibilityInvertColors,
            "showButtonShapes": environment.accessibilityShowButtonShapes,
            "voiceOverEnabled": environment.accessibilityVoiceOverEnabled,
            "switchControlEnabled": environment.accessibilitySwitchControlEnabled,
        ]
    }

    // MARK: - Conversion Helpers

    static func sizeClassString(_ sizeClass: UserInterfaceSizeClass?) -> String {
        switch sizeClass {
        case .compact: return "compact"
        case .regular: return "regular"
        case .none: return "none"
        @unknown default: return "unknown"
        }
    }

    static func redactionReasonsStringArray(_ reasons: RedactionReasons) -> [String] {
        var result: [String] = []
        if reasons.contains(.placeholder) { result.append("placeholder") }
        if reasons.contains(.privacy) { result.append("privacy") }
        return result
    }

    static func dynamicTypeSizeString(_ dynamicTypeSize: DynamicTypeSize) -> String {
        switch dynamicTypeSize {
        case .xSmall: return "xSmall"
        case .small: return "small"
        case .medium: return "medium"
        case .large: return "large"
        case .xLarge: return "xLarge"
        case .xxLarge: return "xxLarge"
        case .xxxLarge: return "xxxLarge"
        case .accessibility1: return "accessibility1"
        case .accessibility2: return "accessibility2"
        case .accessibility3: return "accessibility3"
        case .accessibility4: return "accessibility4"
        case .accessibility5: return "accessibility5"
        @unknown default: return "unknown"
        }
    }

    static func sizeCategoryString(_ c: ContentSizeCategory) -> String {
        switch c {
        case .extraSmall: return "extraSmall"
        case .small: return "small"
        case .medium: return "medium"
        case .large: return "large"
        case .extraLarge: return "extraLarge"
        case .extraExtraLarge: return "extraExtraLarge"
        case .extraExtraExtraLarge: return "extraExtraExtraLarge"
        case .accessibilityMedium: return "accessibilityMedium"
        case .accessibilityLarge: return "accessibilityLarge"
        case .accessibilityExtraLarge: return "accessibilityExtraLarge"
        case .accessibilityExtraExtraLarge: return "accessibilityExtraExtraExtraLarge"
        case .accessibilityExtraExtraExtraLarge: return "accessibilityExtraExtraExtraLarge"
        default: return "unspecified"
        }
    }

    static func scenePhaseString(_ p: ScenePhase) -> String {
        switch p {
        case .active: return "active"
        case .inactive: return "inactive"
        case .background: return "background"
        @unknown default: return "unknown"
        }
    }

    #if os(iOS) || os(tvOS)
    static func colorSchemeContrastString(_ c: ColorSchemeContrast) -> String {
        switch c {
        case .standard: return "standard"
        case .increased: return "increased"
        @unknown default: return "unknown"
        }
    }
    #endif
}
