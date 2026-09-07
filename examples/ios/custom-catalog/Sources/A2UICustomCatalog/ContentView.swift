// The app's own SwiftUI — all of it.
//
// An index in two sections and a screen behind each row. Nothing here describes an offer
// card, a star, a flight, a chart or a deck of cards; that arrives as A2UI and a catalog
// draws it.

import SwiftUI
import A2UI

struct ContentView: View {
    @StateObject private var demo = Demo()

    var body: some View {
        NavigationStack {
            List {
                // Split by what the agent named, not by what the app supplied: these two
                // are types the bundled catalog already has, drawn as it ships and again
                // with `Text` and `Button` replaced.
                Section("Built-in catalog") {
                    NavigationLink("Offer card", value: Screen.offer)
                    NavigationLink("Overrides", value: Screen.overrides)
                }

                // Types the bundled catalog does not have at all.
                Section("Custom components") {
                    NavigationLink("Rating", value: Screen.rating)
                    NavigationLink("Flight search", value: Screen.flights)
                    NavigationLink("Sales dashboard", value: Screen.dashboard)
                    NavigationLink("Habitat sort", value: Screen.habitat)
                }
            }
            .navigationTitle("A2UI Custom Catalog")
            .navigationDestination(for: Screen.self) { screen in
                ScreenView(screen: screen, demo: demo)
            }
        }
    }
}

// MARK: - Index

private enum Screen: String, Hashable {
    case offer = "Offer card"
    case overrides = "Overrides"
    case rating = "Rating"
    case flights = "Flight search"
    case dashboard = "Sales dashboard"
    case habitat = "Habitat sort"
}

// MARK: - Screens

private struct ScreenView: View {
    let screen: Screen
    @ObservedObject var demo: Demo

    /// Every host and surface this screen draws. Its activity is the sum of them, so a
    /// screen reports its own work and never another's.
    private var drawn: [Drawn] {
        switch screen {
        case .offer:
            return [Drawn(host: demo.builtIn, surfaceId: "main")]

        case .overrides:
            return [Drawn(host: demo.branded, surfaceId: "main")]

        // Both hosts: the one that was told about `Rating` and the one that was not.
        case .rating:
            return [Drawn(host: demo.branded, surfaceId: "review"), Drawn(host: demo.builtIn, surfaceId: "review")]

        case .flights:
            return [Drawn(host: demo.flights, surfaceId: "flights")]

        case .dashboard:
            return [Drawn(host: demo.dashboard, surfaceId: "dashboard")]

        case .habitat:
            return [Drawn(host: demo.habitat, surfaceId: "habitat")]
        }
    }

    /// The surface the screen is chiefly about — the first it draws.
    private var subject: Drawn {
        drawn[0]
    }

    var body: some View {
        Screenful(demo: demo, title: screen.rawValue, drawn: drawn) {
            A2UISurfaceView(host: subject.host, surfaceId: subject.surfaceId)

            // The same surface on a host that was never told about `Rating`. Why it comes
            // out empty is in the sheet, with everything else the screen has to say.
            if screen == .rating {
                Panel("Without the catalog") {
                    A2UISurfaceView(host: demo.builtIn, surfaceId: "review")
                }
            }
        }
    }
}

// MARK: - Chrome

/// A screen: its surface, and a floating bar for whatever the surface has said back.
///
/// The bar is a `safeAreaInset` rather than an overlay, so the content it sits above
/// scrolls clear of it instead of underneath. Nothing is shown inline — a screen that has
/// dispatched nothing and drawn cleanly is only its surface.
private struct Screenful<Content: View>: View {
    @ObservedObject var demo: Demo
    let title: String
    let drawn: [Drawn]
    @ViewBuilder let content: Content

    @State private var showingActivity = false

    init(demo: Demo, title: String, drawn: [Drawn], @ViewBuilder content: () -> Content) {
        self.demo = demo
        self.title = title
        self.drawn = drawn
        self.content = content()
    }

    // Only `demo` is observed: it forwards every host's changes as its own, so a
    // diagnostic on any surface this screen draws reaches the bar.
    private var actions: [LoggedAction] {
        demo.actions(from: drawn)
    }

    private var diagnostics: [DiagnosticRow] {
        DiagnosticRow.rows(from: drawn)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                content
            }
            .padding(20)
            .frame(maxWidth: 520, alignment: .leading)
        }
        .safeAreaInset(edge: .bottom) {
            ActivityBar(actions: actions.count, diagnostics: diagnostics.count) {
                showingActivity = true
            }
            .animation(.spring(duration: 0.3), value: actions.count)
            .animation(.spring(duration: 0.3), value: diagnostics.count)
        }
        .navigationTitle(title)
        .toolbar {
            Button("Reset") {
                demo.reset()
            }
        }
        .sheet(isPresented: $showingActivity) {
            ActivitySheet(actions: actions, diagnostics: diagnostics)
        }
    }
}

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

// MARK: - The floating bar

/// Counts what the surface has said back, and nothing at all when it has said nothing.
private struct ActivityBar: View {
    let actions: Int
    let diagnostics: Int
    let open: () -> Void

    var body: some View {
        if actions > 0 || diagnostics > 0 {
            Button(action: open) {
                HStack(spacing: 8) {
                    if actions > 0 {
                        Text(counted(actions, "Action"))
                    }

                    if actions > 0 && diagnostics > 0 {
                        Text("·")
                            .foregroundStyle(.tertiary)
                    }

                    if diagnostics > 0 {
                        Text(counted(diagnostics, "Diagnostic"))
                            .foregroundStyle(.red)
                    }

                    Image(systemName: "chevron.up")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, 20)
                .padding(.vertical, 13)
                .glassCapsule()
            }
            .buttonStyle(.plain)
            .padding(.bottom, 16)
            .transition(.move(edge: .bottom).combined(with: .opacity))
        }
    }

    private func counted(_ count: Int, _ noun: String) -> String {
        "\(count) \(noun)\(count == 1 ? "" : "s")"
    }
}

// MARK: - Glass

/// Liquid Glass where the OS has it, a frosted capsule everywhere else.
///
/// `#available` alone is not enough. `glassEffect` has to exist in the SDK being compiled
/// against, and this example is meant to open and build on whatever Xcode is to hand — so
/// the compiler check is what keeps an older one working, and the availability check is
/// what keeps the iOS 17 deployment target honest.
private struct GlassCapsule: ViewModifier {

    @ViewBuilder
    func body(content: Content) -> some View {
        #if compiler(>=6.2)
        if #available(iOS 26.0, macOS 26.0, *) {
            // Liquid Glass draws its own shadow and edge — anything added here fights it.
            content.glassEffect(.regular.interactive(), in: .capsule)
        } else {
            content.modifier(FrostedCapsule())
        }
        #else
        content.modifier(FrostedCapsule())
        #endif
    }
}

/// The pre-26 look: a material capsule that has to supply its own edge and shadow.
private struct FrostedCapsule: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial, in: Capsule())
            .overlay(Capsule().strokeBorder(Color.primary.opacity(0.08)))
            .shadow(color: .black.opacity(0.14), radius: 12, y: 8)
    }
}

private extension View {
    func glassCapsule() -> some View {
        modifier(GlassCapsule())
    }
}

/// The two lists, out of the surface's way until asked for.
///
/// A plain grouped `List`, because the system already draws exactly this — sectioned rows
/// with a label on the left and its value on the right. Nothing here is worth inventing.
private struct ActivitySheet: View {
    let actions: [LoggedAction]
    let diagnostics: [DiagnosticRow]

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                if !diagnostics.isEmpty {
                    Section("Diagnostics") {
                        ForEach(diagnostics) { entry in
                            Text(entry.message)
                                .font(.caption)
                                .monospaced()
                                .foregroundStyle(.red)
                                .textSelection(.enabled)
                        }
                    }
                }

                if !actions.isEmpty {
                    Section("Actions") {
                        ForEach(actions) { entry in
                            ActionRow(entry: entry)
                        }
                    }
                }
            }
            .navigationTitle("Activity")
            #if os(iOS)
            .listStyle(.insetGrouped)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                Button("Done") {
                    dismiss()
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - One action

/// The action's name and when it was sent, then its resolved context as `LabeledContent`
/// — which is what puts the key on the left and the value on the right.
private struct ActionRow: View {
    let entry: LoggedAction

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(entry.name)
                    .font(.subheadline.weight(.semibold))

                Spacer(minLength: 0)

                Text(entry.at, format: .dateTime.hour().minute().second())
                    .font(.caption2)
                    .monospacedDigit()
                    .foregroundStyle(.tertiary)
            }

            ForEach(entry.payload) { value in
                LabeledContent(value.key) {
                    Text(value.value)
                        .monospaced()
                        .textSelection(.enabled)
                }
                .font(.caption)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Diagnostics

/// A diagnostic given an identity, so it can sit in a `ForEach`.
private struct DiagnosticRow: Identifiable {
    let id: Int
    let message: String

    static func rows(from drawn: [Drawn]) -> [DiagnosticRow] {
        drawn
            .flatMap(\.diagnostics)
            .enumerated()
            .map { DiagnosticRow(id: $0.offset, message: $0.element) }
    }
}
