import SwiftUI

public struct AnnotationComponent: Component {
    public static var directiveName: String = "annotation"

    public var annotation: ChartAnnotation?
}

extension AnnotationComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        if let text: String = directive["text"] ?? directive.rawValue() {
            let rawPosition: String? = directive["position"]
            annotation = ChartAnnotation(
                text: text,
                position: rawPosition.flatMap(ChartAnnotation.Position.init(rawValue:)) ?? .top
            )
        } else {
            annotation = nil
        }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitAnnotation(self)
    }
}

extension AnnotationComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
    }
}
