import Charts
import SwiftUI

public struct ChartLegendComponent: Component {
    public static var directiveName: String = "chartLegend"

    public var hidden: Bool
    public var position: String?
    public var spacing: Double?
}

extension ChartLegendComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        let hiddenFlag: Bool = directive["hidden"] ?? false
        let visibility: String? = directive["visibility"] ?? directive.rawValue()
        let rawPosition: String? = directive["position"] ?? directive.rawValue()

        hidden = hiddenFlag || visibility == "hidden" || rawPosition == "hidden"
        position = hidden ? nil : rawPosition
        spacing = directive["spacing"]
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartLegend(self)
    }
}

extension ChartLegendComponent: ViewModifier {
    @ViewBuilder
    public func body(content: Content) -> some View {
        content.modifier(ChartLegendApplier(legend: ChartLegendOptions(hidden: hidden, position: position, spacing: spacing)))
    }
}
