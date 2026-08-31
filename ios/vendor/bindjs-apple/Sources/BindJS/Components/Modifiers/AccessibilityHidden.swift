import SwiftUI

public struct AccessibilityHiddenComponent: Component {
    public static var directiveName: String = "accessibilityHidden"
    
    public var isActive: Bool
}

extension AccessibilityHiddenComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAccessibilityHidden(self)
    }
}

extension AccessibilityHiddenComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .accessibilityHidden(isActive)
    }
}
