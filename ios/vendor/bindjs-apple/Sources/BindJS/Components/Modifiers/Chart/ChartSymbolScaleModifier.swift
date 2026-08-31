import SwiftUI

public struct ChartSymbolScaleComponent: Component {
    public static var directiveName: String = "chartSymbolScale"

    public var scale: [String: ChartMarkStyle.SymbolName]
    public var domain: [String]
    public var invalidEntries: [String]
}

extension ChartSymbolScaleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        var parsed: [String: ChartMarkStyle.SymbolName] = [:]
        var invalid: [String] = []
        for (key, value) in directive.props where !ChartScaleDomainOrder.isMetadataEntry(key, value: value) {
            guard let raw = value as? String,
                  let symbol = ChartMarkStyle.SymbolName(rawValue: raw) else {
                invalid.append(key)
                continue
            }
            parsed[key] = symbol
        }

        scale = parsed
        domain = ChartScaleDomainOrder.orderedKeys(from: directive, presentIn: scale)
        invalidEntries = invalid.sorted()
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitChartSymbolScale(self)
    }
}

extension ChartSymbolScaleComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.modifier(ChartSymbolScaleApplier(scale: scale, domain: domain))
    }
}
