// The headless check.
//
// Applies every showcase surface to a host with no window, then asks each to decode the
// way `A2UISurfaceView` would. A surface that produces no view or a diagnostic is a
// failure, and the process exits non-zero so CI notices. Run with
// `swift run A2UICatalog --check`.

import Foundation
import A2UI

func runChecks() -> Bool {
    let host = A2UIHost(locale: "en-US")
    var failures = 0

    host.apply("[\(Showcase.all.map(\.message).joined(separator: ","))]")

    for showcase in Showcase.all {
        let view = host.context.view(id: showcase.id) { _ in host.ast(for: showcase.id) }
        let diagnostics = host.diagnostics.filter { $0.surfaceId == showcase.id }

        var verdict = "ok"

        if view == nil {
            verdict = "FAILED to decode"
            failures += 1
        } else if !diagnostics.isEmpty {
            verdict = diagnostics.map(\.description).joined(separator: "; ")
            failures += 1
        }

        print(showcase.title.padding(toLength: 14, withPad: " ", startingAt: 0), verdict)
    }

    // The A2UI project's examples, each on a host of its own so message streams that
    // build a surface up over several messages land on a clean store.
    for showcase in Showcase.spec + Showcase.spec09 {
        let own = A2UIHost(locale: "en-US")
        own.apply(showcase.message)

        var verdict = "ok"

        if own.surfaceIds.isEmpty {
            verdict = "FAILED: no surface"
            failures += 1
        } else if !own.diagnostics.isEmpty {
            verdict = "FAILED: " + own.diagnostics.map(\.description).joined(separator: "; ")
            failures += 1
        } else {
            for surfaceId in own.surfaceIds where own.context.view(id: surfaceId, buildingAST: { _ in own.ast(for: surfaceId) }) == nil {
                verdict = "FAILED to decode \(surfaceId)"
                failures += 1
            }
        }

        let label = (showcase.group == .spec09 ? "v0.9 " : "v1.0 ") + showcase.title

        print(label.padding(toLength: 34, withPad: " ", startingAt: 0), verdict)
    }

    let total = Showcase.all.count + Showcase.spec.count + Showcase.spec09.count

    print(failures == 0 ? "all \(total) surfaces ok" : "\(failures) surface(s) failed")

    return failures == 0
}
