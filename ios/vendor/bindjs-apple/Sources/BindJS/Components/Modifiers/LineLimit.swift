import SwiftUI

public struct LineLimitComponent: Component {
    public static var directiveName: String = "lineLimit"
    
    public var lineLimit: Int?
}

extension LineLimitComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        lineLimit = directive.rawValue()
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitLineLimit(self)
    }
}

extension LineLimitComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .lineLimit(lineLimit)
    }
}
