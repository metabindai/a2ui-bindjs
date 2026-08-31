// The values that cross the boundary.
//
// The bridge speaks JSON, because JavaScriptCore converts strings cheaply and
// unambiguously. These types are where that stops: a host should never have to reach into
// a dictionary to find out what the user did.

import Foundation

// MARK: - Actions

/// Something the surface dispatched, on its way to the agent.
public struct A2UIAction {
    public let name: String
    public let surfaceId: String
    public let sourceComponentId: String?
    public let timestamp: String?

    /// The action's context, resolved against the data model at the moment of the tap.
    public let context: [String: Any]

    /// The same context as JSON, which is usually what gets sent onward.
    public var contextJSON: String {
        guard
            JSONSerialization.isValidJSONObject(context),
            let data = try? JSONSerialization.data(withJSONObject: context, options: [.sortedKeys]),
            let json = String(data: data, encoding: .utf8)
        else {
            return "{}"
        }

        return json
    }

    init?(json: [String: Any]) {
        guard let name = json["name"] as? String else {
            return nil
        }

        self.name = name
        self.surfaceId = json["surfaceId"] as? String ?? ""
        self.sourceComponentId = json["sourceComponentId"] as? String
        self.timestamp = json["timestamp"] as? String
        self.context = json["context"] as? [String: Any] ?? [:]
    }
}

// MARK: - Diagnostics

/// Something the renderer could not draw, reported rather than thrown.
///
/// A2UI surfaces arrive from an agent, so a component the catalog does not know is a
/// normal event. The rest of the surface still renders.
public struct A2UIDiagnostic {
    public let surfaceId: String
    public let componentId: String?
    public let message: String

    public var description: String {
        [surfaceId, componentId, message].compactMap { $0 }.joined(separator: " · ")
    }
}

// MARK: - JSON

/// Quotes a Swift string as a JavaScript literal, escaping included.
func jsLiteral(_ value: String) -> String {
    guard
        let data = try? JSONSerialization.data(withJSONObject: [value], options: []),
        let array = String(data: data, encoding: .utf8)
    else {
        return "\"\""
    }

    return String(array.dropFirst().dropLast())
}

/// Encodes a value as a JavaScript literal, including bare numbers, strings and booleans.
func jsValue(_ value: Any) -> String {
    guard
        let data = try? JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]),
        let json = String(data: data, encoding: .utf8)
    else {
        return "null"
    }

    return json
}
