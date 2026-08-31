import SwiftUI

public struct ColorComponent: Component {
    public static var directiveName: String = "Color"
    
    public enum Storage {
        case name(String)
        case rgba(Double, Double, Double, Double)
    }
    
    public var storage: Storage
    public var opacity: Double
}

extension ColorComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        if let name: String = directive.rawValue() {
            storage = .name(name)
        } else {
            let red: Double = (directive["r"] ?? 0) / 255
            let green: Double = (directive["g"] ?? 0) / 255
            let blue: Double = (directive["b"] ?? 0) / 255
            let alpha: Double = directive["a"] ?? 1
            storage = .rgba(red, green, blue, alpha)
        }
        opacity = directive["opacity"] ?? 1
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitColor(self)
    }
}

extension ColorComponent: View {
    var swiftUI: Color {
        switch storage {
        case .name(let name):
            Self.color(named: name).opacity(opacity)
        case .rgba(let red, let green, let blue, let alpha):
            Color(red: red, green: green, blue: blue, opacity: alpha)
                .opacity(opacity)
        }
    }
    
    public var body: some View {
        swiftUI
    }
}

extension ColorComponent {
    var chartColorString: String {
        switch storage {
        case .name(let name):
            return name
        case .rgba(let red, let green, let blue, let alpha):
            let r = Int((red * 255).rounded())
            let g = Int((green * 255).rounded())
            let b = Int((blue * 255).rounded())
            return "rgba(\(r),\(g),\(b),\(alpha))"
        }
    }

    static func color(named name: String) -> Color {
        namedColors[name] ?? .primary
    }

    private static let namedColors: [String: Color] = {
        var colors: [String: Color] = [

            // MARK: SwiftUI universal

            "clear": .clear,
            "red": .red,
            "orange": .orange,
            "yellow": .yellow,
            "green": .green,
            "mint": .mint,
            "teal": .teal,
            "cyan": .cyan,
            "blue": .blue,
            "indigo": .indigo,
            "purple": .purple,
            "pink": .pink,
            "brown": .brown,
            "black": .black,
            "white": .white,
            "gray": .gray,
            "primary": .primary,
            "secondary": .secondary,
            "accentColor": .accentColor,
            "accent": .accentColor,

            // UIKit label aliases that map directly to SwiftUI
            "label": .primary,
            "secondaryLabel": .secondary,
            "systemGray": .gray,
            "link": .accentColor,
        ]

        // Platform semantic colors — adaptive in both light and dark mode.
        #if canImport(UIKit)
        colors["tertiary"] = Color(.tertiaryLabel)
        colors["quaternary"] = Color(.quaternaryLabel)
        colors["tertiaryLabel"] = Color(.tertiaryLabel)
        colors["quaternaryLabel"] = Color(.quaternaryLabel)
        colors["placeholderText"] = Color(.placeholderText)

        colors["background"] = Color(.systemBackground)
        colors["systemBackground"] = Color(.systemBackground)
        colors["secondarySystemBackground"] = Color(.secondarySystemBackground)
        colors["tertiarySystemBackground"] = Color(.tertiarySystemBackground)
        colors["systemGroupedBackground"] = Color(.systemGroupedBackground)
        colors["secondarySystemGroupedBackground"] = Color(.secondarySystemGroupedBackground)
        colors["tertiarySystemGroupedBackground"] = Color(.tertiarySystemGroupedBackground)

        colors["systemGray2"] = Color(.systemGray2)
        colors["systemGray3"] = Color(.systemGray3)
        colors["systemGray4"] = Color(.systemGray4)
        colors["systemGray5"] = Color(.systemGray5)
        colors["systemGray6"] = Color(.systemGray6)

        colors["systemFill"] = Color(.systemFill)
        colors["secondarySystemFill"] = Color(.secondarySystemFill)
        colors["tertiarySystemFill"] = Color(.tertiarySystemFill)
        colors["quaternarySystemFill"] = Color(.quaternarySystemFill)

        colors["separator"] = Color(.separator)
        colors["opaqueSeparator"] = Color(.opaqueSeparator)
        #else
        colors["tertiary"] = Color(.tertiaryLabelColor)
        colors["quaternary"] = Color(.quaternaryLabelColor)
        colors["tertiaryLabel"] = Color(.tertiaryLabelColor)
        colors["quaternaryLabel"] = Color(.quaternaryLabelColor)
        colors["placeholderText"] = Color(.placeholderTextColor)

        colors["background"] = Color(.textBackgroundColor)
        colors["systemBackground"] = Color(.textBackgroundColor)
        colors["secondarySystemBackground"] = Color(.controlBackgroundColor)
        colors["tertiarySystemBackground"] = Color(.textBackgroundColor)
        colors["systemGroupedBackground"] = Color(.windowBackgroundColor)
        colors["secondarySystemGroupedBackground"] = Color(.controlBackgroundColor)
        colors["tertiarySystemGroupedBackground"] = Color(.textBackgroundColor)

        colors["systemGray2"] = Color(.systemGray)
        colors["systemGray3"] = Color(.systemGray)
        colors["systemGray4"] = Color(.systemGray)
        colors["systemGray5"] = Color(.systemGray)
        colors["systemGray6"] = Color(.systemGray)

        colors["systemFill"] = Color(.quaternaryLabelColor)
        colors["secondarySystemFill"] = Color(.quaternaryLabelColor)
        colors["tertiarySystemFill"] = Color(.quaternaryLabelColor)
        colors["quaternarySystemFill"] = Color(.quaternaryLabelColor)

        colors["separator"] = Color(.separatorColor)
        colors["opaqueSeparator"] = Color(.separatorColor)
        #endif

        return colors
    }()
}

extension Color {
    static func chartColor(named raw: String) -> Color {
        if raw.hasPrefix("#") {
            return color(hex: raw)
        }
        if raw.hasPrefix("rgba(") {
            return color(rgba: raw)
        }
        return ColorComponent.color(named: raw)
    }

    private static func color(hex raw: String) -> Color {
        var hex = raw.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        if hex.count == 3 {
            hex = hex.map { "\($0)\($0)" }.joined()
        }
        guard let int = UInt64(hex, radix: 16) else { return .primary }
        if hex.count == 8 {
            return Color(
                red: Double((int >> 24) & 0xff) / 255,
                green: Double((int >> 16) & 0xff) / 255,
                blue: Double((int >> 8) & 0xff) / 255,
                opacity: Double(int & 0xff) / 255
            )
        }
        return Color(
            red: Double((int >> 16) & 0xff) / 255,
            green: Double((int >> 8) & 0xff) / 255,
            blue: Double(int & 0xff) / 255
        )
    }

    private static func color(rgba raw: String) -> Color {
        let body = raw
            .replacingOccurrences(of: "rgba(", with: "")
            .replacingOccurrences(of: ")", with: "")
        let parts = body.split(separator: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
        guard parts.count == 4 else { return .primary }
        return Color(red: parts[0] / 255, green: parts[1] / 255, blue: parts[2] / 255, opacity: parts[3])
    }
}
