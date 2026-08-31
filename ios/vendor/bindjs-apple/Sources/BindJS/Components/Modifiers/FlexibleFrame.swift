import SwiftUI

public struct FlexibleFrameComponent: Component {
    public static var directiveName: String = "frame"
    
    public var minWidth: CGFloat?
    public var maxWidth: CGFloat?
    public var minHeight: CGFloat?
    public var maxHeight: CGFloat?
    public var alignment: Alignment
}

extension FlexibleFrameComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        minWidth = directive["minWidth"]
        maxWidth = directive["maxWidth"]
        minHeight = directive["minHeight"]
        maxHeight = directive["maxHeight"]
        alignment = directive["alignment"] ?? .center
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitFlexibleFrame(self)
    }
}

extension FlexibleFrameComponent: ViewModifier {
    private func sanitize(_ value: CGFloat?) -> CGFloat? {
        guard let value, value >= 0, !value.isNaN else { return nil }
        return value
    }

    public func body(content: Content) -> some View {
        content
            .frame(
                minWidth: sanitize(minWidth),
                maxWidth: sanitize(maxWidth),
                minHeight: sanitize(minHeight),
                maxHeight: sanitize(maxHeight),
                alignment: alignment
            )
    }
}
