import SwiftUI

public enum PathElement {
    case move(CGPoint)
    case line(CGPoint)
    case quadCurve(to: CGPoint, control: CGPoint)
    case curve(to: CGPoint, control1: CGPoint, control2: CGPoint)
    case arc(center: CGPoint, radius: CGFloat,
             startAngle: Angle, endAngle: Angle, clockwise: Bool)
    case rect(CGRect)
    case roundedRect(CGRect, cornerWidth: CGFloat, cornerHeight: CGFloat)
    case ellipse(CGRect)
    case lines([CGPoint])
    case close
}

public struct PathComponent: ShapeComponent {
    public static var directiveName: String = "Path"

    public var elements: [PathElement]
    public var style: ShapeStyle?
}

extension PathComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        elements = []
        if let rawElements = directive.props["elements"] as? [[String: Any]] {
            for el in rawElements {
                guard let op = el["op"] as? String else { continue }
                switch op {
                case "move":
                    let x = (el["x"] as? Double) ?? 0
                    let y = (el["y"] as? Double) ?? 0
                    elements.append(.move(CGPoint(x: x, y: y)))
                case "line":
                    let x = (el["x"] as? Double) ?? 0
                    let y = (el["y"] as? Double) ?? 0
                    elements.append(.line(CGPoint(x: x, y: y)))
                case "quadCurve":
                    let x = (el["x"] as? Double) ?? 0
                    let y = (el["y"] as? Double) ?? 0
                    let cx = (el["controlX"] as? Double) ?? 0
                    let cy = (el["controlY"] as? Double) ?? 0
                    elements.append(.quadCurve(
                        to: CGPoint(x: x, y: y),
                        control: CGPoint(x: cx, y: cy)
                    ))
                case "curve":
                    let x = (el["x"] as? Double) ?? 0
                    let y = (el["y"] as? Double) ?? 0
                    let c1x = (el["control1X"] as? Double) ?? 0
                    let c1y = (el["control1Y"] as? Double) ?? 0
                    let c2x = (el["control2X"] as? Double) ?? 0
                    let c2y = (el["control2Y"] as? Double) ?? 0
                    elements.append(.curve(
                        to: CGPoint(x: x, y: y),
                        control1: CGPoint(x: c1x, y: c1y),
                        control2: CGPoint(x: c2x, y: c2y)
                    ))
                case "arc":
                    let cx = (el["centerX"] as? Double) ?? 0
                    let cy = (el["centerY"] as? Double) ?? 0
                    let r = (el["radius"] as? Double) ?? 0
                    let start = (el["startAngle"] as? Double) ?? 0
                    let end = (el["endAngle"] as? Double) ?? 0
                    let clockwise = (el["clockwise"] as? Bool) ?? false
                    elements.append(.arc(
                        center: CGPoint(x: cx, y: cy),
                        radius: CGFloat(r),
                        startAngle: .degrees(start),
                        endAngle: .degrees(end),
                        clockwise: clockwise
                    ))
                case "rect":
                    let x = (el["x"] as? Double) ?? 0
                    let y = (el["y"] as? Double) ?? 0
                    let w = (el["width"] as? Double) ?? 0
                    let h = (el["height"] as? Double) ?? 0
                    elements.append(.rect(CGRect(x: x, y: y, width: w, height: h)))
                case "roundedRect":
                    let x = (el["x"] as? Double) ?? 0
                    let y = (el["y"] as? Double) ?? 0
                    let w = (el["width"] as? Double) ?? 0
                    let h = (el["height"] as? Double) ?? 0
                    let cw = (el["cornerWidth"] as? Double) ?? 0
                    let ch = (el["cornerHeight"] as? Double) ?? 0
                    elements.append(.roundedRect(
                        CGRect(x: x, y: y, width: w, height: h),
                        cornerWidth: CGFloat(cw),
                        cornerHeight: CGFloat(ch)
                    ))
                case "ellipse":
                    let x = (el["x"] as? Double) ?? 0
                    let y = (el["y"] as? Double) ?? 0
                    let w = (el["width"] as? Double) ?? 0
                    let h = (el["height"] as? Double) ?? 0
                    elements.append(.ellipse(CGRect(x: x, y: y, width: w, height: h)))
                case "lines":
                    if let pts = el["points"] as? [[Any]] {
                        let points = pts.compactMap { pair -> CGPoint? in
                            guard pair.count >= 2,
                                  let x = pair[0] as? Double,
                                  let y = pair[1] as? Double else { return nil }
                            return CGPoint(x: x, y: y)
                        }
                        elements.append(.lines(points))
                    }
                case "close":
                    elements.append(.close)
                default:
                    break
                }
            }
        }

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
        visitor.visitPath(self)
    }
}

extension PathComponent: View {
    public var body: some View {
        switch style {
        case .none: swiftUI
        case .fill(let fill):
            swiftUI.fill(fill)
        case .stroke(let stroke, let lineWidth):
            swiftUI.stroke(stroke, lineWidth: lineWidth)
        }
    }

    public var swiftUI: SwiftUI.Path {
        SwiftUI.Path { path in
            for element in elements {
                switch element {
                case .move(let p):
                    path.move(to: p)
                case .line(let p):
                    path.addLine(to: p)
                case .quadCurve(let to, let control):
                    path.addQuadCurve(to: to, control: control)
                case .curve(let to, let c1, let c2):
                    path.addCurve(to: to, control1: c1, control2: c2)
                case .arc(let center, let radius, let startAngle, let endAngle, let clockwise):
                    path.addArc(center: center, radius: radius,
                                startAngle: startAngle, endAngle: endAngle,
                                clockwise: clockwise)
                case .rect(let r):
                    path.addRect(r)
                case .roundedRect(let r, let cw, let ch):
                    path.addRoundedRect(in: r, cornerSize: CGSize(width: cw, height: ch))
                case .ellipse(let r):
                    path.addEllipse(in: r)
                case .lines(let pts):
                    path.addLines(pts)
                case .close:
                    path.closeSubpath()
                }
            }
        }
    }
}
