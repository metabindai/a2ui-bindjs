import SwiftUI

public struct ScaledToFitComponent: Component {
    public static var directiveName: String = "scaledToFit"
}

extension ScaledToFitComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitScaledToFit(self)
    }
}

extension ScaledToFitComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .scaledToFit()
    }
}
