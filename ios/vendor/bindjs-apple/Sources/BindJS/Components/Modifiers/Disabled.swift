import SwiftUI

public struct DisabledComponent: Component {
    public static var directiveName: String = "disabled"
    
    public var isActive: Bool
}

extension DisabledComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitDisabled(self)
    }
}

extension DisabledComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .disabled(isActive)
    }
}
