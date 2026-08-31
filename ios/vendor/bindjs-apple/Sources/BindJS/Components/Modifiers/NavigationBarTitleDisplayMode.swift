import SwiftUI

public struct NavigationBarTitleDisplayModeComponent: Component {
    public static var directiveName: String = "navigationBarTitleDisplayMode"

    public var displayMode: String
}

extension NavigationBarTitleDisplayModeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        displayMode = directive.rawValue() ?? "automatic"
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitNavigationBarTitleDisplayMode(self)
    }
}

extension NavigationBarTitleDisplayModeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        #if os(iOS)
        content
            .navigationBarTitleDisplayMode(resolvedDisplayMode)
        #else
        content
        #endif
    }

    #if os(iOS)
    private var resolvedDisplayMode: NavigationBarItem.TitleDisplayMode {
        switch displayMode {
        case "large": return .large
        case "inline": return .inline
        default: return .automatic
        }
    }
    #endif
}
