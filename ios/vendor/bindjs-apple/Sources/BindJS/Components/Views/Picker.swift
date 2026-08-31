import SwiftUI

public struct PickerComponent: Component {
    public static var directiveName: String = "Picker"
    
    @EnvironmentObject private var context: BindJSContext
    
    public var label: String
    public var currentValueId: String?
    public var setterId: String?
    public var environmentId: String
    public var children: [Component]
}

extension PickerComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        label = directive["label"] ?? ""
        currentValueId = directive["currentValueId"]
        setterId = directive["setterId"]
        environmentId = directive["environmentId"] ?? ""
        children = directive.children.compactMap { makeComponent($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitPicker(self)
    }
}

extension PickerComponent: View {
    public var body: some View {
        Picker(label, selection: Binding(
            get: {
                context.restoreEnvironment(id: environmentId)
                return context.restorePickerValue(id: currentValueId ?? "") ?? ""
            },
            set: { newValue in
                context.restoreEnvironment(id: environmentId)
                if let setterId = setterId {
                    context.callPickerSetter(id: setterId, value: newValue)
                }
            }
        )) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }
}
