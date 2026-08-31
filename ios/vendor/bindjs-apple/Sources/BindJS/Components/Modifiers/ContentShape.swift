import SwiftUI

public struct ContentShapeComponent: Component {
    public static var directiveName: String = "contentShape"
    
    public var shape: (any Shape)?
}

extension ContentShapeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        self.shape = directive.rawValue().flatMap { makeComponent($0) }.flatMap { makeShape($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitContentShape(self)
    }
}

extension ContentShapeComponent: ViewModifier {
    
    public func body(content: Content) -> some View {
        if let shape = shape {
            content.contentShape(AnyShape(shape))
        } else {
            content
        }
    }
}
