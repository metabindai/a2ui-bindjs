// A2UI Basic Catalog → BindJS: `Column`
//
// A2UI props: children (required), justify, align.
// The vertical twin of A2UIRow — see that file for the Spacer-based justify notes.

const ALIGNMENT = { start: "leading", center: "center", end: "trailing", stretch: "leading" }

// The stack sizes to its widest child, so its own placement inside the full-width frame
// has to follow `align` too — pinned leading, a centred stack of short children sits on
// the left of the card with its children centred on each other, which reads as nothing.
const FRAME_ALIGNMENT = { start: "leading", center: "center", end: "trailing", stretch: "leading" }

const interleave = (items) => items.flatMap((child, index) => (index === 0 ? [child] : [Spacer(), child]))

export default defineComponent({
    metadata: {
        title: "A2UIColumn",
        description: "A2UI Column primitive — vertical container with justify / align distribution.",
        category: "A2UI",
    },

    properties: {
        justify: {
            type: "enum",
            options: ["start", "center", "end", "spaceBetween", "spaceAround", "spaceEvenly", "stretch"],
            defaultValue: "start",
        },
        align: { type: "enum", options: ["start", "center", "end", "stretch"], defaultValue: "stretch" },
        spacing: { type: "number", defaultValue: 12 },
    },

    body: (props, children) => {
        const justify = props.justify ?? "start"

        // `weight` lets a child claim a share of the height — equal shares, for the reasons
        // in A2UIRow. Only the engine can see each child node's weight, so it passes them
        // down as `childWeights`.
        const weights = Array.isArray(props.childWeights) ? props.childWeights : []

        const items = (children ?? []).map((child, index) => {
            const weight = weights[index]

            if (typeof weight === "number" && weight > 0) {
                return child.frame({ maxHeight: Infinity, alignment: "top" })
            }

            if (justify === "stretch") {
                return child.frame({ maxHeight: Infinity })
            }

            return child
        })

        let laidOut = items

        if (justify === "center") {
            laidOut = [Spacer(), ...items, Spacer()]
        } else if (justify === "end") {
            laidOut = [Spacer(), ...items]
        } else if (justify === "spaceBetween") {
            laidOut = interleave(items)
        } else if (justify === "spaceAround" || justify === "spaceEvenly") {
            laidOut = [Spacer(), ...interleave(items), Spacer()]
        }

        // Distributed layouts own their gaps; a stack spacing on top would double them.
        const distributed = justify === "spaceBetween" || justify === "spaceAround" || justify === "spaceEvenly"
        const spacing = distributed ? 0 : (props.spacing ?? 12)

        return VStack({ spacing, alignment: ALIGNMENT[props.align] || ALIGNMENT.stretch }, laidOut)
            .frame({ maxWidth: Infinity, alignment: FRAME_ALIGNMENT[props.align] || FRAME_ALIGNMENT.stretch })
    },

    previews: [Self({}, [Text("First"), Text("Second"), Text("Third")]).previewName("Default")],
});
