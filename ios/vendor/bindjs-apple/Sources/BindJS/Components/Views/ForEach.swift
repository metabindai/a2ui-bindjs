import SwiftUI
import JavaScriptCore

public struct ForEachComponent: Component {
    public static var directiveName: String = "ForEach"

    public let dataId: String
    public let count: Int
    public let functionId: String
    public let environmentId: String

    /// Pre-computed children (populated by resolveForEachChildren).
    /// When non-nil, body renders these directly instead of calling JS.
    public var resolvedChildren: [Component]?
}

extension ForEachComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        dataId = directive["dataId"] ?? ""
        count = directive["count"] ?? 0
        functionId = directive["functionId"] ?? ""
        environmentId = directive["environmentId"] ?? ""
        resolvedChildren = nil
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitForEach(self)
    }
}

extension ForEachComponent: View {

    public var body: some View {
        ForEach((resolvedChildren ?? []).indices, id: \.self) { index in
            ComponentView((resolvedChildren ?? [])[index])
        }
    }
}
