// A2UI Basic Catalog → BindJS: `Row`
//
// A2UI props: children (required), justify, align.
//
// justify distributes along the main (horizontal) axis. BindJS has no justify modifier,
// so the distributions are spelt out with Spacers — which is also how the official
// SwiftUI catalog does it. `spaceAround` and `spaceEvenly` both put a Spacer at each end
// and between every pair; a Spacer cannot be told to be half of another, so `spaceAround`
// is drawn as `spaceEvenly`. `stretch` gives every child the whole width to share.

const ALIGNMENT = { start: "top", center: "center", end: "bottom", stretch: "center" }

const interleave = (items) => items.flatMap((child, index) => (index === 0 ? [child] : [Spacer(), child]))

export default defineComponent({
    metadata: {
        title: "A2UIRow",
        description: "A2UI Row primitive — horizontal container with justify / align distribution.",
        category: "A2UI",
    },

    properties: {
        justify: {
            type: "enum",
            options: ["start", "center", "end", "spaceBetween", "spaceAround", "spaceEvenly", "stretch"],
            defaultValue: "start",
        },
        align: { type: "enum", options: ["start", "center", "end", "stretch"], defaultValue: "start" },
        spacing: { type: "number", defaultValue: 16 },
    },

    body: (props, children) => {
        const justify = props.justify ?? "start"

        // `weight` lets a child claim proportional space. Only the engine can see each
        // child node's weight, so it passes them down as `childWeights`.
        const weights = Array.isArray(props.childWeights) ? props.childWeights : []

        const items = (children ?? []).map((child, index) => {
            const weight = weights[index]

            if (typeof weight === "number" && weight > 0) {
                return child.frame({ maxWidth: Infinity }).layoutPriority(weight)
            }

            if (justify === "stretch") {
                return child.frame({ maxWidth: Infinity })
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
        const spacing = distributed ? 0 : (props.spacing ?? 16)

        return HStack({ spacing, alignment: ALIGNMENT[props.align] || "center" }, laidOut)
            .frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [
        Self({}, [Text("One"), Text("Two")]).previewName("Start"),
        Self({ justify: "spaceBetween" }, [Text("Left"), Text("Right")]).previewName("Space between"),
        Self({ justify: "spaceEvenly" }, [Text("A"), Text("B"), Text("C")]).previewName("Space evenly"),
    ],
});
