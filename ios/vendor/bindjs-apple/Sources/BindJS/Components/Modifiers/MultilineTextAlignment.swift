import SwiftUI

public struct MultilineTextAlignmentComponent: Component {
    public static var directiveName: String = "multilineTextAlignment"
    
    public var alignment: TextAlignment
}

extension MultilineTextAlignmentComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        alignment = directive.rawValue() ?? .center
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitMultilineTextAlignment(self)
    }
}

extension MultilineTextAlignmentComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .multilineTextAlignment(alignment)
    }
}
