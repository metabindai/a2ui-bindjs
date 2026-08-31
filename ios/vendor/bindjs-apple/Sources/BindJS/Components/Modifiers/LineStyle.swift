import SwiftUI

public struct LineStyleComponent: Component {
    public static var directiveName: String = "lineStyle"

    public var style: ChartLineStyle
}

extension LineStyleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        let dash = (directive.props["dash"] as? [Any])?.compactMap { ChartValue($0)?.number }
        style = ChartLineStyle(width: directive["width"], dash: dash)
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitLineStyle(self)
    }
}

extension LineStyleComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
    }
}

private extension ChartValue {
    var number: Double? {
        guard case .number(let number) = self else { return nil }
        return number
    }
}
