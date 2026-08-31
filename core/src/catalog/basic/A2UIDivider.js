// A2UI Basic Catalog → BindJS: `Divider`
//
// A2UI props: axis.
//
// BindJS's `Divider` draws a horizontal rule and has no orientation of its own, so a
// vertical divider is a one-point-wide filled rectangle instead. Both are one line the
// length of their container, which is what the component means either way.

export default defineComponent({
    metadata: {
        title: "A2UIDivider",
        description: "A2UI Divider primitive — a horizontal or vertical rule.",
        category: "A2UI",
    },

    properties: {
        axis: { type: "enum", options: ["horizontal", "vertical"], defaultValue: "horizontal" },
    },

    body: (props) => {
        if (props.axis === "vertical") {
            return Rectangle()
                .foregroundStyle(Color("quaternary"))
                .frame({ width: 1, maxHeight: Infinity })
        }

        return Divider()
    },

    previews: [
        Self({}).previewName("Horizontal"),
        Self({ axis: "vertical" }).previewName("Vertical"),
    ],
});
