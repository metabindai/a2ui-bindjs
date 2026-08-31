import SwiftUI

public struct TextSelectionComponent: Component {
    public static var directiveName: String = "textSelection"
    
    public var textSelectability: TextSelectabilityArgument
}

extension TextSelectionComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        textSelectability = directive.rawValue() ?? .enabled
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitTextSelection(self)
    }
}

extension TextSelectionComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if textSelectability == .enabled {
            content
                .textSelection(.enabled)
        } else {
            content
                .textSelection(.disabled)
        }
    }
}
