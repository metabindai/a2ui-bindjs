import SwiftUI

public struct PickerStyleComponent: Component {
    public static var directiveName: String = "pickerStyle"
    public var style: String
}

extension PickerStyleComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        style = directive.rawValue() ?? "automatic"
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitPickerStyle(self)
    }
}

extension PickerStyleComponent: ViewModifier {

    @ViewBuilder
    public func body(content: Content) -> some View {
        let s = style.lowercased()

        switch s {
        case "automatic":
            content.pickerStyle(.automatic)

        case "segmented":
            content.pickerStyle(.segmented)

        case "inline":
            #if os(iOS) || os(watchOS)
            if #available(iOS 14.0, watchOS 7.0, *) {
                content.pickerStyle(.inline)
            } else {
                content.pickerStyle(.automatic)
            }
            #else
            content.pickerStyle(.automatic)
            #endif

        case "menu":
            if #available(iOS 14.0, macOS 11.0, tvOS 17.0, watchOS 7.0, *) {
                content.pickerStyle(.menu)
            } else {
                content.pickerStyle(.automatic)
            }

        case "navigationlink":
            #if os(iOS) || os(tvOS) || os(watchOS)
            if #available(iOS 16.0, tvOS 16.0, watchOS 9.0, *) {
                content.pickerStyle(.navigationLink)
            } else {
                content.pickerStyle(.automatic)
            }
            #else
            content.pickerStyle(.automatic)
            #endif

        case "palette":
            #if os(iOS) || os(macOS)
            if #available(iOS 17.0, macOS 14.0, *) {
                content.pickerStyle(.palette)
            } else {
                content.pickerStyle(.automatic)
            }
            #else
            content.pickerStyle(.automatic)
            #endif

        case "radiogroup":
            #if os(macOS)
            if #available(macOS 11.0, *) {
                content.pickerStyle(.radioGroup)
            } else {
                content.pickerStyle(.automatic)
            }
            #else
            content.pickerStyle(.automatic)
            #endif

        case "wheel":
            #if os(iOS)
            content.pickerStyle(.wheel)
            #else
            content.pickerStyle(.automatic)
            #endif

        default:
            content.pickerStyle(.automatic)
        }
    }

}
