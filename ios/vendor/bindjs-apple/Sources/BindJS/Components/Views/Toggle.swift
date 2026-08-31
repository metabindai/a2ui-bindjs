import SwiftUI

public struct ToggleComponent: Component {
    public static var directiveName: String = "Toggle"

    @EnvironmentObject private var context: BindJSContext

    public var label: String
    public var isOn: Bool?
    public var setIsOnId: String?
    public var environmentId: String
}

extension ToggleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        label = directive["label"] ?? ""
        isOn = directive["isOn"]
        setIsOnId = directive["setIsOnId"]
        environmentId = directive["environmentId"] ?? ""
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitToggle(self)
    }
}

extension ToggleComponent: View {
    public var body: some View {
        Toggle(label, isOn: Binding(
            get: {
                return isOn ?? false
            },
            set: { newValue in
                if let setIsOnId {
                    context.restoreEnvironment(id: environmentId)
                    _ = context.callEventHandler(id: setIsOnId, arguments: newValue)
                }
            }
        ))
    }
}
