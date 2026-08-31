import SwiftUI

public struct ScrollEdgeEffectHiddenComponent: Component {
    public static var directiveName: String = "scrollEdgeEffectHidden"
    
    public var isActive: Bool
}

extension ScrollEdgeEffectHiddenComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitScrollEdgeEffectHidden(self)
    }
}

extension ScrollEdgeEffectHiddenComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 26.0, macOS 26.0, *) {
            content
                .scrollEdgeEffectHidden(isActive)
        } else {
            content
        }
    }
}
