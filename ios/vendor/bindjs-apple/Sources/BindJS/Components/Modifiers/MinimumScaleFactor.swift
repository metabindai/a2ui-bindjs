import SwiftUI

public struct MinimumScaleFactorComponent: Component {
    public static var directiveName: String = "minimumScaleFactor"
    
    public var factor: CGFloat
}

extension MinimumScaleFactorComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        factor = directive.rawValue() ?? 1.0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitMinimumScaleFactor(self)
    }
}

extension MinimumScaleFactorComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .minimumScaleFactor(factor)
    }
}