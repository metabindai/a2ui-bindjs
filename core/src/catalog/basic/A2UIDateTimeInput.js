// A2UI Basic Catalog → BindJS: `DateTimeInput`
//
// A2UI props: label, value (two-way bound ISO 8601 string), enableDate, enableTime, min, max.
//
// `enableDate` and `enableTime` are independent booleans rather than one mode: a component
// may offer a date, a time, or both. Both default to true, matching how the official
// examples spell it out.
//
// Interim implementation: an ISO text field. BindJS registers a DatePicker built-in, but it
// exchanges Date objects while A2UI's data model carries ISO strings, so the conversion
// belongs here once the native builder's contract is pinned down. `min` and `max` are
// carried into the caption rather than enforced, because a text field cannot constrain them
// and silently dropping them would hide a constraint the agent asked for.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

/** What the field is asking for, which decides the hint and the placeholder. */
const shapeOf = (props) => {
    const date = props.enableDate !== false
    const time = props.enableTime !== false

    if (date && !time) {
        return { placeholder: "YYYY-MM-DD", noun: "date" }
    }

    if (time && !date) {
        return { placeholder: "HH:MM", noun: "time" }
    }

    return { placeholder: "YYYY-MM-DDTHH:MM", noun: "date and time" }
}

/** `min` and `max` are advisory here, so they are shown rather than enforced. */
const rangeOf = (props) => {
    const min = asText(props.min)
    const max = asText(props.max)

    if (min && max) {
        return `${min} to ${max}`
    }

    if (min) {
        return `from ${min}`
    }

    if (max) {
        return `until ${max}`
    }

    return ""
}

export default defineComponent({
    metadata: {
        title: "A2UIDateTimeInput",
        description: "A2UI DateTimeInput primitive — controlled ISO 8601 input for a date, a time, or both.",
        category: "A2UI",
    },

    properties: {
        label: { type: "string", defaultValue: "" },
        value: { type: "string", defaultValue: "" },
        enableDate: { type: "boolean", defaultValue: true },
        enableTime: { type: "boolean", defaultValue: true },
        min: { type: "string", defaultValue: "" },
        max: { type: "string", defaultValue: "" },
    },

    body: (props) => {
        const shape = shapeOf(props)
        const range = rangeOf(props)
        const setText = typeof props.setValue === "function" ? props.setValue : () => {}

        const field = TextField({ placeholder: shape.placeholder, text: asText(props.value), setText })
            .padding(10)
            .background(Color("quaternary"))
            .cornerRadius(8)

        // Built as an array so the props-form of a layout gets a literal `Component[]`,
        // which `metabind validate` checks for statically.
        const caption = props.label
            ? [Text(asText(props.label)).font("caption").foregroundStyle(Color("secondary"))]
            : []

        const hint = range
            ? [Text(`${shape.noun}, ${range}`).font("caption").foregroundStyle(Color("secondary"))]
            : []

        if (caption.length === 0 && hint.length === 0) {
            return field
        }

        return VStack({ spacing: 4, alignment: "leading" }, [...caption, field, ...hint]).frame({
            maxWidth: Infinity,
            alignment: "leading",
        })
    },

    previews: [
        Self({ label: "Departure", value: "2026-02-02", enableTime: false }).previewName("Date only"),
        Self({ label: "Reminder", value: "09:30", enableDate: false }).previewName("Time only"),
        Self({ label: "Event", value: "2026-02-02T18:00", min: "2026-01-01", max: "2026-12-31" }).previewName(
            "Date and time, bounded"
        ),
    ],
});
