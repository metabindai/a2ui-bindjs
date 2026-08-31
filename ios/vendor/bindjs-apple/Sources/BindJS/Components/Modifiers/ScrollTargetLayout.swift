import SwiftUI

public struct ScrollTargetLayoutComponent: Component {
    public static var directiveName: String = "scrollTargetLayout"

    let isEnabled: Bool
}

extension ScrollTargetLayoutComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.isEnabled = directive.rawValue() ?? true
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitScrollTargetLayout(self)
    }
}

extension ScrollTargetLayoutComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, *) {
            content.scrollTargetLayout(isEnabled: isEnabled)
        } else {
            content
        }
    }
}
