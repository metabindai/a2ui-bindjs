import SwiftUI

public struct ColorSchemeComponent: Component {
    public static var directiveName: String = "colorScheme"
    
    public var colorScheme: ColorScheme
}

extension ColorSchemeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        colorScheme = directive.rawValue() ?? .light
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitColorScheme(self)
    }
}

extension ColorSchemeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .colorScheme(colorScheme)
    }
}
