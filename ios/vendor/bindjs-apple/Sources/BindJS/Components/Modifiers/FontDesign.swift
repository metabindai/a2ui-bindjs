import SwiftUI

public struct FontDesignComponent: Component {
    public static var directiveName: String = "fontDesign"
    
    public var fontDesign: Font.Design
}

extension FontDesignComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        fontDesign = directive.rawValue() ?? .default
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitFontDesign(self)
    }
}

extension FontDesignComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 16.1, *) {
            content
                .fontDesign(fontDesign)
        } else {
            content
        }
    }
}
