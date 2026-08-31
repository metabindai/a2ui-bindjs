import Charts
import SwiftUI

public struct ChartXScaleComponent: Component {
    public static var directiveName: String = "chartXScale"

    public var scale: ChartScaleOption
}

extension ChartXScaleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        scale = ChartScaleOption(from: directive)
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartXScale(self)
    }
}

extension ChartXScaleComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.modifier(ChartSingleScaleApplier(axis: .x, scale: scale))
    }
}
