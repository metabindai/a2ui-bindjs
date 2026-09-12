// The headless smoke test.
//
// The same package the window uses, with no window — so a failure can be attributed to the
// bridge before anyone looks at a layout. Run with `swift run A2UIMinimal --check`.

import Foundation
import Combine
import A2UI
import BindJS
import JavaScriptCore

func runChecks() {
    let host = A2UIHost(locale: "en-US")

    func evaluate(_ expression: String) -> String {
        host.context.javaScriptContext.evaluateScript(expression)?.toString() ?? "<nil>"
    }

    print("1. bridge          ", evaluate("typeof a2ui.render"))

    host.apply(Agent.opening)
    print("2. surfaces        ", host.surfaceIds)

    // The AST a native renderer decodes — the same shape `callComponent` returns.
    let rendered = evaluate("a2ui.renderJSON('main')")
    let boundValue = rendered.contains("Trail Runner X2")
    let calledFunction = rendered.contains("$129.00")

    print("3. rendered        ", "\(rendered.count) bytes | binding: \(boundValue) | function: \(calledFunction)")

    // A tap, delivered the way the host gets it. On its own surface, so the probe stays
    // deterministic: the demo card's first handler is a size chip, which writes to the
    // data model rather than dispatching an action.
    var delivered: [A2UIAction] = []
    host.onAction = { delivered.append($0) }
    host.apply(tapProbeSurface)

    let handlerId = evaluate("""
        (() => {
            const found = []
            JSON.stringify(JSON.parse(a2ui.renderJSON('probe')).ast, (key, value) => {
                if (key === 'handlerId') {
                    found.push(value)
                }
                return value
            })
            return found[0] ?? ''
        })()
        """)

    print("4. handlerId       ", handlerId.isEmpty ? "none" : "found")

    // Resolving it in *this* runtime instance is the whole reason the context is shared.
    host.context.javaScriptContext.evaluateScript("runtime.restoreFunction('\(handlerId)')()")
    RunLoop.main.run(until: Date().addingTimeInterval(0.3))

    print("5. action delivered", delivered.first.map { "\($0.name) \($0.contextJSON)" } ?? "NONE")

    // Two-way binding: a control writing back, and the surface repainting from it.
    host.setValue("Trail Runner X3", surfaceId: "main", path: "/product/name")
    print("6. after setValue  ", evaluate("a2ui.renderJSON('main')").contains("Trail Runner X3") ? "repainted" : "STALE")

    // The whole native path, in the shape `A2UISurfaceView` uses it: reset, build, decode.
    let view = host.context.view(id: "main") { _ in host.ast(for: "main") }

    print("7. native decode   ", view == nil ? "FAILED" : "ok")
    print("8. diagnostics     ", host.diagnostics.isEmpty ? "none" : host.diagnostics.map(\.description).joined(separator: "; "))

    // The redraw signal, all the way through. A write into the data model does not touch
    // BindJS hook state, so without this SwiftUI keeps showing the first tree it drew.
    var published = 0
    let subscription = host.objectWillChange.sink { _ in published += 1 }

    host.setValue(["S"], surfaceId: "main", path: "/order/size")
    RunLoop.main.run(until: Date().addingTimeInterval(0.3))

    print("9. host redraws    ", published > 0 ? "published" : "SILENT")
    print("10. reflects it    ", evaluate("a2ui.renderJSON('main')").contains("\"S\"") ? "yes" : "NO")

    subscription.cancel()

    // The device-locale default, which every example here overrides with "en-US" and so
    // never exercised. `Agent.opening` calls `formatCurrency`, and `Intl` throws on an ICU
    // identifier, so this renders nothing at all if the fallback stops being a BCP 47 tag.
    let deviceHost = A2UIHost()
    deviceHost.apply(Agent.opening)

    let deviceRender = deviceHost.context.javaScriptContext.evaluateScript("a2ui.renderJSON('main')")?.toString() ?? ""
    let formatted = deviceRender.contains("129")

    print("11. device locale  ", formatted ? "formats (\(Locale.current.identifier(.bcp47)))" : "THREW — check the locale tag")
    print("12. its diagnostics", deviceHost.diagnostics.isEmpty ? "none" : deviceHost.diagnostics.map(\.description).joined(separator: "; "))
}

// MARK: - Fixtures

/// One button, one action — the smallest surface that can be tapped.
private let tapProbeSurface = """
[
  { "version": "v1.0",
    "createSurface": {
      "surfaceId": "probe",
      "components": [
        { "id": "root", "component": "Button", "child": "label",
          "action": { "event": { "name": "smoke_test", "context": { "ok": true } } } },
        { "id": "label", "component": "Text", "text": "Tap" }
      ],
      "dataModel": {}
    } }
]
"""
