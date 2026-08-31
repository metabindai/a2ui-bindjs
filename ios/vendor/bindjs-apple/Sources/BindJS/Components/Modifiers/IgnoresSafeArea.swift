import SwiftUI

public struct IgnoresSafeAreaComponent: Component {
    public static var directiveName: String = "ignoresSafeArea"
    
    public var regions: SafeAreaRegions?
    public var edges: Edge.Set?
}

extension IgnoresSafeAreaComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        regions = directive["regions"]
        edges = directive["edges"]
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitIgnoresSafeArea(self)
    }
}

extension IgnoresSafeAreaComponent: ViewModifier {
    public func body(content: Content) -> some View {
        if let regions = regions, let edges = edges {
            content.ignoresSafeArea(regions, edges: edges)
        } else if let regions = regions {
            content.ignoresSafeArea(regions)
        } else if let edges = edges {
            content.ignoresSafeArea(.all, edges: edges)
        } else {
            content.ignoresSafeArea()
        }
    }
}
