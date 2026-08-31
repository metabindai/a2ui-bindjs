import SwiftUI

public struct LayoutPriorityComponent: Component {
    public static var directiveName: String = "layoutPriority"
    
    public var priority: Double
}

extension LayoutPriorityComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        priority = directive.rawValue() ?? 0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitLayoutPriority(self)
    }
}

extension LayoutPriorityComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .layoutPriority(priority)
    }
}