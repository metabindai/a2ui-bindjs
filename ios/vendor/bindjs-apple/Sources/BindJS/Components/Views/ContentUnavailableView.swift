import SwiftUI

public struct ContentUnavailableViewComponent: Component {
    public static var directiveName: String = "ContentUnavailableView"

    public var title: Component?
    public var systemImage: String?
    public var description: Component?
    public var label: Component?
    public var actions: [Component]
}

extension ContentUnavailableViewComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        // Title can be a component or a string
        if let titleDirective: Directive = directive["title"] {
            title = makeComponent(titleDirective)
        } else if let titleString: String = directive["title"] {
            title = TextComponent(titleString)
        }

        systemImage = directive["systemImage"]

        // Description can be a component or a string
        if let descDirective: Directive = directive["description"] {
            description = makeComponent(descDirective)
        } else if let descString: String = directive["description"] {
            description = TextComponent(descString)
        }

        // Label overrides title+systemImage when provided
        if let labelDirective: Directive = directive["label"] {
            label = makeComponent(labelDirective)
        }

        actions = directive.children.compactMap { makeComponent($0) }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitContentUnavailableView(self)
    }
}

@available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *)
extension ContentUnavailableViewComponent: View {
    public var body: some View {
        if let label = label {
            // Custom label component overrides title+systemImage
            ContentUnavailableView {
                ComponentView(label)
            } description: {
                if let description = description {
                    ComponentView(description)
                }
            } actions: {
                ForEach(actions.indices, id: \.self) { index in
                    ComponentView(actions[index])
                }
            }
        } else if let title = title, let systemImage = systemImage {
            // Title + SF Symbol
            ContentUnavailableView {
                SwiftUI.Label {
                    ComponentView(title)
                } icon: {
                    Image(systemName: systemImage)
                }
            } description: {
                if let description = description {
                    ComponentView(description)
                }
            } actions: {
                ForEach(actions.indices, id: \.self) { index in
                    ComponentView(actions[index])
                }
            }
        } else if let title = title {
            // Title only
            ContentUnavailableView {
                ComponentView(title)
            } description: {
                if let description = description {
                    ComponentView(description)
                }
            } actions: {
                ForEach(actions.indices, id: \.self) { index in
                    ComponentView(actions[index])
                }
            }
        } else {
            EmptyView()
        }
    }
}
