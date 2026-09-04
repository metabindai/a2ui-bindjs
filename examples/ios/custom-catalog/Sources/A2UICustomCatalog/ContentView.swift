// The app's own SwiftUI — all of it.
//
// Three panels of chrome around three surfaces. Nothing here describes an offer card or a
// star; that arrives as A2UI and a catalog draws it.

import SwiftUI
import A2UI

struct ContentView: View {
    @StateObject private var demo = Demo()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                header

                Panel("Built-in catalog") {
                    A2UISurfaceView(host: demo.builtIn, surfaceId: "main")
                }

                Panel("Text and Button overridden") {
                    A2UISurfaceView(host: demo.branded, surfaceId: "main")
                }

                Panel("Rating, registered by this app") {
                    A2UISurfaceView(host: demo.branded, surfaceId: "review")
                }

                Panel("The same surface, without the catalog") {
                    A2UISurfaceView(host: demo.builtIn, surfaceId: "review")
                    DiagnosticsView(host: demo.builtIn, surfaceId: "review")
                }

                if !demo.actionLog.isEmpty {
                    Entries("Sent to the agent", entries: demo.actionLog, tint: .secondary)
                }
            }
            .padding(20)
            .frame(maxWidth: 520, alignment: .leading)
        }
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text("One surface, two catalogs")
                    .font(.headline)

                Text("Same messages on every panel. Only the catalog differs.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Button("Reset") {
                demo.reset()
            }
        }
    }
}

// MARK: - Panels

private struct Panel<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    init(_ title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title.uppercased())
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)

            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Observes the host, so a surface that fails to draw says why.
private struct DiagnosticsView: View {
    @ObservedObject var host: A2UIHost
    let surfaceId: String

    var body: some View {
        let entries = host.diagnostics.filter { $0.surfaceId == surfaceId }.map(\.description)

        if !entries.isEmpty {
            Entries("Diagnostics", entries: entries, tint: .red)
        }
    }
}

private struct Entries: View {
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
