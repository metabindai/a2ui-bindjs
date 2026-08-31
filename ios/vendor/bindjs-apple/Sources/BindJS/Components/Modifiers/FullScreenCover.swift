import SwiftUI

public struct FullScreenCoverComponent: Component {
    public static var directiveName: String = "fullScreenCover"

    @EnvironmentObject private var context: BindJSContext

    public var isPresented: Bool
    public var contentHandlerId : String?
    public var dismissHandlerId : String?
    public var setIsPresentedHandlerId: String?

    func handleChange(isPresented: Bool) {
        if let setIsPresentedHandlerId {
            _ = context.callEventHandler(id: setIsPresentedHandlerId, arguments: isPresented)
        }
    }

    func handleDismiss() {
        if let dismissHandlerId {
            _ = context.callEventHandler(id: dismissHandlerId, arguments: [])
        }
    }
}

extension FullScreenCoverComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        isPresented = directive["isPresented"] ?? false
        contentHandlerId = directive["contentHandlerId"]
        setIsPresentedHandlerId = directive["setIsPresentedHandlerId"]
        dismissHandlerId = directive["dismissHandlerId"]
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitFullScreenCover(self)
    }
}

extension FullScreenCoverComponent: ViewModifier {
    public func body(content: Content) -> some View {
        let isPresentedBinding = Binding(
            get: { self.isPresented },
            set: { handleChange(isPresented: $0) }
        )

        content
            #if os(macOS)
            .sheet(isPresented: isPresentedBinding, onDismiss: {
                handleDismiss()
            }) {
                LazyMaterializedComponentView(
                    handlerId: contentHandlerId,
                    isActive: isPresented
                )
                .environmentObject(context)
            }
            #else
            .fullScreenCover(isPresented: isPresentedBinding, onDismiss: {
                handleDismiss()
            }) {
                LazyMaterializedComponentView(
                    handlerId: contentHandlerId,
                    isActive: isPresented
                )
                .environmentObject(context)
            }
            #endif
    }
}
