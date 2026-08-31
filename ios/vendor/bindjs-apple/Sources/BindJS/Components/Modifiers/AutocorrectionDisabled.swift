import SwiftUI

public struct AutocorrectionDisabledComponent: Component {
    public static var directiveName: String = "autocorrectionDisabled"
    
    public var isActive: Bool
}

extension AutocorrectionDisabledComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        isActive = directive.rawValue() ?? true
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAutocorrectionDisabled(self)
    }
}

extension AutocorrectionDisabledComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .autocorrectionDisabled(isActive)
    }
}