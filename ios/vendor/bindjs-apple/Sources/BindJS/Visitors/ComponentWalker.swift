public protocol ComponentWalker: ComponentVisitor where Result == Void {
    
}

public extension ComponentWalker {
    mutating func descendInto(_ component: Component) {
        for child in component.componentChildren {
            visit(child)
        }
    }
    
    mutating func defaultVisit(_ component: any Component) -> Result {
        descendInto(component)
    }
}
