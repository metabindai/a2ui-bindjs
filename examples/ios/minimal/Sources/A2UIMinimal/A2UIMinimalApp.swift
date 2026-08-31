// A2UI on a native host.
//
// A SwiftUI app whose only screen is described by an agent. `swift run` opens the window;
// `swift run A2UIMinimal --check` runs the same bridge headlessly and prints what it saw,
// which is the form this example took before it had a UI and is still the quickest way to
// tell a broken bundle from a broken layout.

import SwiftUI

#if canImport(AppKit)
import AppKit
#endif

@main
struct A2UIMinimalApp: App {

    init() {
        if CommandLine.arguments.contains("--check") {
            runChecks()
            exit(0)
        }

        #if canImport(AppKit)
        // A SwiftPM executable is not a bundled app, so it has to ask for a window and
        // a Dock icon itself.
        NSApplication.shared.setActivationPolicy(.regular)
        NSApplication.shared.activate(ignoringOtherApps: true)
        #endif
    }

    var body: some Scene {
        WindowGroup("A2UI Example") {
            ContentView()
        }
        .defaultSize(width: 520, height: 760)
    }
}
