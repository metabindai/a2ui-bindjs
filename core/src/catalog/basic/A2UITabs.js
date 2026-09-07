// A2UI Basic Catalog → BindJS: `Tabs`
//
// A2UI props: tabs (required) — an array of { title, child }, where `child` is a
// component id. The engine builds each id and hands this component the array with the
// built component in place of the id.
//
// The v1.0 basic catalog gives Tabs no property for the selected tab, so the selection
// is renderer state by definition — there is nowhere in the data model to put it.

export default defineComponent({
    metadata: {
        title: "A2UITabs",
        description: "A2UI Tabs primitive — a title strip over one visible panel.",
        category: "A2UI",
    },

    properties: {},

    body: (props) => {
        const tabs = Array.isArray(props.tabs) ? props.tabs : []
        const [selected, setSelected] = useState(0)
        const active = Math.min(selected, Math.max(tabs.length - 1, 0))

        const strip = tabs.map((tab, index) => {
            const title = String((tab && tab.title) ?? "Tab " + (index + 1))

            const label = index === active
                ? Text(title).font("subheadline").fontWeight("semibold").foregroundStyle(Color("accent"))
                : Text(title).font("subheadline").foregroundStyle(Color("secondary"))

            return Button(label.padding({ horizontal: 12, vertical: 8 }), () => setSelected(index))
        })

        const panel = tabs.length > 0 && tabs[active] ? tabs[active].child : null

        return VStack({ spacing: 12, alignment: "leading" }, [
            ScrollView({ axis: "horizontal", showsIndicators: false }, [HStack({ spacing: 4 }, strip)]),
            Divider(),
            panel ?? Empty(),
        ]).frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [
        Self({
            tabs: [
                { title: "Overview", child: Text("Overview panel") },
                { title: "Details", child: Text("Details panel") },
            ],
        }).previewName("Two tabs"),
    ],
});
