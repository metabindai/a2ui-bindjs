import SwiftUI

public struct FrameComponent: Component {
    public static var directiveName: String = "frame"
    
    public var width: CGFloat?
    public var height: CGFloat?
    public var alignment: Alignment
}

extension FrameComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        width = directive["width"]
        height = directive["height"]
        alignment = directive["alignment"] ?? .center
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitFrame(self)
    }
}

extension FrameComponent: ViewModifier {
    
    var resolvedWidth: CGFloat? {
        guard let width, width >= 0, width.isFinite else { return nil }
        return width
    }

    var resolvedHeight: CGFloat? {
        guard let height, height >= 0, height.isFinite else { return nil }
        return height
    }

    public func body(content: Content) -> some View {
        content
            .frame(width: resolvedWidth, height: resolvedHeight, alignment: alignment)
    }
}
