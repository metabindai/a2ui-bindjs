// A2UI Basic Catalog → BindJS: `DateTimeInput`
//
// A2UI props: label, value (two-way bound ISO 8601 string), mode.
//
// Interim implementation: an ISO text field. BindJS registers a DatePicker built-in,
// but it exchanges Date objects while A2UI's data model carries ISO strings, so the
// conversion belongs here once the native builder's contract is pinned down.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

export default defineComponent({
    metadata: {
        title: "A2UIDateTimeInput",
        description: "A2UI DateTimeInput primitive — controlled ISO 8601 input.",
        category: "A2UI",
    },

    properties: {
        label: { type: "string", defaultValue: "" },
        value: { type: "string", defaultValue: "" },
        mode: { type: "enum", options: ["date", "time", "dateTime"], defaultValue: "date" },
    },

    body: (props) => {
        const text = props.value === undefined || props.value === null ? "" : String(props.value)
        const setText = typeof props.setValue === "function" ? props.setValue : () => {}
        const placeholder = props.mode === "time" ? "HH:MM" : "YYYY-MM-DD"

        const field = TextField({ placeholder, text, setText })
            .padding(10)
            .background(Color("quaternary"))
            .cornerRadius(8)

        if (!props.label) {
            return field
        }

        return VStack({ spacing: 4, alignment: "leading" }, [
            Text(asText(props.label)).font("caption").foregroundStyle(Color("secondary")),
            field,
        ]).frame({ maxWidth: Infinity, alignment: "leading" })
    },

    previews: [Self({ label: "Departure", value: "2026-02-02" }).previewName("Date")],
});
