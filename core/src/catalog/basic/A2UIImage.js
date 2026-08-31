// A2UI Basic Catalog → BindJS: `Image`
//
// A2UI props: url (required), description (alt text), fit, variant.
// `variant` is A2UI's size hint; it maps onto a height so images in a stream do not
// each pick their own intrinsic size.

const HEIGHTS = { smallIcon: 32, mediumIcon: 48, largeIcon: 72, smallFeature: 120, mediumFeature: 200, largeFeature: 320 }

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface — bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? '' : String(value))

export default defineComponent({
    metadata: {
        title: "A2UIImage",
        description: "A2UI Image primitive with fit and size-variant mapping.",
        category: "A2UI",
    },

    properties: {
        url: { type: "string", required: true, defaultValue: "" },
        description: { type: "string", defaultValue: "" },
        fit: { type: "enum", options: ["fill", "contain", "cover"], defaultValue: "fill" },
        variant: { type: "enum", options: Object.keys(HEIGHTS), defaultValue: "mediumFeature" },
    },

    body: (props) => {
        const height = HEIGHTS[props.variant] ?? HEIGHTS.mediumFeature
        const contentMode = props.fit === "contain" ? "fit" : "fill"

        const image = Image({ url: asText(props.url) })
            .resizable()
            .aspectRatio({ contentMode })
            .frame({ maxWidth: Infinity, height })
            .clipped()
            .cornerRadius(8)

        return props.description ? image.accessibilityLabel(asText(props.description)) : image
    },

    previews: [Self({ url: "https://picsum.photos/600/400", description: "Scenery" }).previewName("Default")],
});
