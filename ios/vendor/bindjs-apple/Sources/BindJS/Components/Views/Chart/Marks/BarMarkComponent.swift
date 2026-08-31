public struct BarMarkComponent: ChartMarkComponent {
    public static var directiveName: String = "BarMark"

    let channels: ChartMarkChannels
    let baseStyle: ChartMarkStyle
    let chartMarkKind: ChartMark.Kind = .bar
}

extension BarMarkComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        channels = ChartMarkChannels(from: directive)
        let stacking = ChartMarkStyle.Stacking(rawValue: directive["stacking"] ?? "") ?? .standard
        baseStyle = ChartMarkStyle(stacking: stacking)
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitBarMark(self)
    }
}
