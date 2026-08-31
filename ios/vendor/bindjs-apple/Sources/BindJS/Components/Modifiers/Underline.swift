import SwiftUI

public struct UnderlineComponent: Component {
    public static var directiveName: String = "underline"
    
    public var isActive: Bool
}

extension UnderlineComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitUnderline(self)
    }
}

extension UnderlineComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .underline(isActive)
    }
}
