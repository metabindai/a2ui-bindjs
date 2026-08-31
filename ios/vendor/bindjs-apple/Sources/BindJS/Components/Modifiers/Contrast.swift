import SwiftUI

public struct ContrastComponent: Component {
    public static var directiveName: String = "contrast"
    
    public var contrast: Double
}

extension ContrastComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        contrast = directive.rawValue() ?? 1
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitContrast(self)
    }
}

extension ContrastComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .contrast(contrast)
    }
}
