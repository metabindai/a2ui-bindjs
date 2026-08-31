import Foundation

public struct Directive {
    public let type: String
    public let props: [String: Any]
    public let children: [Directive]
    
    public init(type: String, props: [String : Any] = [:], children: [Directive] = []) {
        self.type = type
        self.props = props
        self.children = children
    }
}

extension Directive {
    
    subscript<T: ParsableArgument>(name: String) -> T? {
        if let value = props[name] {
            if let value = value as? T {
                return value
            } else if let convertedValue = T(rawValue: String(describing: value)) {
                return convertedValue
            }
        }
        return nil
    }
    
    subscript(name: String) -> Directive? {
        if let value = props[name] as? Directive {
            return value
        }
        return nil
    }
    
    subscript(name: String) -> [Directive] {
        if let value = props[name] as? [Directive] {
            return value
        }
        return []
    }
    
    subscript(name: String) -> [String: Any]? {
        if let value = props[name] as? [String: Any] {
            return value
        }
        return nil
    }
    
    func rawValue<T: ParsableArgument>() -> T? {
        self["rawValue"]
    }
    
    func rawValue() -> Directive? {
       self["rawValue"]
    }
    
    func rawValue() -> [Directive] {
        self["rawValue"]
    }
}

extension Directive: Decodable {

    enum CodingKeys: String, CodingKey {
        case type, props
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        // 1️⃣ Decode the “type” field
        type = try container.decode(String.self, forKey: .type)

        // 2️⃣ Decode raw props via AnyDecodable
        let rawProps = try container
            .decodeIfPresent([String: AnyDecodable].self, forKey: .props)
            ?? [:]
        var propsMap = rawProps.mapValues(\.value)

        // 3️⃣ Pull out “children” from props (if any)
        let children: [Directive]
        if let rawChildren = propsMap["children"] as? [Any] {
            children = rawChildren.compactMap { $0 as? Directive }
        } else {
            children = []
        }

        // 4️⃣ Remove “children” key so it doesn’t end up in props
        propsMap.removeValue(forKey: "children")

        self.props = propsMap
        self.children = children
    }
}

struct AnyDecodable: Decodable {
    let value: Any

    init(from decoder: Decoder) throws {
        // 1️⃣ If it looks like a Directive, decode as one
        if let container = try? decoder.container(keyedBy: Directive.CodingKeys.self),
           let t = try? container.decode(String.self, forKey: .type)
        {
            let rawProps = try container
                .decodeIfPresent([String: AnyDecodable].self, forKey: .props)
                ?? [:]
            let propsMap = rawProps.mapValues(\.value)

            let children: [Directive]
            if let rawChildren = propsMap["children"] as? [Any] {
                children = rawChildren.compactMap { $0 as? Directive }
            } else {
                children = []
            }

            // strip out “children” so props is only real props
            let cleanProps = propsMap.filter { $0.key != "children" }
            value = Directive(type: t, props: cleanProps, children: children)
            return
        }

        // 2️⃣ Fallback: primitives, arrays, or dictionaries
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            value = NSNull()
        } else if let b = try? container.decode(Bool.self) {
            value = b
        } else if let d = try? container.decode(Double.self) {
            value = d
        } else if let s = try? container.decode(String.self) {
            value = s
        } else if let arr = try? container.decode([AnyDecodable].self) {
            value = arr.map(\.value)
        } else if let dict = try? container.decode([String: AnyDecodable].self) {
            value = dict.mapValues(\.value)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unsupported JSON type"
            )
        }
    }
}

extension Directive: CustomStringConvertible {
    public var description: String {
        var lines = ["↳ Directive(type: “\(type)”)"]
        if !props.isEmpty {
            lines.append("  Props:")
            for (k,v) in props {
                lines.append("    • \(k): \(v)")
            }
        }
        if !children.isEmpty {
            lines.append("  Children:")
            for child in children {
                let childLines = child.description
                    .split(separator: "\n")
                    .map { "    " + $0 }
                lines.append(contentsOf: childLines)
            }
        }
        return lines.joined(separator: "\n")
    }
}
