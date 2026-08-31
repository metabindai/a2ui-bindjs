import Foundation

/// Bridge that exposes a host's MCP capabilities to BindJS components running
/// in the embedded JavaScript runtime. Mirrors the upstream `MCPHost` TS
/// interface (`metabind-cms/packages/composejs-renderer/types/metabind.d.ts`)
/// plus a native-only `elicit` extension.
///
/// Renderers conform to this protocol and pass an instance to
/// `BindJSContext.setMCPHost(_:)`, which proxies the methods into the JS
/// `runtime.mcpHost` object that `useMCPHost()` returns.
///
/// ## Native vs iframe semantics
///
/// Several methods exist for TS-contract parity but have no counterpart on
/// native (where there is no iframe and no postMessage transport):
///
/// - ``sendRequest(method:params:)`` / ``sendNotification(method:params:)``
///   are iframe JSON-RPC escape hatches. On native, conformers typically
///   return `nil` and the default extension provides that.
/// - ``sizeChanged(height:)`` is iframe container sizing. SwiftUI sizes
///   itself; default is no-op.
///
/// Components that call these on native see degraded but non-crashing
/// behavior, matching the graceful-fallback promise of the JS contract.
public protocol MCPHostBridge: AnyObject {
    // MARK: - Transport (iframe-only on native)

    func sendRequest(method: String, params: [String: Any]) async throws -> Any?
    func sendNotification(method: String, params: [String: Any])

    // MARK: - Tool calls

    /// Execute an MCP tool and return the unwrapped result.
    ///
    /// The return value should be the structured data a component wants to
    /// consume — not a raw `tools/call` envelope. Implementations are
    /// expected to prefer `structuredContent`, fall back to parsing the
    /// first text block as JSON, and finally return the raw text.
    func toolCall(name: String, arguments: [String: Any]) async throws -> Any?

    // MARK: - Messaging

    /// Inject a user message into the host's conversation, triggering a new
    /// turn. Analogous to the user typing the message themselves.
    func sendMessage(_ message: String) async throws

    // MARK: - Model context

    /// Silently provide structured context for future model turns without
    /// generating an immediate response.
    func updateModelContext(_ content: [String: Any]) async throws

    // MARK: - Elicitation

    /// Request structured input from the user matching a JSON Schema.
    /// Returns the user's decision plus any provided content.
    ///
    /// Hosts that support elicitation (e.g. Metabind Assistant with an
    /// elicitation handler configured) present UI derived from `schema`.
    /// Hosts without a handler return ``ElicitationResponse/Action/decline``.
    func elicit(schema: [String: Any], metadata: [String: Any]?) async throws -> ElicitationResponse

    // MARK: - Size (iframe-only on native)

    func sizeChanged(height: Double)

    // MARK: - Navigation

    func openLink(_ url: URL) async throws

    // MARK: - Display

    /// Request a display-mode change from the host. Hosts may grant a
    /// different mode than requested or ignore the request.
    func requestDisplayMode(_ mode: String) async throws

    // MARK: - Logging

    /// Emit a diagnostic log message. Useful because `console.log` inside a
    /// sandboxed context may not reach the developer.
    func log(level: String, message: String, data: [String: Any]?)
}

// MARK: - Default implementations

public extension MCPHostBridge {
    func sendRequest(method: String, params: [String: Any]) async throws -> Any? { nil }
    func sendNotification(method: String, params: [String: Any]) {}
    func toolCall(name: String, arguments: [String: Any]) async throws -> Any? { nil }
    func sendMessage(_ message: String) async throws {}
    func updateModelContext(_ content: [String: Any]) async throws {}
    func elicit(schema: [String: Any], metadata: [String: Any]?) async throws -> ElicitationResponse {
        ElicitationResponse(action: .decline)
    }
    func sizeChanged(height: Double) {}
    func openLink(_ url: URL) async throws {}
    func requestDisplayMode(_ mode: String) async throws {}
    func log(level: String, message: String, data: [String: Any]?) {}
}

// MARK: - Elicitation types

/// The host's response to an ``MCPHostBridge/elicit(schema:metadata:)`` call.
///
/// Mirrors the MCP specification's `elicitation/create` response shape so a
/// host that proxies to an MCP server can forward the result unchanged.
public struct ElicitationResponse {
    public enum Action: String, Sendable {
        /// User submitted content matching the requested schema.
        case accept
        /// User actively refused (e.g. tapped "No thanks").
        case decline
        /// User dismissed without choosing (e.g. closed the sheet).
        case cancel
    }

    public let action: Action
    /// Content submitted on `.accept`, nil otherwise. Keys match the
    /// schema's properties. Per MCP spec, values are primitives (String,
    /// Double, Bool) but nested objects may appear for proposed extensions.
    public let content: [String: Any]?

    public init(action: Action, content: [String: Any]? = nil) {
        self.action = action
        self.content = content
    }
}
