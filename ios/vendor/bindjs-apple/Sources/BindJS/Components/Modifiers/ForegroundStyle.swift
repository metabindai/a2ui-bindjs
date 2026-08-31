import SwiftUI

public struct ForegroundStyleComponent: Component {
    public static var directiveName: String = "foregroundStyle"
    
    public var style: Component
    public var rawStyle: Any?
}

extension ForegroundStyleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        rawStyle = directive.props["rawValue"] ?? directive.props
        if let component = directive.rawValue().flatMap({ makeComponent($0) }) {
            style = component
        } else if let color: String = directive.rawValue() {
            style = ColorComponent(storage: .name(color), opacity: 1)
        } else if let color: String = directive["color"] {
            style = ColorComponent(storage: .name(color), opacity: 1)
        } else {
            style = EmptyComponent()
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitForegroundStyle(self)
    }
}

extension ForegroundStyleComponent {
    var chartForegroundStyle: ChartMarkStyle.ForegroundStyle? {
        if let color = style as? ColorComponent {
            return .color(color.chartColorString)
        }

        if let raw = rawStyle as? String {
            return .color(raw)
        }

        guard let raw = rawStyle as? [String: Any] else { return nil }
        if let color = raw["color"] as? String {
            return .color(color)
        }
        if let directive = raw["color"] as? Directive, let color = ColorComponent(from: directive) {
            return .color(color.chartColorString)
        }
        if let by = ChartChannel(raw["by"], defaultLabel: raw["label"] as? String ?? "Series") {
            return .series(by)
        }
        return nil
    }
}

extension ForegroundStyleComponent: ViewModifier {
    public func body(content: Content) -> some View {
        switch style {
        case let color as ColorComponent:
            content.foregroundStyle(color.swiftUI)
        case let linearGradient as LinearGradientComponent:
            content.foregroundStyle(linearGradient.swiftUI)
        case let angularGradient as AngularGradientComponent:
            content.foregroundStyle(angularGradient.swiftUI)
        case let radialGradient as RadialGradientComponent:
            content.foregroundStyle(radialGradient.swiftUI)
        case let ellipticalGradient as EllipticalGradientComponent:
            content.foregroundStyle(ellipticalGradient.swiftUI)
        case let material as MaterialComponent:
            content.foregroundStyle(material.swiftUI)
        case let call as ComponentCall:
            content.modifier(ForegroundStyleComponent(style: call.wrapped))
        default:
            content
        }
    }
}
