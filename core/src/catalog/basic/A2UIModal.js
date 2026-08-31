// A2UI Basic Catalog → BindJS: `Modal`
//
// A2UI props: trigger (required), content (required) — both component ids, built by
// the engine and passed here as components.
//
// As with Tabs, the v1.0 basic catalog gives Modal no property for open state, so it is
// renderer state by definition.

export default defineComponent({
    metadata: {
        title: "A2UIModal",
        description: "A2UI Modal primitive — a trigger that reveals overlay content.",
        category: "A2UI",
    },

    properties: {},

    body: (props) => {
        const [open, setOpen] = useState(false)

        const trigger = Button(props.trigger ?? Text("Open"), () => setOpen(true))

        if (!open) {
            return trigger
        }

        const header = HStack({ spacing: 8 }, [
            Spacer(),
            Button(Text("Close").font("subheadline").foregroundStyle(Color("accent")), () => setOpen(false)),
        ])

        const panel = VStack({ spacing: 12, alignment: "leading" }, [header, props.content ?? Empty()])
            .padding(16)
            .frame({ maxWidth: Infinity, alignment: "leading" })
            .background(Color("background"))
            .cornerRadius(14)

        return VStack({ spacing: 12, alignment: "leading" }, [trigger, panel])
    },

    previews: [Self({ trigger: Text("Open"), content: Text("Are you sure?") }).previewName("Closed")],
});
