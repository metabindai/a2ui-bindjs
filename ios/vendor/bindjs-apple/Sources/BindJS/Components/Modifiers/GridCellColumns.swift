import SwiftUI

public struct GridCellColumnsComponent: Component {
    public static var directiveName: String = "gridCellColumns"

    public var count: Int
}

extension GridCellColumnsComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        count = directive.rawValue() ?? 1
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGridCellColumns(self)
    }
}

extension GridCellColumnsComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .gridCellColumns(count)
    }
}
