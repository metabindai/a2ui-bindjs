import SwiftUI

public struct GlassEffectComponent: Component {
    public static var directiveName: String = "glassEffect"
}

extension GlassEffectComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGlassEffect(self)
    }
}

extension GlassEffectComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 26.0, macOS 26.0, *) {
            content
                .glassEffect()
        } else {
            content
            // Fallback on earlier versions
        }
    }
}
