import SwiftUI

public struct ListStyleComponent: Component {
    public static var directiveName: String = "listStyle"
    public var style: String
}

extension ListStyleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        style = directive.rawValue() ?? "automatic"
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitListStyle(self)
    }
}

extension ListStyleComponent: ViewModifier {

    @ViewBuilder
    public func body(content: Content) -> some View {
        switch style.lowercased() {
        case "plain":
            content.listStyle(.plain)

        case "insetgrouped", "inset-grouped":
            #if os(iOS)
            content.listStyle(.insetGrouped)
            #else
            content.listStyle(.automatic)
            #endif

        case "grouped":
            #if os(iOS)
            content.listStyle(.grouped)
            #else
            content.listStyle(.automatic)
            #endif

        case "inset":
            content.listStyle(.inset)

        case "sidebar":
            content.listStyle(.sidebar)

        default:
            content.listStyle(.automatic)
        }
    }
}
