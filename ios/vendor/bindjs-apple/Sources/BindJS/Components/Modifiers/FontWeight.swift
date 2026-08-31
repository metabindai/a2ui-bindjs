import SwiftUI

public struct FontWeightComponent: Component {
    public static var directiveName: String = "fontWeight"
    
    public var fontWeight: Font.Weight
}

extension FontWeightComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        fontWeight = directive.rawValue() ?? .regular
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitFontWeight(self)
    }
}

extension FontWeightComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .fontWeight(fontWeight)
    }
}
