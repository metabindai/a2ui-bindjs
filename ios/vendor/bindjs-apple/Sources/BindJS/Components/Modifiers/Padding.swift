import SwiftUI

public struct PaddingComponent: Component {
    public static var directiveName: String = "padding"
    
    public var top: CGFloat?
    public var leading: CGFloat?
    public var bottom: CGFloat?
    public var trailing: CGFloat?
}

extension PaddingComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        top = directive["top"]
        leading = directive["leading"]
        bottom = directive["bottom"]
        trailing = directive["trailing"]
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitPadding(self)
    }
}

extension PaddingComponent: ViewModifier {
    var edgeSet: Edge.Set {
        if top == nil, leading == nil, bottom == nil, trailing == nil {
            return .all
        }
        var edgeSet: Edge.Set = []
        if top != nil {
            edgeSet.insert(.top)
        }
        if leading != nil {
            edgeSet.insert(.leading)
        }
        if bottom != nil {
            edgeSet.insert(.bottom)
        }
        if trailing != nil {
            edgeSet.insert(.trailing)
        }
        return edgeSet
    }
    
    var edgeInsets: EdgeInsets? {
        if top == nil, leading == nil, bottom == nil, trailing == nil {
            return nil
        }
        return .init(top: top ?? 0, leading: leading ?? 0, bottom: bottom ?? 0, trailing: trailing ?? 0)
    }
    
    public func body(content: Content) -> some View {
        content.modifier(_PaddingLayout(edges: edgeSet, insets: edgeInsets))
    }
}
