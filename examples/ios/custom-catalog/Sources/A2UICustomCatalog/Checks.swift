// The headless check.
//
// Proves the catalog is what makes the difference, with no window: the host without it
// cannot draw `Rating`, the host with it can, and a tap on a star writes through to the
// data model. The flight search then does the same for a type carrying state of its own.
// Run with `swift run A2UICustomCatalog --check`.

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

    // The flight search: one type of the app's own, templated over three rows.
    let flights = A2UIHost(locale: "en-US")
    flights.useCatalog(sources: Flights.sources, catalog: Flights.catalog)
    flights.apply(Flights.messages)

    let surface = render(flights, "flights")

    report("8. flights", flights.diagnostics.isEmpty, "no diagnostics")
    report("9. rows bound", surface.contains("\"count\":3"), "a ForEach over 3 rows")

    // A card outside a template, so its body is expanded into the tree rather than left
    // to the row callback. Everything below reads it.
    let single = A2UIHost(locale: "en-US")
    single.useCatalog(sources: Flights.sources, catalog: Flights.catalog)
    single.apply(Flights.singleCard)

    // `Color('#f59e0b')` crosses the bridge as channels, not as the hex it was written
    // as, so the status dot is checked by the colour it ended up with.
    let card = render(single, "one")
    let amber = card.contains("\"r\":245,\"g\":158,\"b\":11")
    let drawn = card.contains("United Airlines") && card.contains("$289") && amber

    report("10. card draws", drawn, "airline, price, and Delayed's colour")

    // The type is the app's. A host that never registered it has no such component.
    let plain = A2UIHost(locale: "en-US")
    let known = { (host: A2UIHost) in
        host.context.javaScriptContext.evaluateScript("typeof runtime.components['FlightCard']")?.toString()
    }

    report("11. registered by us", known(plain) == "undefined" && known(flights) == "string", "only on the host that asked")

    // The whole native path again, this time over a list the rows are built lazily into.
    let flightsView = flights.context.view(id: "flights") { _ in flights.ast(for: "flights") }
    report("12. native decode", flightsView != nil, "ok")

    // The dashboard: one A2UI type, three chart shapes, over three lists.
    let dashboard = A2UIHost(locale: "en-US")
    dashboard.useCatalog(sources: Dashboard.sources, catalog: Dashboard.catalog)
    dashboard.apply(Dashboard.messages)

    let charts = render(dashboard, "dashboard")
    let shapes = charts.contains("BarMark") && charts.contains("LineMark") && charts.contains("PieSliceMark")

    report("13. dashboard", dashboard.diagnostics.isEmpty, "no diagnostics")
    report("14. three shapes", shapes, "bar, line and pie marks from one type")
    // `formatCurrency` is the engine's, applied before the surface is built; the chart
    // formats its own readout separately.
    report("15. engine formatting", charts.contains("708,550"), "the total came through formatCurrency")

    // The board: a type whose whole point is state the data model does not hold.
    let habitat = A2UIHost(locale: "en-US")
    habitat.useCatalog(sources: Habitat.sources, catalog: Habitat.catalog)
    habitat.apply(Habitat.messages)

    let board = render(habitat, "habitat")
    let bins = ["Ocean", "Savanna", "Arctic"].allSatisfy { board.contains($0) }

    report("16. habitat", habitat.diagnostics.isEmpty && bins, "three bins drawn")
    report("17. deck dealt", board.contains("1 of 9"), "nine cards, one face-up")

    print(failures == 0 ? "all checks ok" : "\(failures) check(s) failed")

    return failures == 0
}
