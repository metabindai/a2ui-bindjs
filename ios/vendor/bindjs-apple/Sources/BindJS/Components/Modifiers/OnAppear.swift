import SwiftUI

public struct OnAppearComponent: Component {
    public static var directiveName: String = "onAppear"
    
    @EnvironmentObject private var context: BindJSContext
    
    public let handlerId: String
}

extension OnAppearComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        handlerId = directive["handlerId"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitOnAppear(self)
    }
}

extension OnAppearComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .onAppear {
                _ = context.callEventHandler(id: handlerId, arguments: [])
            }
    }
}
