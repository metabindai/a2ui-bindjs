import Foundation

public struct PieSliceMarkComponent: PieSliceMarkComponentProtocol {
    public static var directiveName: String = "PieSliceMark"

    let sliceId: String?
    let value: Double?
    let label: String?
    let baseStyle: PieSliceStyle
}

extension PieSliceMarkComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        sliceId = directive["id"]
        value = Self.number(from: directive.props["value"])
        label = directive["label"]
        baseStyle = PieSliceStyle()
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitPieSliceMark(self)
    }

    private static func number(from raw: Any?) -> Double? {
        switch raw {
        case let value as Int:
            return Double(value)
        case let value as Double:
            return value
        case let value as Float:
            return Double(value)
        case let value as NSNumber:
            if CFGetTypeID(value) == CFBooleanGetTypeID() {
                return nil
            }
            return value.doubleValue
        default:
            return nil
        }
    }
}
