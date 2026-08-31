import SwiftUI

public struct OnChangeComponent: Component {
    public static var directiveName: String = "onChange"

    @EnvironmentObject private var context: BindJSContext

    public let value: String?
    public let handlerId: String
}

extension OnChangeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        value = directive["value"] ?? ""
        handlerId = directive["handlerId"] ?? ""
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitOnChange(self)
    }
}

extension OnChangeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *) {
            content
                .onChange(of: value) { oldValue, newValue in
                    _ = context.callEventHandler(id: handlerId, arguments: [oldValue, newValue])
                }
        } else {
            content
                .onChange(of: value) { newValue in
                    _ = context.callEventHandler(id: handlerId, arguments: [newValue, newValue])
                }
        }
    }
}
