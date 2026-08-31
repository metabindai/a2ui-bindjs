import SwiftUI

public struct MaterialComponent: Component {
    public static var directiveName: String = "Material"
    
    public var material: Material
}

extension MaterialComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        guard let material: Material = directive.rawValue() else { return nil }
        
        self.material = material
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitMaterial(self)
    }
}

extension MaterialComponent: View {
    var swiftUI: Material {
        material
    }
    
    public var body: some View {
        Rectangle().fill(swiftUI)
    }
}
