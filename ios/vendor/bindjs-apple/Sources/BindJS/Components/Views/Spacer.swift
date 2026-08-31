import SwiftUI

public struct SpacerComponent: Component {
    public static var directiveName: String = "Spacer"
    
    public var minLength: CGFloat?
}

extension SpacerComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        minLength = directive["minLength"]
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitSpacer(self)
    }
}

extension SpacerComponent: View {
    public var body: some View {
        Spacer(minLength: minLength)
    }
}
