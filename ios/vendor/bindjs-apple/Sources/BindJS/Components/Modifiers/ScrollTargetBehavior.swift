import SwiftUI

public struct ScrollTargetBehaviorComponent: Component {
    public static var directiveName: String = "scrollTargetBehavior"

    let behavior: String
}

extension ScrollTargetBehaviorComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.behavior = directive.rawValue() ?? "viewAligned"
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitScrollTargetBehavior(self)
    }
}

extension ScrollTargetBehaviorComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, *) {
            switch behavior {
            case "paging":
                content.scrollTargetBehavior(.paging)
            default:
                content.scrollTargetBehavior(.viewAligned)
            }
        } else {
            content
        }
    }
}
