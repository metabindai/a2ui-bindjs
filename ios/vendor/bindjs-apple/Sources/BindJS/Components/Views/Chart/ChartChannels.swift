import Foundation

public enum ChartValue: Equatable, Hashable {
    case number(Double)
    case string(String)
    case bool(Bool)
    case date(Date)

    init?(_ value: Any?) {
        switch value {
        case let value as Date:
            self = .date(value)
        case let value as NSNumber:
            // All numerics and bools land here — Swift Bool/Int/Double/Float
            // bridge to NSNumber, and JavaScriptCore hands every JS number
            // over as NSNumber. The CFBoolean type check is the ONLY reliable
            // discriminator: a `case let value as Bool` pattern before this
            // would bridge NSNumber(0)/NSNumber(1) to Bool, silently turning
            // the first two indices of any 0-based chart series into bool
            // channels that never render.
            if CFGetTypeID(value) == CFBooleanGetTypeID() {
                self = .bool(value.boolValue)
            } else {
                self = .number(value.doubleValue)
            }
        case let value as String:
            self = .string(value)
        default:
            return nil
        }
    }

    var accessibilityText: String {
        switch self {
        case .number(let number):
            if number.rounded() == number {
                return String(Int(number))
            }
            return String(number)
        case .string(let string):
            return string
        case .bool(let bool):
            return bool ? "true" : "false"
        case .date(let date):
            return ChartDateParser.accessibilityFormatter.string(from: date)
        }
    }
}

enum ChartDateParser {
    static let accessibilityFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()

    private static let internetFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let internetFormatterWithoutFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    private static let fullDateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter
    }()

    static func date(from string: String) -> Date? {
        internetFormatter.date(from: string)
            ?? internetFormatterWithoutFractionalSeconds.date(from: string)
            ?? fullDateFormatter.date(from: string)
    }
}

public struct ChartChannel: Equatable, Hashable {
    public var value: ChartValue
    public var label: String?

    public init(value: ChartValue, label: String? = nil) {
        self.value = value
        self.label = label
    }

    init?(_ raw: Any?, defaultLabel: String? = nil) {
        if let dict = raw as? [String: Any] {
            guard let value = ChartValue(dict["value"]) else { return nil }
            self.value = value
            self.label = dict["label"] as? String ?? defaultLabel
            return
        }

        guard let value = ChartValue(raw) else { return nil }
        self.value = value
        self.label = defaultLabel
    }
}

public struct ChartMarkChannels: Equatable {
    public var x: ChartChannel?
    public var y: ChartChannel?
    public var x2: ChartChannel?
    public var y2: ChartChannel?

    public init(x: ChartChannel? = nil, y: ChartChannel? = nil, x2: ChartChannel? = nil, y2: ChartChannel? = nil) {
        self.x = x
        self.y = y
        self.x2 = x2
        self.y2 = y2
    }

    init(from directive: Directive) {
        self.x = ChartChannel(directive.props["x"], defaultLabel: "x")
        self.y = ChartChannel(directive.props["y"], defaultLabel: "y")
        self.x2 = ChartChannel(directive.props["x2"], defaultLabel: "x2")
        self.y2 = ChartChannel(directive.props["y2"], defaultLabel: "y2")
    }
}
