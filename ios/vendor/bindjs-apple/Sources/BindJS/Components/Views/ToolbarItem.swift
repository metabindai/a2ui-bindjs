import SwiftUI

public struct ToolbarItemComponent: Component {
    public static var directiveName: String = "ToolbarItem"

    public var placement: ToolbarItemPlacement
    public var content: Component
}

extension ToolbarItemComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        placement = directive["placement"] ?? .automatic

        // Content can be a single component from children or from content prop
        if let contentDirective: Directive = directive["content"] {
            content = makeComponent(contentDirective) ?? EmptyComponent()
        } else if let firstChild = directive.children.first {
            content = makeComponent(firstChild) ?? EmptyComponent()
        } else {
            content = EmptyComponent()
        }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitToolbarItem(self)
    }
}

extension ToolbarItemComponent: ToolbarContent {
    public var body: some ToolbarContent {
        ToolbarItem(placement: placement) {
            ComponentView(content)
        }
    }
}
