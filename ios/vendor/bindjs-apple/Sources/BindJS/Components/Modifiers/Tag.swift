import SwiftUI

public struct TagComponent: Component {
    public static var directiveName: String = "tag"
    
    public var value: String
}

extension TagComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        value = directive.rawValue() ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitTag(self)
    }
}

extension TagComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .tag(value)
    }
}