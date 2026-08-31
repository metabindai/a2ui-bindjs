// A2UI Basic Catalog → BindJS: `Divider`
//
// A2UI props: none.

export default defineComponent({
    metadata: {
        title: "A2UIDivider",
        description: "A2UI Divider primitive.",
        category: "A2UI",
    },

    properties: {},

    body: () => Divider(),

    previews: [Self({}).previewName("Default")],
});
