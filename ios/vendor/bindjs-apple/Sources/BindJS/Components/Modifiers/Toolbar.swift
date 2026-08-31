import SwiftUI

public struct ToolbarComponent: Component {
    public static var directiveName: String = "toolbar"

    public var items: [Component]
}

extension ToolbarComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        // Content comes from ContentModifier - extract toolbar items
        if let contentDirective: Directive = directive["content"] {
            let content = makeComponent(contentDirective)

            // If content is a Group, extract its children
            if let group = content as? GroupComponent {
                items = group.content
            } else if let toolbarItem = content as? ToolbarItemComponent {
                // Single toolbar item
                items = [toolbarItem]
            } else {
                items = []
            }
        } else {
            items = []
        }

        // Filter to only ToolbarItems or ToolbarItemGroupComponent (ignore anything else)
        items = items.filter { $0 is ToolbarItemComponent || $0 is ToolbarItemGroupComponent }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitToolbar(self)
    }
}

extension ToolbarComponent: ViewModifier {
    public func body(content: Content) -> some View {
        applyToolbarItems(to: content, items: items)
    }

    @ViewBuilder
    private func applyToolbarItems(to content: Content, items: [Component]) -> some View {
        if items.isEmpty {
            // Base case: no more items
            content
        } else if let firstItem = items.first as? ToolbarItemComponent {
            // Recursive case: apply first item, then recurse with remaining
            let remaining = Array(items.dropFirst())
            content
                .toolbar {
                    firstItem
                }
                .modifier(ToolbarRecursiveModifier(items: remaining))
        } else if let firstItem = items.first as? ToolbarItemGroupComponent {
            // Recursive case: apply first item, then recurse with remaining
            let remaining = Array(items.dropFirst())
            content
                .toolbar {
                    firstItem
                }
                .modifier(ToolbarRecursiveModifier(items: remaining))
        } else {
            // Shouldn't happen due to validation, but fallback
            content
        }
    }
}

// Helper modifier for recursive application
private struct ToolbarRecursiveModifier: ViewModifier {
    let items: [Component]

    func body(content: Content) -> some View {
        applyToolbarItems(to: content, items: items)
    }

    @ViewBuilder
    private func applyToolbarItems(to content: Content, items: [Component]) -> some View {
        if items.isEmpty {
            content
        } else if let firstItem = items.first as? ToolbarItemComponent {
            let remaining = Array(items.dropFirst())
            content
                .toolbar {
                    firstItem
                }
                .modifier(ToolbarRecursiveModifier(items: remaining))
        } else if let firstItem = items.first as? ToolbarItemGroupComponent {
            let remaining = Array(items.dropFirst())
            content
                .toolbar {
                    firstItem
                }
                .modifier(ToolbarRecursiveModifier(items: remaining))
        } else {
            content
        }
    }
}
