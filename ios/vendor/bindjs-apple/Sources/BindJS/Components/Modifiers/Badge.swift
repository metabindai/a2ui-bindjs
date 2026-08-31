import SwiftUI

public struct BadgeComponent: Component {
    public static var directiveName: String = "badge"

    let count: Int?
    let label: String?
}

extension BadgeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        if let intValue: Int = directive.rawValue() {
            count = intValue
            label = nil
        } else {
            count = nil
            label = directive.rawValue()
        }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitBadge(self)
    }
}

extension BadgeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if let count {
            content.badge(count)
        } else {
            content.badge(label ?? "")
        }
    }
}
