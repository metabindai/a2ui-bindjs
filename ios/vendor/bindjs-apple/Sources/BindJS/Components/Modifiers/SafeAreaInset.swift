import SwiftUI

public struct SafeAreaInsetComponent: Component {
    public static var directiveName: String = "safeAreaInset"

    public var edge: VerticalEdge
    public var alignment: HorizontalAlignment
    public var spacing: CGFloat?
    public var content: Component
}

extension SafeAreaInsetComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        guard let edge: VerticalEdge = directive["edge"] else { return nil }
        self.edge = edge
        self.alignment = directive["alignment"] ?? .center
        self.spacing = directive["spacing"]
        self.content = directive["content"].flatMap { makeComponent($0) } ?? EmptyComponent()
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitSafeAreaInset(self)
    }
}

extension SafeAreaInsetComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.safeAreaInset(edge: edge, alignment: alignment, spacing: spacing ?? 0) {
            ComponentView(self.content)
        }
    }
}
