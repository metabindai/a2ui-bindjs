import SwiftUI

public struct TextCaseComponent: Component {
    public static var directiveName: String = "textCase"
    
    public var textCase: Text.Case?
}

extension TextCaseComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        textCase = directive.rawValue()
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitTextCase(self)
    }
}

extension TextCaseComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if let textCase {
            content
                .textCase(textCase)
        } else {
            content
        }
    }
}
