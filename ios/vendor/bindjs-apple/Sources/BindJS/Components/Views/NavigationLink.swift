import SwiftUI

public struct NavigationLinkComponent: Component {
    public static var directiveName: String = "NavigationLink"

    @EnvironmentObject private var context: BindJSContext
    @Environment(\.componentRegistry) private var componentRegistry

    @State var destination: Component

    public var label: Component
    public var destinationHandlerId: String?

}

extension NavigationLinkComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        destination = EmptyComponent()
        label = directive["label"].flatMap(makeComponent) ?? TextComponent("Link")
        destinationHandlerId = directive["destinationHandlerId"]
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitNavigationLink(self)
    }
}

extension NavigationLinkComponent: View {
    public var body: some View {
        if #available(iOS 16.0, macOS 13.0, *) {
            NavigationLink {
                NavigationLinkContentView(destinationHandlerId: destinationHandlerId)
                    .environmentObject(context)
                    .environment(\.componentRegistry, componentRegistry)
            } label: {
                ComponentView(label)
            }
        } else {
            NavigationLink(destination: NavigationLinkContentView(destinationHandlerId: destinationHandlerId)
                .environmentObject(context)
                .environment(\.componentRegistry, componentRegistry)
            ) {
                ComponentView(label)
            }
        }
    }
}

struct NavigationLinkContentView : View {
    var destinationHandlerId: String?
    @State var destination: Component = ColorComponent(storage: .name("clear"), opacity: 0)
    @EnvironmentObject private var context: BindJSContext

    func reloadDestination() {
        guard let destinationHandlerId else { return }

        if let jsValue = context.callEventHandler(id: destinationHandlerId, arguments: []),
           let directive = jsValue.toDirective() {
            // If the directive is a known built-in component, create it directly.
            // Otherwise, wrap it in a ComponentCall so the ComponentRegistry can
            // resolve it (e.g. MetabindView registered via .withComponent()).
            if let component = makeComponentIfBuiltIn(directive) {
                self.destination = component
            } else if let call = ComponentCall(from: Directive(
                type: "ComponentCall",
                props: ["name": directive.type, "props": directive.props],
                children: directive.children
            )) {
                self.destination = call
            }
        }
    }
    
    var body : some View {
        ComponentView(destination)
            .onAppear {
                reloadDestination()
            }
    }
}
