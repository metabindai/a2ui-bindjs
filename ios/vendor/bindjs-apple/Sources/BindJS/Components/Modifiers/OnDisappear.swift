import SwiftUI

public struct OnDisappearComponent: Component {
    public static var directiveName: String = "onDisappear"
    
    @EnvironmentObject private var context: BindJSContext
    
    public let handlerId: String
}

extension OnDisappearComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        handlerId = directive["handlerId"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitOnDisappear(self)
    }
}

extension OnDisappearComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .onDisappear {
                _ = context.callEventHandler(id: handlerId, arguments: [])
            }
    }
}
