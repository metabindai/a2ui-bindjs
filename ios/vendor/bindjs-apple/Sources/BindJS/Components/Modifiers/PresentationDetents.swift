import SwiftUI

public struct PresentationDetentsComponent: Component {
    public static var directiveName: String = "presentationDetents"
    
    public var detents: [PresentationDetent]
    
    static func parseDetent(from dict: [String: Any]) -> PresentationDetent? {
        guard let type = dict["detentType"] as? String else { return nil }
        
        switch type {
        case "large":
            return .large
        case "medium":
            return .medium
        case "height":
            if let value = dict["value"] as? Double {
                return .height(value)
            }
        case "fraction":
            if let value = dict["value"] as? Double {
                return .fraction(value)
            }
        default:
            return nil
        }
        
        return nil
    }
}

extension PresentationDetentsComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        if let rawDetents = directive.props["rawValue"] as? [[String: Any]] {
            detents = rawDetents.compactMap { PresentationDetentsComponent.parseDetent(from: $0) }
        } else {
            detents = [.large]
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitPresentationDetents(self)
    }
}

extension PresentationDetentsComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .presentationDetents(Set(detents))
    }
}
