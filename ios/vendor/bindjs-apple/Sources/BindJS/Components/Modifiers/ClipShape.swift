import SwiftUI

public struct ClipShapeComponent: Component {
    public static var directiveName: String = "clipShape"
    
    public var shape: (any Shape)?
}

extension ClipShapeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        // Get shape from rawValue directive
        if let shapeDirective: Directive = directive.rawValue(),
           let shapeComponent = makeComponent(shapeDirective) {
            self.shape = makeShape(shapeComponent)
        } else {
            self.shape = nil
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitClipShape(self)
    }
}

extension ClipShapeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if let shape = shape {
            content.clipShape(AnyShape(shape))
        } else {
            content
        }
    }
}
