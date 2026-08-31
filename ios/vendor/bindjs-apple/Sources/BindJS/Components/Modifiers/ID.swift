import SwiftUI

public struct IDComponent: Component {
    public static var directiveName: String = "id"
    
    public var id: String
}

extension IDComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        id = directive.rawValue() ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitID(self)
    }
}

extension IDComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .id(id)
    }
}
