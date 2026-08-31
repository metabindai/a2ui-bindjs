import SwiftUI

public struct SectionComponent: Component {
    public static var directiveName: String = "Section"
    
    public var header: Component?
    public var footer: Component?
    public var content: [Component]
}

extension SectionComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        self.header = directive["header"].flatMap(makeComponent)
        self.footer = directive["footer"].flatMap(makeComponent)
        self.content = directive.children.compactMap { makeComponent($0) }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitSection(self)
    }
}

extension SectionComponent: View {
    public var body: some View {
        Section {
            ForEach(content.indices, id: \.self) { index in
                ComponentView(content[index])
            }
        } header: {
            if let header = header {
                ComponentView(header)
            }
        } footer: {
            if let footer = footer {
                ComponentView(footer)
            }
        }

    }
}
