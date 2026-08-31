import SwiftUI

public protocol Component {
    static var directiveName: String { get }
    init?(from directive: Directive)
    
    func accept<V: ComponentVisitor>(visitor: inout V) -> V.Result
}

extension Component {
    public func modifier(_ m: Component) -> Component {
        ModifiedComponent(content: [self], modifier: m)
    }
}
