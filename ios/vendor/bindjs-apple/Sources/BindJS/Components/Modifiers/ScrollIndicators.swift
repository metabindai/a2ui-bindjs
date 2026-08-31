import SwiftUI

public struct ScrollIndicatorsComponent: Component {
    public static var directiveName: String = "scrollIndicators"

    let visibility: ScrollIndicatorVisibility
    let axes: Axis.Set
}

extension ScrollIndicatorsComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        let rawVisibility: String = directive["visibility"] ?? directive.rawValue() ?? "automatic"
        switch rawVisibility {
        case "hidden": visibility = .hidden
        case "visible": visibility = .visible
        case "never": visibility = .never
        default: visibility = .automatic
        }

        axes = directive["axes"] ?? [.vertical, .horizontal]
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitScrollIndicators(self)
    }
}

extension ScrollIndicatorsComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .scrollIndicators(visibility, axes: axes)
    }
}
