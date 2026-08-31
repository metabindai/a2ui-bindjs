// A2UI Basic Catalog → BindJS: `CheckBox`
//
// A2UI props: label, value (two-way bound boolean).
// Stateless for the same reason as A2UITextField — the data model owns the value.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

export default defineComponent({
    metadata: {
        title: "A2UICheckBox",
        description: "A2UI CheckBox primitive — controlled boolean toggle.",
        category: "A2UI",
    },

    properties: {
        label: { type: "string", defaultValue: "" },
        value: { type: "boolean", defaultValue: false },
    },

    body: (props) => {
        const setIsOn = typeof props.setValue === "function" ? props.setValue : () => {}

        return Toggle({ label: asText(props.label), isOn: props.value === true, setIsOn }).frame({ maxWidth: Infinity })
    },

    previews: [
        Self({ label: "Subscribe to updates", value: true }).previewName("Checked"),
        Self({ label: "Subscribe to updates", value: false }).previewName("Unchecked"),
    ],
});
