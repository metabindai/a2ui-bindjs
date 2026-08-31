import SwiftUI

public struct FontComponent: Component {
    public static var directiveName: String = "font"
    
    public enum Storage {
        case textStyle(Font.TextStyle)
        case size(CGFloat)
        case custom(CustomFontComponent)
    }
    
    public var storage: Storage
}

extension FontComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        if let size: CGFloat = directive.rawValue() {
            storage = .size(size)
        } else if let textStyle: Font.TextStyle = directive.rawValue() {
            storage = .textStyle(textStyle)
        } else if let directive: Directive = directive.rawValue(),
                  let customFont: CustomFontComponent = makeComponent(directive) as? CustomFontComponent {
            storage = .custom(customFont)
        } else {
            return nil
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitFont(self)
    }
}

extension Font.TextStyle {
    var font: Font {
        switch self {
        case .caption2: .caption2
        case .largeTitle: .largeTitle
        case .title: .title
        case .title2: .title2
        case .title3: .title3
        case .headline: .headline
        case .subheadline: .subheadline
        case .body: .body
        case .callout: .callout
        case .footnote: .footnote
        case .caption: .caption
        @unknown default: .body
        }
    }
}

extension FontComponent: ViewModifier {
    public func body(content: Content) -> some View {
        switch storage {
        case .textStyle(let textStyle):
            content
                .font(textStyle.font)
        case .size(let size):
            content
                .font(.system(size: size))
        case .custom(let custom):
            content
                .modifier(custom)
        }
    }
}
