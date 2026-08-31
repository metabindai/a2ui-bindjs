import SwiftUI

public struct TextFieldStyleComponent: Component {
    public static var directiveName: String = "textFieldStyle"
    
    let rawValue: String
}

extension TextFieldStyleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.rawValue = directive["rawValue"] ?? "automatic"
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitTextFieldStyle(self)
    }
}

extension TextFieldStyleComponent: ViewModifier {
    public func body(content: Content) -> some View {
        switch rawValue {
        case "roundedBorder":
            content.textFieldStyle(.roundedBorder)
        case "plain":
            content.textFieldStyle(.plain)
        case "automatic":
            content.textFieldStyle(.automatic)
        default:
            content.textFieldStyle(.automatic)
        }
    }
}
