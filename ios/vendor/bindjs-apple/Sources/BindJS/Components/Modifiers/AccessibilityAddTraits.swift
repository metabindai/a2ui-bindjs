import SwiftUI

public struct AccessibilityAddTraitsComponent: Component {
    public static var directiveName: String = "accessibilityAddTraits"
    
    public var traits: [AccessibilityTraits]
}

extension AccessibilityAddTraitsComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        var traitsToAdd: [AccessibilityTraits] = []
        
        // Check for individual trait properties
        if directive["isButton"] == true {
            traitsToAdd.append(.isButton)
        }
        if directive["isHeader"] == true {
            traitsToAdd.append(.isHeader)
        }
        if directive["isImage"] == true {
            traitsToAdd.append(.isImage)
        }
        if directive["isLink"] == true {
            traitsToAdd.append(.isLink)
        }
        if directive["isSearchField"] == true {
            traitsToAdd.append(.isSearchField)
        }
        if directive["isSelected"] == true {
            traitsToAdd.append(.isSelected)
        }
        if directive["isStaticText"] == true {
            traitsToAdd.append(.isStaticText)
        }
        if directive["isSummaryElement"] == true {
            traitsToAdd.append(.isSummaryElement)
        }
        if directive["playsSound"] == true {
            traitsToAdd.append(.playsSound)
        }
        if directive["startsMediaSession"] == true {
            traitsToAdd.append(.startsMediaSession)
        }
        if directive["updatesFrequently"] == true {
            traitsToAdd.append(.updatesFrequently)
        }
        
        // Also support comma-separated string of traits
        if let traitsString: String = directive["traits"] {
            let traitNames = traitsString.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            for traitName in traitNames {
                switch traitName {
                case "button": traitsToAdd.append(.isButton)
                case "header": traitsToAdd.append(.isHeader)
                case "image": traitsToAdd.append(.isImage)
                case "link": traitsToAdd.append(.isLink)
                case "searchField": traitsToAdd.append(.isSearchField)
                case "selected": traitsToAdd.append(.isSelected)
                case "staticText": traitsToAdd.append(.isStaticText)
                case "summaryElement": traitsToAdd.append(.isSummaryElement)
                case "playsSound": traitsToAdd.append(.playsSound)
                case "startsMediaSession": traitsToAdd.append(.startsMediaSession)
                case "updatesFrequently": traitsToAdd.append(.updatesFrequently)
                default: break
                }
            }
        }
        
        traits = traitsToAdd
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitAccessibilityAddTraits(self)
    }
}

extension AccessibilityAddTraitsComponent: ViewModifier {
    public func body(content: Content) -> some View {
        var result: any View = content
        for trait in traits {
            result = AnyView(result).accessibilityAddTraits(trait)
        }
        return AnyView(result)
    }
}