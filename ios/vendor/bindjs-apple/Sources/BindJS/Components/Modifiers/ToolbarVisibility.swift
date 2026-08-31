import SwiftUI

public struct ToolbarVisibilityComponent: Component {
    public static var directiveName: String = "toolbarVisibility"
    
    public var visibility: String
    public var bars: [String]?
}

extension ToolbarVisibilityComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        visibility = directive["visibility"] ?? "automatic"
        
        // Handle both string and array inputs for bars
        if let barsArray = directive.props["bars"] as? [String] {
            bars = barsArray
        } else if let barsString: String = directive["bars"] {
            bars = [barsString]
        } else {
            bars = nil
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitToolbarVisibility(self)
    }
}

extension ToolbarVisibilityComponent: ViewModifier {
    private func toolbarPlacement(for bar: String) -> ToolbarPlacement? {
        switch bar {
        #if os(iOS) || os(visionOS)
        case "navigationBar":
            return .navigationBar
        case "tabBar":
            return .tabBar
        case "bottomBar":
            return .bottomBar
        #endif
        #if os(macOS)
        case "windowToolbar":
            return .windowToolbar
        #endif
        case "automatic":
            return .automatic
        default:
            return nil
        }
    }

    public func body(content: Content) -> some View {
        if #available(iOS 18.0, macOS 15.0, *) {
            let toolbarVisibility: Visibility = {
                switch visibility {
                case "visible":
                    return .visible
                case "hidden":
                    return .hidden
                case "automatic":
                    return .automatic
                default:
                    return .automatic
                }
            }()

            if let bars = bars, !bars.isEmpty {
                // Convert string array to ToolbarPlacement values
                let toolbarPlacements: [ToolbarPlacement] = bars.compactMap { toolbarPlacement(for: $0) }

                // Use variadic arguments by expanding the array
                switch toolbarPlacements.count {
                case 1:
                    content.toolbarVisibility(toolbarVisibility, for: toolbarPlacements[0])
                case 2:
                    content.toolbarVisibility(toolbarVisibility, for: toolbarPlacements[0], toolbarPlacements[1])
                case 3:
                    content.toolbarVisibility(toolbarVisibility, for: toolbarPlacements[0], toolbarPlacements[1], toolbarPlacements[2])
                default:
                    content.toolbarVisibility(toolbarVisibility)
                }
            } else {
                content.toolbarVisibility(toolbarVisibility)
            }
        } else {
            content
        }
    }
}
