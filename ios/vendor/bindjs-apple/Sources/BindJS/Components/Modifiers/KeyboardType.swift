import SwiftUI

public struct KeyboardTypeComponent: Component {
    public static var directiveName: String = "keyboardType"
    
    let rawValue: String
}

extension KeyboardTypeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.rawValue = directive["rawValue"] ?? "default"
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitKeyboardType(self)
    }
}

extension KeyboardTypeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        #if os(iOS) || os(tvOS)
        let keyboardType: UIKeyboardType = {
            switch rawValue {
            case "asciiCapable": return .asciiCapable
            case "numbersAndPunctuation": return .numbersAndPunctuation
            case "URL": return .URL
            case "numberPad": return .numberPad
            case "phonePad": return .phonePad
            case "namePhonePad": return .namePhonePad
            case "emailAddress": return .emailAddress
            case "decimalPad": return .decimalPad
            case "twitter": return .twitter
            case "webSearch": return .webSearch
            case "asciiCapableNumberPad": return .asciiCapableNumberPad
            default: return .default
            }
        }()
        content.keyboardType(keyboardType)
        #else
        content  // macOS has no keyboard type
        #endif
    }
}
