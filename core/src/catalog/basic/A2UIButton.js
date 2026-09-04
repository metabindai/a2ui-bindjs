// A2UI Basic Catalog → BindJS: `Button`
//
// A2UI props: child (required label), variant, checks, plus an `action` on the node.
//
// The engine resolves the A2UI action — event name, resolved context, any local
// functionCall — into a single `props.action` callback, so nothing about the wire
// protocol reaches this component. Dispatch is the engine's job; this file is only
// about how a button looks and that it is tappable.
//
// `checks` is how an agent gates a submit on the form being valid: each rule's
// `condition` is resolved by the engine to a boolean, and a failing rule disables the
// button rather than showing a message — the message belongs to the input it is about.

/**
 * A rule's `condition` arrives one of two ways: a boolean, when it was a binding or a logic
 * function, or a `{ valid, message }` result from a validation function such as
 * `required` or `email`. Either spelling of failure counts, and the rule's own message
 * wins over the function's.
 */
const isFailure = (condition) =>
    condition === false || (condition !== null && typeof condition === "object" && condition.valid === false)

const failedChecks = (checks) =>
    (Array.isArray(checks) ? checks : [])
        .filter((rule) => rule && typeof rule === "object" && isFailure(rule.condition))
        .map((rule) => ({ message: rule.message ?? (rule.condition && rule.condition.message) ?? "Invalid" }))

export default defineComponent({
    metadata: {
        title: "A2UIButton",
        description: "A2UI Button primitive — variant styling over an engine-supplied action.",
        category: "A2UI",
    },

    properties: {
        variant: { type: "enum", options: ["default", "primary", "borderless"], defaultValue: "default" },
        enabled: { type: "boolean", defaultValue: true },
    },

    body: (props, children) => {
        // `properties.defaultValue` is inspector metadata and is NOT applied at runtime,
        // so an omitted `enabled` arrives as undefined — compare against false, because
        // `!undefined` would disable every button that never set the prop.
        const enabled = props.enabled !== false && failedChecks(props.checks).length === 0
        const action = typeof props.action === "function" ? props.action : () => {}
        const label = children && children.length > 0 ? HStack({ spacing: 6 }, children) : Text("Button")

        let styled

        if (props.variant === "primary") {
            styled = label
                .padding({ horizontal: 16, vertical: 10 })
                .background(Color("accent"))
                .foregroundStyle(Color("white"))
                .cornerRadius(10)
        } else if (props.variant === "borderless") {
            styled = label.padding({ horizontal: 4, vertical: 4 }).foregroundStyle(Color("accent"))
        } else {
            styled = label
                .padding({ horizontal: 16, vertical: 10 })
                .background(Color("quaternary"))
                .cornerRadius(10)
        }

        const button = Button(styled, action)

        return enabled ? button : button.disabled(true).opacity(0.5)
    },

    previews: [
        Self({ variant: "primary" }, [Text("Add to cart")]).previewName("Primary"),
        Self({}, [Text("Cancel")]).previewName("Default"),
        Self({ variant: "borderless" }, [Text("Learn more")]).previewName("Borderless"),
        Self({ variant: "primary", enabled: false }, [Text("Unavailable")]).previewName("Disabled"),
        Self({ variant: "primary", checks: [{ condition: false, message: "Fill in the form first" }] }, [Text("Submit")]).previewName(
            "Gated by a check"
        ),
    ],
});
