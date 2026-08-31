import SwiftUI

public struct TintComponent: Component {
    public static var directiveName: String = "tint"
    
    public var color: ColorComponent
}

extension TintComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        guard let colorDirective: Directive = directive.rawValue(),
              let colorComponent = ColorComponent(from: colorDirective) else { return nil }
        
        color = colorComponent
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitTint(self)
    }
}

extension TintComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .tint(color.swiftUI)
    }
}
