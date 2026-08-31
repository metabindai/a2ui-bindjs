import SwiftUI

public struct ScrollContentBackgroundComponent: Component {
    public static var directiveName: String = "scrollContentBackground"
    
    let rawValue: String
}

extension ScrollContentBackgroundComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.rawValue = directive["rawValue"] ?? "visible"
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitScrollContentBackground(self)
    }
}

extension ScrollContentBackgroundComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if #available(iOS 16.0, macOS 13.0, *) {
            content
                .scrollContentBackground(rawValue == "hidden" ? .hidden : .visible)
        } else {
            content
        }
    }
}
