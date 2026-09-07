// The example's own state: five hosts, and the messages each was given.
//
// Five contexts, and therefore five runtimes, on purpose: each host renders on its own and
// they never exchange handler ids. An app that also renders BindJS of its own would pass
// that context to one host, not all five.

import Combine
import Foundation
import A2UI

final class Demo: ObservableObject {

    /// The basic catalog, untouched.
    let builtIn = A2UIHost(locale: "en-US")

    /// The same package, told about three components before the first surface arrives.
    let branded = A2UIHost(locale: "en-US")

    /// The flight search: the basic catalog plus one type of the app's own. Nothing is
    /// overridden here, so the heading and the list are the bundled components and only
    /// `FlightCard` is new.
    let flights = A2UIHost(locale: "en-US")

    /// The sales dashboard: the basic catalog plus `Chart`, named three times on one
    /// surface for three different shapes.
    let dashboard = A2UIHost(locale: "en-US")

    /// The habitat sort: the basic catalog plus `SortBoard`, one type carrying a whole
    /// interaction.
    let habitat = A2UIHost(locale: "en-US")

    /// Every host, in the order the index lists them.
    private var hosts: [A2UIHost] {
        [builtIn, branded, flights, dashboard, habitat]
    }

    /// What the surfaces have dispatched, newest first.
    ///
    /// Recorded against the host and surface it came from, so a screen shows only its own:
    /// two of them share the `branded` host, and all of them share this object.
    @Published private(set) var actions: [LoggedAction] = []

    /// Forwards every host's changes as this object's own, so a view watching the demo
    /// sees a diagnostic appear without having to observe each host it draws.
    private var watches: [AnyCancellable] = []

    init() {
        branded.useCatalog(sources: Brand.sources, catalog: Brand.catalog)
        flights.useCatalog(sources: Flights.sources, catalog: Flights.catalog)
        dashboard.useCatalog(sources: Dashboard.sources, catalog: Dashboard.catalog)
        habitat.useCatalog(sources: Habitat.sources, catalog: Habitat.catalog)

        for host in hosts {
            // The id is captured by value: the closure is stored on the host, so holding
            // the host itself here would be a cycle.
            let hostId = ObjectIdentifier(host)

            host.onAction = { [weak self] action in
                self?.record(action, from: hostId)
            }

            watches.append(
                host.objectWillChange.sink { [weak self] _ in
                    self?.objectWillChange.send()
                }
            )
        }

        apply()
    }

    func reset() {
        actions = []

        for host in hosts {
            host.reset()
        }

        apply()
    }

    /// Each host gets the messages it is there to draw.
    private func apply() {
        builtIn.apply(Agent.messages)
        branded.apply(Agent.messages)
        flights.apply(Flights.messages)
        dashboard.apply(Dashboard.messages)
        habitat.apply(Habitat.messages)
    }

    /// Everything the surfaces on one screen have dispatched, newest first.
    func actions(from drawn: [Drawn]) -> [LoggedAction] {
        let wanted = Set(drawn.map { Key(hostId: ObjectIdentifier($0.host), surfaceId: $0.surfaceId) })

        return actions.filter { wanted.contains(Key(hostId: $0.hostId, surfaceId: $0.surfaceId)) }
    }

    private struct Key: Hashable {
        let hostId: ObjectIdentifier
        let surfaceId: String
    }

    private func record(_ action: A2UIAction, from hostId: ObjectIdentifier) {
        let entry = LoggedAction(
            hostId: hostId,
            surfaceId: action.surfaceId,
            name: action.name,
            payload: LoggedValue.pairs(of: action.context),
            at: Date()
        )

        actions.insert(entry, at: 0)
        actions = Array(actions.prefix(12))
    }
}

// MARK: - What a screen draws

/// A host and one of its surfaces. A screen's activity — what it dispatched, what it could
/// not draw — is the sum of these, so the Rating screen accounts for both of its hosts.
struct Drawn {
    let host: A2UIHost
    let surfaceId: String

    /// Everything this surface failed to draw.
    var diagnostics: [String] {
        host.diagnostics.filter { $0.surfaceId == surfaceId }.map(\.description)
    }
}

// MARK: - One dispatched action

/// What the agent would have received, kept as fields rather than a formatted string so
/// the view can lay it out.
struct LoggedAction: Identifiable {
    let id = UUID()
    let hostId: ObjectIdentifier
    let surfaceId: String
    let name: String

    /// The engine-resolved action context, a row per entry. Empty when it carried none.
    let payload: [LoggedValue]

    let at: Date
}

/// One entry of an action's context.
struct LoggedValue: Identifiable {
    let id = UUID()
    let key: String
    let value: String

    /// Sorted by key, because a dictionary has no order of its own and a log that
    /// reshuffles between entries is hard to read.
    static func pairs(of context: [String: Any]) -> [LoggedValue] {
        context
            .sorted { $0.key < $1.key }
            .map { LoggedValue(key: $0.key, value: describe($0.value)) }
    }

    private static func describe(_ value: Any) -> String {
        switch value {
        case let string as String:
            return string

        case let bool as Bool:
            return bool ? "true" : "false"

        case let number as NSNumber:
            return number.stringValue

        default:
            return String(describing: value)
        }
    }
}
