#if os(iOS) || os(tvOS) || os(watchOS)
import UIKit
public typealias PlatformImage = UIImage
public let defaultScreenScale: CGFloat = UIScreen.main.scale
#elseif os(macOS)
import AppKit
public typealias PlatformImage = NSImage
public let defaultScreenScale: CGFloat = NSScreen.main?.backingScaleFactor ?? 1.0
#endif
import SwiftUI
import Combine
import CryptoKit
import ImageIO
import CoreImage
import CoreImage.CIFilterBuiltins
@_implementationOnly import SVGViewKit

public struct ImageComponent: Component {
    public static var directiveName: String = "Image"
    public var contentMode: AspectImageContentMode? = nil
    public var name: String?
    public var url: URL?
    public var systemName: String?
    public var svg: String?
    public var resizable: Bool
}

extension ImageComponent {
    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }
            
        switch directive["contentMode"] as String? {
            case "fill":
                contentMode = .fill
            case "fit":
                contentMode = .fit
            default:
                contentMode = nil
        }

        name = directive["name"]
        url = directive["url"]
        systemName = directive["systemName"]
        svg = directive["svg"]
        resizable = directive["resizable"] ?? false
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitImage(self)
    }
}

extension ImageComponent: View {
    public var body: some View {
        if let url = url {
            if url.pathExtension.lowercased() == "svg" {
                SVGURLView(url: url, resizable: resizable)
            } else {
                AsyncImageView(url: url) { image in
                    if resizable {
                        AspectContentImage(image, mode: contentMode)
                    } else {
                        image
                    }
                } placeholder: { _ in
                    RoundedRectangle(cornerRadius: 0)
                        .fill(.quaternary)
                }
            }
        } else if let name = name {
            if resizable {
                Image(name)
                    .resizable()
            } else {
                Image(name)
            }
        } else if let svg = svg {
            SVGImageView(svgData: svg, resizable: resizable)
        } else if let systemName = systemName {
            Image(systemName: systemName)
        }
    }
}

// MARK: - contentMode aspect support
public enum AspectImageContentMode : String {
    case fit
    case fill
}

struct AspectContentImage: View {
    let image: Image
    let mode: AspectImageContentMode?
    
    init(_ image: Image, mode: AspectImageContentMode? = nil) {
        self.image = image
        self.mode = mode
    }
    
    var body : some View {
        switch mode {
            // Fill, or fit into container.
            case .fill, .fit:
                aspectContent
            
            // Stretch
            default:
                image.resizable()
        }
    }
    
    var aspectContent: some View {
        GeometryReader { proxy in
            let size = proxy.size
            
            image
                .resizable()
                .modifier(AspectImageContentSizingMode(mode: mode))
                .frame(width: size.width, height: size.height)
                .clipped()
        }
    }
}

private struct AspectImageContentSizingMode: ViewModifier {
    let mode: AspectImageContentMode?
    
    func body(content: Content) -> some View {
        switch mode {
        case .fit:
            content.scaledToFit()
        case .fill:
            content.scaledToFill()
        default:
            content
        }
    }
}

// MARK: - SVG Support Views
private struct SVGImageView: View {
    let svgData: String
    let resizable: Bool

    var body: some View {
        // SVGView wraps its rendering in a GeometryReader (greedy), which
        // makes it fill any unconstrained slot. When the SVG declares an
        // intrinsic size on its root element and the caller hasn't asked
        // for resizable behavior, clamp to that size — matches web parity.
        if !resizable, let intrinsic = parseSVGIntrinsicSize(svgData) {
            SVGView(string: svgData)
                .frame(width: intrinsic.width, height: intrinsic.height)
        } else {
            SVGView(string: svgData)
        }
    }
}

private func parseSVGIntrinsicSize(_ svgData: String) -> CGSize? {
    // Pull width/height attributes off the first <svg ...> element.
    // Ignores percentage units and viewBox-only sizing.
    guard let openIdx = svgData.range(of: "<svg", options: .caseInsensitive)?.lowerBound,
          let closeIdx = svgData[openIdx...].firstIndex(of: ">") else {
        return nil
    }
    let header = String(svgData[openIdx...closeIdx])

    func attr(_ name: String) -> CGFloat? {
        let pattern = "\\b\(name)\\s*=\\s*\"([^\"]+)\""
        guard let range = header.range(of: pattern, options: .regularExpression) else {
            return nil
        }
        let raw = String(header[range])
        guard let q1 = raw.firstIndex(of: "\""),
              let q2 = raw.lastIndex(of: "\""),
              q1 != q2 else { return nil }
        let value = String(raw[raw.index(after: q1)..<q2])
            .replacingOccurrences(of: "px", with: "")
            .trimmingCharacters(in: .whitespaces)
        if value.contains("%") { return nil }
        return Double(value).map { CGFloat($0) }
    }

    if let w = attr("width"), let h = attr("height") {
        return CGSize(width: w, height: h)
    }
    return nil
}

private struct SVGURLView: View {
    let url: URL
    let resizable: Bool
    @State private var svgString: String?
    @State private var isLoading = true
    
    var body: some View {
        Group {
            if let svgString = svgString {
                SVGView(string: svgString)
            } else {
                RoundedRectangle(cornerRadius: 0)
                    .fill(.quaternary)
                    .task {
                        await loadSVG()
                    }
            }
        }
    }
    
    private func loadSVG() async {
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let string = String(data: data, encoding: .utf8) {
                await MainActor.run {
                    self.svgString = string
                    self.isLoading = false
                }
            } else {
                await MainActor.run {
                    self.isLoading = false
                }
            }
        } catch {
            await MainActor.run {
                self.isLoading = false
            }
        }
    }
}

// MARK: - Caching Protocol
private protocol ImageCache {
    /// Retrieve cached image for URL
    func image(for url: URL) async -> PlatformImage?
    /// Insert or remove cached image for URL
    func insert(_ image: PlatformImage?, for url: URL) async
}

// MARK: - In-Memory Cache
private actor MemoryImageCache: ImageCache {
    private let cache = NSCache<NSURL, PlatformImage>()
    public func image(for url: URL) -> PlatformImage? {
        cache.object(forKey: url as NSURL)
    }
    public func insert(_ image: PlatformImage?, for url: URL) {
        if let image = image {
            cache.setObject(image, forKey: url as NSURL)
        } else {
            cache.removeObject(forKey: url as NSURL)
        }
    }
}

// MARK: - Disk Cache
private final class DiskImageCache {
    private let ioQueue = DispatchQueue(label: "DiskImageCache")
    private let directory: URL
    private let maxCacheSize: Int

    public init(name: String = "DiskImageCache", maxCacheSize: Int = 200 * 1024 * 1024) {
        let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
        directory = paths[0].appendingPathComponent(name, isDirectory: true)
        self.maxCacheSize = maxCacheSize
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    /// Raw data for URL on disk
    public func data(for url: URL) -> Data? {
        let fileURL = directory.appendingPathComponent(
            SHA256.hash(data: Data(url.absoluteString.utf8))
                .compactMap { String(format: "%02x", $0) }
                .joined()
        )
        return try? Data(contentsOf: fileURL)
    }

    /// Store raw data and trim if needed
    public func store(_ data: Data, for url: URL) {
        let fileURL = directory.appendingPathComponent(
            SHA256.hash(data: Data(url.absoluteString.utf8))
                .compactMap { String(format: "%02x", $0) }
                .joined()
        )
        ioQueue.async { [weak self] in
            try? data.write(to: fileURL, options: .atomic)
            self?.trimCacheIfNeeded()
        }
    }

    private func trimCacheIfNeeded() {
        guard let files = try? FileManager.default.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: [.contentAccessDateKey, .fileSizeKey],
            options: []
        ) else { return }
        var totalSize = 0
        let sorted = files.compactMap { url -> (URL, Date, Int)? in
            guard let values = try? url.resourceValues(
                forKeys: [.contentAccessDateKey, .fileSizeKey]
            ), let date = values.contentAccessDate, let size = values.fileSize else {
                return nil
            }
            totalSize += size
            return (url, date, size)
        }
        .sorted { $0.1 < $1.1 }

        guard totalSize > maxCacheSize else { return }
        for (url, _, size) in sorted {
            try? FileManager.default.removeItem(at: url)
            totalSize -= size
            if totalSize <= maxCacheSize { break }
        }
    }
}

// MARK: - PlatformImage Extensions
extension PlatformImage {
    /// Safely extract a CGImage reference
    var cgImageRef: CGImage? {
        #if os(macOS)
        return cgImage(forProposedRect: nil, context: nil, hints: nil)
        #else
        return cgImage
        #endif
    }
    /// Initialize from CGImage
    convenience init(cgImage: CGImage) {
        #if os(macOS)
        self.init(cgImage: cgImage, size: NSSize(width: cgImage.width, height: cgImage.height))
        #else
        self.init(cgImage: cgImage, scale: 1.0, orientation: .up)
        #endif
    }
    /// Wrap to SwiftUI Image
    func swiftUIImage() -> SwiftUI.Image {
        #if os(macOS)
        Image(nsImage: self)
        #else
        Image(uiImage: self)
        #endif
    }
}

// MARK: - In-Flight Coordinator
private actor InFlightCoordinator {
    private var tasks: [URL: Task<PlatformImage, Error>] = [:]

    func task(for url: URL, fetch: @escaping () async throws -> PlatformImage) -> Task<PlatformImage, Error> {
        if let existing = tasks[url] { return existing }
        let newTask = Task<PlatformImage, Error> {
            defer { Task { remove(url) } }
            return try await fetch()
        }
        tasks[url] = newTask
        return newTask
    }

    private func remove(_ url: URL) {
        tasks[url] = nil
    }
}

// MARK: - Shared Image Service
private final class SharedImageService {
    public static let shared = SharedImageService()

    public let memoryCache: ImageCache
    public let diskCache: DiskImageCache
    private let ciContext: CIContext
    private let session: URLSession
    private let inflight: InFlightCoordinator

    private init() {
        memoryCache = MemoryImageCache()
        diskCache = DiskImageCache(name: "SharedImageCache")
        ciContext = CIContext()
        inflight = InFlightCoordinator()
        let config = URLSessionConfiguration.ephemeral
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        session = URLSession(configuration: config)
    }

    /// Core fetch logic with caching and filtering
    fileprivate func fetchImage(
        from url: URL,
        desiredSize: CGSize,
        scale: CGFloat
    ) async throws -> PlatformImage {
        // 1. Memory
        if let img = await memoryCache.image(for: url) {
            return img
        }
        // 2. Disk
        if let data = diskCache.data(for: url),
           let img = createLanczosImage(from: data, to: desiredSize, scale: scale) {
            await memoryCache.insert(img, for: url)
            return img
        }
        // 3. Network
        let (data, _) = try await session.data(from: url)
        guard let img = createLanczosImage(from: data, to: desiredSize, scale: scale) else {
            throw URLError(.cannotDecodeContentData)
        }
        await memoryCache.insert(img, for: url)
        diskCache.store(data, for: url)
        return img
    }

    /// Apply Lanczos downsampling. Skips the filter when no downsampling is needed.
    private func createLanczosImage(
        from data: Data,
        to size: CGSize,
        scale: CGFloat
    ) -> PlatformImage? {
        guard let image = PlatformImage(data: data),
              let baseCG = image.cgImageRef else { return nil }

        // Skip Lanczos when no target size is specified or image is already smaller
        guard size.width > 0, size.height > 0 else { return image }
        let factor = min(size.width, size.height) * scale / CGFloat(baseCG.width)
        guard factor < 1.0 else { return image }

        let ciImage = CIImage(cgImage: baseCG)
        let filter = CIFilter.lanczosScaleTransform()
        filter.inputImage = ciImage
        filter.scale = Float(factor)
        filter.aspectRatio = 1.0
        guard let output = filter.outputImage,
              let outCG = ciContext.createCGImage(output, from: output.extent) else {
            return image
        }
        return PlatformImage(cgImage: outCG)
    }

    /// Public entry point
    public func loadImage(
        url: URL,
        desiredSize: CGSize,
        scale: CGFloat
    ) async throws -> PlatformImage {
        let task = await inflight.task(for: url) {
            try await self.fetchImage(from: url, desiredSize: desiredSize, scale: scale)
        }
        return try await task.value
    }
}

// MARK: - Load State
private enum AsyncImagePhase {
    case empty
    case success(SwiftUI.Image)
    case failure(Error)
}

// MARK: - Image Loader
@MainActor
private final class ImageLoader: ObservableObject {
    @Published public private(set) var phase = AsyncImagePhase.empty

    private let url: URL
    private let desiredSize: CGSize
    private let scale: CGFloat

    init(
        url: URL,
        desiredSize: CGSize,
        scale: CGFloat = defaultScreenScale
    ) {
        self.url = url
        self.desiredSize = desiredSize
        self.scale = scale
    }

    public func load() {
        guard case .empty = phase else { return }
        Task {
            do {
                let platformImg = try await SharedImageService.shared.loadImage(
                    url: url,
                    desiredSize: desiredSize,
                    scale: scale
                )
                let swiftImg = platformImg.swiftUIImage()
                phase = .success(swiftImg)
            } catch {
                phase = .failure(error)
            }
        }
    }
}

// MARK: - AsyncImage View
private struct AsyncImageView<Content: View, Placeholder: View>: View {
    @StateObject private var loader: ImageLoader
    private let content: (SwiftUI.Image) -> Content
    private let placeholder: (AsyncImagePhase) -> Placeholder

    public init(
        url: URL,
        desiredSize: CGSize = .zero,
        scale: CGFloat = defaultScreenScale,
        @ViewBuilder content: @escaping (SwiftUI.Image) -> Content,
        @ViewBuilder placeholder: @escaping (AsyncImagePhase) -> Placeholder
    ) {
        _loader = StateObject(
            wrappedValue: ImageLoader(url: url, desiredSize: desiredSize, scale: scale)
        )
        self.content = content
        self.placeholder = placeholder
    }

    public var body: some View {
        switch loader.phase {
        case .empty:
            placeholder(.empty)
                .task { loader.load() }
        case .success(let image):
            content(image)
        case .failure(let error):
            placeholder(.failure(error))
        }
    }
}
