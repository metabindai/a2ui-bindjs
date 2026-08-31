import SwiftUI

public struct BrightnessComponent: Component {
    public static var directiveName: String = "brightness"
    
    public var brightness: Double
}

extension BrightnessComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        brightness = directive.rawValue() ?? 0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitBrightness(self)
    }
}

extension BrightnessComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .brightness(brightness)
    }
}
