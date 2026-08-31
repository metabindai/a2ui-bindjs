import SwiftUI

public struct GridColumnAlignmentComponent: Component {
    public static var directiveName: String = "gridColumnAlignment"

    public var guide: HorizontalAlignment
}

extension GridColumnAlignmentComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        guide = directive.rawValue() ?? .center
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGridColumnAlignment(self)
    }
}

extension GridColumnAlignmentComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .gridColumnAlignment(guide)
    }
}
