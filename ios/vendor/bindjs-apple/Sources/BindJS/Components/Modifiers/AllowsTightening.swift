import SwiftUI

public struct AllowsTighteningComponent: Component {
    public static var directiveName: String = "allowsTightening"
    
    public var flag: Bool
}

extension AllowsTighteningComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        flag = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAllowsTightening(self)
    }
}

extension AllowsTighteningComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .allowsTightening(flag)
    }
}