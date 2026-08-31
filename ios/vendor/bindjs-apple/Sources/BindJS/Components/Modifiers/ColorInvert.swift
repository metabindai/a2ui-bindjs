import SwiftUI

public struct ColorInvertComponent: Component {
    public static var directiveName: String = "colorInvert"
}

extension ColorInvertComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitColorInvert(self)
    }
}

extension ColorInvertComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .colorInvert()
    }
}
