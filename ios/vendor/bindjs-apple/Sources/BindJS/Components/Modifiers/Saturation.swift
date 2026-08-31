import SwiftUI

public struct SaturationComponent: Component {
    public static var directiveName: String = "saturation"
    
    public var saturation: Double
}

extension SaturationComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        saturation = directive.rawValue() ?? 1
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitSaturation(self)
    }
}

extension SaturationComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .saturation(saturation)
    }
}
