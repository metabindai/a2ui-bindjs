import SwiftUI

public struct LabelComponent: Component {
    public static var directiveName: String = "Label"

    public var title: Component?
    public var icon: Component?
    public var systemImage: String?
}

extension LabelComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        // Title can be a component or a string
        if let titleDirective: Directive = directive["title"] {
            title = makeComponent(titleDirective)
        } else if let titleString: String = directive["title"] {
            title = TextComponent(titleString)
        }

        // Icon can be a component, SF Symbol name, or both
        systemImage = directive["systemImage"]

        if let iconDirective: Directive = directive["icon"] {
            icon = makeComponent(iconDirective)
        }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitLabel(self)
    }
}

extension LabelComponent: View {
    public var body: some View {
        if let systemImage = systemImage {
            // SF Symbol + title
            if let title = title {
                Label {
                    ComponentView(title)
                } icon: {
                    Image(systemName: systemImage)
                }
            } else {
                Label("", systemImage: systemImage)
            }
        } else if let icon = icon, let title = title {
            // Custom icon + title
            Label {
                ComponentView(title)
            } icon: {
                ComponentView(icon)
            }
        } else if let title = title {
            // Title only (no icon)
            ComponentView(title)
        } else if let icon = icon {
            // Icon only (no title)
            ComponentView(icon)
        } else {
            // Empty label
            EmptyView()
        }
    }
}
