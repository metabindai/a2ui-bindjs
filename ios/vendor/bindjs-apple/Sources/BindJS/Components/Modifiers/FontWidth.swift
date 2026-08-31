import SwiftUI

public struct FontWidthComponent: Component {
    public static var directiveName: String = "fontWidth"
    
    public var fontWidth: Font.Width
}

extension FontWidthComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        fontWidth = directive.rawValue() ?? .standard
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitFontWidth(self)
    }
}

extension FontWidthComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .fontWidth(fontWidth)
    }
}
