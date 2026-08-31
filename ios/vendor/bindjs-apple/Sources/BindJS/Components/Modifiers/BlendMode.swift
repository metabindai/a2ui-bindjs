import SwiftUI

public struct BlendModeComponent: Component {
    public static var directiveName: String = "blendMode"
    
    public var blendMode: BlendMode
}

extension BlendModeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        blendMode = directive.rawValue() ?? .normal
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitBlendMode(self)
    }
}

extension BlendModeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .blendMode(blendMode)
    }
}
