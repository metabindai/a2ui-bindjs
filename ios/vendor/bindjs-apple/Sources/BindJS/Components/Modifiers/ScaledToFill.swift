import SwiftUI

public struct ScaledToFillComponent: Component {
    public static var directiveName: String = "scaledToFill"
}

extension ScaledToFillComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitScaledToFill(self)
    }
}

extension ScaledToFillComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .scaledToFill()
    }
}
