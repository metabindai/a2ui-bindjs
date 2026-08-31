import Charts
import SwiftUI

public struct ChartForegroundStyleScaleComponent: Component {
    public static var directiveName: String = "chartForegroundStyleScale"

    public var scale: [String: String]
    public var domain: [String]
    public var invalidEntries: [String]
}

extension ChartForegroundStyleScaleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        var parsed: [String: String] = [:]
        var invalid: [String] = []
        for (key, value) in directive.props where !ChartScaleDomainOrder.isMetadataEntry(key, value: value) {
            if let string = value as? String {
                parsed[key] = string
            } else if let colorDirective = value as? Directive,
                      let color = ColorComponent(from: colorDirective)?.chartColorString {
                parsed[key] = color
            } else {
                invalid.append(key)
            }
        }

        scale = parsed
        domain = ChartScaleDomainOrder.orderedKeys(from: directive, presentIn: scale)
        invalidEntries = invalid.sorted()
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartForegroundStyleScale(self)
    }
}

extension ChartForegroundStyleScaleComponent: ViewModifier {
    @ViewBuilder
    public func body(content: Content) -> some View {
        content.modifier(ChartForegroundScaleApplier(scale: scale, domain: domain))
    }
}
