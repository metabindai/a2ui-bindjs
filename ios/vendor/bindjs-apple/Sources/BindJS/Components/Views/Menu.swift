import SwiftUI

public struct MenuComponent: Component {
    public static var directiveName: String = "Menu"

    public var label: Component
    public var children: [Component]
}

extension MenuComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        // Label can be a component or default to "Menu" text
        label = directive["label"].flatMap(makeComponent) ?? TextComponent("Menu")

        // Children are the menu items
        children = directive.children.compactMap { makeComponent($0) }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitMenu(self)
    }
}

extension MenuComponent: View {
    public var body: some View {
        Menu {
            ForEach(children.indices, id: \.self) { index in
                ComponentView(children[index])
            }
        } label: {
            ComponentView(label)
        }
    }
}
