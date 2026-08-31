// A2UI Basic Catalog → BindJS: `Column`
//
// A2UI props: children (required), justify, align.
// The vertical twin of A2UIRow — see that file for the Spacer-based justify notes.

const ALIGNMENT = { start: "leading", center: "center", end: "trailing", stretch: "leading" }

export default defineComponent({
    metadata: {
        title: "A2UIColumn",
        description: "A2UI Column primitive — vertical container with justify / align distribution.",
        category: "A2UI",
    },

    properties: {
        justify: { type: "enum", options: ["start", "center", "end", "spaceBetween"], defaultValue: "start" },
        align: { type: "enum", options: ["start", "center", "end", "stretch"], defaultValue: "start" },
        spacing: { type: "number", defaultValue: 12 },
    },

    body: (props, children) => {
        // `weight` lets a child claim proportional space. Only the engine can see each
        // child node's weight, so it passes them down as `childWeights`.
        const weights = Array.isArray(props.childWeights) ? props.childWeights : []

        const items = (children ?? []).map((child, index) => {
            const weight = weights[index]

            if (typeof weight !== "number" || weight <= 0) {
                return child
            }

            return child.frame({ maxWidth: Infinity }).layoutPriority(weight)
        })
        const justify = props.justify ?? "start"

        let laidOut = items

        if (justify === "center") {
            laidOut = [Spacer(), ...items, Spacer()]
        } else if (justify === "end") {
            laidOut = [Spacer(), ...items]
        } else if (justify === "spaceBetween") {
            laidOut = items.flatMap((child, index) => (index === 0 ? [child] : [Spacer(), child]))
        }

        return VStack({ spacing: props.spacing ?? 12, alignment: ALIGNMENT[props.align] || "leading" }, laidOut)
            .frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [Self({}, [Text("First"), Text("Second"), Text("Third")]).previewName("Default")],
});
