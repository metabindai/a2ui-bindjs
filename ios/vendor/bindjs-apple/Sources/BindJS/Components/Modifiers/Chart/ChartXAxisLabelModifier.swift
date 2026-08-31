import Charts
import SwiftUI

public struct ChartXAxisLabelComponent: Component {
    public static var directiveName: String = "chartXAxisLabel"

    public var label: String
}

extension ChartXAxisLabelComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        label = directive["label"] ?? directive.rawValue() ?? ""
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartXAxisLabel(self)
    }
}

extension ChartXAxisLabelComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.chartXAxisLabel(label)
    }
}
