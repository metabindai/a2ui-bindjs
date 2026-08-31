import SwiftUI

public struct ModifiedComponent: Component {
    public static var directiveName: String = "ModifiedComponent"
    
    public var content: [Component]
    public var modifier: Component
}

extension ModifiedComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        content = directive["content"].compactMap { makeComponent($0) }
        modifier = directive["modifier"].flatMap { makeComponent($0) } ?? EmptyComponent()
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitModified(self)
    }
}

extension ModifiedComponent: View {
    @ViewBuilder
    public var body: some View {
        if let model = ChartCollector.collectRenderableRoot(self) {
            ChartRenderedView(model: model)
        } else if let model = PieChartCollector.collectRenderableRoot(self) {
            PieChartRenderedView(model: model)
        } else {
            // In practice this is only one element ever. We should change in the runtime to not be an array.
            ForEach(content.indices, id: \.self) { index in
                ComponentView(content[index])
            }
            .modifier(ComponentViewModifier(modifier))
        }
    }
}

extension Directive {
    func modifier(_ m: Directive) -> Directive {
        Directive(
            type: "ModifiedComponent",
            props: [
                "content": [self],
                "modifier": m
            ],
            children: []
        )
    }
}

public struct EmptyComponent: Component {
    public static var directiveName: String = "EmptyComponent"
    
    public init() {}
}

extension EmptyComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitEmpty(self)
    }
}

extension EmptyComponent: View {
    public var body: some View {
        EmptyView()
    }
}
