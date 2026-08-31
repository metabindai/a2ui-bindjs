import SwiftUI

public struct FixedSizeComponent: Component {
    public static var directiveName: String = "fixedSize"
    
    public var horizontal: Bool
    public var vertical: Bool
}

extension FixedSizeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        // Support different initialization patterns:
        // 1. Both true (default)
        // 2. Specific axes via properties
        // 3. Axis set string
        
        if let axis: String = directive["axis"] {
            switch axis {
            case "horizontal":
                horizontal = true
                vertical = false
            case "vertical":
                horizontal = false
                vertical = true
            case "both":
                horizontal = true
                vertical = true
            default:
                horizontal = true
                vertical = true
            }
        } else {
            horizontal = directive["horizontal"] ?? true
            vertical = directive["vertical"] ?? true
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitFixedSize(self)
    }
}

extension FixedSizeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .fixedSize(horizontal: horizontal, vertical: vertical)
    }
}