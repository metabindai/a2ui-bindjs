import SwiftUI

public struct ListRowBackgroundComponent: Component {
    public static var directiveName: String = "listRowBackground"

    public var content: Component
}

extension ListRowBackgroundComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        content = directive["content"].flatMap { makeComponent($0) } ?? EmptyComponent()
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitListRowBackground(self)
    }
}

extension ListRowBackgroundComponent: ViewModifier {
    public func body(content: Content) -> some View {
        switch self.content {
        case let color as ColorComponent:
            content.listRowBackground(color.swiftUI)
        case let linearGradient as LinearGradientComponent:
            content.listRowBackground(linearGradient.swiftUI)
        case let angularGradient as AngularGradientComponent:
            content.listRowBackground(angularGradient.swiftUI)
        case let radialGradient as RadialGradientComponent:
            content.listRowBackground(radialGradient.swiftUI)
        case let ellipticalGradient as EllipticalGradientComponent:
            content.listRowBackground(ellipticalGradient.swiftUI)
        case let material as MaterialComponent:
            content.listRowBackground(Rectangle().fill(material.swiftUI))
        case is EmptyComponent:
            content.listRowBackground(EmptyView())
        default:
            content.listRowBackground(ComponentView(self.content))
        }
    }
}
