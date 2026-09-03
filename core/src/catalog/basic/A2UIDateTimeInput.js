// A2UI Basic Catalog → BindJS: `DateTimeInput`
//
// A2UI props: label, value (two-way bound ISO 8601 string), enableDate, enableTime, min,
// max, checks.
//
// `enableDate` and `enableTime` are independent booleans rather than one mode: a component
// may offer a date, a time, or both. Both default to false in the spec, and a component
// that asks for neither is treated as asking for a date — the same reading the official
// SwiftUI catalog takes, so an agent that forgot the flags gets the same field everywhere.
//
// Interim implementation: an ISO text field. BindJS registers a DatePicker name, but
// neither backend draws one yet, and it would exchange Date objects while A2UI's data
// model carries ISO strings — so the conversion belongs here once a native builder lands.
// `min` and `max` are carried into the caption rather than enforced, because a text field
// cannot constrain them and silently dropping them would hide a constraint the agent asked
// for.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

/** A rule the engine resolved to `false`; anything else is valid or not a rule at all. */
const failedChecks = (checks) =>
    (Array.isArray(checks) ? checks : []).filter((rule) => rule && typeof rule === "object" && rule.condition === false)

/** What the field is asking for, which decides the hint and the placeholder. */
const shapeOf = (props) => {
    const time = props.enableTime === true
    const date = props.enableDate === true || !time

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
        enableDate: { type: "boolean", defaultValue: false },
        enableTime: { type: "boolean", defaultValue: false },
        min: { type: "string", defaultValue: "" },
        max: { type: "string", defaultValue: "" },
    },

    body: (props) => {
        const shape = shapeOf(props)
        const range = rangeOf(props)
        const setText = typeof props.setValue === "function" ? props.setValue : () => {}
        const failed = failedChecks(props.checks)

        const field = TextField({ placeholder: shape.placeholder, text: asText(props.value), setText })
            .padding(10)
            .background(Color("quaternary"))
            .cornerRadius(8)

        // Built as arrays so the props-form of a layout gets a literal `Component[]`,
        // which `metabind validate` checks for statically.
        const caption = props.label
            ? [Text(asText(props.label)).font("caption").foregroundStyle(Color(failed.length > 0 ? "red" : "secondary"))]
            : []

        const hint = range
            ? [Text(`${shape.noun}, ${range}`).font("caption").foregroundStyle(Color("secondary"))]
            : []

        const error = failed.length > 0 ? [Text(asText(failed[0].message)).font("caption").foregroundStyle(Color("red"))] : []

        if (caption.length === 0 && hint.length === 0 && error.length === 0) {
            return field
        }

        return VStack({ spacing: 4, alignment: "leading" }, [...caption, field, ...hint, ...error]).frame({
            maxWidth: Infinity,
            alignment: "leading",
        })
    },

    previews: [
        Self({ label: "Departure", value: "2026-02-02", enableDate: true }).previewName("Date only"),
        Self({ label: "Reminder", value: "09:30", enableTime: true }).previewName("Time only"),
        Self({
            label: "Event",
            value: "2026-02-02T18:00",
            enableDate: true,
            enableTime: true,
            min: "2026-01-01",
            max: "2026-12-31",
        }).previewName("Date and time, bounded"),
        Self({
            label: "Check-in",
            value: "",
            enableDate: true,
            checks: [{ condition: false, message: "Choose a check-in date" }],
        }).previewName("Failing a check"),
    ],
});
