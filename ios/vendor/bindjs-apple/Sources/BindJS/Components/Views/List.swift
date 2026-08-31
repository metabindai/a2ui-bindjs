import SwiftUI

public struct ListComponent: Component {
    public static var directiveName: String = "List"

    @EnvironmentObject private var context: BindJSContext

    public var selection: String?
    public var setSelectionId: String?
    public var environmentId: String
    public var children: [Component]
}

extension ListComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        selection      = directive["selection"]
        setSelectionId = directive["setSelectionId"]
        environmentId  = directive["environmentId"] ?? ""
        children       = directive.children.compactMap { makeComponent($0) }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitList(self)
    }
}

extension ListComponent: View {
    public var body: some View {
        if setSelectionId != nil {
            // List with selection binding
            List(selection: Binding(
                get: {
                    return selection
                },
                set: { newValue in
                    context.restoreEnvironment(id: environmentId)
                    if let selectionSetterId = setSelectionId {
                        _ = context.callEventHandler(id: selectionSetterId, arguments: newValue)
                    }
                }
            )) {
                ForEach(children.indices, id: \.self) { index in
                    ComponentView(children[index])
                }
            }
        } else {
            // List without selection
            List {
                ForEach(children.indices, id: \.self) { index in
                    ComponentView(children[index])
                }
            }
        }
    }
}
