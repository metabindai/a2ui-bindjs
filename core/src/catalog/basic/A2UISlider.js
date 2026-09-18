// A2UI Basic Catalog → BindJS: `Slider`
//
// A2UI props: label, value (two-way bound number), min, max, steps, checks.
//
// `steps` is the number of discrete divisions across the range, not the size of one —
// so the step size is derived here. BindJS's Slider takes the bounds as a single
// `range: [lower, upper]` pair; both native renderers fall back to `[0, 1]` when it is
// missing, which clamps the thumb and leaves it two positions to snap between. BindJS's Slider callback is already named `setValue`,
// which is exactly what the engine injects for a path-bound `value`.
//
// The current value is shown beside the label, as the official SwiftUI catalog does: a
// slider with no readout tells the user where the thumb is and nothing else.

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

/** Whole numbers read as such; anything else keeps its fraction. */
const formatValue = (value) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100))

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
        steps: { type: "number" },
    },

    body: (props) => {
        const lowerBound = typeof props.min === "number" ? props.min : 0
        const upperBound = typeof props.max === "number" && props.max > lowerBound ? props.max : lowerBound + 100
        const value = typeof props.value === "number" ? props.value : lowerBound
        const setValue = typeof props.setValue === "function" ? props.setValue : () => {}
        const steps = typeof props.steps === "number" && props.steps > 0 ? Math.floor(props.steps) : 0
        const failed = failedChecks(props.checks)

        const slider = Slider({
            value,
            setValue,
            range: [lowerBound, upperBound],
            step: steps > 0 ? (upperBound - lowerBound) / steps : null,
            label: asText(props.label),
        })

        // Built as arrays so the props-form of a layout gets a literal `Component[]`,
        // which `metabind validate` checks for statically.
        const header = props.label
            ? [
                  HStack({ spacing: 8 }, [
                      Text(asText(props.label)).font("caption").foregroundStyle(Color(failed.length > 0 ? "red" : "secondary")),
                      Spacer(),
                      Text(formatValue(value)).font("caption").monospaced().foregroundStyle(Color("secondary")),
                  ]),
              ]
            : []

        const error = failed.length > 0 && failed[0].message ? [Text(failed[0].message).font("caption").foregroundStyle(Color("red"))] : []

        if (header.length === 0 && error.length === 0) {
            return slider
        }

        return VStack({ spacing: 4, alignment: "leading" }, [...header, slider, ...error]).frame({
            maxWidth: Infinity,
            alignment: "leading",
        })
    },

    previews: [
        Self({ label: "Budget", value: 40, min: 0, max: 100, steps: 20 }).previewName("Stepped"),
        Self({ label: "Volume", value: 0.35, min: 0, max: 1 }).previewName("Continuous"),
        Self({ label: "Guests", value: 0, min: 0, max: 12, checks: [{ condition: false, message: "Invite at least one guest" }] }).previewName(
            "Failing a check"
        ),
    ],
});
