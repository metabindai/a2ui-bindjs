import SwiftUI

public struct SecureFieldComponent: Component {
    public static var directiveName: String = "SecureField"

    @EnvironmentObject private var context: BindJSContext

    public var placeholder: String
    public var text: String?
    public var setTextId: String?
    public var environmentId: String
}

extension SecureFieldComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        placeholder = directive["placeholder"] ?? ""
        text = directive["text"]
        setTextId = directive["setTextId"]
        environmentId = directive["environmentId"] ?? ""
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitSecureField(self)
    }
}

extension SecureFieldComponent: View {
    public var body: some View {
        SecureField(placeholder, text: Binding(
            get: {
                return text ?? ""
            },
            set: { newValue in
                if let setTextId {
                    context.restoreEnvironment(id: environmentId)
                    _ = context.callEventHandler(id: setTextId, arguments: newValue)
                }
            }
        ))
    }
}
