import Foundation
import JavaScriptCore

extension JSValue {
    /// Converts JSValue directly to Directive. Handles Infinity/NaN naturally.
    func toDirective() -> Directive? {
        guard let obj = toObject() else { return nil }
        return convertToDirective(obj)
    }

    /// Recursively converts Any value to Directive
    private func convertToDirective(_ value: Any) -> Directive? {
        guard let dict = value as? [String: Any],
              let type = dict["type"] as? String else {
            return nil
        }

        // Get props object (might not exist)
        let propsDict = dict["props"] as? [String: Any] ?? [:]

        // Process props recursively
        var processedProps: [String: Any] = [:]
        for (key, val) in propsDict {
            if key == "children" {
                // Skip - we handle children separately
                continue
            }
            processedProps[key] = processValue(val)
        }

        // Extract children
        let children = extractChildren(from: propsDict["children"])

        return Directive(type: type, props: processedProps, children: children)
    }

    /// Processes any value - converts nested Directives, arrays, dicts recursively
    private func processValue(_ value: Any) -> Any {
        // Try as Directive
        if let dict = value as? [String: Any], dict["type"] is String {
            if let directive = convertToDirective(dict) {
                return directive
            }
        }

        // Try as array
        if let array = value as? [Any] {
            return array.map { processValue($0) }
        }

        // Try as nested dict
        if let dict = value as? [String: Any] {
            var result: [String: Any] = [:]
            for (k, v) in dict {
                result[k] = processValue(v)
            }
            return result
        }

        // Primitive - return as-is (handles Infinity, NaN, strings, numbers, etc.)
        return value
    }

    /// Extracts children from props["children"]
    private func extractChildren(from value: Any?) -> [Directive] {
        guard let value = value else { return [] }

        // Array of children
        if let array = value as? [Any] {
            return array.compactMap { convertToDirective($0) }
        }

        // Single child
        if let directive = convertToDirective(value) {
            return [directive]
        }

        return []
    }
}
