import SwiftUI

public struct AccessibilityLabelComponent: Component {
    public static var directiveName: String = "accessibilityLabel"
    
    public var label: String
}

extension AccessibilityLabelComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        label = directive.rawValue() ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAccessibilityLabel(self)
    }
}

extension AccessibilityLabelComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .accessibilityLabel(label)
    }
}
