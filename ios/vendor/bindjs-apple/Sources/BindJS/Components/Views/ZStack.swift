import SwiftUI

public struct ZStackComponent: Component {
    public static var directiveName: String = "ZStack"
    
    public var alignment: Alignment
    public var children: [Component]
}

extension ZStackComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        alignment = directive["alignment"] ?? .center
        children = directive.children.compactMap { makeComponent($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitZStack(self)
    }
}

extension ZStackComponent: View {
    public var body: some View {
        ZStack(alignment: alignment) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }
}
