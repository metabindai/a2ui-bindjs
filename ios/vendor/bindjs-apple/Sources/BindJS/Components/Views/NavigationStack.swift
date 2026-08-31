import SwiftUI

public struct NavigationStackComponent: Component {
    public static var directiveName: String = "NavigationStack"
    
    public var children: [Component]
}

extension NavigationStackComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        children = directive.children.compactMap { makeComponent($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitNavigationStack(self)
    }
}

extension NavigationStackComponent: View {
    public var body: some View {
        if #available(iOS 16.0, macOS 13.0, *) {
            NavigationStack {
                ForEach(children.indices, id: \.self) { index in
                    ComponentView(children[index])
                }
            }
        } else {
            #if os(iOS) || os(tvOS)
            NavigationView {
                ForEach(children.indices, id: \.self) { index in
                    ComponentView(children[index])
                }
            }
            .navigationViewStyle(.stack)
            #else
            NavigationView {
                ForEach(children.indices, id: \.self) { index in
                    ComponentView(children[index])
                }
            }
            #endif
        }
    }
}
