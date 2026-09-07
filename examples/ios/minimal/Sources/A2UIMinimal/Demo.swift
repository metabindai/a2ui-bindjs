// The example's own state: everything the package deliberately does not decide.
//
// Which surface to show, what to do with an action, what to log. A real app would send
// the action to its agent and apply whatever comes back; this one answers locally.

import Foundation
import A2UI

final class Demo: ObservableObject {

    /// Fresh context here, because nothing else in this app renders BindJS. An app that
    /// already did would pass its own in, so both share one runtime.
    let host = A2UIHost(locale: "en-US")

    @Published private(set) var actionLog: [String] = []

    init() {
        host.onAction = { [weak self] action in
            self?.handle(action)
        }

        host.apply(Agent.opening)
    }

    func reset() {
        actionLog = []

        host.reset()
        host.apply(Agent.opening)
    }

    private func handle(_ action: A2UIAction) {
        actionLog.insert("\(action.name) \(action.contextJSON)", at: 0)
        actionLog = Array(actionLog.prefix(6))

        // The agent answers with more A2UI, applied to the same surfaces.
        if let reply = Agent.reply(to: action.name, context: action.context) {
            host.apply(reply)
        }
    }
}
