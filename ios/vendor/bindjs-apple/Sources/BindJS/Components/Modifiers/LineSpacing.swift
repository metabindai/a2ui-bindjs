import SwiftUI

public struct LineSpacingComponent: Component {
    public static var directiveName: String = "lineSpacing"
    
    public var lineSpacing: CGFloat
}

extension LineSpacingComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        lineSpacing = directive.rawValue() ?? 0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitLineSpacing(self)
    }
}

extension LineSpacingComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .lineSpacing(lineSpacing)
    }
}
