import SwiftUI

public struct GridRowComponent: Component {
    public static var directiveName: String = "GridRow"

    public var alignment: VerticalAlignment?
    public var children: [Component]
}

extension GridRowComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        alignment = directive["alignment"]
        children = directive.children.compactMap { makeComponent($0) }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGridRow(self)
    }
}

extension GridRowComponent: View {
    public var body: some View {
        GridRow(alignment: alignment) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }
}
