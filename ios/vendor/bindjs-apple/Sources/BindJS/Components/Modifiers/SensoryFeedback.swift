import SwiftUI

public struct SensoryFeedbackComponent: Component {
    public static var directiveName: String = "sensoryFeedback"

    public let feedback: String
    public let trigger: String
}

extension SensoryFeedbackComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        feedback = directive["feedback"] ?? "impact"
        trigger = String(describing: directive.props["trigger"] ?? "")
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitSensoryFeedback(self)
    }
}

extension SensoryFeedbackComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *) {
            content
                .sensoryFeedback(parseFeedback(), trigger: trigger)
        } else {
            content
        }
    }

    @available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *)
    private func parseFeedback() -> SensoryFeedback {
        switch feedback {
        case "impact": return .impact
        case "selection": return .selection
        case "success": return .success
        case "warning": return .warning
        case "error": return .error
        case "light": return .impact(weight: .light)
        case "medium": return .impact(weight: .medium)
        case "heavy": return .impact(weight: .heavy)
        case "increase": return .increase
        case "decrease": return .decrease
        default: return .impact
        }
    }
}
