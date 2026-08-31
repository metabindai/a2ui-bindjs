import SwiftUI

public struct ContainerRelativeFrameComponent: Component {
    public static var directiveName: String = "containerRelativeFrame"

    public var axes: Axis.Set
    public var alignment: Alignment
    public var count: Int?
    public var span: Int?
    public var spacing: CGFloat?
    public var fraction: CGFloat?
}

extension ContainerRelativeFrameComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        axes = directive["axes"] ?? directive.rawValue() ?? .horizontal
        alignment = directive["alignment"] ?? .center
        count = directive["count"]
        span = directive["span"]
        spacing = directive["spacing"]
        fraction = directive["fraction"]
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitContainerRelativeFrame(self)
    }
}

extension ContainerRelativeFrameComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if let count, let spacing {
            content
                .containerRelativeFrame(axes, count: count, span: span ?? 1, spacing: spacing, alignment: alignment)
        } else if let fraction {
            content
                .containerRelativeFrame(axes, alignment: alignment) { length, _ in
                    length * fraction
                }
        } else {
            content
                .containerRelativeFrame(axes, alignment: alignment)
        }
    }
}
