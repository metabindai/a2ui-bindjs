// The app's own SwiftUI — all of it.
//
// A three-row menu, a list per group, and for each item a surface drawn by the catalog.
// Nothing here describes what a component looks like; that arrives as A2UI.

import SwiftUI
import A2UI

struct ContentView: View {
    @StateObject private var gallery = Gallery()
    @State private var path = ContentView.initialPath

    var body: some View {
        NavigationStack(path: $path) {
            List {
                NavigationLink(value: Showcase.Group.basic) {
                    MenuRow("Basic catalog", detail: "One screen per component, written here")
                }

                // What the online galleries render. Same names as the v1.0 files, but the
                // v1.0 rewrite dropped the heading variants, so these carry more emphasis.
                NavigationLink(value: Showcase.Group.spec09) {
                    MenuRow("A2UI v0.9 examples", detail: "What every upstream gallery shows")
                }

                NavigationLink(value: Showcase.Group.spec) {
                    MenuRow("A2UI v1.0 examples", detail: "The spec's own 43 surfaces")
                }
            }
            .navigationTitle("A2UI Catalog")
            .navigationDestination(for: Showcase.Group.self) { group in
                GroupList(group: group)
            }
            .navigationDestination(for: Showcase.self) { showcase in
                ExampleScreen(initial: showcase, gallery: gallery)
            }
        }
    }

    /// `--show <id>` opens a screen directly, which is what a screenshot script wants:
    /// its group is pushed first so Back lands on the right list.
    private static var initialPath: NavigationPath {
        var path = NavigationPath()
        let arguments = CommandLine.arguments

        if let index = arguments.firstIndex(of: "--show"), index + 1 < arguments.count, let showcase = Showcase.find(arguments[index + 1]) {
            path.append(showcase.group)
            path.append(showcase)
        }

        return path
    }
}

// MARK: - Menu

private struct MenuRow: View {
    let title: String
    let detail: String

    init(_ title: String, detail: String) {
        self.title = title
        self.detail = detail
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)

            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

private struct GroupList: View {
    let group: Showcase.Group

    var body: some View {
        List(Showcase.showcases(in: group)) { showcase in
            NavigationLink(showcase.title, value: showcase)
        }
        .navigationTitle(title)
    }

    private var title: String {
        switch group {
        case .basic:
            return "Basic catalog"
        case .spec:
            return "A2UI v1.0 examples"
        case .spec09:
            return "A2UI v0.9 examples"
        }
    }
}

// MARK: - Stepping through a group

/// The pushed screen. It holds which item it is showing, so Previous and Next swap the
/// content in place and Back still returns to the list the item came from.
private struct ExampleScreen: View {
    @State private var current: Showcase
    @ObservedObject var gallery: Gallery

    init(initial: Showcase, gallery: Gallery) {
        _current = State(initialValue: initial)
        self.gallery = gallery
    }

    private var siblings: [Showcase] {
        Showcase.showcases(in: current.group)
    }

    private var index: Int {
        siblings.firstIndex(where: { $0.id == current.id }) ?? 0
    }

    var body: some View {
        Group {
            if current.group == .basic {
                ShowcaseView(showcase: current, gallery: gallery)
            } else {
                // Its own host, so each example's message stream lands on a clean store.
                // `.id` makes SwiftUI build a fresh one per example.
                SpecExampleView(showcase: current)
                    .id(current.id)
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: stepperPlacement) {
                Button {
                    step(-1)
                } label: {
                    Label("Previous", systemImage: "chevron.left")
                }
                .disabled(index == 0)

                Spacer()

                Text("\(index + 1) of \(siblings.count)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
                    .lineLimit(1)
                    .fixedSize()

                Spacer()

                Button {
                    step(1)
                } label: {
                    Label("Next", systemImage: "chevron.right")
                }
                .disabled(index == siblings.count - 1)
            }
        }
    }

    private var stepperPlacement: ToolbarItemPlacement {
        #if os(iOS)
        return .bottomBar
        #else
        return .automatic
        #endif
    }

    private func step(_ offset: Int) {
        let target = index + offset

        guard siblings.indices.contains(target) else {
            return
        }

        current = siblings[target]
    }
}

// MARK: - One component

private struct ShowcaseView: View {
    let showcase: Showcase
    @ObservedObject var gallery: Gallery

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(showcase.summary)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                A2UISurfaceView(host: gallery.host, surfaceId: showcase.id)

                DiagnosticsView(host: gallery.host, surfaceId: showcase.id)

                if !gallery.actionLog.isEmpty {
                    Panel("Sent to the agent", entries: gallery.actionLog, tint: .secondary)
                }
            }
            .padding(20)
            .frame(maxWidth: 560, alignment: .leading)
        }
        .navigationTitle(showcase.title)
        .toolbar {
            Button("Reset") {
                gallery.reset()
            }
        }
    }
}

// MARK: - One spec example

/// A host of its own, created when the example is opened and dropped when it is left.
private struct SpecExampleView: View {
    let showcase: Showcase
    @StateObject private var gallery: Gallery

    init(showcase: Showcase) {
        self.showcase = showcase
        _gallery = StateObject(wrappedValue: Gallery(applying: showcase.message))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(showcase.summary)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                A2UISurfaceView(host: gallery.host)

                DiagnosticsView(host: gallery.host, surfaceId: nil)

                if !gallery.actionLog.isEmpty {
                    Panel("Sent to the agent", entries: gallery.actionLog, tint: .secondary)
                }
            }
            .padding(20)
            .frame(maxWidth: 560, alignment: .leading)
        }
        .navigationTitle(showcase.title)
        .toolbar {
            Button("Reset") {
                gallery.reset()
            }
        }
    }
}

// MARK: - Panels

/// Observes the host, so a surface that fails to draw says why. `nil` means every surface.
private struct DiagnosticsView: View {
    @ObservedObject var host: A2UIHost
    let surfaceId: String?

    var body: some View {
        let entries = host.diagnostics.filter { surfaceId == nil || $0.surfaceId == surfaceId }.map(\.description)

        if !entries.isEmpty {
            Panel("Diagnostics", entries: entries, tint: .red)
        }
    }
}

private struct Panel: View {
    let title: String
    let entries: [String]
    let tint: Color

    init(_ title: String, entries: [String], tint: Color) {
        self.title = title
        self.entries = entries
        self.tint = tint
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)

            ForEach(Array(entries.enumerated()), id: \.offset) { _, entry in
                Text(entry)
                    .font(.system(.caption, design: .monospaced))
                    .foregroundStyle(tint)
                    .textSelection(.enabled)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
