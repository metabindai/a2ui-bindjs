import SwiftUI

public struct ControlSizeComponent: Component {
    public static var directiveName: String = "controlSize"
    
    public var controlSize: ControlSize
}

extension ControlSizeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        controlSize = directive.rawValue() ?? .regular
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitControlSize(self)
    }
}

extension ControlSizeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .controlSize(controlSize)
    }
}
