import SwiftUI

public struct GridComponent: Component {
    public static var directiveName: String = "Grid"

    public var alignment: Alignment
    public var horizontalSpacing: CGFloat?
    public var verticalSpacing: CGFloat?
    public var children: [Component]
}

extension GridComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        alignment = directive["alignment"] ?? .center
        horizontalSpacing = directive["horizontalSpacing"]
        verticalSpacing = directive["verticalSpacing"]
        children = directive.children.compactMap { makeComponent($0) }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGrid(self)
    }
}

extension GridComponent: View {
    public var body: some View {
        Grid(alignment: alignment, horizontalSpacing: horizontalSpacing, verticalSpacing: verticalSpacing) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }
}
