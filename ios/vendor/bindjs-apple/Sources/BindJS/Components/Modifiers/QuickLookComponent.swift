import SwiftUI
import QuickLook

public struct QuickLookComponent: Component {
    public static var directiveName: String = "quickLookPreview"
    
    let url: String?
    let setUrlId: String?
    let urls: [String]?
    let onLoadingChangedId: String?
    let environmentId: String
    
    @EnvironmentObject private var context: BindJSContext
}

extension QuickLookComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
        self.url = directive["url"]
        self.setUrlId = directive["setURLId"]
        self.urls = directive.props["urls"] as? [String]
        self.onLoadingChangedId = directive["onLoadingChangedId"]
        self.environmentId = directive["environmentId"] ?? ""
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitQuickLookPreview(self)
    }
}

extension QuickLookComponent: ViewModifier {
    public func body(content: Content) -> some View {
        QuickLookView(
            url: Binding(
                get: { url },
                set: { newUrl in
                    if let setUrlId {
                        context.restoreEnvironment(id: environmentId)
                        _ = context.callEventHandler(id: setUrlId, arguments: newUrl)
                    }
                }
            ),
            urls: urls,
            content: content,
            onLoadingChanged: { isLoading in
                if let onLoadingChangedId {
                    context.restoreEnvironment(id: environmentId)
                    _ = context.callEventHandler(id: onLoadingChangedId, arguments: isLoading)
                }
            }
        )
    }
}

struct QuickLookView<Content: View>: View {
    @Binding var url: String?
    let urls: [String]?
    let content: Content
    let onLoadingChanged: (Bool) -> Void
    
    @State private var isPresented = false
    @State private var currentPreviewURL: URL?
    @State private var downloadedURLs: [URL] = []
    @State private var isLoading = false
    
    var body: some View {
        quickLookContent()
            .onChange(of: url) { _, newURL in
                guard let newURL, !newURL.isEmpty else { return }
                presentQuickLook()
            }
            .onChange(of: isLoading) { _, newValue in
                onLoadingChanged(newValue)
            }
            .onChange(of: currentPreviewURL) { _, newValue in
                
                // Quick look present
                if newValue != nil && isLoading {
                    // Give QuickLook a moment to present, then update loading state
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                        self.isLoading = false
                    }
                    
                // Quick look dismiss
                } else if (newValue == nil) {
                    url = nil
                }
            }
    }
    
    @ViewBuilder
    private func quickLookContent() -> some View {
        if let urls = urls, !urls.isEmpty {
            content.modifier(QuickLookPreviewModifier(url: $currentPreviewURL, urls: downloadedURLs))
        } else {
            content.modifier(QuickLookPreviewModifier(url: $currentPreviewURL))
        }
    }
}

struct QuickLookPreviewModifier: ViewModifier {
    private let urls: [URL]?
    private let url: Binding<URL?>

    init(url: Binding<URL?>, urls: [URL]? = nil) {
        self.url = url
        self.urls = urls
    }

    func body(content: Content) -> some View {
        if let urls {
            content.quickLookPreview(url, in: urls)
        } else {
            content.quickLookPreview(url)
        }
    }
}

extension QuickLookView {
    private func presentQuickLook() {
        guard let url = url else { return }
        
        let urlsToLoad = urls ?? [url]
        guard !urlsToLoad.isEmpty else { return }
        
        isLoading = true
        downloadedURLs.removeAll()
        
        let group = DispatchGroup()
        var loadedURLs: [URL] = []
        let validUrls = urlsToLoad.compactMap { URL(string: $0) }
        
        for urlObject in validUrls {
            group.enter()
            downloadFile(url: urlObject) { localURL in
                if let localURL = localURL {
                    loadedURLs.append(localURL)
                }
                group.leave()
            }
        }
        
        group.notify(queue: .main) {
            self.isLoading = false
        
            if !loadedURLs.isEmpty {
                self.downloadedURLs = loadedURLs
                self.currentPreviewURL = loadedURLs.first
            }
        }
    }
    
    private func downloadFile(url: URL, completion: @escaping (URL?) -> Void) {
        let fileName = url.lastPathComponent
        let localURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        
        try? FileManager.default.removeItem(at: localURL)
        
        // Check if already cached
        if FileManager.default.fileExists(atPath: localURL.path) {
            completion(localURL)
            return
        }
        
        // Download the file
        let task = URLSession.shared.downloadTask(with: url) { tempURL, _, error in
            guard let tempURL = tempURL, error == nil else {
                completion(nil)
                return
            }
            
            do {
                try? FileManager.default.removeItem(at: localURL)
                try FileManager.default.moveItem(at: tempURL, to: localURL)
                completion(localURL)
            } catch {
                completion(nil)
            }
        }
        
        task.resume()
    }
}
