import SwiftUI

public struct ClippedComponent: Component {
    public static var directiveName: String = "clipped"
}

extension ClippedComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitClipped(self)
    }
}

extension ClippedComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .clipped()
    }
}
