import Foundation
import CoreText
import CryptoKit
import SwiftUI
import Combine

// MARK: - CustomFontComponent

public struct CustomFontComponent: Component {
    public static var directiveName: String = "CustomFont"

    public var family: String
    public var size: CGFloat
    public var url: URL?
}

extension CustomFontComponent {
    public init?(from directive: Directive) {
        self.family = directive["family"] ?? "Not Specified"
        self.size = directive["size"] ?? 17.0
        self.url = directive["url"]
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitCustomFont(self)
    }
}

extension CustomFontComponent: ViewModifier {
    public func body(content: Content) -> some View {
        FontLoaderView(url: url, family: family, size: size) {
            content
        }
    }
}

// MARK: - FontLoaderView

private let fontTextStyleMap: [(Font.TextStyle, CGFloat)] = [
    (.largeTitle, 34),
    (.title,      28),
    (.title2,     22),
    (.title3,     20),
    (.headline,   17),
    (.body,       17),
    (.callout,    16),
    (.subheadline,15),
    (.footnote,   13),
    (.caption,    12),
    (.caption2,   11)
]

/// A helper view that owns the @State for font loading.
/// Using a View (instead of storing @State in the ViewModifier) ensures
/// stable identity across parent re-renders.
private struct FontLoaderView<Content: View>: View {
    let url: URL?
    let family: String
    let size: CGFloat
    let content: Content

    @State private var postScriptName: String?
    @State private var isLoading = false

    init(url: URL?, family: String, size: CGFloat, @ViewBuilder content: () -> Content) {
        self.url = url
        self.family = family
        self.size = size
        self.content = content()
    }

    var body: some View {
        content
            .font(makeFont())
            .task(id: url) {
                await loadFontIfNeeded()
            }
            .onReceive(FontLoadedPublisher.shared.publisher) { loadedURL in
                // When any font finishes loading, check if it's ours
                if loadedURL == url, postScriptName == nil {
                    Task {
                        if let name = await FontCache.shared.cachedPostScriptName(for: loadedURL) {
                            postScriptName = name
                        }
                    }
                }
            }
    }

    // MARK: — Helper: choose the Font to apply
    private func makeFont() -> Font {
        let textStyle = nearestTextStyle(for: size)
        if let psName = postScriptName {
            return .custom(psName, size: size, relativeTo: textStyle)
        } else if url != nil {
            return .system(size: size, weight: .regular, design: .default)
        } else {
            return .custom(family, size: size, relativeTo: textStyle)
        }
    }

    private func nearestTextStyle(for size: CGFloat) -> Font.TextStyle {
        fontTextStyleMap.min(by: { abs($0.1 - size) < abs($1.1 - size) })!.0
    }

    // MARK: — Async loader
    private func loadFontIfNeeded() async {
        guard
            !isLoading,
            postScriptName == nil,
            let fontURL = url
        else {
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let name = try await FontCache.shared.postScriptName(for: fontURL)
            postScriptName = name
        } catch {
            // Font loading failures are non-fatal — fall back to system font
        }
    }
}

// MARK: - FontLoadedPublisher

/// Publishes when a font finishes loading so all views using that font can update
final class FontLoadedPublisher {
    static let shared = FontLoadedPublisher()
    let publisher = PassthroughSubject<URL, Never>()
}

// MARK: - FontCacheError

public enum FontCacheError: Error {
    case downloadFailed(Error)
    case invalidFontData
    case registrationFailed(CFError)
}

// MARK: - FontCache

public actor FontCache {
    public static let shared = FontCache()
    
    /// In-memory map from source URL → registered PostScript name
    private var loadedFonts: [URL: String] = [:]

    /// In-flight download tasks to prevent duplicate downloads
    private var inFlightTasks: [URL: Task<String, Error>] = [:]

    /// Directory in Caches/Fonts where we store the raw data
    private let cacheDirectory: URL
    
    init() {
        let base = FileManager.default
            .urls(for: .cachesDirectory, in: .userDomainMask)
            .first!
        cacheDirectory = base.appendingPathComponent("Fonts", isDirectory: true)
        
        try? FileManager.default.createDirectory(
            at: cacheDirectory,
            withIntermediateDirectories: true
        )
    }
    
    /// Downloads (or reads from disk) the font at `url`, registers it once,
    /// and returns its PostScript name.
    public func postScriptName(for url: URL) async throws -> String {
        // 1) Reuse in-memory if already loaded
        if let existing = loadedFonts[url] {
            return existing
        }

        // 2) Deduplicate in-flight requests for the same URL
        if let existing = inFlightTasks[url] {
            return try await existing.value
        }

        let task = Task<String, Error> {
            try await self.loadAndRegisterFont(for: url)
        }
        inFlightTasks[url] = task

        do {
            let result = try await task.value
            inFlightTasks[url] = nil
            return result
        } catch {
            inFlightTasks[url] = nil
            throw error
        }
    }

    private func loadAndRegisterFont(for url: URL) async throws -> String {
        // Check again in case another task completed while we were waiting
        if let existing = loadedFonts[url] {
            return existing
        }

        // Compute local file URL using URL hash to avoid filename collisions
        let hash = SHA256.hash(data: Data(url.absoluteString.utf8))
            .compactMap { String(format: "%02x", $0) }
            .joined()
        let ext = url.pathExtension
        let localFile = cacheDirectory.appendingPathComponent(ext.isEmpty ? hash : "\(hash).\(ext)")

        // Load font data from disk or download it
        let data: Data
        if FileManager.default.fileExists(atPath: localFile.path) {
            data = try Data(contentsOf: localFile)
        } else {
            do {
                let (downloaded, _) = try await URLSession.shared.data(from: url)
                data = downloaded
                try data.write(to: localFile, options: .atomic)
            } catch {
                throw FontCacheError.downloadFailed(error)
            }
        }

        // Wrap in CGFont and register with CoreText
        guard
            let provider = CGDataProvider(data: data as CFData),
            let cgFont = CGFont(provider)
        else {
            throw FontCacheError.invalidFontData
        }

        var registrationError: Unmanaged<CFError>?
        CTFontManagerRegisterGraphicsFont(cgFont, &registrationError)
        if let err = registrationError?.takeRetainedValue() {
            throw FontCacheError.registrationFailed(err)
        }

        // Extract and cache its PostScript name
        guard let psName = cgFont.postScriptName as String? else {
            throw FontCacheError.invalidFontData
        }

        loadedFonts[url] = psName

        // Notify all listeners that this font is now available
        Task { @MainActor in
            FontLoadedPublisher.shared.publisher.send(url)
        }

        return psName
    }

    /// Synchronous lookup for already-loaded fonts
    public func cachedPostScriptName(for url: URL) -> String? {
        loadedFonts[url]
    }
}
