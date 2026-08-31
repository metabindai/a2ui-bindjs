import SwiftUI

public struct ListRowSeparatorComponent: Component {
    public static var directiveName: String = "listRowSeparator"

    let rawValue: String
}

extension ListRowSeparatorComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.rawValue = directive["rawValue"] ?? "visible"
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitListRowSeparator(self)
    }
}

extension ListRowSeparatorComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .listRowSeparator(rawValue == "hidden" ? .hidden : .visible)
    }
}
