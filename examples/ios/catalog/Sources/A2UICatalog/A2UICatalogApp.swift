// The basic catalog on a native host.
//
// A SwiftUI app with one screen per catalog component, each described by A2UI. `swift run`
// opens the window; `swift run A2UICatalog --check` applies every surface headlessly and
// reports the ones that fail to decode, which is the quickest way to tell a broken bundle
// from a broken layout.

import SwiftUI

#if canImport(AppKit)
import AppKit
#endif

@main
struct A2UICatalogApp: App {

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
        WindowGroup("A2UI Catalog") {
            ContentView()
        }
        .defaultSize(width: 900, height: 760)
    }
}
