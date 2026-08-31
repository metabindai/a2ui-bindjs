import Charts
import SwiftUI

public struct ChartYAxisLabelComponent: Component {
    public static var directiveName: String = "chartYAxisLabel"

    public var label: String
}

extension ChartYAxisLabelComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        label = directive["label"] ?? directive.rawValue() ?? ""
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartYAxisLabel(self)
    }
}

extension ChartYAxisLabelComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.chartYAxisLabel(label)
    }
}
