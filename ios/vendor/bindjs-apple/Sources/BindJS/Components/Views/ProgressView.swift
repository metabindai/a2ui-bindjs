import SwiftUI

public struct ProgressViewComponent: Component {
    public static var directiveName: String = "ProgressView"
    
    public var value: Double?
    public var total: Double?
}

extension ProgressViewComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        value = directive["value"]
        total = directive["total"]
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitProgressView(self)
    }
}

extension ProgressViewComponent: View {
    public var body: some View {
        if let value {
            if let total {
                ProgressView(value: value, total: total)
            } else {
                ProgressView(value: value)
            }
        } else {
            ProgressView()
        }
    }
}
