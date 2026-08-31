import SwiftUI

public struct AllowsHitTestingComponent: Component {
    public static var directiveName: String = "allowsHitTesting"
    
    public var isActive: Bool
}

extension AllowsHitTestingComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAllowsHitTesting(self)
    }
}

extension AllowsHitTestingComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .allowsHitTesting(isActive)
    }
}
