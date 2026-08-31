import SwiftUI

public struct SymbolComponent: Component {
    public static var directiveName: String = "symbol"

    public var symbol: ChartMarkStyle.SymbolName?
}

extension SymbolComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        let raw: String? = directive.rawValue() ?? directive["name"] ?? directive["symbol"]
        symbol = raw.flatMap(ChartMarkStyle.SymbolName.init(rawValue:))
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitSymbol(self)
    }
}

extension SymbolComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
    }
}
