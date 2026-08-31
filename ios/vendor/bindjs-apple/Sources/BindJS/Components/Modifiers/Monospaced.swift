import SwiftUI

public struct MonospacedComponent: Component {
    public static var directiveName: String = "monospaced"
    
    public var isActive: Bool
}

extension MonospacedComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitMonospaced(self)
    }
}

extension MonospacedComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .monospaced(isActive)
    }
}
