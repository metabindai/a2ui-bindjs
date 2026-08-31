// The agent's side of the conversation.
//
// Nothing here is native. It is the A2UI an agent would emit over whatever transport the
// app uses — the same bytes the browser example receives — and it is the only description
// of this screen that exists. There is no SwiftUI for the product card anywhere in this
// target.

import Foundation

enum Agent {

    // MARK: - The opening surface

    /// `createSurface`: the component graph, plus the data model it reads from.
    ///
    /// Note what is *not* here: no sizes, no colours, no fonts. A2UI names components and
    /// binds them to data; the catalog on the renderer's side decides how they look, which
    /// is why the identical message draws a web page in the playground and SwiftUI here.
    static let opening = """
    [
      {
        "version": "v1.0",
        "createSurface": {
          "surfaceId": "main",
          "components": [
            { "id": "root", "component": "Card", "child": "body" },

            { "id": "body", "component": "Column",
              "children": ["title", "price", "rule", "size", "gift", "note", "buy", "status"] },

            { "id": "title", "component": "Text", "variant": "h2",
              "text": { "path": "/product/name" } },

            { "id": "price", "component": "Text", "variant": "caption",
              "text": { "call": "formatCurrency",
                        "args": { "value": { "path": "/product/price" }, "currency": "USD" } } },

            { "id": "rule", "component": "Divider" },

            { "id": "size", "component": "ChoicePicker", "label": "Size",
              "variant": "mutuallyExclusive", "displayStyle": "chips",
              "value": { "path": "/order/size" },
              "options": [
                { "label": "S", "value": "S" },
                { "label": "M", "value": "M" },
                { "label": "L", "value": "L" }
              ] },

            { "id": "gift", "component": "CheckBox", "label": "Gift wrap (+$4)",
              "value": { "path": "/order/giftWrap" } },

            { "id": "note", "component": "TextField", "label": "Note for the courier",
              "placeholder": "Leave at the door", "value": { "path": "/order/note" } },

            { "id": "buyLabel", "component": "Text", "text": "Add to cart" },

            { "id": "buy", "component": "Button", "variant": "primary", "child": "buyLabel",
              "action": { "event": { "name": "add_to_cart",
                                     "context": { "product": { "path": "/product/name" },
                                                  "size": { "path": "/order/size" },
                                                  "giftWrap": { "path": "/order/giftWrap" },
                                                  "note": { "path": "/order/note" } } } } },

            { "id": "status", "component": "Text", "variant": "title3",
              "text": { "path": "/order/status" } }
          ],
          "dataModel": {
            "product": { "name": "Trail Runner X2", "price": 129 },
            "order": { "size": ["M"], "giftWrap": false, "note": "", "status": "" }
          }
        }
      }
    ]
    """

    // MARK: - Answering an action

    /// What a real agent would send back after handling the tap.
    ///
    /// It answers with more A2UI — here an `updateDataModel`, which repaints one bound
    /// `Text` and leaves the rest of the tree alone. The app does not know or care which
    /// part of the screen changed.
    static func reply(to name: String, context: [String: Any]) -> String? {
        guard name == "add_to_cart" else {
            return nil
        }

        let size = (context["size"] as? [String])?.first ?? "M"
        let wrapped = context["giftWrap"] as? Bool ?? false

        var confirmation = "Added size \(size) to your cart"

        if wrapped {
            confirmation += ", gift wrapped"
        }

        if let note = context["note"] as? String, !note.isEmpty {
            confirmation += " — “\(note)”"
        }

        return """
        [
          { "version": "v1.0",
            "updateDataModel": {
              "surfaceId": "main",
              "path": "/order/status",
              "value": \(JSON.string(confirmation))
            } }
        ]
        """
    }
}

// MARK: - Helpers

enum JSON {

    /// Quotes a Swift string as a JavaScript/JSON literal, escaping included.
    static func string(_ value: String) -> String {
        guard
            let data = try? JSONSerialization.data(withJSONObject: [value], options: []),
            let array = String(data: data, encoding: .utf8)
        else {
            return "\"\""
        }

        return String(array.dropFirst().dropLast())
    }
}
