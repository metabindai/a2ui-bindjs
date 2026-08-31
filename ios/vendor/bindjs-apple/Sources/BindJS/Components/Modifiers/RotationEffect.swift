import SwiftUI

public struct RotationEffectComponent: Component {
    public static var directiveName: String = "rotationEffect"
    
    public var angle: Angle
    public var anchor: UnitPoint
}

extension RotationEffectComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        angle = Angle(degrees: directive.rawValue() ?? directive["degrees"] ?? 0)
        anchor = directive["anchor"] ?? .center
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitRotationEffect(self)
    }
}

extension RotationEffectComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .rotationEffect(angle, anchor: anchor)
    }
}
