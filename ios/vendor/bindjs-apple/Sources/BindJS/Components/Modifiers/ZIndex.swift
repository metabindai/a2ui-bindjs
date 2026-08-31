import SwiftUI

public struct ZIndexComponent: Component {
    public static var directiveName: String = "zIndex"
    
    public var zIndex: Double
}

extension ZIndexComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        zIndex = directive.rawValue() ?? 0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitZIndex(self)
    }
}

extension ZIndexComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .zIndex(zIndex)
    }
}
