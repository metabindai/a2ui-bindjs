import SwiftUI

public struct PlaceholderComponent: Component {
    public static var directiveName: String = "Placeholder"
    @Environment(\.componentCall) private var enclosingCall
    @Environment(\.componentRegistry) private var componentRegistry
    @EnvironmentObject private var componentContext: BindJSContext
    @Environment(\.self) private var environmentValues
    
    let name: String
}

extension PlaceholderComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        self.name = directive["name"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitPlaceholder(self)
    }
}

extension PlaceholderComponent: View {
    public var body: some View {
        if let enclosingCall {
            if let resolved = componentRegistry.makeComponent(name, props: enclosingCall.props, children: enclosingCall.children, componentContext: componentContext, environmentValues: environmentValues) {
                resolved
            } else {
                defaultPlaceholder
            }
        } else {
            defaultPlaceholder
        }
    }
    
    var defaultPlaceholder: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(Color.gray.opacity(0.3))
    }
}
