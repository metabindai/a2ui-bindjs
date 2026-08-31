import SwiftUI

public struct HiddenComponent: Component {
    public static var directiveName: String = "hidden"
}

extension HiddenComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitHidden(self)
    }
}

extension HiddenComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .hidden()
    }
}
