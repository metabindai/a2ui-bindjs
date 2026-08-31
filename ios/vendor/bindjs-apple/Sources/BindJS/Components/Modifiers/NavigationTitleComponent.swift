import Foundation
import SwiftUI

public struct NavigationTitleComponent: Component {
    public static var directiveName: String = "navigationTitle"
    
    public var title: String
}

extension NavigationTitleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        title = directive.rawValue() ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitNavigationTitle(self)
    }
}

extension NavigationTitleComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .navigationTitle(title)
    }
}
