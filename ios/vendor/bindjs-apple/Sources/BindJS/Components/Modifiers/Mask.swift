import SwiftUI

public struct MaskComponent: Component {
    public static var directiveName: String = "mask"

    public var maskContent: Component?
}

extension MaskComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        // Get mask content from rawValue directive
        if let maskDirective: Directive = directive.rawValue(),
           let maskComponent = makeComponent(maskDirective) {
            self.maskContent = maskComponent
        } else {
            self.maskContent = nil
        }
    }

    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitMask(self)
    }
}

extension MaskComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if let maskContent = maskContent {
            content.mask(ComponentView(maskContent))
        } else {
            content
        }
    }
}
