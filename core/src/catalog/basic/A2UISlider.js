// A2UI Basic Catalog → BindJS: `Slider`
//
// A2UI props: label, value (two-way bound number), min, max, step.
// BindJS's Slider callback is already named `setValue`, which is exactly what the
// engine injects for a path-bound `value`.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

export default defineComponent({
    metadata: {
        title: "A2UISlider",
        description: "A2UI Slider primitive — controlled numeric slider with optional discrete steps.",
        category: "A2UI",
    },

    properties: {
        label: { type: "string", defaultValue: "" },
        value: { type: "number", defaultValue: 0 },
        min: { type: "number", defaultValue: 0 },
        max: { type: "number", defaultValue: 100 },
        step: { type: "number" },
    },

    body: (props) => {
        const lowerBound = props.min ?? 0
        const upperBound = props.max ?? 100
        const value = typeof props.value === "number" ? props.value : lowerBound
        const setValue = typeof props.setValue === "function" ? props.setValue : () => {}

        const slider = Slider({
            value,
            setValue,
            lowerBound,
            upperBound,
            step: props.step ?? null,
            label: asText(asText(props.label)),
        })

        if (!props.label) {
            return slider
        }

        return VStack({ spacing: 4, alignment: "leading" }, [
            Text(asText(props.label)).font("caption").foregroundStyle(Color("secondary")),
            slider,
        ]).frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [Self({ label: "Budget", value: 40, min: 0, max: 100, step: 5 }).previewName("Stepped")],
});
