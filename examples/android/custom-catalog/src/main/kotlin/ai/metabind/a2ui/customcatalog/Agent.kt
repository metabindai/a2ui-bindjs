// The agent's side of the conversation — identical to the web and iOS examples' messages.
//
// Two surfaces. The first names only basic-catalog types; the second names `Rating`,
// which the basic catalog does not have. Nothing in either says how anything looks.
package ai.metabind.a2ui.customcatalog

object Agent {

    val messages = """
    [
      { "version": "v1.0",
        "createSurface": {
          "surfaceId": "main",
          "components": [
            { "id": "root", "component": "Card", "child": "body" },
            { "id": "body", "component": "Column", "children": ["title", "blurb", "cta"] },
            { "id": "title", "component": "Text", "variant": "h2", "text": { "path": "/offer/title" } },
            { "id": "blurb", "component": "Text", "variant": "caption", "text": { "path": "/offer/blurb" } },
            { "id": "ctaLabel", "component": "Text", "text": "Claim offer" },
            { "id": "cta", "component": "Button", "variant": "primary", "child": "ctaLabel",
              "action": { "event": { "name": "claim_offer" } } }
          ],
          "dataModel": {
            "offer": { "title": "Weekend upgrade", "blurb": "Two nights, sea view, breakfast included." }
          }
        } },

      { "version": "v1.0",
        "createSurface": {
          "surfaceId": "review",
          "components": [
            { "id": "root", "component": "Card", "child": "body" },
            { "id": "body", "component": "Column", "children": ["title", "stars", "count", "send"] },
            { "id": "title", "component": "Text", "variant": "h2", "text": "Rate your stay" },
            { "id": "stars", "component": "Rating", "label": "Stars", "max": 5, "value": { "path": "/review/stars" } },
            { "id": "count", "component": "Text", "variant": "caption", "text": { "path": "/review/stars" } },
            { "id": "sendLabel", "component": "Text", "text": "Send review" },
            { "id": "send", "component": "Button", "variant": "primary", "child": "sendLabel",
              "action": { "event": { "name": "send_review", "context": { "stars": { "path": "/review/stars" } } } } }
          ],
          "dataModel": {
            "review": { "stars": 3 }
          }
        } }
    ]
    """.trimIndent()
}
