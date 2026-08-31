import SwiftUI

public struct ToolbarItemGroupComponent: Component {
    public static var directiveName: String = "ToolbarItemGroup"
    
    public let placement: ToolbarItemPlacement
    public var children: [Component]
}

extension ToolbarItemGroupComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.placement = directive["placement"] ?? .automatic
        self.children = directive.children.compactMap { makeComponent($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitToolbarItemGroup(self)
    }
}

extension ToolbarItemGroupComponent: ToolbarContent {
    public var body: some ToolbarContent {
        ToolbarItemGroup(placement: placement) {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        }
    }
}
