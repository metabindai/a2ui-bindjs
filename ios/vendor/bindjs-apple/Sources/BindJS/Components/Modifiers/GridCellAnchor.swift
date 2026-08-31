import SwiftUI

public struct GridCellAnchorComponent: Component {
    public static var directiveName: String = "gridCellAnchor"

    public var anchor: UnitPoint
}

extension GridCellAnchorComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        anchor = directive.rawValue() ?? .center
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGridCellAnchor(self)
    }
}

extension GridCellAnchorComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .gridCellAnchor(anchor)
    }
}
