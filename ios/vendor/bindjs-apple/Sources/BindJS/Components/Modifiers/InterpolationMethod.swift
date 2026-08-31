import SwiftUI

public struct InterpolationMethodComponent: Component {
    public static var directiveName: String = "interpolationMethod"

    public var method: ChartMarkStyle.Interpolation
}

extension InterpolationMethodComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        let raw: String? = directive["method"] ?? directive.rawValue()
        method = raw.flatMap(ChartMarkStyle.Interpolation.init(rawValue:)) ?? .linear
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitInterpolationMethod(self)
    }
}

extension InterpolationMethodComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
    }
}
