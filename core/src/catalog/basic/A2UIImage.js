// A2UI Basic Catalog → BindJS: `Image`
//
// A2UI props: url (required), description (alt text), fit, variant.
//
// `variant` is A2UI's size hint, and the names are the spec's: `icon` and `avatar` are
// fixed squares (an avatar is round), the three `*Feature` sizes and `header` are
// full-width bands with a fixed height so images in a stream do not each pick their own
// intrinsic size. The heights follow the official SwiftUI catalog.
//
// `fit` has five spec values but BindJS draws two: `contain` and `scaleDown` fit inside
// the frame, everything else fills it. A header always fills — it is a band, and a
// letterboxed band is not one.

const VARIANTS = {
    icon: { width: 24, height: 24, radius: 0 },
    avatar: { width: 40, height: 40, circle: true },
    smallFeature: { maxWidth: 100, height: 100 },
    mediumFeature: { height: 200 },
    largeFeature: { height: 320 },
    header: { height: 200, cover: true, radius: 0 },
}

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface — bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? '' : String(value))

const contentModeFor = (fit, variant) => {
    if (variant.cover) {
        return "fill"
    }

    return fit === "contain" || fit === "scaleDown" ? "fit" : "fill"
}

const frameFor = (variant) => {
    if (variant.width) {
        return { width: variant.width, height: variant.height }
    }

    return { maxWidth: variant.maxWidth ?? Infinity, minHeight: variant.height, maxHeight: variant.height }
}

export default defineComponent({
    metadata: {
        title: "A2UIImage",
        description: "A2UI Image primitive with fit and size-variant mapping.",
        category: "A2UI",
    },

    properties: {
        url: { type: "string", required: true, defaultValue: "" },
        description: { type: "string", defaultValue: "" },
        fit: { type: "enum", options: ["contain", "cover", "fill", "none", "scaleDown"], defaultValue: "fill" },
        variant: { type: "enum", options: Object.keys(VARIANTS), defaultValue: "mediumFeature" },
    },

    body: (props) => {
        const variant = VARIANTS[props.variant] ?? VARIANTS.mediumFeature

        const sized = Image({ url: asText(props.url), contentMode: contentModeFor(props.fit, variant) })
            .resizable()
            .frame(frameFor(variant))
            .clipped()

        let shaped

        if (variant.circle) {
            shaped = sized.clipShape(Circle())
        } else if (variant.radius === 0) {
            shaped = sized
        } else {
            shaped = sized.cornerRadius(8)
        }

        return props.description ? shaped.accessibilityLabel(asText(props.description)) : shaped
    },

    previews: [
        Self({ url: "https://picsum.photos/600/400", description: "Scenery" }).previewName("Medium feature"),
        Self({ url: "https://picsum.photos/200", variant: "avatar", description: "Profile" }).previewName("Avatar"),
        Self({ url: "https://picsum.photos/1200/400", variant: "header" }).previewName("Header"),
        Self({ url: "https://picsum.photos/64", variant: "icon" }).previewName("Icon"),
    ],
});
