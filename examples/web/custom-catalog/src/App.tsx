/**
 * Overriding how A2UI components look.
 *
 * The same surface is rendered twice — once with the built-in catalog, once with two
 * components swapped out. Nothing about the A2UI messages changes between them: the
 * agent describes *what* to show, the catalog decides *how* it looks.
 *
 * A catalog is a map from A2UI component type to the name of a registered BindJS
 * component, so overriding one means supplying the component and changing one entry.
 * There is no runtime to build here: `sources` and `catalog` are enough, and the renderer
 * registers them on the runtime it already owns.
 */
import { BASIC_CATALOG, type AgentMessage, type Catalog } from '@metabindai/a2ui-bindjs'
import { A2UIRenderer, useA2UIStore } from '@metabindai/a2ui-bindjs-react'

// ─── The agent's messages ────────────────────────────────────────────────────

const MESSAGES: AgentMessage[] = [
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'main',
            components: [
                { id: 'root', component: 'Card', child: 'body' },
                { id: 'body', component: 'Column', children: ['title', 'blurb', 'cta'] },
                { id: 'title', component: 'Text', variant: 'h2', text: { path: '/offer/title' } },
                { id: 'blurb', component: 'Text', variant: 'caption', text: { path: '/offer/blurb' } },
                { id: 'ctaLabel', component: 'Text', text: 'Claim offer' },
                {
                    id: 'cta',
                    component: 'Button',
                    variant: 'primary',
                    child: 'ctaLabel',
                    action: { event: { name: 'claim_offer' } },
                },
            ],
            dataModel: {
                offer: { title: 'Weekend upgrade', blurb: 'Two nights, sea view, breakfast included.' },
            },
        },
    },

    // A second surface naming a type the basic catalog does not have. The agent writes
    // `Rating` the way it writes `Button`; the catalog below is what makes it real.
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'review',
            components: [
                { id: 'root', component: 'Card', child: 'body' },
                { id: 'body', component: 'Column', children: ['title', 'stars', 'count', 'send'] },
                { id: 'title', component: 'Text', variant: 'h2', text: 'Rate your stay' },
                { id: 'stars', component: 'Rating', label: 'Stars', max: 5, value: { path: '/review/stars' } },
                { id: 'count', component: 'Text', variant: 'caption', text: { path: '/review/stars' } },
                { id: 'sendLabel', component: 'Text', text: 'Send review' },
                {
                    id: 'send',
                    component: 'Button',
                    variant: 'primary',
                    child: 'sendLabel',
                    action: { event: { name: 'send_review', context: { stars: { path: '/review/stars' } } } },
                },
            ],
            dataModel: {
                review: { stars: 3 },
            },
        },
    },
]

// ─── Custom components, written as BindJS source ─────────────────────────────
//
// The runtime evaluates these strings, so a component is authorable in code, in a file,
// or fetched from a server — which is what makes a presentation swappable at runtime.
//
// Props arrive under their A2UI names (`text`, `variant`), plus the two things only the
// engine can supply: an `action` callback, and a `set<Prop>` writer for any prop bound to
// the data model.

const BRAND_TEXT = `
exports.default = defineComponent({
    body: (props) => {
        // A bound value arrives as whatever the data model holds — the review surface
        // binds a number — and the web Text throws on anything but a string.
        const text = String(props.text ?? '')

        if (props.variant === 'h2') {
            return Text({ markdown: text })
                .font('title2')
                .fontWeight('bold')
                .foregroundStyle(Color('#5b21b6'))
        }

        return Text({ markdown: text }).font('subheadline')
    },
    properties: {},
})
`

const BRAND_BUTTON = `
exports.default = defineComponent({
    body: (props, children) => {
        const label = HStack({ spacing: 6 }, children ?? [])
            .padding({ horizontal: 22, vertical: 12 })
            .background(Color('#5b21b6'))
            .foregroundStyle(Color('white'))
            .cornerRadius(999)

        return Button(label, props.action ?? (() => {}))
    },
    properties: {},
})
`

// A component the basic catalog does not have. `value` is bound to the data model, so the
// engine injects `setValue` and nothing here holds state — tapping a star writes the
// number back, and the caption bound to the same path repaints from it.
const RATING = `
exports.default = defineComponent({
    metadata: { title: 'Rating', description: 'A star rating bound to a number in the data model.' },
    properties: {
        value: { type: 'number', defaultValue: 0 },
        max: { type: 'number', defaultValue: 5 },
        label: { type: 'string', defaultValue: '' },
    },
    body: (props) => {
        const max = typeof props.max === 'number' && props.max > 0 ? Math.floor(props.max) : 5
        const value = typeof props.value === 'number' ? props.value : 0
        const setValue = typeof props.setValue === 'function' ? props.setValue : () => {}

        const stars = []

        for (let index = 0; index < max; index += 1) {
            const filled = index < value
            const star = Text(filled ? '★' : '☆').font('title2').foregroundStyle(Color(filled ? 'yellow' : 'quaternary'))

            stars.push(Button(star, () => setValue(index + 1)))
        }

        const row = HStack({ spacing: 2 }, stars)

        if (!props.label) {
            return row
        }

        return VStack({ spacing: 4, alignment: 'leading' }, [
            Text(String(props.label)).font('caption').foregroundStyle(Color('secondary')),
            row,
        ])
    },
})
`

// Only what the basic catalog lacks or is being overridden is supplied. The renderer fills in whatever the catalog
// names and the runtime does not have — Card and Column still come from the built-in
// catalog — and never replaces what is already registered, which is what makes an
// override win.
//
// Both are module constants rather than built in the component, so their identity is
// stable across renders.
const BRAND_SOURCES = { BrandText: BRAND_TEXT, BrandButton: BRAND_BUTTON, Rating: RATING }

const BRAND_CATALOG: Catalog = {
    ...BASIC_CATALOG,
    Text: 'BrandText',
    Button: 'BrandButton',
    Rating: 'Rating',
}

// ─── App ─────────────────────────────────────────────────────────────────────

export function App() {
    // One store, read by both renderers — the surface is described once and drawn twice.
    const { store } = useA2UIStore(MESSAGES)

    return (
        <main className="app">
            <h1>One surface, two catalogs</h1>

            <div className="panels">
                <section className="panel">
                    <h2>Built-in catalog</h2>
                    <A2UIRenderer store={store} locale="en-US" />
                </section>

                <section className="panel">
                    <h2>Text and Button overridden</h2>
                    <A2UIRenderer store={store} sources={BRAND_SOURCES} catalog={BRAND_CATALOG} locale="en-US" />
                </section>
            </div>

            <h1>A component the basic catalog does not have</h1>

            <div className="panels">
                <section className="panel">
                    <h2>Rating, registered by this app</h2>
                    <A2UIRenderer store={store} surfaceId="review" sources={BRAND_SOURCES} catalog={BRAND_CATALOG} locale="en-US" />
                </section>
            </div>
        </main>
    )
}
