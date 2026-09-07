// A component of the app's own, drawn from an agent's surface.
//
// `swift run` opens the window; `swift run A2UICustomCatalog --check` runs the same bridge
// headlessly and proves the custom catalog is what makes the difference.

import SwiftUI

#if canImport(AppKit)
import AppKit
#endif

@main
struct A2UICustomCatalogApp: App {

    init() {
        if CommandLine.arguments.contains("--check") {
            exit(runChecks() ? 0 : 1)
        }

        #if canImport(AppKit)
        // A SwiftPM executable is not a bundled app, so it has to ask for a window and
        // a Dock icon itself.
        NSApplication.shared.setActivationPolicy(.regular)
        NSApplication.shared.activate(ignoringOtherApps: true)
        #endif
    }

    var body: some Scene {
        WindowGroup("A2UI Custom Catalog") {
            ContentView()
        }
        .defaultSize(width: 560, height: 900)
    }
}
