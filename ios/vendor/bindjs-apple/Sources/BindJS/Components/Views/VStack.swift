import SwiftUI

public struct VStackComponent: Component {
    public static var directiveName: String = "VStack"
    
    public var alignment: HorizontalAlignment
    public var spacing: CGFloat?
    public var children: [Component]
}

extension VStackComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        spacing = directive["spacing"]
        alignment = directive["alignment"] ?? .center
        children = directive.children.compactMap { makeComponent($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitVStack(self)
    }
}

extension VStackComponent: View {
    public var body: some View {
        VStack(alignment: alignment, spacing: spacing) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }
}
