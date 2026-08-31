// A2UI Basic Catalog → BindJS: `TextField`
//
// A2UI props: label (required), value (two-way bound), placeholder, variant.
//
// The data model owns the value. The engine resolves `value` and injects `setValue`,
// which writes back to the bound JSON Pointer — so this component is stateless and
// there is only ever one copy of the truth.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

export default defineComponent({
    metadata: {
        title: "A2UITextField",
        description: "A2UI TextField primitive — controlled input over an engine-supplied setValue.",
        category: "A2UI",
    },

    properties: {
        label: { type: "string", required: true, defaultValue: "Label" },
        value: { type: "string", defaultValue: "" },
        placeholder: { type: "string", defaultValue: "" },
        variant: { type: "enum", options: ["shortText", "longText", "number", "obscured"], defaultValue: "shortText" },
        validationMessage: { type: "string", defaultValue: "" },
    },

    body: (props) => {
        const text = props.value === undefined || props.value === null ? "" : String(props.value)
        const setText = typeof props.setValue === "function" ? props.setValue : () => {}
        const placeholder = asText(props.placeholder)

        let input

        if (props.variant === "longText") {
            input = TextEditor({ text, setText }).frame({ minHeight: 96 })
        } else if (props.variant === "obscured") {
            input = SecureField({ placeholder, text, setText })
        } else {
            input = TextField({ placeholder, text, setText })
        }

        const field = input.padding(10).background(Color("quaternary")).cornerRadius(8)

        const rows = [
            Text(asText(props.label)).font("caption").foregroundStyle(Color("secondary")),
            field,
        ]

        if (props.validationMessage) {
            rows.push(Text(asText(props.validationMessage)).font("caption").foregroundStyle(Color("red")))
        }

        return VStack({ spacing: 4, alignment: "leading" }, rows).frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [
        Self({ label: "Full name", value: "Jane Doe", placeholder: "Jane Doe" }).previewName("Short text"),
        Self({ label: "Notes", variant: "longText", value: "Two scoops." }).previewName("Long text"),
        Self({ label: "Password", variant: "obscured", value: "hunter2" }).previewName("Obscured"),
        Self({ label: "Email", value: "nope", validationMessage: "Enter a valid email address" }).previewName("Invalid"),
    ],
});
