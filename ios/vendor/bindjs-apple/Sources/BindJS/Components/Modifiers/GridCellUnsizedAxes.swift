import SwiftUI

public struct GridCellUnsizedAxesComponent: Component {
    public static var directiveName: String = "gridCellUnsizedAxes"

    public var axes: Axis.Set
}

extension GridCellUnsizedAxesComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        axes = directive.rawValue() ?? []
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGridCellUnsizedAxes(self)
    }
}

extension GridCellUnsizedAxesComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .gridCellUnsizedAxes(axes)
    }
}
