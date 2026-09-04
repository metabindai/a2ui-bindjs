// The headless check.
//
// Proves the catalog is what makes the difference, with no window: the host without it
// cannot draw `Rating`, the host with it can, and a tap on a star writes through to the
// data model. Run with `swift run A2UICustomCatalog --check`.

import Foundation
import A2UI

func runChecks() -> Bool {
    var failures = 0

    func report(_ step: String, _ ok: Bool, _ detail: String) {
        print(step.padding(toLength: 22, withPad: " ", startingAt: 0), ok ? detail : "FAILED: \(detail)")

        if !ok {
            failures += 1
        }
    }

    func render(_ host: A2UIHost, _ surfaceId: String) -> String {
        host.context.javaScriptContext.evaluateScript("a2ui.renderJSON('\(surfaceId)')")?.toString() ?? ""
    }

    // Without the catalog: the offer card draws, the review card cannot.
    let builtIn = A2UIHost(locale: "en-US")
    builtIn.apply(Agent.messages)

    let unknown = builtIn.diagnostics.filter { $0.surfaceId == "review" }
    report("1. main, built-in", builtIn.diagnostics.filter { $0.surfaceId == "main" }.isEmpty, "no diagnostics")
    report("2. review, built-in", unknown.contains { $0.message.contains("Rating") }, "Rating reported unknown")

    // With it: three sources, three entries, before the first surface arrives.
    let branded = A2UIHost(locale: "en-US")
    branded.useCatalog(sources: Brand.sources, catalog: Brand.catalog)
    branded.apply(Agent.messages)

    let review = render(branded, "review")
    let filled = review.components(separatedBy: "★").count - 1

    report("3. review, branded", branded.diagnostics.isEmpty, "no diagnostics")
    report("4. stars drawn", filled == 3, "\(filled) filled of 5")
    // `Color('#5b21b6')` crosses the bridge as channels, not as the hex it was written as.
    report("5. override applied", render(branded, "main").contains("\"r\":91,\"g\":33,\"b\":182"), "brand colour in the AST")

    // The engine-injected writer: a tap on the fifth star, as the control would do it.
    branded.setValue(5, surfaceId: "review", path: "/review/stars")
    let after = render(branded, "review").components(separatedBy: "★").count - 1

    report("6. after setValue", after == 5, "\(after) filled of 5")

    // The whole native path, the way `A2UISurfaceView` takes it.
    let view = branded.context.view(id: "review") { _ in branded.ast(for: "review") }
    report("7. native decode", view != nil, "ok")

    print(failures == 0 ? "all checks ok" : "\(failures) check(s) failed")

    return failures == 0
}
