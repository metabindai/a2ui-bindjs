// A2UI Basic Catalog → BindJS: `Icon`
//
// A2UI props: name (required — a platform-neutral icon name), size.
// Named icons map to the platform symbol set; an inline SVG path is passed straight
// through for names the platform does not know.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

export default defineComponent({
    metadata: {
        title: "A2UIIcon",
        description: "A2UI Icon primitive — named platform symbols or inline SVG path data.",
        category: "A2UI",
    },

    properties: {
        name: { type: "string", required: true, defaultValue: "star" },
        size: { type: "number", defaultValue: 24 },
    },

    body: (props) => {
        const size = props.size ?? 24
        const name = asText(props.name)

        // A path payload rather than a symbol name.
        if (name.indexOf("M") === 0 || name.indexOf("<svg") === 0) {
            return Image({ svg: name }).frame({ width: size, height: size })
        }

        return Image({ systemName: name }).resizable().aspectRatio({ contentMode: "fit" }).frame({ width: size, height: size })
    },

    previews: [Self({ name: "star.fill" }).previewName("Symbol")],
});
