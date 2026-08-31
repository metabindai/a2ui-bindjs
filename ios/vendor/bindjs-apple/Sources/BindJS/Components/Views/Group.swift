import SwiftUI

public struct GroupComponent: Component {
    public static var directiveName: String = "Group"
    
    public var content: [Component]
}

extension GroupComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        self.content = directive.children.compactMap { makeComponent($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGroup(self)
    }
}

extension GroupComponent: View {
    public var body: some View {
        Group {
            ForEach(content.indices, id: \.self) { index in
                ComponentView(content[index])
            }
        }
    }
}
