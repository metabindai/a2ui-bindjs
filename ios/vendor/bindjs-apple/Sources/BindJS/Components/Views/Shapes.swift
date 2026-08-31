import SwiftUI

func makeShape(_ component: Component) -> (any Shape)? {
    switch component {
    case let circle as CircleComponent:
        return circle.swiftUI
    case let ellipse as EllipseComponent:
        return ellipse.swiftUI
    case let rectangle as RectangleComponent:
        return rectangle.swiftUI
    case let roundedRectangle as RoundedRectangleComponent:
        return roundedRectangle.swiftUI
    case let capsule as CapsuleComponent:
        return capsule.swiftUI
    case let path as PathComponent:
        return path.swiftUI
    default:
        return nil
    }
}

public enum ShapeStyle {
    case fill(Component)
    case stroke(Component, lineWidth: CGFloat)
}

public protocol ShapeComponent: Component {
    var style: ShapeStyle? { get set }
}

public struct CircleComponent: ShapeComponent {
    public static var directiveName: String = "Circle"
    
    public var style: ShapeStyle?
}

extension CircleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        if let fill: [String: Any] = directive["fill"],
           let fillStyle = (fill["style"] as? Directive).flatMap(makeComponent) {
            style = .fill(fillStyle)
        } else if let stroke: [String: Any] = directive["stroke"],
                  let strokeStyle = (stroke["style"] as? Directive).flatMap(makeComponent)
        {
            let lineWidth: CGFloat = (stroke["lineWidth"] as? Double) ?? 1
            style = .stroke(strokeStyle, lineWidth: lineWidth)
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitCircle(self)
    }
}

extension CircleComponent: View {
    public var body: some View {
        switch style {
        case .none: Circle()
        case .fill(let fill):
            Circle().fill(fill)
        case .stroke(let stroke, let lineWidth):
            Circle().stroke(stroke, lineWidth: lineWidth)
        }
    }
    
    public var swiftUI: Circle {
        Circle()
    }
}

public struct EllipseComponent: ShapeComponent {
    public static var directiveName: String = "Ellipse"
    
    public var style: ShapeStyle?
}

extension EllipseComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        if let fill: [String: Any] = directive["fill"],
           let fillStyle = (fill["style"] as? Directive).flatMap(makeComponent) {
            style = .fill(fillStyle)
        } else if let stroke: [String: Any] = directive["stroke"],
                  let strokeStyle = (stroke["style"] as? Directive).flatMap(makeComponent)
        {
            let lineWidth: CGFloat = (stroke["lineWidth"] as? Double) ?? 1
            style = .stroke(strokeStyle, lineWidth: lineWidth)
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitEllipse(self)
    }
}

extension EllipseComponent: View {
    public var body: some View {
        switch style {
        case .none: Ellipse()
        case .fill(let fill):
            Ellipse().fill(fill)
        case .stroke(let stroke, let lineWidth):
            Ellipse().stroke(stroke, lineWidth: lineWidth)
        }
    }
    
    public var swiftUI: Ellipse {
        Ellipse()
    }
}

public struct RectangleComponent: ShapeComponent {
    public static var directiveName: String = "Rectangle"
    
    public var style: ShapeStyle?
}

extension RectangleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        if let fill: [String: Any] = directive["fill"],
           let fillStyle = (fill["style"] as? Directive).flatMap(makeComponent) {
            style = .fill(fillStyle)
        } else if let stroke: [String: Any] = directive["stroke"],
                  let strokeStyle = (stroke["style"] as? Directive).flatMap(makeComponent)
        {
            let lineWidth: CGFloat = (stroke["lineWidth"] as? Double) ?? 1
            style = .stroke(strokeStyle, lineWidth: lineWidth)
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitRectangle(self)
    }
}

extension RectangleComponent: View {
    public var body: some View {
        switch style {
        case .none: Rectangle()
        case .fill(let fill):
            Rectangle().fill(fill)
        case .stroke(let stroke, let lineWidth):
            Rectangle().stroke(stroke, lineWidth: lineWidth)
        }
    }
    
    public var swiftUI: Rectangle {
        Rectangle()
    }
}

public struct RoundedRectangleComponent: ShapeComponent {
    public static var directiveName: String = "RoundedRectangle"
    
    public let cornerRadius: CGFloat
    public var style: ShapeStyle?
}

extension RoundedRectangleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        cornerRadius = directive["cornerRadius"] ?? 10
        
        if let fill: [String: Any] = directive["fill"],
           let fillStyle = (fill["style"] as? Directive).flatMap(makeComponent) {
            style = .fill(fillStyle)
        } else if let stroke: [String: Any] = directive["stroke"],
                  let strokeStyle = (stroke["style"] as? Directive).flatMap(makeComponent)
        {
            let lineWidth: CGFloat = (stroke["lineWidth"] as? Double) ?? 1
            style = .stroke(strokeStyle, lineWidth: lineWidth)
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitRoundedRectangle(self)
    }
}

extension RoundedRectangleComponent: View {
    public var body: some View {
        switch style {
        case .none: RoundedRectangle(cornerRadius: cornerRadius)
        case .fill(let fill):
            RoundedRectangle(cornerRadius: cornerRadius).fill(fill)
        case .stroke(let stroke, let lineWidth):
            RoundedRectangle(cornerRadius: cornerRadius).stroke(stroke, lineWidth: lineWidth)
        }
    }
    
    public var swiftUI: RoundedRectangle {
        RoundedRectangle(cornerRadius: cornerRadius)
    }
}

public struct CapsuleComponent: ShapeComponent {
    public static var directiveName: String = "Capsule"
    
    public var style: ShapeStyle?
}

extension CapsuleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        if let fill: [String: Any] = directive["fill"],
           let fillStyle = (fill["style"] as? Directive).flatMap(makeComponent) {
            style = .fill(fillStyle)
        } else if let stroke: [String: Any] = directive["stroke"],
                  let strokeStyle = (stroke["style"] as? Directive).flatMap(makeComponent)
        {
            let lineWidth: CGFloat = (stroke["lineWidth"] as? Double) ?? 1
            style = .stroke(strokeStyle, lineWidth: lineWidth)
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitCapsule(self)
    }
}

extension CapsuleComponent: View {
    public var body: some View {
        switch style {
        case .none: Capsule()
        case .fill(let fill):
            Capsule().fill(fill)
        case .stroke(let stroke, let lineWidth):
            Capsule().stroke(stroke, lineWidth: lineWidth)
        }
    }
    
    public var swiftUI: Capsule {
        Capsule()
    }
    
}

extension Shape {
    func fill(_ style: Component) -> some View {
        modifier(ForegroundStyleComponent(style: style))
    }

    @ViewBuilder
    func stroke(_ style: Component, lineWidth: CGFloat) -> some View {
        switch style {
        case let color as ColorComponent:
            self.stroke(color.swiftUI, lineWidth: lineWidth)
        case let linearGradient as LinearGradientComponent:
            self.stroke(linearGradient.swiftUI, lineWidth: lineWidth)
        case let angularGradient as AngularGradientComponent:
            self.stroke(angularGradient.swiftUI, lineWidth: lineWidth)
        case let radialGradient as RadialGradientComponent:
            self.stroke(radialGradient.swiftUI, lineWidth: lineWidth)
        case let ellipticalGradient as EllipticalGradientComponent:
            self.stroke(ellipticalGradient.swiftUI, lineWidth: lineWidth)
        case let material as MaterialComponent:
            self.stroke(material.swiftUI, lineWidth: lineWidth)
        case let call as ComponentCall:
            self.stroke(call, lineWidth: lineWidth)
        default:
            self.stroke(Color.primary, lineWidth: lineWidth)
        }
    }
    
    @ViewBuilder
    private func stroke(_ call: ComponentCall, lineWidth: CGFloat) -> some View {
        switch call.wrapped {
        case let color as ColorComponent:
            self.stroke(color.swiftUI, lineWidth: lineWidth)
        case let linearGradient as LinearGradientComponent:
            self.stroke(linearGradient.swiftUI, lineWidth: lineWidth)
        case let angularGradient as AngularGradientComponent:
            self.stroke(angularGradient.swiftUI, lineWidth: lineWidth)
        case let radialGradient as RadialGradientComponent:
            self.stroke(radialGradient.swiftUI, lineWidth: lineWidth)
        case let ellipticalGradient as EllipticalGradientComponent:
            self.stroke(ellipticalGradient.swiftUI, lineWidth: lineWidth)
        case let material as MaterialComponent:
            self.stroke(material.swiftUI, lineWidth: lineWidth)
        default:
            self.stroke(Color.primary, lineWidth: lineWidth)
        }
    }
}
