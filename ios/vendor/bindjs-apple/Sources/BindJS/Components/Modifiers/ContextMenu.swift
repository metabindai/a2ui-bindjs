import SwiftUI

public struct ContextMenuComponent: Component {
    public static var directiveName: String = "contextMenu"

    @EnvironmentObject private var context: BindJSContext

    public var content: Component
}

extension ContextMenuComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        // Content is passed via the "content" prop from ContentModifier
        content = directive["content"].flatMap { makeComponent($0) } ?? EmptyComponent()
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitContextMenu(self)
    }
}

extension ContextMenuComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .contextMenu {
                ComponentView(self.content)
            }
    }
}
