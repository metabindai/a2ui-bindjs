import SwiftUI

public struct SubmitLabelComponent: Component {
    public static var directiveName: String = "submitLabel"
    
    let rawValue: String
}

extension SubmitLabelComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.rawValue = directive["rawValue"] ?? "return"
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitSubmitLabel(self)
    }
}

extension SubmitLabelComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 15.0, macOS 12.0, *) {
            let submitLabel: SubmitLabel = {
                switch rawValue {
                case "done": return .done
                case "go": return .go
                case "send": return .send
                case "join": return .join
                case "route": return .route
                case "search": return .search
                case "next": return .next
                case "continue": return .continue
                case "return": return .return
                default: return .return
                }
            }()
            
            content
                .submitLabel(submitLabel)
        } else {
            content
        }
    }
}