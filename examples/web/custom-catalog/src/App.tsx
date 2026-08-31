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
        if (props.variant === 'h2') {
            return Text({ markdown: props.text })
                .font('title2')
                .fontWeight('bold')
                .foregroundStyle(Color('#5b21b6'))
        }

        return Text({ markdown: props.text }).font('subheadline')
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

// Only the two being overridden are supplied. The renderer fills in whatever the catalog
// names and the runtime does not have — Card and Column still come from the built-in
// catalog — and never replaces what is already registered, which is what makes an
// override win.
//
// Both are module constants rather than built in the component, so their identity is
// stable across renders.
const BRAND_SOURCES = { BrandText: BRAND_TEXT, BrandButton: BRAND_BUTTON }

const BRAND_CATALOG: Catalog = {
    ...BASIC_CATALOG,
    Text: 'BrandText',
    Button: 'BrandButton',
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
        </main>
    )
}
