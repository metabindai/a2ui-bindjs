import SwiftUI

public struct ComponentCall: Component {
    public static var directiveName: String = "ComponentCall"
    @Environment(\.componentRegistry) private var componentRegistry
    @EnvironmentObject private var componentContext: BindJSContext
    @Environment(\.self) private var environmentValues
    
    public let directive: Directive
    public var children: [Component]
    
    public var wrapped: Component {
        children.first ?? EmptyComponent()
    }
    
    public var name: String {
        directive["name"] ?? ""
    }
    
    public var props: [String: Any] {
        directive.props["props"] as? [String: Any] ?? [:]
    }
    
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.directive = directive
        self.children = directive.children.compactMap(makeComponent(_:))
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitCall(self)
    }
}

extension ComponentCall: View {
    
    public var body: some View {
        if let resolved = componentRegistry.makeComponent(name, props: props, children: children, componentContext: componentContext, environmentValues: environmentValues) {
            resolved
        } else {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
            .environment(\.componentCall, self)
        }
    }
}

extension ComponentCall: CustomStringConvertible {
    public var description: String {
        "\(name)(props: \(props))"
    }
}

extension EnvironmentValues {
    @Entry var componentCall: ComponentCall?
}
