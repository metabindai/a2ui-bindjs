import SwiftUI

public struct DividerComponent: Component {
    public static var directiveName: String = "Divider"
}

extension DividerComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitDivider(self)
    }
}

extension DividerComponent: View {
    public var body: some View {
        Divider()
    }
}
