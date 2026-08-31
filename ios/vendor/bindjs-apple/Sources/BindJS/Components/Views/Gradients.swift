import SwiftUI

public struct LinearGradientComponent: Component {
    public static var directiveName: String = "LinearGradient"
    
    public var colors: [Color]
    public var startPoint: UnitPoint
    public var endPoint: UnitPoint
}

extension LinearGradientComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        let colors = directive["colors"].compactMap(makeComponent).compactMap { $0 as? ColorComponent }.map(\.swiftUI)
        if colors.isEmpty {
            self.colors = [.white, .black]
        } else {
            self.colors = colors
        }
        startPoint = directive["startPoint"] ?? .top
        endPoint = directive["endPoint"] ?? .bottom
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitLinearGradient(self)
    }
}

extension LinearGradientComponent: View {
    public var swiftUI: LinearGradient {
        LinearGradient(
            colors: colors,
            startPoint: startPoint,
            endPoint: endPoint
        )
    }
    
    public var body: some View {
        swiftUI
    }
}

public struct AngularGradientComponent: Component {
    public static var directiveName: String = "AngularGradient"
    
    public let colors: [Color]
    public let center: UnitPoint
    public let startAngle: Angle
    public let endAngle: Angle
}

extension AngularGradientComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        let colors = directive["colors"].compactMap(makeComponent).compactMap { $0 as? ColorComponent }.map(\.swiftUI)
        if colors.isEmpty {
            self.colors = [.white, .black]
        } else {
            self.colors = colors
        }
        center = directive["center"] ?? .center
        startAngle = Angle(degrees: directive["startAngle"] ?? 0)
        endAngle = Angle(degrees: directive["endAngle"] ?? 360)
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAngularGradient(self)
    }
}

extension AngularGradientComponent: View {
    public var swiftUI: AngularGradient {
        AngularGradient(
            colors: colors,
            center: center,
            startAngle: startAngle,
            endAngle: endAngle
        )
    }
    
    public var body: some View {
        swiftUI
    }
}

public struct RadialGradientComponent: Component {
    public static var directiveName: String = "RadialGradient"
    
    public let colors: [Color]
    public let center: UnitPoint
    public let startRadius: CGFloat
    public let endRadius: CGFloat
}

extension RadialGradientComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        let colors = directive["colors"].compactMap(makeComponent).compactMap { $0 as? ColorComponent }.map(\.swiftUI)
        if colors.isEmpty {
            self.colors = [.white, .black]
        } else {
            self.colors = colors
        }
        center = directive["center"] ?? .center
        startRadius = directive["startRadius"] ?? 0.0
        endRadius = directive["endRadius"] ?? 128.0
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitRadialGradient(self)
    }
}

extension RadialGradientComponent: View {
    public var swiftUI: RadialGradient {
        RadialGradient(
            colors: colors,
            center: center,
            startRadius: startRadius,
            endRadius: endRadius
        )
    }
    
    public var body: some View {
        swiftUI
    }
}

public struct EllipticalGradientComponent: Component {
    public static var directiveName: String = "EllipticalGradient"
    
    public let colors: [Color]
    public let center: UnitPoint
    public let startRadiusFraction: CGFloat
    public let endRadiusFraction: CGFloat
}

extension EllipticalGradientComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        let colors = directive["colors"].compactMap(makeComponent).compactMap { $0 as? ColorComponent }.map(\.swiftUI)
        if colors.isEmpty {
            self.colors = [.white, .black]
        } else {
            self.colors = colors
        }
        center = directive["center"] ?? .center
        startRadiusFraction = directive["startRadiusFraction"] ?? 0.0
        endRadiusFraction = directive["endRadiusFraction"] ?? 0.5
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitEllipticalGradient(self)
    }
}

extension EllipticalGradientComponent: View {
    public var swiftUI: EllipticalGradient {
        EllipticalGradient(
            colors: colors,
            center: center,
            startRadiusFraction: startRadiusFraction,
            endRadiusFraction: endRadiusFraction
        )
    }
    
    public var body: some View {
        swiftUI
    }
}
