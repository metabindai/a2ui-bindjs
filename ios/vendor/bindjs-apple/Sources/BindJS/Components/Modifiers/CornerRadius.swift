import SwiftUI

public struct CornerRadiusComponent: Component {
    public static var directiveName: String = "cornerRadius"
    
    public var radius: CGFloat
}

extension CornerRadiusComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        radius = directive.rawValue() ?? 0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitCornerRadius(self)
    }
}

extension CornerRadiusComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .cornerRadius(radius)
    }
}
