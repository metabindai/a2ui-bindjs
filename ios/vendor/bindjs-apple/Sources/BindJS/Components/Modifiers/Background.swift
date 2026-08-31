import SwiftUI

public struct BackgroundComponent: Component {
    public static var directiveName: String = "background"
    
    public var content: Component
}

extension BackgroundComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        content = directive["content"].flatMap { makeComponent($0) } ?? EmptyComponent()
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitBackground(self)
    }
}

extension BackgroundComponent: ViewModifier {
    public func body(content: Content) -> some View {
        switch content {
        case let color as ColorComponent:
            content.background(color.swiftUI)
        case let linearGradient as LinearGradientComponent:
            content.background(linearGradient.swiftUI)
        case let angularGradient as AngularGradientComponent:
            content.background(angularGradient.swiftUI)
        case let radialGradient as RadialGradientComponent:
            content.background(radialGradient.swiftUI)
        case let ellipticalGradient as EllipticalGradientComponent:
            content.background(ellipticalGradient.swiftUI)
        case let material as MaterialComponent:
            content.background(material.swiftUI)
        case is EmptyComponent:
            content.background()
        default:
            content.background(ComponentView(self.content))
        }
    }
}
