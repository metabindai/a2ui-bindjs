import SwiftUI

public struct OffsetComponent: Component {
    public static var directiveName: String = "offset"
    
    public var x: CGFloat
    public var y: CGFloat
}

extension OffsetComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        x = directive["x"] ?? 0
        y = directive["y"] ?? 0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitOffset(self)
    }
}

extension OffsetComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .offset(x: x, y: y)
    }
}
