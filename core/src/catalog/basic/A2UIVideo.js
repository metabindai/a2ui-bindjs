// A2UI Basic Catalog → BindJS: `Video`
//
// A2UI props: url (required), posterUrl, description.
// `Video` is a registered BindJS built-in. The web backend honours a `poster` frame; the
// native one does not read it yet and ignores the key, so it is passed rather than
// dropped and used as the accessibility description as well.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface — bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? '' : String(value))

export default defineComponent({
    metadata: {
        title: "A2UIVideo",
        description: "A2UI Video primitive with standard playback controls.",
        category: "A2UI",
    },

    properties: {
        url: { type: "string", required: true, defaultValue: "" },
        posterUrl: { type: "string", defaultValue: "" },
        description: { type: "string", defaultValue: "" },
    },

    body: (props) => {
        const poster = asText(props.posterUrl)
        const source = poster ? { url: asText(props.url), poster } : { url: asText(props.url) }

        const player = Video(source).frame({ maxWidth: Infinity, height: 220 }).cornerRadius(8)

        return props.description ? player.accessibilityLabel(asText(props.description)) : player
    },

    previews: [
        Self({ url: "https://example.com/clip.mp4" }).previewName("Default"),
        Self({ url: "https://example.com/clip.mp4", posterUrl: "https://picsum.photos/600/340" }).previewName("With poster"),
    ],
});
