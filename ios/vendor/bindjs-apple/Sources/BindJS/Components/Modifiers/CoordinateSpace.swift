import SwiftUI

public struct CoordinateSpaceComponent: Component {
    public static var directiveName: String = "coordinateSpace"
    
    public var name: String
}

extension CoordinateSpaceComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        name = directive.rawValue() ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitCoordinateSpace(self)
    }
}

extension CoordinateSpaceComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .coordinateSpace(name: name)
    }
}