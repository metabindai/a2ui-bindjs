import SwiftUI

public struct ContentAction: Decodable, Sendable {
    public let name: String
    public let props: [String: Any]

    enum CodingKeys: String, CodingKey {
        case name
        case props
    }

    public init(name: String, props: [String: Any] = [:]) {
        self.name = name
        self.props = props
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        // Decode "name"
        self.name = try container.decode(String.self, forKey: .name)

        // Decode props using AnyDecodable to Any
        let rawProps = try container
            .decodeIfPresent([String: AnyDecodable].self, forKey: .props)
            ?? [:]

        // Convert AnyDecodable to Any
        self.props = rawProps.mapValues(\.value)
    }
}
