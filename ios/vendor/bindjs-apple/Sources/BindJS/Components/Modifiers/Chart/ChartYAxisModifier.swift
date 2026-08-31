import Charts
import SwiftUI

public struct ChartYAxisComponent: Component {
    public static var directiveName: String = "chartYAxis"

    public var options: ChartAxisOption
}

extension ChartYAxisComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        options = ChartAxisOption(from: directive)
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartYAxis(self)
    }
}

extension ChartYAxisComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.modifier(ChartAxisApplier(axis: .y, options: options, scale: nil))
    }
}
