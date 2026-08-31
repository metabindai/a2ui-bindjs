import SwiftUI

public struct FocusedComponent: Component {
    public static var directiveName: String = "focused"
    
    let isFocused: Bool?
    let setIsFocusedId: String?
    let environmentId: String
    
    @EnvironmentObject private var context: BindJSContext
}

extension FocusedComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.isFocused = directive["isFocused"]
        self.setIsFocusedId = directive["setIsFocusedId"]
        self.environmentId = directive["environmentId"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitFocused(self)
    }
}

extension FocusedComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 15.0, macOS 12.0, *) {
            FocusedView(
                content: content,
                isFocused: isFocused,
                setIsFocusedId: setIsFocusedId,
                environmentId: environmentId,
                context: context
            )
        } else {
            content
        }
    }
}

@available(iOS 15.0, macOS 12.0, *)
private struct FocusedView<Content: View>: View {
    let content: Content
    let isFocused: Bool?
    let setIsFocusedId: String?
    let environmentId: String
    let context: BindJSContext
    
    @FocusState private var focusState: Bool
    
    var body: some View {
        content
            .focused($focusState)
            .onChange(of: focusState) { oldValue, newValue in
                if let setIsFocusedId {
                    context.restoreEnvironment(id: environmentId)
                    _ = context.callEventHandler(id: setIsFocusedId, arguments: newValue)
                }
            }
            .onChange(of: isFocused) { oldValue, newValue in
                focusState = newValue ?? false
            }
            .onAppear {
                focusState = isFocused ?? false
            }
    }
}
