/**
 * Components of the app's own, in an agent's surface.
 *
 * Two of them replace what the basic catalog already has, and two it does not have at
 * all. Nothing about the A2UI messages changes between the screens: the agent describes
 * *what* to show, the catalog decides *how* it looks.
 *
 * A catalog is a map from A2UI component type to the name of a registered BindJS
 * component, so overriding one means supplying the component and changing one entry.
 * There is no runtime to build here: `sources` and `catalog` are enough, and the renderer
 * registers them on the runtime it already owns.
 */
import { useState } from 'react'
import {
    BASIC_CATALOG,
    type ActionMessage,
    type AgentMessage,
    type Catalog,
    type Diagnostic,
    type JsonValue,
    type SurfaceStore,
} from '@metabindai/a2ui-bindjs'
import { A2UIRenderer, useA2UIStore } from '@metabindai/a2ui-bindjs-react'
import { DASHBOARD_CATALOG, DASHBOARD_MESSAGES, DASHBOARD_SOURCES } from './dashboard'
import { FLIGHT_CATALOG, FLIGHT_MESSAGES, FLIGHT_SOURCES } from './flights'
import { HABITAT_CATALOG, HABITAT_MESSAGES, HABITAT_SOURCES } from './habitat'

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
//
// An index in two sections and a screen behind each row, the same shape as the iOS and
// Android examples. Nothing here describes an offer card, a star, a flight, a chart or a
// deck of cards; that arrives as A2UI and a catalog draws it.

const SCREENS = {
    offer: 'Offer card',
    overrides: 'Overrides',
    rating: 'Rating',
    flights: 'Flight search',
    dashboard: 'Sales dashboard',
    habitat: 'Habitat sort',
} as const

type Screen = keyof typeof SCREENS

interface LoggedAction {
    id: number
    screen: Screen
    name: string
    payload: Array<[string, string]>
    at: string
}

/**
 * Every surface the example shows, in one stream.
 *
 * A module constant, not an array built in the component: `useA2UIStore` applies what it
 * is handed when the identity changes, so a fresh literal each render would re-apply the
 * stream, re-render, and build another literal.
 */
const ALL_MESSAGES: AgentMessage[] = [...MESSAGES, ...FLIGHT_MESSAGES, ...DASHBOARD_MESSAGES, ...HABITAT_MESSAGES]

let nextActionId = 0

/** Sorted by key, because an object has no order a reader can rely on. */
function pairs(context: Record<string, JsonValue> | undefined): Array<[string, string]> {
    return Object.entries(context ?? {})
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)])
}

export function App() {
    // One store for every surface. The screens differ in which catalog draws them, not in
    // what the agent said.
    const { store } = useA2UIStore(ALL_MESSAGES)

    const [screen, setScreen] = useState<Screen | null>(null)
    const [actions, setActions] = useState<LoggedAction[]>([])
    // Keyed by screen *and* slot: the Rating screen draws two renderers, and one of them
    // is meant to fail. Sharing a slot would let whichever reported last erase the other.
    const [diagnostics, setDiagnostics] = useState<Record<string, string[]>>({})
    const [showingActivity, setShowingActivity] = useState(false)

    if (screen === null) {
        return <Index onOpen={setScreen} />
    }

    // Only the visible screen can dispatch or fail, so tagging with it is enough to keep
    // one screen from reporting another's work.
    const record = (message: ActionMessage) => {
        setActions((current) =>
            [{ id: nextActionId++, screen, name: message.name, payload: pairs(message.context), at: new Date().toLocaleTimeString() }, ...current].slice(0, 12)
        )
    }

    const report = (slot: string) => (found: Diagnostic[]) => {
        setDiagnostics((current) => ({ ...current, [`${screen}:${slot}`]: found.map((entry) => entry.message) }))
    }

    const mine = actions.filter((entry) => entry.screen === screen)
    const failures = Object.entries(diagnostics)
        .filter(([key]) => key.startsWith(`${screen}:`))
        .flatMap(([, messages]) => messages)

    return (
        <main className="app">
            <header className="bar">
                <button className="back" onClick={() => setScreen(null)}>
                    ← Back
                </button>
                <h1>{SCREENS[screen]}</h1>
            </header>

            <Surfaces screen={screen} store={store} onAction={record} onDiagnostics={report} />

            <ActivityPill actions={mine.length} diagnostics={failures.length} onOpen={() => setShowingActivity(true)} />

            {showingActivity && <ActivitySheet actions={mine} diagnostics={failures} onClose={() => setShowingActivity(false)} />}
        </main>
    )
}

// ─── Index ───────────────────────────────────────────────────────────────────

function Index({ onOpen }: { onOpen(screen: Screen): void }) {
    return (
        <main className="app">
            <h1>A2UI Custom Catalog</h1>

            {/* Types the bundled catalog already has: as it ships, and restyled. */}
            <h2 className="section">Built-in catalog</h2>
            <IndexRow screen="offer" onOpen={onOpen} />
            <IndexRow screen="overrides" onOpen={onOpen} />

            {/* Types it does not have at all. */}
            <h2 className="section">Custom components</h2>
            <IndexRow screen="rating" onOpen={onOpen} />
            <IndexRow screen="flights" onOpen={onOpen} />
            <IndexRow screen="dashboard" onOpen={onOpen} />
            <IndexRow screen="habitat" onOpen={onOpen} />
        </main>
    )
}

function IndexRow({ screen, onOpen }: { screen: Screen; onOpen(screen: Screen): void }) {
    return (
        <button className="row" onClick={() => onOpen(screen)}>
            {SCREENS[screen]}
        </button>
    )
}

// ─── Surfaces ────────────────────────────────────────────────────────────────

interface SurfacesProps {
    screen: Screen
    store: SurfaceStore
    onAction(message: ActionMessage): void
    onDiagnostics(slot: string): (found: Diagnostic[]) => void
}

function Surfaces({ screen, store, onAction, onDiagnostics }: SurfacesProps) {
    const shared = { store, locale: 'en-US', onAction, onDiagnostics: onDiagnostics('surface') }

    if (screen === 'offer') {
        return <A2UIRenderer {...shared} surfaceId="main" />
    }

    if (screen === 'overrides') {
        return <A2UIRenderer {...shared} surfaceId="main" sources={BRAND_SOURCES} catalog={BRAND_CATALOG} />
    }

    if (screen === 'flights') {
        return <A2UIRenderer {...shared} surfaceId="flights" sources={FLIGHT_SOURCES} catalog={FLIGHT_CATALOG} />
    }

    if (screen === 'dashboard') {
        return <A2UIRenderer {...shared} surfaceId="dashboard" sources={DASHBOARD_SOURCES} catalog={DASHBOARD_CATALOG} />
    }

    if (screen === 'habitat') {
        return <A2UIRenderer {...shared} surfaceId="habitat" sources={HABITAT_SOURCES} catalog={HABITAT_CATALOG} />
    }

    // The same surface on a renderer that was never told about `Rating`, so the two
    // outcomes sit side by side. Why the second is empty is in the sheet.
    return (
        <>
            <A2UIRenderer {...shared} surfaceId="review" sources={BRAND_SOURCES} catalog={BRAND_CATALOG} />

            <section className="panel">
                <h2>Without the catalog</h2>
                <A2UIRenderer store={store} locale="en-US" surfaceId="review" onDiagnostics={onDiagnostics('without')} />
            </section>
        </>
    )
}

// ─── What a surface says back ────────────────────────────────────────────────

function ActivityPill({ actions, diagnostics, onOpen }: { actions: number; diagnostics: number; onOpen(): void }) {
    if (actions === 0 && diagnostics === 0) {
        return null
    }

    return (
        <button className="pill" onClick={onOpen}>
            {actions > 0 && <span>{counted(actions, 'Action')}</span>}
            {actions > 0 && diagnostics > 0 && <span className="dot">·</span>}
            {diagnostics > 0 && <span className="failed">{counted(diagnostics, 'Diagnostic')}</span>}
            <ChevronUp />
        </button>
    )
}

/** Drawn, because the glyphs that look like a chevron are not one — `⌃` is the control key. */
function ChevronUp() {
    return (
        <svg className="chevron" width="10" height="7" viewBox="0 0 10 7" aria-hidden="true">
            <path d="M1 6L5 2l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function counted(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? '' : 's'}`
}

interface SheetProps {
    actions: LoggedAction[]
    diagnostics: string[]
    onClose(): void
}

function ActivitySheet({ actions, diagnostics, onClose }: SheetProps) {
    return (
        <div className="scrim" onClick={onClose}>
            <div className="sheet" onClick={(event) => event.stopPropagation()}>
                <header>
                    <h2>Activity</h2>
                    <button onClick={onClose}>Done</button>
                </header>

                {diagnostics.length > 0 && (
                    <section>
                        <h3>Diagnostics</h3>
                        {diagnostics.map((message, index) => (
                            <p className="failure" key={index}>
                                {message}
                            </p>
                        ))}
                    </section>
                )}

                {actions.length > 0 && (
                    <section>
                        <h3>Actions</h3>
                        {actions.map((entry) => (
                            <article key={entry.id}>
                                <div className="name">
                                    <strong>{entry.name}</strong>
                                    <time>{entry.at}</time>
                                </div>

                                {entry.payload.map(([key, value]) => (
                                    <div className="pair" key={key}>
                                        <span>{key}</span>
                                        <code>{value}</code>
                                    </div>
                                ))}
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </div>
    )
}
