// The example's own state: two hosts, the same messages.
//
// Two contexts, and therefore two runtimes, on purpose: each host renders on its own and
// they never exchange handler ids. An app that also renders BindJS of its own would pass
// that context to one host, not both.

import Foundation
import A2UI

final class Demo: ObservableObject {

    /// The basic catalog, untouched.
    let builtIn = A2UIHost(locale: "en-US")

    /// The same package, told about three components before the first surface arrives.
    let branded = A2UIHost(locale: "en-US")

    @Published private(set) var actionLog: [String] = []

    init() {
        branded.useCatalog(sources: Brand.sources, catalog: Brand.catalog)

        for host in [builtIn, branded] {
            host.onAction = { [weak self] action in
                self?.record(action)
            }

            host.apply(Agent.messages)
        }
    }

    func reset() {
        actionLog = []

        for host in [builtIn, branded] {
            host.reset()
            host.apply(Agent.messages)
        }
    }

    private func record(_ action: A2UIAction) {
        actionLog.insert("\(action.name) \(action.contextJSON)", at: 0)
        actionLog = Array(actionLog.prefix(6))
    }
}
