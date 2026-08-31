import SwiftUI

#if os(iOS) || os(visionOS)

public struct GalleryItemComponent: Component {
    public static var directiveName: String = "galleryItem"

    @Environment(\.galleryContext) private var galleryContext
    @Environment(\.galleryNamespace) private var galleryNamespace

    public var id: String
}

extension GalleryItemComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        id = directive.rawValue() ?? directive["id"] ?? ""
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitGalleryItem(self)
    }
}

extension GalleryItemComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .preference(key: GalleryItemPreferenceKey.self, value: [id])
            .applyMatchedTransitionSourceIfAvailable(id: id, namespace: galleryNamespace)
            .contentShape(Rectangle())
            .onTapGesture {
                galleryContext?.open(id)
            }
    }
}

#endif
