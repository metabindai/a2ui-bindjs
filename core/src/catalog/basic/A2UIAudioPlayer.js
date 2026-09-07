// A2UI Basic Catalog → BindJS: `AudioPlayer`
//
// A2UI props: url (required), description.
// Interim implementation over the video built-in, kept short so it reads as a control
// strip rather than a video frame, pending a native audio builder.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface — bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? '' : String(value))

export default defineComponent({
    metadata: {
        title: "A2UIAudioPlayer",
        description: "A2UI AudioPlayer primitive — interim implementation over the video built-in.",
        category: "A2UI",
    },

    properties: {
        url: { type: "string", required: true, defaultValue: "" },
        description: { type: "string", defaultValue: "" },
    },

    body: (props) => {
        const player = Video({ url: asText(props.url) }).frame({ maxWidth: Infinity, height: 64 }).cornerRadius(8)

        if (!props.description) {
            return player
        }

        return VStack({ spacing: 4, alignment: "leading" }, [
            Text(asText(props.description)).font("caption").foregroundStyle(Color("secondary")),
            player,
        ]).frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [Self({ url: "https://example.com/track.mp3", description: "Episode 12" }).previewName("Default")],
});
