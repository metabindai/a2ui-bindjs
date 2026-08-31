import SwiftUI

public struct ScaleEffectComponent: Component {
    public static var directiveName: String = "scaleEffect"
    
    public var x: CGFloat
    public var y: CGFloat
    public var anchor: UnitPoint
}

extension ScaleEffectComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        x = directive["x"] ?? directive.rawValue() ?? 1
        y = directive["y"] ?? directive.rawValue() ?? 1
        anchor = directive["anchor"] ?? .center
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitScaleEffect(self)
    }
}

extension ScaleEffectComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .scaleEffect(x: x, y: y, anchor: anchor)
    }
}
