// The agent's side of the conversation.
//
// Nothing here is native. It is the A2UI an agent would emit over whatever transport the
// app uses — the same bytes the browser and iOS examples receive — and it is the only
// description of this screen that exists. There is no Compose for the product card
// anywhere in this module.

package ai.metabind.a2ui.minimal

import org.json.JSONArray

object Agent {

    /**
     * `createSurface`: the component graph, plus the data model it reads from.
     *
     * Note what is *not* here: no sizes, no colours, no fonts. A2UI names components and
     * binds them to data; the catalog on the renderer's side decides how they look, which
     * is why the identical message draws a web page in the playground, SwiftUI on iOS and
     * Compose here.
     */
    val opening = """
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
    """.trimIndent()

    /**
     * What a real agent would send back after handling the tap.
     *
     * It answers with more A2UI — here an `updateDataModel`, which repaints one bound
     * `Text` and leaves the rest of the tree alone. The app does not know or care which
     * part of the screen changed.
     */
    fun reply(name: String, context: Map<String, Any?>): String? {
        if (name != "add_to_cart") {
            return null
        }

        val size = (context["size"] as? List<*>)?.firstOrNull()?.toString() ?: "M"
        val wrapped = context["giftWrap"] as? Boolean ?: false
        val note = context["note"] as? String

        var confirmation = "Added size $size to your cart"

        if (wrapped) {
            confirmation += ", gift wrapped"
        }

        if (!note.isNullOrEmpty()) {
            confirmation += " — “$note”"
        }

        return """
        [
          { "version": "v1.0",
            "updateDataModel": {
              "surfaceId": "main",
              "path": "/order/status",
              "value": ${quote(confirmation)}
            } }
        ]
        """.trimIndent()
    }

    /** Quotes a string as a JSON literal, escaping included. */
    private fun quote(value: String): String = JSONArray().put(value).toString().let { it.substring(1, it.length - 1) }
}
