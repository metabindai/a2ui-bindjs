import SwiftUI

public struct ScrollViewComponent: Component {
    public static var directiveName: String = "ScrollView"
    
    public var axis: Axis.Set
    public var showsIndicators: Bool
    public var content: [Component]
}

extension ScrollViewComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        axis = directive["axis"] ?? .vertical
        showsIndicators = directive["showsIndicators"] ?? true
        content = directive.children.compactMap { makeComponent($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitScrollView(self)
    }
}

extension ScrollViewComponent: View {
    public var body: some View {
        ScrollView(axis, showsIndicators: showsIndicators) {
            ForEach(content.indices, id: \.self) { index in
                ComponentView(content[index])
            }
        }
    }
}
