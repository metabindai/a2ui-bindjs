// A2UI Basic Catalog → BindJS: `CheckBox`
//
// A2UI props: label, value (two-way bound boolean), checks.
// Stateless for the same reason as A2UITextField — the data model owns the value.
// The first failing check is shown under the control in red.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

/** A rule the engine resolved to `false`; anything else is valid or not a rule at all. */
const failedChecks = (checks) =>
    (Array.isArray(checks) ? checks : []).filter((rule) => rule && typeof rule === "object" && rule.condition === false)

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
        const failed = failedChecks(props.checks)

        const toggle = Toggle({ label: asText(props.label), isOn: props.value === true, setIsOn }).frame({ maxWidth: Infinity })

        if (failed.length === 0) {
            return toggle
        }

        return VStack({ spacing: 4, alignment: "leading" }, [
            toggle,
            Text(asText(failed[0].message)).font("caption").foregroundStyle(Color("red")),
        ]).frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [
        Self({ label: "Subscribe to updates", value: true }).previewName("Checked"),
        Self({ label: "Subscribe to updates", value: false }).previewName("Unchecked"),
        Self({
            label: "I accept the terms",
            value: false,
            checks: [{ condition: false, message: "You need to accept the terms to continue" }],
        }).previewName("Failing a check"),
    ],
});
