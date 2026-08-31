import SwiftUI

public struct OnTapGestureComponent: Component {
    public static var directiveName: String = "onTapGesture"
    
    @EnvironmentObject private var context: BindJSContext
    
    public var count: Int
    public let handlerId: String
}

extension OnTapGestureComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        count = directive["count"] ?? 1
        handlerId = directive["handlerId"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitOnTapGesture(self)
    }
}

extension OnTapGestureComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.onTapGesture(count: count) {
            _ = context.callEventHandler(id: handlerId, arguments: [])
        }
    }
}
