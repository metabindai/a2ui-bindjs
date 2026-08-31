import SwiftUI

public struct ContentTransitionComponent: Component {
    public static var directiveName: String = "contentTransition"

    public var transition: ContentTransition
}

extension ContentTransitionComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        if let rawValue: String = directive.rawValue() {
            switch rawValue {
            case "numericText": transition = .numericText()
            case "opacity": transition = .opacity
            case "interpolate": transition = .interpolate
            case "identity": transition = .identity
            default: transition = .identity
            }
        } else if let countsDown = directive.props["countsDown"] as? Bool {
            transition = .numericText(countsDown: countsDown)
        } else {
            transition = .identity
        }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitContentTransition(self)
    }
}

extension ContentTransitionComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.contentTransition(transition)
    }
}
