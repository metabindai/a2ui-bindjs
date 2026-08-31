import SwiftUI

public struct NavigationDestinationComponent: Component {
    public static var directiveName: String = "navigationDestination"

    @EnvironmentObject private var context: BindJSContext

    @State var internalIsPresentedState: Bool = false
    
    public var isPresented: Bool
    public var destinationHandlerId: String?
    public var setIsPresentedHandlerId: String?

    func handleChange(isPresented: Bool) {
        if let setIsPresentedHandlerId {
            _ = context.callEventHandler(id: setIsPresentedHandlerId, arguments: isPresented)
        }
    }
}

extension NavigationDestinationComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        isPresented = directive["isPresented"] ?? false
        destinationHandlerId = directive["destinationHandlerId"]
        setIsPresentedHandlerId = directive["setIsPresentedHandlerId"]
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitNavigationDestination(self)
    }
}

extension NavigationDestinationComponent: ViewModifier {
    @ViewBuilder
    public func body(content: Content) -> some View {
        if #available(iOS 16.0, macOS 13.0, *) {
            content
                .navigationDestination(isPresented: $internalIsPresentedState) {
                    LazyMaterializedComponentView(
                        handlerId: destinationHandlerId,
                        placeholder: ColorComponent(storage: .name("clear"), opacity: 0)
                    )
                        .environmentObject(context)
                }
                .onAppear {
                    internalIsPresentedState = isPresented
                }
                .onChange(of: isPresented) { old, new in
                    if internalIsPresentedState != new {
                        internalIsPresentedState = new
                    }
                }
                .onChange(of: internalIsPresentedState) { old, new in
                    if isPresented != new {
                        handleChange(isPresented: new)
                    }
                }
        } else {
            content
        }
    }
}
