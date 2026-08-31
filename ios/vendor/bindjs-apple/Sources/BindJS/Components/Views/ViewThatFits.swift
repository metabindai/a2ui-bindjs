import SwiftUI

public struct ViewThatFitsComponent: Component {
    public static var directiveName: String = "ViewThatFits"

    public var axes: Axis.Set
    public var children: [Component]
}

extension ViewThatFitsComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        axes = directive["axes"] ?? [.horizontal, .vertical]
        children = directive.children.compactMap { makeComponent($0) }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitViewThatFits(self)
    }
}

extension ViewThatFitsComponent: View {
    public var body: some View {
        ViewThatFits(in: axes) {
            switch children.count {
            case 1:
                ComponentView(children[0])
            case 2:
                ComponentView(children[0])
                ComponentView(children[1])
            case 3:
                ComponentView(children[0])
                ComponentView(children[1])
                ComponentView(children[2])
            case 4:
                ComponentView(children[0])
                ComponentView(children[1])
                ComponentView(children[2])
                ComponentView(children[3])
            case 5:
                ComponentView(children[0])
                ComponentView(children[1])
                ComponentView(children[2])
                ComponentView(children[3])
                ComponentView(children[4])
            case 6:
                ComponentView(children[0])
                ComponentView(children[1])
                ComponentView(children[2])
                ComponentView(children[3])
                ComponentView(children[4])
                ComponentView(children[5])
            case 7:
                ComponentView(children[0])
                ComponentView(children[1])
                ComponentView(children[2])
                ComponentView(children[3])
                ComponentView(children[4])
                ComponentView(children[5])
                ComponentView(children[6])
            case 8:
                ComponentView(children[0])
                ComponentView(children[1])
                ComponentView(children[2])
                ComponentView(children[3])
                ComponentView(children[4])
                ComponentView(children[5])
                ComponentView(children[6])
                ComponentView(children[7])
            case 9:
                ComponentView(children[0])
                ComponentView(children[1])
                ComponentView(children[2])
                ComponentView(children[3])
                ComponentView(children[4])
                ComponentView(children[5])
                ComponentView(children[6])
                ComponentView(children[7])
                ComponentView(children[8])
            case 10:
                ComponentView(children[0])
                ComponentView(children[1])
                ComponentView(children[2])
                ComponentView(children[3])
                ComponentView(children[4])
                ComponentView(children[5])
                ComponentView(children[6])
                ComponentView(children[7])
                ComponentView(children[8])
                ComponentView(children[9])
            default:
                EmptyView()
            }
        }
    }
}
