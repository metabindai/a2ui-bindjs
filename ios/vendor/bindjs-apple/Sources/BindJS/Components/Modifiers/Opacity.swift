import SwiftUI

public struct OpacityComponent: Component {
    public static var directiveName: String = "opacity"
    
    public var opacity: Double
}

extension OpacityComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        opacity = directive.rawValue() ?? 1
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitOpacity(self)
    }
}

extension OpacityComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .opacity(opacity)
    }
}
