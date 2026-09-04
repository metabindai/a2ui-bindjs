// A2UI Basic Catalog → BindJS: `TextField`
//
// A2UI props: label (required), value (two-way bound), placeholder, variant, checks.
//
// The data model owns the value. The engine resolves `value` and injects `setValue`,
// which writes back to the bound JSON Pointer — so this component is stateless and
// there is only ever one copy of the truth.
//
// Validation is `checks`: rules whose `condition` the engine has already resolved to a
// boolean. The first failing rule's message is shown under the field in red and the
// label turns red with it, which is what the official SwiftUI catalog does.
//
// The `number` variant asks for a decimal keyboard. That is a native modifier — the web
// backend does not know it and ignores it, which is fine: a browser keyboard is already
// a full one.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

/**
 * The rules whose `condition` the engine resolved to `false`. A condition is a boolean
 * whichever way it was written — a binding, a logic function, or a validation function
 * such as `required` — and the rule carries the message.
 */
const failedChecks = (checks) =>
    (Array.isArray(checks) ? checks : [])
        .filter((rule) => rule && typeof rule === "object" && rule.condition === false)
        .map((rule) => ({ message: rule.message === undefined || rule.message === null ? "" : String(rule.message) }))

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
    },

    body: (props) => {
        const text = props.value === undefined || props.value === null ? "" : String(props.value)
        const setText = typeof props.setValue === "function" ? props.setValue : () => {}
        const placeholder = asText(props.placeholder)
        const failed = failedChecks(props.checks)
        const hasError = failed.length > 0

        let input

        if (props.variant === "longText") {
            input = TextEditor({ text, setText }).frame({ minHeight: 96 })
        } else if (props.variant === "obscured") {
            input = SecureField({ placeholder, text, setText })
        } else if (props.variant === "number") {
            input = TextField({ placeholder, text, setText }).keyboardType("decimalPad")
        } else {
            input = TextField({ placeholder, text, setText })
        }

        const field = input.padding(10).background(Color("quaternary")).cornerRadius(8)

        const rows = [
            Text(asText(props.label)).font("caption").foregroundStyle(Color(hasError ? "red" : "secondary")),
            field,
        ]

        if (hasError && failed[0].message) {
            rows.push(Text(failed[0].message).font("caption").foregroundStyle(Color("red")))
        }

        return VStack({ spacing: 4, alignment: "leading" }, rows).frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [
        Self({ label: "Full name", value: "Jane Doe", placeholder: "Jane Doe" }).previewName("Short text"),
        Self({ label: "Notes", variant: "longText", value: "Two scoops." }).previewName("Long text"),
        Self({ label: "Password", variant: "obscured", value: "hunter2" }).previewName("Obscured"),
        Self({ label: "Quantity", variant: "number", value: "2" }).previewName("Number"),
        Self({
            label: "Email",
            value: "nope",
            checks: [{ condition: false, message: "Enter a valid email address" }],
        }).previewName("Failing a check"),
    ],
});
