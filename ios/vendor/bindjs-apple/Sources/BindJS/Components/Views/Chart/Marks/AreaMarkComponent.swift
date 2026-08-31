public struct AreaMarkComponent: ChartMarkComponent {
    public static var directiveName: String = "AreaMark"

    let channels: ChartMarkChannels
    let baseStyle: ChartMarkStyle
    let chartMarkKind: ChartMark.Kind = .area
}

extension AreaMarkComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        channels = ChartMarkChannels(from: directive)
        let stacking = ChartMarkStyle.Stacking(rawValue: directive["stacking"] ?? "") ?? .standard
        baseStyle = ChartMarkStyle(stacking: stacking)
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitAreaMark(self)
    }
}
