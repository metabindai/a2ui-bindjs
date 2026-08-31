import SwiftUI

public struct LazyVStackComponent: Component {
    public static var directiveName: String = "LazyVStack"

    public var alignment: HorizontalAlignment
    public var spacing: CGFloat?
    public var pinnedViews: PinnedScrollableViews
    public var children: [Component]
}

extension LazyVStackComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        spacing = directive["spacing"]
        alignment = directive["alignment"] ?? .center
        pinnedViews = directive["pinnedViews"] ?? []
        children = directive.children.compactMap { makeComponent($0) }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitLazyVStack(self)
    }
}

extension LazyVStackComponent: View {
    public var body: some View {
        LazyVStack(alignment: alignment, spacing: spacing, pinnedViews: pinnedViews) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }
}
