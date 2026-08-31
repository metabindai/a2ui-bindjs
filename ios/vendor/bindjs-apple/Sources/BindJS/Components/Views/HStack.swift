import SwiftUI

public struct HStackComponent: Component {
    public static var directiveName: String = "HStack"
    
    public var alignment: VerticalAlignment
    public var spacing: CGFloat?
    public var children: [Component]
}

extension HStackComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        spacing = directive["spacing"]
        alignment = directive["alignment"] ?? .center
        children = directive.children.compactMap { makeComponent($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitHStack(self)
    }
}

extension HStackComponent: View {
    public var body: some View {
        HStack(alignment: alignment, spacing: spacing) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }
}
