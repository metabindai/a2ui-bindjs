import SwiftUI

public struct GrayscaleComponent: Component {
    public static var directiveName: String = "grayscale"
    
    public var grayscale: Double
}

extension GrayscaleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        grayscale = directive.rawValue() ?? 1
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitGrayscale(self)
    }
}

extension GrayscaleComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .grayscale(grayscale)
    }
}
