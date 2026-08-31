// A2UI Basic Catalog → BindJS: `Row`
//
// A2UI props: children (required), justify, align.
// justify distributes along the main (horizontal) axis; BindJS has no justify
// modifier, so `center` / `end` / `spaceBetween` are expressed with Spacers.

const ALIGNMENT = { start: "top", center: "center", end: "bottom", stretch: "center" }

export default defineComponent({
    metadata: {
        title: "A2UIRow",
        description: "A2UI Row primitive — horizontal container with justify / align distribution.",
        category: "A2UI",
    },

    properties: {
        justify: { type: "enum", options: ["start", "center", "end", "spaceBetween"], defaultValue: "start" },
        align: { type: "enum", options: ["start", "center", "end", "stretch"], defaultValue: "start" },
        spacing: { type: "number", defaultValue: 16 },
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

        return HStack({ spacing: props.spacing ?? 16, alignment: ALIGNMENT[props.align] || "center" }, laidOut)
            .frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [
        Self({}, [Text("One"), Text("Two")]).previewName("Start"),
        Self({ justify: "spaceBetween" }, [Text("Left"), Text("Right")]).previewName("Space between"),
    ],
});
