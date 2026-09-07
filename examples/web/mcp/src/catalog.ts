/**
 * A couple of components registered over the bundled catalog.
 *
 * The agent's payload never mentions these — it asks for `Card` and `Text` like any other
 * A2UI surface. Registering different BindJS under those names is the whole extension
 * point: the same message stream renders differently, with no change on the agent's side.
 */
import { createA2UIRuntime } from '@metabindai/a2ui-bindjs-react'
import type { BindJSRuntimeLike } from '@metabindai/a2ui-bindjs'

const RECIPE_CARD = `
exports.default = defineComponent({
    body: (props, children) => VStack({ spacing: 0, alignment: 'leading' }, children ?? [])
        .padding(20)
        .frame({ maxWidth: Infinity, alignment: 'leading' })
        .background(Color('#fffbeb'))
        .cornerRadius(16),
    properties: {},
})
`

const RECIPE_TEXT = `
const HEADINGS = { h1: 'title', h2: 'title2', h3: 'title3', h4: 'headline', h5: 'subheadline' }

/*
 * A2UI's DynamicString resolves to whatever the data model holds — this very recipe binds
 * a rating of 4.9 — so a Text must coerce. Handing a number to the markdown builder
 * throws, and the throw blanks the whole surface rather than just this node.
 */
const asText = (value) => (value === null || value === undefined ? '' : String(value))

exports.default = defineComponent({
    body: (props) => {
        const text = asText(props.text)
        const heading = HEADINGS[props.variant]

        if (heading) {
            return Text({ markdown: text }).font(heading).fontWeight('bold').foregroundStyle(Color('#7c2d12'))
        }

        if (props.variant === 'caption') {
            return Text({ markdown: text }).font('caption').foregroundStyle(Color('#a16207'))
        }

        // No colour: a Text is often a label inside something that already tinted it.
        return Text({ markdown: text }).font('subheadline')
    },
    properties: {},
})
`

/** A runtime with the bundled catalog, and Card and Text swapped for the ones above. */
export function createRecipeRuntime(): BindJSRuntimeLike {
    return createA2UIRuntime({ sources: { A2UICard: RECIPE_CARD, A2UIText: RECIPE_TEXT } })
}
