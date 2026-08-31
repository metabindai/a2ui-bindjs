import SwiftUI

public struct LazyHStackComponent: Component {
    public static var directiveName: String = "LazyHStack"

    public var alignment: VerticalAlignment
    public var spacing: CGFloat?
    public var pinnedViews: PinnedScrollableViews
    public var children: [Component]
}

extension LazyHStackComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        spacing = directive["spacing"]
        alignment = directive["alignment"] ?? .center
        pinnedViews = directive["pinnedViews"] ?? []
        children = directive.children.compactMap { makeComponent($0) }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitLazyHStack(self)
    }
}

extension LazyHStackComponent: View {
    public var body: some View {
        LazyHStack(alignment: alignment, spacing: spacing, pinnedViews: pinnedViews) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }
}
