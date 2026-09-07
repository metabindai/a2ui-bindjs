// A2UI Basic Catalog → BindJS: `Card`
//
// A2UI props: child (required).

export default defineComponent({
    metadata: {
        title: "A2UICard",
        description: "A2UI Card primitive — elevated container for a single child.",
        category: "A2UI",
    },

    properties: {},

    body: (props, children) => {
        return VStack({ spacing: 0, alignment: "leading" }, children ?? [])
            .padding(16)
            .frame({ maxWidth: Infinity, alignment: "leading" })
            .background(Color("background"))
            .cornerRadius(16)
            .shadow({ y: 8, radius: 12, color: Color("black").opacity(0.14) })
    },

    previews: [Self({}, [Text("Card contents")]).previewName("Default")],
});
