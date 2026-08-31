import SwiftUI

struct ComponentRegistry {
    var components: [String: () -> any View] = [:]
    
    func makeComponent(_ name: String, props: [String: Any], children: [Component], componentContext: BindJSContext, environmentValues: EnvironmentValues) -> AnyView? {
        guard let builder = components[name] else { return nil }
        let c = ComponentRepresentableContext(
            children: children,
            props: props,
            componentContext: componentContext,
            environmentValues: environmentValues
        )
        return AnyView(
            builder()
                .environment(\.componentRepresentableContext, c)
        )
    }
}

extension EnvironmentValues {
    @Entry var componentRegistry = ComponentRegistry()
}

extension View {
    public func withComponent<R: ComponentRepresentable>(_ component: R.Type) -> some View {
        transformEnvironment(\.componentRegistry) { registry in
            registry.components[R.name] = R.init
        }
    }
}
