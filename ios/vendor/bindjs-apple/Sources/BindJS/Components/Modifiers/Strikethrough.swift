import SwiftUI

public struct StrikethroughComponent: Component {
    public static var directiveName: String = "strikethrough"
    
    public var isActive: Bool
}

extension StrikethroughComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitStrikethrough(self)
    }
}

extension StrikethroughComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .strikethrough(isActive)
    }
}
