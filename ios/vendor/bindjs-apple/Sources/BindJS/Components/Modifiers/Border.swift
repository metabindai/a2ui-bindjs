import SwiftUI

public struct BorderComponent: Component {
    public static var directiveName: String = "border"
    
    public var style: Component
    public var width: CGFloat
}

extension BorderComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        style = (directive["style"] ?? directive.rawValue()).flatMap { makeComponent($0) } ?? EmptyComponent()
        width = directive["width"] ?? 1
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitBorder(self)
    }
}

extension BorderComponent: ViewModifier {
    public func body(content: Content) -> some View {
        switch style {
        case let color as ColorComponent:
            content.border(color.swiftUI, width: width)
        case let linearGradient as LinearGradientComponent:
            content.border(linearGradient.swiftUI, width: width)
        case let angularGradient as AngularGradientComponent:
            content.border(angularGradient.swiftUI, width: width)
        case let radialGradient as RadialGradientComponent:
            content.border(radialGradient.swiftUI, width: width)
        case let ellipticalGradient as EllipticalGradientComponent:
            content.border(ellipticalGradient.swiftUI, width: width)
        case let material as MaterialComponent:
            content.border(material.swiftUI, width: width)
        case let call as ComponentCall:
            content.modifier(BorderComponent(style: call.wrapped, width: width))
        default:
            content.border(.primary, width: width)
        }
    }
}
