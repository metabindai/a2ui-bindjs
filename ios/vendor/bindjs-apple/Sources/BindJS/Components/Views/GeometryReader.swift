import SwiftUI
import JavaScriptCore

public struct GeometryReaderComponent: Component {
    public static var directiveName: String = "GeometryReader"

    public let handlerId: String
    public let environmentId: String

    @EnvironmentObject private var context: BindJSContext
}

extension GeometryReaderComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        handlerId = directive["handlerId"] ?? ""
        environmentId = directive["environmentId"] ?? ""
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGeometryReader(self)
    }
}

extension GeometryReaderComponent: View {
    public var body: some View {
        GeometryReader { geometry in
            // Restore environment before calling handler
            if case _ = context.restoreEnvironment(id: environmentId) {
                // Call into JS with geometry data and get back child components
                let result = context.callEventHandler(
                    id: handlerId,
                    arguments: geometryCallbackData(for: geometry)
                )

                // Expect the handler to return a directive or array of directives
                if let directive = result?.toDirective(),
                   let component = makeComponent(directive) {
                    ComponentView(component)
                } else if let array = result?.toArray() {
                    ForEach(array.indices, id: \.self) { index in
                        if let jsValue = array[index] as? JSValue,
                           let directive = jsValue.toDirective(),
                           let component = makeComponent(directive) {
                            ComponentView(component)
                        }
                    }
                }
            }
        }
    }
}
