import SwiftUI

public struct ScrollEdgeEffectStyleComponent: Component {
    public static var directiveName: String = "scrollEdgeEffectStyle"
    
    public var style: String
    public var edges: Edge.Set?
}

extension ScrollEdgeEffectStyleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        style = directive["style"] ?? "automatic"
        edges = directive["edges"]
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitScrollEdgeEffectStyle(self)
    }
}

extension ScrollEdgeEffectStyleComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 26.0, macOS 26.0, *) {
            let scrollEdgeEffectStyle: ScrollEdgeEffectStyle = {
                switch style {
                case "automatic":
                    return .automatic
                case "soft":
                    return .soft
                case "hard":
                    return .hard
                default:
                    return .automatic
                }
            }()
            
            if let edges = edges {
                content.scrollEdgeEffectStyle(scrollEdgeEffectStyle, for: edges)
            } else {
                content.scrollEdgeEffectStyle(scrollEdgeEffectStyle, for: .all)
            }
        } else {
            content
        }
    }
}
