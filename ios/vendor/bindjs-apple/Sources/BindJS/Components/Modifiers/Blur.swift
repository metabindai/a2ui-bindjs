import SwiftUI

public struct BlurComponent: Component {
    public static var directiveName: String = "blur"
    
    public var radius: CGFloat
}

extension BlurComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        radius = directive.rawValue() ?? 0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitBlur(self)
    }
}

extension BlurComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .blur(radius: radius)
    }
}
