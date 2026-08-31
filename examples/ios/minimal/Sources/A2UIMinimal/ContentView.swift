// The app's own SwiftUI — all of it.
//
// Everything outside `A2UISurfaceView` is chrome: a title, a reset button, a log. The
// product card has no SwiftUI here at all; it arrives as A2UI and the catalog draws it.

import SwiftUI
import A2UI

struct ContentView: View {
    @StateObject private var demo = Demo()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                A2UISurfaceView(host: demo.host)

                DiagnosticsView(host: demo.host)

                if !demo.actionLog.isEmpty {
                    Section("Sent to the agent", entries: demo.actionLog, tint: .secondary)
                }
            }
            .padding(20)
            .frame(maxWidth: 520, alignment: .leading)
        }
    }

    // MARK: - Chrome

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text("A2UI on BindJS")
                    .font(.headline)

                Text("The card below is agent-authored — no SwiftUI describes it.")
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

/// Observes the host, so a surface that fails to draw says why.
private struct DiagnosticsView: View {
    @ObservedObject var host: A2UIHost

    var body: some View {
        if !host.diagnostics.isEmpty {
            Section("Diagnostics", entries: host.diagnostics.map(\.description), tint: .red)
        }
    }
}

private struct Section: View {
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
