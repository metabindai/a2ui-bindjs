import SwiftUI

public struct NavigationBarBackButtonHiddenComponent: Component {
    public static var directiveName: String = "navigationBarBackButtonHidden"

    public var isHidden: Bool
}

extension NavigationBarBackButtonHiddenComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        isHidden = directive.rawValue() ?? true
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitNavigationBarBackButtonHidden(self)
    }
}

extension NavigationBarBackButtonHiddenComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .navigationBarBackButtonHidden(isHidden)
    }
}
