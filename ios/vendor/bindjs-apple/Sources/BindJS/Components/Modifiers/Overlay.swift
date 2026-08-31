import SwiftUI

public struct OverlayComponent: Component {
    public static var directiveName: String = "overlay"
    
    public var content: Component
    public var alignment: Alignment
}

extension OverlayComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        self.alignment = directive["alignment"] ?? .center
        self.content = directive["content"].flatMap { makeComponent($0) } ?? EmptyComponent()
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitOverlay(self)
    }
}

extension OverlayComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.overlay(alignment: alignment) {
            ComponentView(self.content)
        }
    }
}
