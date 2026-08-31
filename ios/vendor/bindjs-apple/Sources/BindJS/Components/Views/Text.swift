import SwiftUI

public struct TextComponent: Component {
    public static var directiveName: String = "Text"
    
    enum Storage {
        case markdown(String)
        case verbatim(String)
    }
    
    private var storage: Storage
    
    public var text: String {
        switch storage {
        case .markdown(let string):
            string
        case .verbatim(let string):
            string
        }
    }
    
    init(_ markdown: String) {
        self.storage = .markdown(markdown)
    }
    
    init(verbatim: String) {
        self.storage = .verbatim(verbatim)
    }
}

extension TextComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        
        if let markdown: String = directive.rawValue() {
            self.storage = .markdown(markdown)
        } else if let markdown: String = directive["markdown"] {
            self.storage = .markdown(markdown)
        } else if let markdown: String = directive["text"] {
            self.storage = .markdown(markdown)
        } else if let verbatim: String = directive["verbatim"] {
            self.storage = .verbatim(verbatim)
        } else {
            self.storage = .verbatim("")
        }
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitText(self)
    }
}

extension TextComponent: View {
    public var body: some View {
        switch storage {
        case .markdown(let string):
            Text(LocalizedStringKey(string))
        case .verbatim(let string):
            Text(verbatim: string)
        }
    }
}
