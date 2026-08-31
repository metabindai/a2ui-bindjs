import SwiftUI

public struct OnSubmitComponent: Component {
    public static var directiveName: String = "onSubmit"
    
    let onSubmitId: String?
    let environmentId: String
    
    @EnvironmentObject private var context: BindJSContext
}

extension OnSubmitComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.onSubmitId = directive["handlerId"]
        self.environmentId = directive["environmentId"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitOnSubmit(self)
    }
}

extension OnSubmitComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 15.0, macOS 12.0, *) {
            content
                .onSubmit {
                    if let onSubmitId {
                        context.restoreEnvironment(id: environmentId)
                        _ = context.callEventHandler(id: onSubmitId, arguments: [])
                    }
                }
        } else {
            content
        }
    }
}
