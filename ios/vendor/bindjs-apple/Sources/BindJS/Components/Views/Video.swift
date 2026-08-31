import SwiftUI
import AVKit
import AVFoundation

public struct VideoComponent: Component, View {
    public static let directiveName = "Video"

    public var url: URL
    public var autoplay: Bool
    public var muted: Bool
    public var controls: Bool
    public var loop: Bool
    public var contentMode: ContentMode

    public init?(from directive: Directive) {
        guard directive.type == Self.directiveName else { return nil }

        if let directURL: URL = directive["url"] {
            url = directURL
        } else if let dict: [String: Any] = directive["video"],
                  let urlString = dict["url"] as? String,
                  let nestedURL = URL(string: urlString) {
            url = nestedURL
        } else {
            return nil
        }

        autoplay = directive["autoplay"] ?? false
        muted    = directive["muted"]    ?? false
        controls = directive["controls"] ?? true
        loop     = directive["loop"]     ?? false
        contentMode = directive["contentMode"] ?? .fit
    }
    
    public func accept<V>(visitor: inout V) -> V.Result where V : ComponentVisitor {
        visitor.visitVideo(self)
    }

    public var body: some View {
        VideoPlayerContainer(
            url: url,
            autoplay: autoplay,
            muted: muted,
            controls: controls,
            loop: loop,
            contentMode: contentMode
        )
    }
}

private struct VideoPlayerContainer: View {
    let url: URL
    let autoplay: Bool
    let muted: Bool
    let controls: Bool
    let loop: Bool
    let contentMode: ContentMode

    var body: some View {
    #if os(macOS)
        MacVideoPlayer(
            url: url,
            autoplay: autoplay,
            muted: muted,
            controls: controls,
            loop: loop,
            contentMode: contentMode
        )
    #else
        iOSVideoPlayer(
            url: url,
            autoplay: autoplay,
            muted: muted,
            controls: controls,
            loop: loop,
            contentMode: contentMode
        )
    #endif
    }
}

#if os(iOS) || os(tvOS) || os(watchOS)
private struct iOSVideoPlayer: UIViewControllerRepresentable {
    let url: URL
    let autoplay: Bool
    let muted: Bool
    let controls: Bool
    let loop: Bool
    let contentMode: ContentMode

    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let controller = AVPlayerViewController()
        let player = AVPlayer(url: url)
        player.isMuted = muted
        controller.player = player
        controller.showsPlaybackControls = controls
        controller.videoGravity = contentMode == .fit ? .resizeAspect : .resizeAspectFill

        context.coordinator.player = player

        if loop {
            NotificationCenter.default.addObserver(
                context.coordinator,
                selector: #selector(Coordinator.playerDidFinish(_:)),
                name: .AVPlayerItemDidPlayToEndTime,
                object: player.currentItem
            )
        }
        if autoplay {
            player.play()
        }
        return controller
    }

    func updateUIViewController(_ uiViewController: AVPlayerViewController, context: Context) {
        // Update player settings if props change
        uiViewController.player?.isMuted = muted
        uiViewController.showsPlaybackControls = controls
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    class Coordinator: NSObject {
        var player: AVPlayer?

        @objc func playerDidFinish(_ notification: Notification) {
            guard let player = player else { return }
            player.seek(to: .zero)
            player.play()
        }

        deinit {
            NotificationCenter.default.removeObserver(self)
        }
    }
}
#else
private struct MacVideoPlayer: NSViewRepresentable {
    let url: URL
    let autoplay: Bool
    let muted: Bool
    let controls: Bool
    let loop: Bool
    let contentMode: ContentMode

    func makeNSView(context: Context) -> AVPlayerView {
        let view = AVPlayerView()
        let player = AVPlayer(url: url)
        player.isMuted = muted
        view.player = player
        view.controlsStyle = controls ? .floating : .none
        view.videoGravity = contentMode == .fit ? .resizeAspect: .resizeAspectFill

        context.coordinator.player = player

        if loop {
            NotificationCenter.default.addObserver(
                context.coordinator,
                selector: #selector(Coordinator.playerDidFinish(_:)),
                name: .AVPlayerItemDidPlayToEndTime,
                object: player.currentItem
            )
        }
        if autoplay {
            player.play()
        }
        return view
    }

    func updateNSView(_ nsView: AVPlayerView, context: Context) {
        // Update view settings if props change
        nsView.controlsStyle = controls ? .floating : .none
        nsView.player?.isMuted = muted
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    class Coordinator: NSObject {
        var player: AVPlayer?

        @objc func playerDidFinish(_ notification: Notification) {
            guard let player = player else { return }
            player.seek(to: .zero)
            player.play()
        }

        deinit {
            NotificationCenter.default.removeObserver(self)
        }
    }
}
#endif
