public struct PointMarkComponent: ChartMarkComponent {
    public static var directiveName: String = "PointMark"

    let channels: ChartMarkChannels
    let baseStyle: ChartMarkStyle
    let chartMarkKind: ChartMark.Kind = .point
}

extension PointMarkComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        channels = ChartMarkChannels(from: directive)
        baseStyle = ChartMarkStyle()
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitPointMark(self)
    }
}
