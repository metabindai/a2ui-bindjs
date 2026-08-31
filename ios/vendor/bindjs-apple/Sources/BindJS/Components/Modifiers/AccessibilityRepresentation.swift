import SwiftUI

public struct AccessibilityRepresentationComponent: Component {
    public static var directiveName: String = "accessibilityRepresentation"
    
    public var representation: Component
}

extension AccessibilityRepresentationComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        representation = directive.rawValue().flatMap { makeComponent($0) } ?? EmptyComponent()
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAccessibilityRepresentation(self)
    }
}

extension AccessibilityRepresentationComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .accessibilityRepresentation {
                ComponentView(representation)
            }
    }
}
