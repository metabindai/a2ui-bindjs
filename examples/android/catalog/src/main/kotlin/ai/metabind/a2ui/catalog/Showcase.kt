// The agent's side of the conversation, one surface per catalog component.
//
// Nothing here is native. Each entry is the `createSurface` an agent would emit, with the
// data model it binds to — the same bytes the web playground and the iOS catalog example
// receive — and it is the only description of that screen that exists.
package ai.metabind.a2ui.catalog

import android.content.Context
import org.json.JSONObject

/** Which corpus a screen belongs to; also the three rows of the menu. */
enum class Group(val title: String, val detail: String) {
    BASIC("Basic catalog", "One screen per component, written here"),
    SPEC09("A2UI v0.9 examples", "What every upstream gallery shows"),
    SPEC("A2UI v1.0 examples", "The spec's own 43 surfaces"),
}

data class Showcase(
    /** The menu selection. For [Group.BASIC] it is also the surface id. */
    val id: String,
    val title: String,
    val summary: String,
    val group: Group,
    /** The message stream, as a JSON array — some spec examples build a surface up over several. */
    val messages: String,
)

object Showcases {

    /** In catalog order, which is the order the spec lists them. Lazy: the entries are
     *  declared below, and an object initialises top to bottom. */
    val basic: List<Showcase> by lazy {
        listOf(
        text, image, icon, video, audioPlayer,
        row, column, list, card, tabs, modal, divider,
        button, textField, checkBox, choicePicker, slider, dateTimeInput,
        )
    }

    /**
     * The A2UI project's own examples, read from the assets the build copied out of
     * `vendor/spec/`. v1.0 is the corpus the conformance suite renders; v0.9 is what every
     * upstream renderer, gallery and demo still shows. Both render through the same
     * catalog: the engine answers to either catalog id.
     */
    fun spec(context: Context, group: Group): List<Showcase> {
        val folder = "a2ui-spec-examples/" + if (group == Group.SPEC) "v1_0" else "v0_9"
        val prefix = if (group == Group.SPEC) "spec-" else "spec09-"
        val assets = context.assets

        return assets.list(folder).orEmpty().filter { it.endsWith(".json") }.sorted().map { file ->
            val document = JSONObject(assets.open("$folder/$file").bufferedReader().use { it.readText() })
            val name = file.removeSuffix(".json")

            Showcase(
                id = prefix + name,
                title = document.optString("name", name),
                summary = document.optString("description", ""),
                group = group,
                messages = document.optJSONArray("messages")?.toString() ?: "[]",
            )
        }
    }

    /** Wraps a component array and data model as one versioned `createSurface`, in an array. */
    private fun surface(id: String, components: String, dataModel: String = "{}"): String = """
        [{ "version": "v1.0",
          "createSurface": {
            "surfaceId": "$id",
            "components": [$components],
            "dataModel": $dataModel
          } }]
    """.trimIndent()

    private fun basic(id: String, title: String, summary: String, components: String, dataModel: String = "{}") =
        Showcase(id, title, summary, Group.BASIC, surface(id, components, dataModel))

    // MARK: - Content

    private val text = basic(
        "text", "Text",
        "Every variant, plus inline Markdown. The spec defines body and caption; h1–h5 are honoured because agents write them.",
        """
        { "id": "root", "component": "Column", "children": ["h1", "h2", "h3", "h4", "h5", "body", "caption", "md"] },
        { "id": "h1", "component": "Text", "variant": "h1", "text": "Heading one" },
        { "id": "h2", "component": "Text", "variant": "h2", "text": "Heading two" },
        { "id": "h3", "component": "Text", "variant": "h3", "text": "Heading three" },
        { "id": "h4", "component": "Text", "variant": "h4", "text": "Heading four" },
        { "id": "h5", "component": "Text", "variant": "h5", "text": "Heading five" },
        { "id": "body", "component": "Text",
          "text": "Body is the default variant. The quick brown fox jumps over the lazy dog, and keeps going long enough to wrap." },
        { "id": "caption", "component": "Text", "variant": "caption", "text": "Caption — updated 5 minutes ago" },
        { "id": "md", "component": "Text", "text": "Markdown: **bold**, _italic_ and [a link](https://a2ui.org)." }
        """,
    )

    private val image = basic(
        "image", "Image",
        "The spec's six variants. An avatar is round, a header always fills its band, an icon is a 24-point square.",
        """
        { "id": "root", "component": "Column",
          "children": ["headerCaption", "header", "avatarRow", "mediumCaption", "medium", "smallCaption", "small"] },
        { "id": "headerCaption", "component": "Text", "variant": "caption", "text": "header" },
        { "id": "header", "component": "Image", "variant": "header", "url": "https://picsum.photos/seed/a2ui-header/1200/400", "description": "A wide landscape" },
        { "id": "avatarRow", "component": "Row", "align": "center", "children": ["avatar", "avatarCaption", "iconImage", "iconCaption"] },
        { "id": "avatar", "component": "Image", "variant": "avatar", "url": "https://picsum.photos/seed/a2ui-avatar/200", "description": "Profile photo" },
        { "id": "avatarCaption", "component": "Text", "variant": "caption", "text": "avatar" },
        { "id": "iconImage", "component": "Image", "variant": "icon", "url": "https://picsum.photos/seed/a2ui-icon/64" },
        { "id": "iconCaption", "component": "Text", "variant": "caption", "text": "icon" },
        { "id": "mediumCaption", "component": "Text", "variant": "caption", "text": "mediumFeature, fit: contain" },
        { "id": "medium", "component": "Image", "variant": "mediumFeature", "fit": "contain", "url": "https://picsum.photos/seed/a2ui-medium/600/400" },
        { "id": "smallCaption", "component": "Text", "variant": "caption", "text": "smallFeature" },
        { "id": "small", "component": "Image", "variant": "smallFeature", "url": "https://picsum.photos/seed/a2ui-small/300" }
        """,
    )

    private val icon = basic(
        "icon", "Icon",
        "The spec's platform-neutral names, drawn as the platform's symbols, and one icon given as SVG path data.",
        """
        { "id": "root", "component": "Column", "children": ["named", "labels", "pathCaption", "pathRow"] },
        { "id": "named", "component": "Row", "justify": "spaceEvenly",
          "children": ["cart", "favorite", "search", "settings", "warning", "send"] },
        { "id": "cart", "component": "Icon", "name": "shoppingCart" },
        { "id": "favorite", "component": "Icon", "name": "favorite" },
        { "id": "search", "component": "Icon", "name": "search" },
        { "id": "settings", "component": "Icon", "name": "settings" },
        { "id": "warning", "component": "Icon", "name": "warning" },
        { "id": "send", "component": "Icon", "name": "send" },
        { "id": "labels", "component": "Text", "variant": "caption",
          "text": "shoppingCart · favorite · search · settings · warning · send" },
        { "id": "pathCaption", "component": "Text", "variant": "caption", "text": "{ svgPath } — a triangle on a 24×24 canvas" },
        { "id": "pathRow", "component": "Row", "children": ["path"] },
        { "id": "path", "component": "Icon", "name": { "svgPath": "M12 2L2 22h20L12 2z" } }
        """,
    )

    private val video = basic(
        "video", "Video",
        "A player with the platform's controls. posterUrl reaches it as the poster frame.",
        """
        { "id": "root", "component": "Video",
          "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          "posterUrl": "https://picsum.photos/seed/a2ui-poster/600/340",
          "description": "Big Buck Bunny" }
        """,
    )

    private val audioPlayer = basic(
        "audio", "AudioPlayer",
        "Audio over the same player, kept short so it reads as a control strip.",
        """
        { "id": "root", "component": "AudioPlayer",
          "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          "description": "SoundHelix — Song 1" }
        """,
    )

    // MARK: - Layout

    private val row = basic(
        "row", "Row",
        "Every justify value the spec allows, three children each. spaceAround draws as spaceEvenly.",
        """
        { "id": "root", "component": "Column",
          "children": ["c1", "r1", "c2", "r2", "c3", "r3", "c4", "r4", "c5", "r5", "c6", "r6"] },
        { "id": "c1", "component": "Text", "variant": "caption", "text": "start" },
        { "id": "r1", "component": "Row", "justify": "start", "children": ["a1", "b1", "d1"] },
        { "id": "a1", "component": "Text", "text": "One" }, { "id": "b1", "component": "Text", "text": "Two" }, { "id": "d1", "component": "Text", "text": "Three" },
        { "id": "c2", "component": "Text", "variant": "caption", "text": "center" },
        { "id": "r2", "component": "Row", "justify": "center", "children": ["a2", "b2", "d2"] },
        { "id": "a2", "component": "Text", "text": "One" }, { "id": "b2", "component": "Text", "text": "Two" }, { "id": "d2", "component": "Text", "text": "Three" },
        { "id": "c3", "component": "Text", "variant": "caption", "text": "end" },
        { "id": "r3", "component": "Row", "justify": "end", "children": ["a3", "b3", "d3"] },
        { "id": "a3", "component": "Text", "text": "One" }, { "id": "b3", "component": "Text", "text": "Two" }, { "id": "d3", "component": "Text", "text": "Three" },
        { "id": "c4", "component": "Text", "variant": "caption", "text": "spaceBetween" },
        { "id": "r4", "component": "Row", "justify": "spaceBetween", "children": ["a4", "b4", "d4"] },
        { "id": "a4", "component": "Text", "text": "One" }, { "id": "b4", "component": "Text", "text": "Two" }, { "id": "d4", "component": "Text", "text": "Three" },
        { "id": "c5", "component": "Text", "variant": "caption", "text": "spaceEvenly" },
        { "id": "r5", "component": "Row", "justify": "spaceEvenly", "children": ["a5", "b5", "d5"] },
        { "id": "a5", "component": "Text", "text": "One" }, { "id": "b5", "component": "Text", "text": "Two" }, { "id": "d5", "component": "Text", "text": "Three" },
        { "id": "c6", "component": "Text", "variant": "caption", "text": "weight 1 : 2, as buttons so the widths show" },
        { "id": "r6", "component": "Row", "children": ["w1", "w2"] },
        { "id": "w1", "component": "Button", "weight": 1, "child": "w1l", "action": { "event": { "name": "weight_one" } } },
        { "id": "w1l", "component": "Text", "text": "One" },
        { "id": "w2", "component": "Button", "weight": 2, "variant": "primary", "child": "w2l", "action": { "event": { "name": "weight_two" } } },
        { "id": "w2l", "component": "Text", "text": "Two" }
        """,
    )

    private val column = basic(
        "column", "Column",
        "align across the column's width: start, center and end.",
        """
        { "id": "root", "component": "Column", "children": ["c1", "k1", "rule1", "c2", "k2", "rule2", "c3", "k3"] },
        { "id": "c1", "component": "Text", "variant": "caption", "text": "align: start" },
        { "id": "k1", "component": "Column", "align": "start", "children": ["a1", "b1"] },
        { "id": "a1", "component": "Text", "text": "First line" }, { "id": "b1", "component": "Text", "text": "A longer second line" },
        { "id": "rule1", "component": "Divider" },
        { "id": "c2", "component": "Text", "variant": "caption", "text": "align: center" },
        { "id": "k2", "component": "Column", "align": "center", "children": ["a2", "b2"] },
        { "id": "a2", "component": "Text", "text": "First line" }, { "id": "b2", "component": "Text", "text": "A longer second line" },
        { "id": "rule2", "component": "Divider" },
        { "id": "c3", "component": "Text", "variant": "caption", "text": "align: end" },
        { "id": "k3", "component": "Column", "align": "end", "children": ["a3", "b3"] },
        { "id": "a3", "component": "Text", "text": "First line" }, { "id": "b3", "component": "Text", "text": "A longer second line" }
        """,
    )

    private val list = basic(
        "list", "List",
        "Template children generated from a data list, vertically and horizontally. Rows build lazily.",
        """
        { "id": "root", "component": "Column", "children": ["vCaption", "vertical", "hCaption", "horizontal"] },
        { "id": "vCaption", "component": "Text", "variant": "caption", "text": "vertical, from /trails" },
        { "id": "vertical", "component": "List", "children": { "path": "/trails", "componentId": "trail" } },
        { "id": "trail", "component": "Card", "child": "trailBody" },
        { "id": "trailBody", "component": "Column", "children": ["trailName", "trailMeta"] },
        { "id": "trailName", "component": "Text", "variant": "h4", "text": { "path": "name" } },
        { "id": "trailMeta", "component": "Text", "variant": "caption", "text": { "path": "length" } },
        { "id": "hCaption", "component": "Text", "variant": "caption", "text": "horizontal, from /tags" },
        { "id": "horizontal", "component": "List", "direction": "horizontal", "children": { "path": "/tags", "componentId": "tag" } },
        { "id": "tag", "component": "Text", "text": { "path": "" } }
        """,
        """
        { "trails": [
            { "name": "Ridge loop", "length": "7.2 km · 340 m up" },
            { "name": "River flats", "length": "4.1 km · flat" },
            { "name": "Summit push", "length": "12.8 km · 910 m up" } ],
          "tags": ["easy", "scenic", "dogs ok", "steep", "shaded"] }
        """,
    )

    private val card = basic(
        "card", "Card",
        "An elevated container for a single child.",
        """
        { "id": "root", "component": "Card", "child": "body" },
        { "id": "body", "component": "Column", "children": ["title", "text"] },
        { "id": "title", "component": "Text", "variant": "h3", "text": "Trail Runner X2" },
        { "id": "text", "component": "Text", "text": "Lightweight, grippy, and happy in the wet. Ships in two days." }
        """,
    )

    private val tabs = basic(
        "tabs", "Tabs",
        "A title strip over one visible panel. Selection is renderer state; the spec gives it no property.",
        """
        { "id": "root", "component": "Tabs", "tabs": [
            { "title": "Overview", "child": "t1" },
            { "title": "Specs", "child": "t2" },
            { "title": "Reviews", "child": "t3" } ] },
        { "id": "t1", "component": "Text", "text": "The overview panel." },
        { "id": "t2", "component": "Text", "text": "Weight 240 g. Drop 6 mm. Stack 28 mm." },
        { "id": "t3", "component": "Text", "text": "4.6 out of 5 from 212 reviews." }
        """,
    )

    private val modal = basic(
        "modal", "Modal",
        "A trigger that reveals content. Drawn inline, because the web backend has no sheet.",
        """
        { "id": "root", "component": "Modal", "trigger": "trigger", "content": "content" },
        { "id": "trigger", "component": "Text", "text": "Show shipping details" },
        { "id": "content", "component": "Column", "children": ["ct", "cb"] },
        { "id": "ct", "component": "Text", "variant": "h4", "text": "Shipping" },
        { "id": "cb", "component": "Text", "text": "Dispatched within 24 hours. Free returns for 30 days." }
        """,
    )

    private val divider = basic(
        "divider", "Divider",
        "Horizontal between rows, vertical inside a row.",
        """
        { "id": "root", "component": "Column", "children": ["above", "h", "below", "row"] },
        { "id": "above", "component": "Text", "text": "Above the rule" },
        { "id": "h", "component": "Divider" },
        { "id": "below", "component": "Text", "text": "Below the rule" },
        { "id": "row", "component": "Row", "align": "center", "children": ["left", "v", "right"] },
        { "id": "left", "component": "Text", "text": "Left" },
        { "id": "v", "component": "Divider", "axis": "vertical" },
        { "id": "right", "component": "Text", "text": "Right" }
        """,
    )

    // MARK: - Inputs

    private val button = basic(
        "button", "Button",
        "Three variants, and one gated by a check: it stays disabled until the box is ticked.",
        """
        { "id": "root", "component": "Column", "children": ["variants", "rule", "agree", "continue"] },
        { "id": "variants", "component": "Row", "children": ["default", "primary", "borderless"] },
        { "id": "default", "component": "Button", "child": "dl", "action": { "event": { "name": "tapped", "context": { "variant": "default" } } } },
        { "id": "dl", "component": "Text", "text": "Default" },
        { "id": "primary", "component": "Button", "variant": "primary", "child": "pl", "action": { "event": { "name": "tapped", "context": { "variant": "primary" } } } },
        { "id": "pl", "component": "Text", "text": "Primary" },
        { "id": "borderless", "component": "Button", "variant": "borderless", "child": "bl", "action": { "event": { "name": "tapped", "context": { "variant": "borderless" } } } },
        { "id": "bl", "component": "Text", "text": "Borderless" },
        { "id": "rule", "component": "Divider" },
        { "id": "agree", "component": "CheckBox", "label": "I have read the terms", "value": { "path": "/agreed" } },
        { "id": "continue", "component": "Button", "variant": "primary", "child": "cl",
          "checks": [ { "condition": { "path": "/agreed" }, "message": "Accept the terms first" } ],
          "action": { "event": { "name": "continue", "context": { "agreed": { "path": "/agreed" } } } } },
        { "id": "cl", "component": "Text", "text": "Continue" }
        """,
        """{ "agreed": false }""",
    )

    private val textField = basic(
        "textfield", "TextField",
        "All four variants. Name and email carry checks that resolve against what you type.",
        """
        { "id": "root", "component": "Column", "children": ["name", "email", "qty", "secret", "notes"] },
        { "id": "name", "component": "TextField", "label": "Name", "placeholder": "Ada Lovelace",
          "value": { "path": "/form/name" },
          "checks": [ { "condition": { "call": "required", "args": { "value": { "path": "/form/name" } } }, "message": "Your name is required" } ] },
        { "id": "email", "component": "TextField", "label": "Email", "placeholder": "you@example.com",
          "value": { "path": "/form/email" },
          "checks": [ { "condition": { "call": "email", "args": { "value": { "path": "/form/email" } } }, "message": "That does not look like an email address" } ] },
        { "id": "qty", "component": "TextField", "label": "Quantity", "variant": "number", "value": { "path": "/form/qty" } },
        { "id": "secret", "component": "TextField", "label": "Password", "variant": "obscured", "value": { "path": "/form/secret" } },
        { "id": "notes", "component": "TextField", "label": "Notes", "variant": "longText", "placeholder": "Anything else?", "value": { "path": "/form/notes" } }
        """,
        """{ "form": { "name": "", "email": "nope", "qty": "2", "secret": "hunter2", "notes": "" } }""",
    )

    private val checkBox = basic(
        "checkbox", "CheckBox",
        "Two-way bound. The second one fails its check until it is on.",
        """
        { "id": "root", "component": "Column", "children": ["updates", "terms"] },
        { "id": "updates", "component": "CheckBox", "label": "Email me about updates", "value": { "path": "/updates" } },
        { "id": "terms", "component": "CheckBox", "label": "I accept the terms", "value": { "path": "/terms" },
          "checks": [ { "condition": { "path": "/terms" }, "message": "You need to accept the terms to continue" } ] }
        """,
        """{ "updates": true, "terms": false }""",
    )

    private val choicePicker = basic(
        "choicepicker", "ChoicePicker",
        "Single selection is the platform's own control. Multiple is chips or rows. The last one is filterable.",
        """
        { "id": "root", "component": "Column", "children": ["size", "toppings", "extras", "country"] },
        { "id": "size", "component": "ChoicePicker", "label": "Size", "variant": "mutuallyExclusive", "displayStyle": "chips",
          "value": { "path": "/size" },
          "options": [ { "label": "S", "value": "S" }, { "label": "M", "value": "M" }, { "label": "L", "value": "L" } ] },
        { "id": "toppings", "component": "ChoicePicker", "label": "Toppings", "variant": "multipleSelection", "displayStyle": "chips",
          "value": { "path": "/toppings" },
          "options": [ { "label": "Cheese", "value": "cheese" }, { "label": "Basil", "value": "basil" }, { "label": "Olives", "value": "olives" } ] },
        { "id": "extras", "component": "ChoicePicker", "label": "Extras", "variant": "multipleSelection", "displayStyle": "checkbox",
          "value": { "path": "/extras" },
          "options": [ { "label": "Gift wrap", "value": "wrap" }, { "label": "Express shipping", "value": "express" } ] },
        { "id": "country", "component": "ChoicePicker", "label": "Country", "variant": "mutuallyExclusive", "filterable": true,
          "value": { "path": "/country" },
          "options": [
            { "label": "Australia", "value": "AU" }, { "label": "Austria", "value": "AT" }, { "label": "Belgium", "value": "BE" },
            { "label": "Brazil", "value": "BR" }, { "label": "Canada", "value": "CA" }, { "label": "Chile", "value": "CL" },
            { "label": "Denmark", "value": "DK" }, { "label": "New Zealand", "value": "NZ" } ] }
        """,
        """{ "size": ["M"], "toppings": ["cheese"], "extras": [], "country": [] }""",
    )

    private val slider = basic(
        "slider", "Slider",
        "Bound to the data model, with steps snapping to 20 divisions. The text below reads the same path.",
        """
        { "id": "root", "component": "Column", "children": ["budget", "readout"] },
        { "id": "budget", "component": "Slider", "label": "Budget", "min": 0, "max": 500, "steps": 20, "value": { "path": "/budget" } },
        { "id": "readout", "component": "Text", "variant": "caption",
          "text": { "call": "formatCurrency", "args": { "value": { "path": "/budget" }, "currency": "USD" } } }
        """,
        """{ "budget": 125 }""",
    )

    private val dateTimeInput = basic(
        "datetime", "DateTimeInput",
        "A date, a time, and both with a range. ISO 8601 in the data model either way.",
        """
        { "id": "root", "component": "Column", "children": ["date", "time", "both"] },
        { "id": "date", "component": "DateTimeInput", "label": "Departure", "enableDate": true, "value": { "path": "/departure" } },
        { "id": "time", "component": "DateTimeInput", "label": "Reminder", "enableTime": true, "value": { "path": "/reminder" } },
        { "id": "both", "component": "DateTimeInput", "label": "Event", "enableDate": true, "enableTime": true,
          "min": "2026-01-01", "max": "2026-12-31", "value": { "path": "/event" },
          "checks": [ { "condition": { "call": "required", "args": { "value": { "path": "/event" } } }, "message": "Pick a date and time" } ] }
        """,
        """{ "departure": "2026-02-02", "reminder": "09:30", "event": "" }""",
    )
}
