import SwiftUI

public struct SymbolSizeComponent: Component {
    public static var directiveName: String = "symbolSize"

    public var size: Double?
}

extension SymbolSizeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        size = directive["size"] ?? directive["rawValue"] ?? directive["value"]
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitSymbolSize(self)
    }
}

extension SymbolSizeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
    }
}
