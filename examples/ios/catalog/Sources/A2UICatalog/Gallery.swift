// The example's own state: one host, every showcase surface applied to it.
//
// A real app would send actions to its agent and apply whatever comes back. This one only
// records them, so a tap on any screen shows what the agent would have received.

import Foundation
import A2UI

final class Gallery: ObservableObject {

    /// Fresh context here, because nothing else in this app renders BindJS. An app that
    /// already did would pass its own in, so both share one runtime.
    let host = A2UIHost(locale: "en-US")

    @Published private(set) var actionLog: [String] = []

    /// What `reset` re-applies: the message array this gallery was built from.
    private let messages: String

    /// The basic-catalog showcases, every surface in one message array so the store
    /// notifies once with the final shape.
    convenience init() {
        self.init(applying: "[\(Showcase.all.map(\.message).joined(separator: ",\n"))]")
    }

    /// One message stream — a spec example's — on a host of its own.
    init(applying messages: String) {
        self.messages = messages

        host.onAction = { [weak self] action in
            self?.record(action)
        }

        host.apply(messages)
    }

    func reset() {
        actionLog = []

        host.reset()
        host.apply(messages)
    }

    private func record(_ action: A2UIAction) {
        actionLog.insert("\(action.surfaceId): \(action.name) \(action.contextJSON)", at: 0)
        actionLog = Array(actionLog.prefix(6))
    }
}
