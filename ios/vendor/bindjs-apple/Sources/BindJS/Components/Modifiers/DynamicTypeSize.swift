import SwiftUI

public struct DynamicTypeSizeComponent: Component {
    public static var directiveName: String = "dynamicTypeSize"
    
    public var dynamicTypeSize: DynamicTypeSize
}

extension DynamicTypeSizeComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        dynamicTypeSize = directive.rawValue() ?? .large
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitDynamicTypeSize(self)
    }
}

extension DynamicTypeSizeComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .dynamicTypeSize(dynamicTypeSize)
    }
}
