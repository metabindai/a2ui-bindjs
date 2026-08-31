import SwiftUI

public protocol DefaultInitializable {
    init()
}

public protocol ComponentRepresentable: DefaultInitializable, View {
    
    static var name: String { get }
    
    typealias Context = ComponentRepresentableContext
}

public extension EnvironmentValues {
    @Entry var componentRepresentableContext: ComponentRepresentableContext?
}

public struct ComponentRepresentableContext {
    public let children: [Component]
    public let props: [String: Any]
    public let componentContext: BindJSContext
    public let environmentValues: EnvironmentValues
    
    public init(children: [Component], props: [String: Any], componentContext: BindJSContext, environmentValues: EnvironmentValues) {
        self.children = children
        self.props = props
        self.componentContext = componentContext
        self.environmentValues = environmentValues
    }
    
    public var content: some View {
        ForEach(children.indices, id: \.self) { index in
            ComponentView(children[index])
        }
    }
}
