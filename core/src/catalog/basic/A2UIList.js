// A2UI Basic Catalog → BindJS: `List`
//
// A2UI props: children (required — often the template form), direction, align.
//
// Lazy stacks inside a ScrollView are the point of this component: the engine emits
// template children as a BindJS ForEach, which builds rows on demand, and LazyVStack
// recycles them natively on iOS / Android.

const V_ALIGN = { start: "leading", center: "center", end: "trailing", stretch: "leading" }
const H_ALIGN = { start: "top", center: "center", end: "bottom", stretch: "top" }

export default defineComponent({
    metadata: {
        title: "A2UIList",
        description: "A2UI List primitive — scrollable lazy stack, vertical or horizontal.",
        category: "A2UI",
    },

    properties: {
        direction: { type: "enum", options: ["vertical", "horizontal"], defaultValue: "vertical" },
        align: { type: "enum", options: ["start", "center", "end", "stretch"], defaultValue: "stretch" },
        spacing: { type: "number", defaultValue: 8 },
    },

    body: (props, children) => {
        const items = children ?? []
        const spacing = props.spacing ?? 8

        if (props.direction === "horizontal") {
            return ScrollView({ axis: "horizontal", showsIndicators: false }, [
                LazyHStack({ spacing, alignment: H_ALIGN[props.align] || "top" }, items),
            ])
        }

        return ScrollView({ axis: "vertical", showsIndicators: true }, [
            LazyVStack({ spacing, alignment: V_ALIGN[props.align] || "leading" }, items),
        ])
    },

    previews: [
        Self({}, [Text("Row 1"), Text("Row 2"), Text("Row 3")]).previewName("Vertical"),
        Self({ direction: "horizontal" }, [Text("A"), Text("B"), Text("C")]).previewName("Horizontal"),
    ],
});
