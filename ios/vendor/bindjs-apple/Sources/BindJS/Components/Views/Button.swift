import SwiftUI

public struct ButtonComponent: Component {
    public static var directiveName: String = "Button"
    
    @EnvironmentObject private var context: BindJSContext
    
    public var label: Component
    public let handlerId: String
}

extension ButtonComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        label = directive["label"].flatMap(makeComponent) ?? TextComponent("Button")
        handlerId = directive["handlerId"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitButton(self)
    }
}

extension ButtonComponent: View {
    public var body: some View {
        Button(action: {
            _ = context.callEventHandler(id: handlerId, arguments: [])
        }) {
            ComponentView(label)
        }
    }
}
