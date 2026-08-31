import SwiftUI

public struct ItalicComponent: Component {
    public static var directiveName: String = "italic"
    
    public var isActive: Bool
}

extension ItalicComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitItalic(self)
    }
}

extension ItalicComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .italic(isActive)
    }
}
