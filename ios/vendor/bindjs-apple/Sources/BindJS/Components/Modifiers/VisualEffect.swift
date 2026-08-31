import SwiftUI
import JavaScriptCore

public struct VisualEffectComponent: Component {
    public static var directiveName: String = "visualEffect"
    
    public let handlerId: String
    
    @EnvironmentObject private var context: BindJSContext
}

extension VisualEffectComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        handlerId = directive["handlerId"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitVisualEffect(self)
    }
}

struct CombinedVisualEffect: ViewModifier {
    
    let handlerId: String

    @EnvironmentObject private var context: BindJSContext

    func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *) {
            content
                .visualEffect { effect, geometry in
                    // Call into JS to compute the offset
                    let result = context.callEventHandler(
                        id: handlerId,
                        arguments: geometryCallbackData(for: geometry)
                    )
                    
                    // Expect a JS dict like:
                    // { "offset": { "x": 12, "y": 23 }, "opacity": 0.2, etc.. }
                    let dict = result?.toDictionary() as? [String: Any]

                    // Extract values (defaulting to neutral)
                    
                    // Offset
                    let offsetDict = dict?["offset"] as? [String: Any]
                    let x = offsetDict?["x"] as? Double ?? 0
                    let y = offsetDict?["y"] as? Double ?? 0
                    
                    // Opacity
                    let opacity = dict?["opacity"] as? Double ?? 1
                    
                    // Scale
                    let scaleDict = dict?["scale"] as? [String: Any]
                    let scaleX = scaleDict?["x"] as? Double ?? 1
                    let scaleY = scaleDict?["y"] as? Double ?? 1
                    let anchor = unitPoint(from: scaleDict?["anchor"] as? String)

                    // Blur
                    let blur = dict?["blur"] as? Double ?? 0
                    
                    // Rotation
                    let rotation = dict?["rotation"] as? Double ?? 0
                    
                    // Transform matrix
                    var transform = CGAffineTransform.identity
                    if let t = dict?["transform"] as? [String: Any] {
                        transform = CGAffineTransform(
                            a: t["m11"] as? CGFloat ?? 1,
                            b: t["m12"] as? CGFloat ?? 0,
                            c: t["m21"] as? CGFloat ?? 0,
                            d: t["m22"] as? CGFloat ?? 1,
                            tx: t["tx"] as? CGFloat ?? 0,
                            ty: t["ty"] as? CGFloat ?? 0
                        )
                    }
                    
                    // Apply all transformations in one call chain
                    return effect
                            .offset(x: x, y: y)
                            .scaleEffect(x: scaleX, y: scaleY, anchor: anchor)
                            .opacity(opacity)
                            .blur(radius: blur)
                            .rotationEffect(.degrees(rotation))
                            .transformEffect(transform)
                }
        } else {
            content
        }
    }
    
    func unitPoint(from anchorName: String?) -> UnitPoint {
        guard let name = anchorName?.lowercased() else { return .center }
        
        switch name {
            case "topleading":       return .topLeading
            case "top":              return .top
            case "toptrailing":      return .topTrailing
            case "leading":          return .leading
            case "center":           return .center
            case "trailing":         return .trailing
            case "bottomleading":    return .bottomLeading
            case "bottom":           return .bottom
            case "bottomtrailing":   return .bottomTrailing
            default:                 return .center
        }
    }
}

extension VisualEffectComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content.modifier(CombinedVisualEffect(handlerId: handlerId))
    }
}


func geometryCallbackData(for geometry: GeometryProxy) -> [String: Any] {
    func frameDictionary(from rect: CGRect) -> [String: Double] {
        [
            "minX": rect.minX,
            "minY": rect.minY,
            "maxX": rect.maxX,
            "maxY": rect.maxY,
            "width": rect.width,
            "height": rect.height,
            "midX": rect.midX,
            "midY": rect.midY
        ]
    }
        
    let geometryFrame: @convention(block) (JSValue) -> [String: Double] = { coordinateSpaceValue in
        guard let name = coordinateSpaceValue.toString() else {
            return [:]
        }

        let rect: CGRect
        switch name {
        case "", "local":
            rect = geometry.frame(in: .local)
        case "global":
            rect = geometry.frame(in: .global)
        case "scrollView":
            rect = geometry.frame(in: .scrollView)
        case "scrollView.horizontal":
            rect = geometry.frame(in: .scrollView(axis: .horizontal))
        case "scrollView.vertical":
            rect = geometry.frame(in: .scrollView(axis: .vertical))
        default:
            rect = geometry.frame(in: .named(name))
        }

        return frameDictionary(from: rect)
    }

    let boundsFrame: @convention(block) (JSValue) -> [String: Double] = { coordinateSpaceValue in
        let name = coordinateSpaceValue.toString() ?? ""

        let rect: CGRect?
        switch name {
        case "scrollView":
            rect = geometry.bounds(of: .scrollView)
        case "scrollView.horizontal":
            rect = geometry.bounds(of: .scrollView(axis: .horizontal))
        case "scrollView.vertical":
            rect = geometry.bounds(of: .scrollView(axis: .vertical))
        default:
            rect = geometry.bounds(of: .named(name))
        }

        if let rect = rect {
            return frameDictionary(from: rect)
        } else {
            return [:]
        }
    }
    
    var result: [String: Any] = [
        "size": [
            "width": geometry.size.width,
            "height": geometry.size.height
        ],
        "safeAreaInsets": [
            "top": geometry.safeAreaInsets.top,
            "bottom": geometry.safeAreaInsets.bottom,
            "leading": geometry.safeAreaInsets.leading,
            "trailing": geometry.safeAreaInsets.trailing
        ],
        "frame": geometryFrame,
        "bounds": boundsFrame
    ]

    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, *) {
        let insets = geometry.containerCornerInsets
        result["containerCornerInsets"] = [
            "topLeading": ["width": insets.topLeading.width, "height": insets.topLeading.height],
            "topTrailing": ["width": insets.topTrailing.width, "height": insets.topTrailing.height],
            "bottomLeading": ["width": insets.bottomLeading.width, "height": insets.bottomLeading.height],
            "bottomTrailing": ["width": insets.bottomTrailing.width, "height": insets.bottomTrailing.height]
        ]
    }

    return result
}
