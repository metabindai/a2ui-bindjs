import SwiftUI

public struct TrackingComponent: Component {
    public static var directiveName: String = "tracking"
    
    public var tracking: CGFloat
}

extension TrackingComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        tracking = directive.rawValue() ?? 0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitTracking(self)
    }
}

extension TrackingComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .tracking(tracking)
    }
}
