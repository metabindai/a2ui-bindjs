import SwiftUI

#if os(iOS) || os(visionOS)

// MARK: - Preference Key

struct GalleryItemPreferenceKey: PreferenceKey {
    static var defaultValue: [String] = []
    static func reduce(value: inout [String], nextValue: () -> [String]) {
        value.append(contentsOf: nextValue())
    }
}

// MARK: - Gallery Context

@Observable
class GalleryContext {
    var selectedItem: String?
    var isPresented: Bool = false

    func open(_ id: String) {
        selectedItem = id
        isPresented = true
    }
}

// MARK: - Environment Keys

private struct GalleryContextKey: EnvironmentKey {
    static let defaultValue: GalleryContext? = nil
}

private struct GalleryNamespaceKey: EnvironmentKey {
    static let defaultValue: Namespace.ID? = nil
}

extension EnvironmentValues {
    var galleryContext: GalleryContext? {
        get { self[GalleryContextKey.self] }
        set { self[GalleryContextKey.self] = newValue }
    }

    var galleryNamespace: Namespace.ID? {
        get { self[GalleryNamespaceKey.self] }
        set { self[GalleryNamespaceKey.self] = newValue }
    }
}

// MARK: - Gallery Component

public struct GalleryComponent: Component {
    public static var directiveName: String = "gallery"

    @EnvironmentObject private var context: BindJSContext
    @Namespace private var namespace
    @State private var galleryContext = GalleryContext()
    @State private var itemIDs: [String] = []

    public var detailHandlerId: String?
    public var zoomEnabled: Bool
}

extension GalleryComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        detailHandlerId = directive["detailHandlerId"]
        zoomEnabled = directive["zoomEnabled"] ?? true
    }

    public func accept<V>(visitor: inout V) -> V.Result where V: ComponentVisitor {
        visitor.visitGallery(self)
    }
}

extension GalleryComponent: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .environment(\.galleryContext, galleryContext)
            .environment(\.galleryNamespace, namespace)
            .onPreferenceChange(GalleryItemPreferenceKey.self) { ids in
                itemIDs = ids
            }
            .fullScreenCover(isPresented: $galleryContext.isPresented) {
                GalleryPagerView(
                    items: itemIDs,
                    selectedItem: $galleryContext.selectedItem,
                    namespace: namespace,
                    detailHandlerId: detailHandlerId,
                    zoomEnabled: zoomEnabled
                )
            }
    }
}

// MARK: - Gallery Pager View

struct GalleryPagerView: View {
    let items: [String]
    @Binding var selectedItem: String?
    var namespace: Namespace.ID
    var detailHandlerId: String?
    var zoomEnabled: Bool

    @EnvironmentObject private var context: BindJSContext
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            TabView(selection: $selectedItem) {
                ForEach(items, id: \.self) { itemId in
                    GalleryDetailItemView(
                        itemId: itemId,
                        detailHandlerId: detailHandlerId,
                        zoomEnabled: zoomEnabled,
                        selectedItem: selectedItem
                    )
                    .tag(Optional(itemId))
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .background(Color.black)
            .ignoresSafeArea()
            .toolbarBackground(.hidden, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    closeButton
                }
            }
        }
        .applyNavigationTransitionIfAvailable(selectedItem: selectedItem, namespace: namespace)
    }

    @ViewBuilder
    private var closeButton: some View {
        if #available(iOS 26.0, *) {
            Button(role: .close) {
                dismiss()
            }
        } else {
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
            }
        }
    }
}

// MARK: - Gallery Detail Item View

struct GalleryDetailItemView: View {
    let itemId: String
    let detailHandlerId: String?
    let zoomEnabled: Bool
    let selectedItem: String?

    @EnvironmentObject private var context: BindJSContext
    @State private var detailComponent: Component?
    @State private var zoomResetID = UUID()

    var body: some View {
        Color.clear
            .overlay {
                if let component = detailComponent {
                    if zoomEnabled {
                        ZoomableContainer(resetID: zoomResetID) {
                            ComponentView(component)
                        }
                    } else {
                        ComponentView(component)
                    }
                }
            }
            .ignoresSafeArea()
            .onChange(of: selectedItem) {
                zoomResetID = UUID()
            }
            .task {
                loadDetail()
            }
    }

    private func loadDetail() {
        guard let detailHandlerId else { return }
        if let jsValue = context.callEventHandler(id: detailHandlerId, arguments: itemId),
           let directive = jsValue.toDirective(),
           let component = makeComponent(directive) {
            detailComponent = component
        }
    }
}

// MARK: - Transition Helpers

extension View {
    @ViewBuilder
    func applyMatchedTransitionSourceIfAvailable(id: String, namespace: Namespace.ID?) -> some View {
        if #available(iOS 18.0, *), let namespace {
            self.matchedTransitionSource(id: id, in: namespace)
        } else {
            self
        }
    }

    @ViewBuilder
    func applyNavigationTransitionIfAvailable(selectedItem: String?, namespace: Namespace.ID) -> some View {
        if #available(iOS 18.0, *) {
            self.navigationTransition(.zoom(sourceID: selectedItem ?? "", in: namespace))
        } else {
            self
        }
    }
}

#endif
