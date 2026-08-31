import SwiftUI

public struct ScrollPositionComponent: Component {
    public static var directiveName: String = "scrollPosition"

    let scrolledID: String?
    let setScrolledIDHandlerId: String?
    let environmentId: String

    @EnvironmentObject private var context: BindJSContext
}

extension ScrollPositionComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.scrolledID = directive["scrolledID"]
        self.setScrolledIDHandlerId = directive["setScrolledIDHandlerId"]
        self.environmentId = directive["environmentId"] ?? ""
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitScrollPosition(self)
    }
}

extension ScrollPositionComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, *) {
            ScrollPositionView(
                content: content,
                scrolledID: scrolledID,
                setScrolledIDHandlerId: setScrolledIDHandlerId,
                environmentId: environmentId,
                context: context
            )
        } else {
            content
        }
    }
}

@available(iOS 17.0, macOS 14.0, *)
private struct ScrollPositionView<Content: View>: View {
    let content: Content
    let scrolledID: String?
    let setScrolledIDHandlerId: String?
    let environmentId: String
    let context: BindJSContext

    @State private var currentScrolledID: String?

    var body: some View {
        content
            .scrollPosition(id: $currentScrolledID)
            .onChange(of: currentScrolledID) { oldValue, newValue in
                if let setScrolledIDHandlerId {
                    context.restoreEnvironment(id: environmentId)
                    _ = context.callEventHandler(id: setScrolledIDHandlerId, arguments: newValue as Any)
                }
            }
            .onChange(of: scrolledID) { oldValue, newValue in
                currentScrolledID = newValue
            }
            .onAppear {
                currentScrolledID = scrolledID
            }
    }
}
