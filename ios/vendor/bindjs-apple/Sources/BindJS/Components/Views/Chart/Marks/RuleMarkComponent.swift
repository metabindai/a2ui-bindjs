public struct RuleMarkComponent: ChartMarkComponent {
    public static var directiveName: String = "RuleMark"

    let channels: ChartMarkChannels
    let baseStyle: ChartMarkStyle
    let chartMarkKind: ChartMark.Kind = .rule
}

extension RuleMarkComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        channels = ChartMarkChannels(from: directive)
        baseStyle = ChartMarkStyle()
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitRuleMark(self)
    }
}
