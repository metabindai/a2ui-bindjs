import SwiftUI

public struct UnresolvedComponent: Component {
    public static var directiveName: String = "Unresolved"
    
    public let directive: Directive
    public var children: [Component]
    
    public init?(from directive: Directive) {
        self.directive = directive
        self.children = directive.children.compactMap(makeComponent(_:))
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitUnresolved(self)
    }
}

extension UnresolvedComponent: View {
    
    public var body: some View {
        ForEach(children.indices, id: \.self) { index in
            ComponentView(children[index])
        }
    }
}
