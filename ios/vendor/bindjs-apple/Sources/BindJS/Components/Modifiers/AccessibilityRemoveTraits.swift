import SwiftUI

public struct AccessibilityRemoveTraitsComponent: Component {
    public static var directiveName: String = "accessibilityRemoveTraits"
    
    public var traits: [AccessibilityTraits]
}

extension AccessibilityRemoveTraitsComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        var traitsToRemove: [AccessibilityTraits] = []
        
        // Check for individual trait properties
        if directive["isButton"] == true {
            traitsToRemove.append(.isButton)
        }
        if directive["isHeader"] == true {
            traitsToRemove.append(.isHeader)
        }
        if directive["isImage"] == true {
            traitsToRemove.append(.isImage)
        }
        if directive["isLink"] == true {
            traitsToRemove.append(.isLink)
        }
        if directive["isSearchField"] == true {
            traitsToRemove.append(.isSearchField)
        }
        if directive["isSelected"] == true {
            traitsToRemove.append(.isSelected)
        }
        if directive["isStaticText"] == true {
            traitsToRemove.append(.isStaticText)
        }
        if directive["isSummaryElement"] == true {
            traitsToRemove.append(.isSummaryElement)
        }
        if directive["playsSound"] == true {
            traitsToRemove.append(.playsSound)
        }
        if directive["startsMediaSession"] == true {
            traitsToRemove.append(.startsMediaSession)
        }
        if directive["updatesFrequently"] == true {
            traitsToRemove.append(.updatesFrequently)
        }
        
        // Also support comma-separated string of traits
        if let traitsString: String = directive["traits"] {
            let traitNames = traitsString.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            for traitName in traitNames {
                switch traitName {
                case "button": traitsToRemove.append(.isButton)
                case "header": traitsToRemove.append(.isHeader)
                case "image": traitsToRemove.append(.isImage)
                case "link": traitsToRemove.append(.isLink)
                case "searchField": traitsToRemove.append(.isSearchField)
                case "selected": traitsToRemove.append(.isSelected)
                case "staticText": traitsToRemove.append(.isStaticText)
                case "summaryElement": traitsToRemove.append(.isSummaryElement)
                case "playsSound": traitsToRemove.append(.playsSound)
                case "startsMediaSession": traitsToRemove.append(.startsMediaSession)
                case "updatesFrequently": traitsToRemove.append(.updatesFrequently)
                default: break
                }
            }
        }
        
        traits = traitsToRemove
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAccessibilityRemoveTraits(self)
    }
}

extension AccessibilityRemoveTraitsComponent: ViewModifier {
    public func body(content: Content) -> some View {
        var result: any View = content
        for trait in traits {
            result = AnyView(result).accessibilityRemoveTraits(trait)
        }
        return AnyView(result)
    }
}