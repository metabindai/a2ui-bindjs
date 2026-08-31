import SwiftUI

public struct BoldComponent: Component {
    public static var directiveName: String = "bold"
    
    public var isActive: Bool
}

extension BoldComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitBold(self)
    }
}

extension BoldComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .bold(isActive)
    }
}
