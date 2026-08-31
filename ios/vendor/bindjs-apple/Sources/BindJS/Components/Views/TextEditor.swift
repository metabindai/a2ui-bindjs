import SwiftUI

public struct TextEditorComponent: Component {
    public static var directiveName: String = "TextEditor"

    @EnvironmentObject private var context: BindJSContext

    public var text: String?
    public var setTextId: String?
    public var environmentId: String
}

extension TextEditorComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        text = directive["text"]
        setTextId = directive["setTextId"]
        environmentId = directive["environmentId"] ?? ""
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitTextEditor(self)
    }
}

extension TextEditorComponent: View {
    public var body: some View {
        TextEditor(text: Binding(
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
