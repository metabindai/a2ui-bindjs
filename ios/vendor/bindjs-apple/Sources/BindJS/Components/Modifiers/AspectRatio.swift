import SwiftUI

public struct AspectRatioComponent: Component {
    public static var directiveName: String = "aspectRatio"
    
    public var aspectRatio: CGFloat?
    public var contentMode: ContentMode
}

extension AspectRatioComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        self.aspectRatio = directive["aspectRatio"]
        self.contentMode = directive["contentMode"] ?? .fill
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAspectRatio(self)
    }
}

extension AspectRatioComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .aspectRatio(aspectRatio, contentMode: contentMode)
    }
}
