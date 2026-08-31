// A2UI Basic Catalog → BindJS: `Text`
//
// A2UI props: text (required), variant.
//
// Platform note carried over from the first implementation: only the object form
// `Text({ markdown })` is honoured by bindjs-apple's TextComponent (it maps to
// SwiftUI Text(LocalizedStringKey:)). `Markdown(text)` has no native builder and
// `Text(string)` renders nothing on iOS — so the object form is the only safe
// spelling for a component that must work on every backend.
//
// The v1.0 basic catalog only defines ("body" | "caption"), but agents routinely
// emit h1–h5. Unrecognised variants would silently collapse to body and flatten
// every heading, so all seven are mapped onto the platform type ramp.

const HEADING_STYLES = {
    h1: "title",
    h2: "title2",
    h3: "title3",
    h4: "headline",
    h5: "subheadline",
}

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

export default defineComponent({
    metadata: {
        title: "A2UIText",
        description: "A2UI Text primitive — headings, body or caption, with simple Markdown.",
        category: "A2UI",
    },

    properties: {
        text: { type: "string", required: true, defaultValue: "", inspector: { control: "multiline", markdown: true } },
        variant: { type: "enum", options: ["h1", "h2", "h3", "h4", "h5", "body", "caption"] },
    },

    body: (props) => {
        const text = asText(props.text)
        const headingStyle = HEADING_STYLES[props.variant]

        // Each branch builds its own Text: hanging two modifier stacks off one shared
        // instance renders nothing on the web backend.
        if (headingStyle) {
            return props.variant === "h5"
                ? Text({ markdown: text }).font(headingStyle).multilineTextAlignment("leading")
                : Text({ markdown: text }).font(headingStyle).fontWeight("semibold").multilineTextAlignment("leading")
        }

        if (props.variant === "caption") {
            return Text({ markdown: text }).font("caption").foregroundStyle(Color("secondary")).multilineTextAlignment("leading")
        }

        return Text({ markdown: text }).font("subheadline").multilineTextAlignment("leading")
    },

    previews: [
        Self({ text: "Heading one", variant: "h1" }).previewName("h1"),
        Self({ text: "Heading three", variant: "h3" }).previewName("h3"),
        Self({ text: "The quick brown fox jumps over the lazy dog." }).previewName("Body"),
        Self({ text: "Updated 5 minutes ago", variant: "caption" }).previewName("Caption"),
        Self({ text: "Supports **bold**, _italic_ and [links](https://a2ui.org)." }).previewName("Markdown"),
    ],
});
