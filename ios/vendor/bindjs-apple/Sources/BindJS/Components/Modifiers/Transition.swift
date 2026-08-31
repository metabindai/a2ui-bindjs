import SwiftUI

public struct TransitionComponent: Component {
    public static var directiveName: String = "transition"

    let kind: Kind

    enum Kind {
        case standard(AnyTransition)
        case blurReplace(String?)
    }
}

extension TransitionComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        kind = Self.parseKind(from: directive)
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitTransition(self)
    }

    private static func parseKind(from directive: Directive) -> Kind {
        // String form: .transition("opacity")
        if let value: String = directive.rawValue() {
            if value == "blurReplace" {
                return .blurReplace(nil)
            }
            return .standard(transitionFromString(value))
        }

        // .transition({ move: "bottom" })
        if let edge: String = directive["move"] {
            return .standard(.move(edge: parseEdge(edge)))
        }

        // .transition({ push: "bottom" }) — iOS 17+, falls back to move
        if let edge: String = directive["push"] {
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *) {
                return .standard(.push(from: parseEdge(edge)))
            }
            return .standard(.move(edge: parseEdge(edge)))
        }

        // .transition({ scale: 0.5 }) or .transition({ scale: 0.5, anchor: "topLeading" })
        if let scale = directive.props["scale"] as? Double {
            let anchor: UnitPoint = directive["anchor"] ?? .center
            return .standard(.scale(scale: scale, anchor: anchor))
        }

        // .transition({ offset: { x: 100, y: 50 } })
        if let offsetDict: [String: Any] = directive["offset"] {
            let x = offsetDict["x"] as? Double ?? 0
            let y = offsetDict["y"] as? Double ?? 0
            return .standard(.offset(x: x, y: y))
        }

        // .transition({ blurReplace: "upUp" })
        if let config: String = directive["blurReplace"] {
            return .blurReplace(config)
        }

        // .transition({ asymmetric: { insertion: "slide", removal: "opacity" } })
        if let asymmetric: [String: Any] = directive["asymmetric"] {
            let insertion = transitionFromString(asymmetric["insertion"] as? String ?? "identity")
            let removal = transitionFromString(asymmetric["removal"] as? String ?? "identity")
            return .standard(.asymmetric(insertion: insertion, removal: removal))
        }

        // .transition({ combined: ["opacity", "scale"] })
        if let combined = directive.props["combined"] as? [Any] {
            let transitions = combined.map { transitionFromString($0 as? String ?? "") }
            guard let first = transitions.first else { return .standard(.identity) }
            return .standard(transitions.dropFirst().reduce(first) { $0.combined(with: $1) })
        }

        return .standard(.identity)
    }

    private static func transitionFromString(_ value: String) -> AnyTransition {
        switch value {
        case "opacity": return .opacity
        case "slide": return .slide
        case "scale": return .scale
        case "identity": return .identity
        default: return .identity
        }
    }

    private static func parseEdge(_ value: String) -> Edge {
        switch value {
        case "top": return .top
        case "bottom": return .bottom
        case "leading": return .leading
        case "trailing": return .trailing
        default: return .bottom
        }
    }
}

extension TransitionComponent: ViewModifier {
    public func body(content: Content) -> some View {
        switch kind {
        case .standard(let transition):
            content.transition(transition)
        case .blurReplace(let config):
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *) {
                switch config {
                case "downUp": content.transition(.blurReplace(.downUp))
                case "upUp": content.transition(.blurReplace(.upUp))
                default: content.transition(.blurReplace)
                }
            } else {
                content.transition(.opacity)
            }
        }
    }
}
