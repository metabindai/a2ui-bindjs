import SwiftUI

public struct AccessibilityValueComponent: Component {
    public static var directiveName: String = "accessibilityValue"
    
    public var value: String
}

extension AccessibilityValueComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        value = directive.rawValue() ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAccessibilityValue(self)
    }
}

extension AccessibilityValueComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .accessibilityValue(value)
    }
}