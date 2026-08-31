import SwiftUI

struct SpringOptions: Decodable {
    var response: Double?
    var dampingFraction: Double?
    var blendDuration: Double?
}
struct InterpolatingSpringOptions: Decodable {
    var stiffness: Double?
    var damping: Double?
    var mass: Double?
}
struct LinearOptions: Decodable { var duration: Double? }
struct EaseOptions: Decodable { var duration: Double? }
struct BouncyOptions: Decodable {
    var duration: Double?
    var extraBounce: Double?
}
struct SnappyOptions: Decodable {
    var response: Double?
    var dampingFraction: Double?
    var blendDuration: Double?
}

enum JSAnimationKind {
    case spring(SpringOptions)
    case interpolatingSpring(InterpolatingSpringOptions)
    case linear(LinearOptions)
    case easeIn(EaseOptions)
    case easeOut(EaseOptions)
    case easeInOut(EaseOptions)
    case bouncy(BouncyOptions)
    case snappy(SnappyOptions)
    case unknown
}

struct JSAnimation: Decodable {
    let kind: JSAnimationKind

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = (try? container.decode(String.self, forKey: .type))?.lowercased() ?? "unknown"

        switch type {
        case "spring":
            let opts = try SpringOptions(from: decoder)
            kind = .spring(opts)
        case "interpolatingspring":
            let opts = try InterpolatingSpringOptions(from: decoder)
            kind = .interpolatingSpring(opts)
        case "linear":
            let opts = try LinearOptions(from: decoder)
            kind = .linear(opts)
        case "easein":
            let opts = try EaseOptions(from: decoder)
            kind = .easeIn(opts)
        case "easeout":
            let opts = try EaseOptions(from: decoder)
            kind = .easeOut(opts)
        case "easeinout":
            let opts = try EaseOptions(from: decoder)
            kind = .easeInOut(opts)
        case "bouncy":
            let opts = try BouncyOptions(from: decoder)
            kind = .bouncy(opts)
        case "snappy":
            let opts = try SnappyOptions(from: decoder)
            kind = .snappy(opts)
        default:
            kind = .unknown
        }
    }

    private enum CodingKeys: String, CodingKey {
        case type
    }

    func animation() -> Animation {
        switch kind {
        case .spring(let o):
            return Animation.spring(
                response: o.response ?? 0.55,
                dampingFraction: o.dampingFraction ?? 0.825,
                blendDuration: o.blendDuration ?? 0
            )
        case .interpolatingSpring(let o):
            return Animation.interpolatingSpring(
                mass: o.mass ?? 1,
                stiffness: o.stiffness ?? 170,
                damping: o.damping ?? 15
            )
        case .linear(let o):
            return Animation.linear(duration: o.duration ?? 0.5)
        case .easeIn(let o):
            return Animation.easeIn(duration: o.duration ?? 0.5)
        case .easeOut(let o):
            return Animation.easeOut(duration: o.duration ?? 0.5)
        case .easeInOut(let o):
            return Animation.easeInOut(duration: o.duration ?? 0.5)
        case .bouncy(let o):
            return Animation.bouncy(
                duration: o.duration ?? 0.4,
                extraBounce: o.extraBounce ?? 0
            )
        case .snappy(let o):
            return Animation.snappy(
                duration: o.response ?? 0.4,
                extraBounce: o.dampingFraction ?? 0
            )
        case .unknown:
            return .default
        }
    }

    func apply(_ block: @escaping () -> Void) {
        withAnimation(self.animation(), block)
    }
}
