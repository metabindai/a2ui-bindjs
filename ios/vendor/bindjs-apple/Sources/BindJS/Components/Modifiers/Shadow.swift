import SwiftUI

public struct ShadowComponent: Component {
    public static var directiveName: String = "shadow"
    
    public var color: Color
    public var radius: CGFloat
    public var x: CGFloat
    public var y: CGFloat
}

extension ShadowComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        color = (directive["color"].flatMap(makeComponent(_:)) as? ColorComponent)?.swiftUI ?? .black.opacity(0.3)
        radius = directive["radius"] ?? 10
        x = directive["x"] ?? 0
        y = directive["y"] ?? 10
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitShadow(self)
    }
}

extension ShadowComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .shadow(color: color, radius: radius, x: x, y: y)
    }
}
