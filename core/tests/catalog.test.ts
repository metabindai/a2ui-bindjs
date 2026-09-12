import { BindJSRuntime } from '@metabindai/bindjs-runtime'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BASIC_CATALOG, BASIC_CATALOG_ID } from '../src/engine/catalog'
import { catalogEntry } from '../src/engine/types'
import { renderSurface } from '../src/engine/render'
import type { BindJSRuntimeLike, Catalog } from '../src/engine/types'
import { createStandardRegistry } from '../src/functions/registry'
import { registerCatalog, type RegistrarRuntime } from '../src/catalog/register'
import { SurfaceStore } from '../src/store/SurfaceStore'
import type { A2UIComponent, JsonValue } from '../src/protocol/types'

let runtime: BindJSRuntime
let consoleErrors: unknown[][]

beforeEach(() => {
    runtime = new BindJSRuntime()
    registerCatalog(runtime as unknown as RegistrarRuntime)

    // A body that throws is caught by the runtime and logged, yielding a null AST —
    // so failures surface here rather than as a silent empty render.
    consoleErrors = []
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        consoleErrors.push(args)
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

interface RenderCase {
    components: A2UIComponent[]
    dataModel?: Record<string, JsonValue>
    setValue?: (path: string, value: JsonValue) => void
    onAction?: (message: unknown) => void
}

function render({ components, dataModel, setValue, onAction }: RenderCase) {
    const store = new SurfaceStore()
    store.apply({ createSurface: { surfaceId: 's', components, dataModel } })

    const result = renderSurface({
        runtime: runtime as unknown as BindJSRuntimeLike,
        surface: store.requireSurface('s'),
        catalog: BASIC_CATALOG,
        registry: createStandardRegistry(),
        locale: 'en-US',
        setValue,
        onAction: onAction as never,
    })

    return { ...result, unwrapped: runtime.unwrapComponentAST(result.ast) }
}

function propsOf(ast: unknown): Record<string, unknown> {
    return (ast as { props: { props: Record<string, unknown> } }).props.props
}

// One minimal surface per basic-catalog type, each exercising its required props.
const CASES: Record<string, A2UIComponent[]> = {
    Text: [{ id: 'root', component: 'Text', text: 'Hello **world**', variant: 'h2' }],
    Image: [{ id: 'root', component: 'Image', url: 'https://example.com/a.png', description: 'Alt' }],
    Icon: [{ id: 'root', component: 'Icon', name: 'star.fill' }],
    Video: [{ id: 'root', component: 'Video', url: 'https://example.com/a.mp4' }],
    AudioPlayer: [{ id: 'root', component: 'AudioPlayer', url: 'https://example.com/a.mp3', description: 'Episode 12' }],
    Row: [
        { id: 'root', component: 'Row', justify: 'spaceBetween', children: ['a', 'b'] },
        { id: 'a', component: 'Text', text: 'Left' },
        { id: 'b', component: 'Text', text: 'Right' },
    ],
    Column: [
        { id: 'root', component: 'Column', align: 'center', children: ['a'] },
        { id: 'a', component: 'Text', text: 'Only' },
    ],
    List: [
        { id: 'root', component: 'List', direction: 'horizontal', children: ['a'] },
        { id: 'a', component: 'Text', text: 'Row' },
    ],
    Card: [
        { id: 'root', component: 'Card', child: 'a' },
        { id: 'a', component: 'Text', text: 'Inside' },
    ],
    Tabs: [
        {
            id: 'root',
            component: 'Tabs',
            tabs: [
                { title: 'One', child: 'a' },
                { title: 'Two', child: 'b' },
            ],
        },
        { id: 'a', component: 'Text', text: 'First' },
        { id: 'b', component: 'Text', text: 'Second' },
    ],
    Divider: [{ id: 'root', component: 'Divider' }],
    Modal: [
        { id: 'root', component: 'Modal', trigger: 'a', content: 'b' },
        { id: 'a', component: 'Text', text: 'Open' },
        { id: 'b', component: 'Text', text: 'Body' },
    ],
    Button: [
        { id: 'root', component: 'Button', variant: 'primary', child: 'a', action: { event: { name: 'go' } } },
        { id: 'a', component: 'Text', text: 'Save' },
    ],
    CheckBox: [{ id: 'root', component: 'CheckBox', label: 'Agree', value: true }],
    TextField: [{ id: 'root', component: 'TextField', label: 'Email', value: 'a@b.co', variant: 'shortText' }],
    DateTimeInput: [{ id: 'root', component: 'DateTimeInput', label: 'Departure', value: '2026-02-02' }],
    ChoicePicker: [
        {
            id: 'root',
            component: 'ChoicePicker',
            label: 'Size',
            // Selection mode is `variant`, and `value` is always a list — both are easy
            // to guess wrong, and were.
            variant: 'mutuallyExclusive',
            displayStyle: 'chips',
            value: ['m'],
            options: [
                { label: 'Small', value: 's' },
                { label: 'Medium', value: 'm' },
            ],
        },
    ],
    Slider: [{ id: 'root', component: 'Slider', label: 'Budget', value: 40, min: 0, max: 100, steps: 20 }],
}

describe('basic catalog', () => {
    it('registers every type the catalog map names', () => {
        for (const value of Object.values(BASIC_CATALOG)) {
            const name = catalogEntry(value)!.component

            expect(runtime.components[name], `${name} not registered`).toBeDefined()
        }
    })

    it.each(Object.keys(CASES))('renders %s without runtime errors', (type) => {
        const { unwrapped, diagnostics } = render({ components: CASES[type] })

        expect(diagnostics).toEqual([])
        expect(unwrapped, `${type} produced no AST`).not.toBeNull()
        expect(consoleErrors, `${type} logged a runtime error`).toEqual([])
    })

    it.each([
        ['multipleSelection', 'checkbox'],
        ['multipleSelection', 'chips'],
        ['mutuallyExclusive', 'checkbox'],
    ])('renders ChoicePicker as %s / %s', (variant, displayStyle) => {
        const { unwrapped, diagnostics } = render({
            components: [
                {
                    id: 'root',
                    component: 'ChoicePicker',
                    label: 'Toppings',
                    variant,
                    displayStyle,
                    value: ['cheese'],
                    options: [
                        { label: 'Cheese', value: 'cheese' },
                        { label: 'Basil', value: 'basil' },
                    ],
                },
            ],
        })

        expect(diagnostics).toEqual([])
        expect(unwrapped).not.toBeNull()
        expect(consoleErrors).toEqual([])
    })

    it('writes selection back as a list, even for a single choice', () => {
        const setValue = vi.fn()
        const { unwrapped } = render({
            components: [
                {
                    id: 'root',
                    component: 'ChoicePicker',
                    variant: 'mutuallyExclusive',
                    value: { path: '/size' },
                    options: [
                        { label: 'Small', value: 's' },
                        { label: 'Medium', value: 'm' },
                    ],
                },
            ],
            dataModel: { size: ['s'] },
            setValue,
        })

        // `value` is a DynamicStringList, so a bare value would not round-trip.
        expect(propsOf(unwrapped).value).toEqual(['s'])
        expect(typeof propsOf(unwrapped).setValue).toBe('function')
    })

    it.each(['longText', 'obscured', 'number'])('renders TextField variant %s', (variant) => {
        const { unwrapped } = render({
            components: [{ id: 'root', component: 'TextField', label: 'Field', value: 'x', variant }],
        })

        expect(unwrapped).not.toBeNull()
        expect(consoleErrors).toEqual([])
    })

    it('writes a TextField edit back to the bound path', () => {
        const setValue = vi.fn()
        const { unwrapped } = render({
            components: [{ id: 'root', component: 'TextField', label: 'Email', value: { path: '/contact/email' } }],
            dataModel: { contact: { email: 'a@b.co' } },
            setValue,
        })

        const props = propsOf(unwrapped)
        expect(props.value).toBe('a@b.co')
        ;(props.setValue as (value: JsonValue) => void)('new@b.co')

        expect(setValue).toHaveBeenCalledWith('/contact/email', 'new@b.co')
    })

    it('fires a Button action', () => {
        const onAction = vi.fn()
        const { unwrapped } = render({
            components: [
                { id: 'root', component: 'Button', child: 'a', action: { event: { name: 'go', context: { id: { path: '/id' } } } } },
                { id: 'a', component: 'Text', text: 'Save' },
            ],
            dataModel: { id: 'abc' },
            onAction,
        })

        ;(propsOf(unwrapped).action as () => void)()

        expect(onAction).toHaveBeenCalledOnce()
        expect(onAction.mock.calls[0][0]).toMatchObject({ name: 'go', context: { id: 'abc' } })
    })

    it('keeps a disabled Button renderable', () => {
        const { unwrapped } = render({
            components: [
                { id: 'root', component: 'Button', enabled: false, child: 'a', action: { event: { name: 'go' } } },
                { id: 'a', component: 'Text', text: 'Nope' },
            ],
        })

        expect(unwrapped).not.toBeNull()
        expect(consoleErrors).toEqual([])
    })

    // A subtree hanging off a non-standard slot produces no diagnostic when it is
    // ignored — it just silently never renders. These assert it is actually built.
    it('builds Modal trigger and content, not just the root', () => {
        const { unwrapped, nodeCount, diagnostics } = render({ components: CASES.Modal })

        expect(diagnostics).toEqual([])
        expect(nodeCount).toBe(3)

        const props = propsOf(unwrapped)
        expect(props.trigger).toBeDefined()
        expect(props.content).toBeDefined()
        expect(props.child).toBeUndefined()
    })

    it('builds every Tabs panel and resolves its title', () => {
        const { unwrapped, nodeCount, diagnostics } = render({ components: CASES.Tabs })

        expect(diagnostics).toEqual([])
        expect(nodeCount).toBe(3)

        const tabs = propsOf(unwrapped).tabs as Array<{ title: string; child: unknown }>
        expect(tabs).toHaveLength(2)
        expect(tabs[0].title).toBe('One')
        expect(tabs[0].child).toBeDefined()
        expect(tabs[1].child).toBeDefined()
    })

    it('resolves a dynamic tab title from the data model', () => {
        const { unwrapped } = render({
            components: [
                { id: 'root', component: 'Tabs', tabs: [{ title: { path: '/label' }, child: 'a' }] },
                { id: 'a', component: 'Text', text: 'Panel' },
            ],
            dataModel: { label: 'Bound Title' },
        })

        const tabs = propsOf(unwrapped).tabs as Array<{ title: string }>
        expect(tabs[0].title).toBe('Bound Title')
    })

    it('passes child weights to a Row so it can distribute space', () => {
        const { unwrapped } = render({
            components: [
                { id: 'root', component: 'Row', children: ['a', 'b'] },
                { id: 'a', component: 'Text', text: 'Wide', weight: 2 },
                { id: 'b', component: 'Text', text: 'Narrow' },
            ],
        })

        expect(propsOf(unwrapped).childWeights).toEqual([2, 0])
    })

    it('omits childWeights when no child declares one', () => {
        const { unwrapped } = render({ components: CASES.Row })

        expect(propsOf(unwrapped).childWeights).toBeUndefined()
    })

    it('renders a template-driven List lazily through the catalog', () => {
        const { unwrapped, diagnostics, nodeCount } = render({
            components: [
                { id: 'root', component: 'List', children: { path: '/items', componentId: 'row' } },
                { id: 'row', component: 'Text', text: { path: 'label' } },
            ],
            dataModel: { items: [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }] },
        })

        expect(diagnostics).toEqual([])
        expect(unwrapped).not.toBeNull()
        expect(nodeCount).toBe(1)
        expect(consoleErrors).toEqual([])
    })
})

// Behaviour adopted from the official SwiftUI basic catalog: renderer-side `checks`,
// the spec's neutral icon names, its Image variants, the full set of justify values,
// `Slider.steps`, and the Video poster frame.
describe('parity with the official SwiftUI catalog', () => {
    // The body the component built, without the ComponentCall wrapper that echoes the
    // input props — so a message that was *not* rendered is genuinely absent.
    function rendered(components: A2UIComponent[], dataModel?: Record<string, JsonValue>): string {
        const { ast, diagnostics } = render({ components, dataModel })

        expect(diagnostics).toEqual([])
        expect(consoleErrors).toEqual([])

        return JSON.stringify((ast as { props: { children: unknown } }).props.children)
    }

    function count(text: string, needle: string): number {
        return text.split(needle).length - 1
    }

    const FAILING = [
        { condition: false, message: 'Needs attention' },
        { condition: false, message: 'Second failure' },
    ]

    const INPUTS: Record<string, A2UIComponent> = {
        TextField: { id: 'root', component: 'TextField', label: 'Email', value: 'x', checks: FAILING },
        CheckBox: { id: 'root', component: 'CheckBox', label: 'Agree', value: false, checks: FAILING },
        ChoicePicker: { id: 'root', component: 'ChoicePicker', options: [{ label: 'A', value: 'a' }], value: [], checks: FAILING },
        Slider: { id: 'root', component: 'Slider', label: 'Guests', value: 0, min: 0, max: 10, checks: FAILING },
        DateTimeInput: { id: 'root', component: 'DateTimeInput', label: 'When', value: '', enableDate: true, checks: FAILING },
    }

    it.each(Object.keys(INPUTS))('shows only the first failed check under a %s', (type) => {
        const text = rendered([INPUTS[type]])

        expect(text).toContain('Needs attention')
        expect(text).not.toContain('Second failure')
    })

    it('keeps a passing check silent', () => {
        const text = rendered([
            { id: 'root', component: 'TextField', label: 'Email', value: 'x', checks: [{ condition: true, message: 'Hidden' }] },
        ])

        expect(text).not.toContain('Hidden')
    })

    it('resolves a check condition from the data model', () => {
        const field: A2UIComponent = {
            id: 'root',
            component: 'TextField',
            label: 'Email',
            value: 'x',
            checks: [{ condition: { path: '/agreed' }, message: 'Must agree' }],
        }

        expect(rendered([field], { agreed: false })).toContain('Must agree')
        expect(rendered([field], { agreed: true })).not.toContain('Must agree')
    })

    it('treats a validation function result as a check condition', () => {
        const field: A2UIComponent = {
            id: 'root',
            component: 'TextField',
            label: 'Name',
            value: { path: '/name' },
            checks: [{ condition: { call: 'required', args: { value: { path: '/name' } } }, message: 'Name is required' }],
        }

        expect(rendered([field], { name: '' })).toContain('Name is required')
        expect(rendered([field], { name: 'Ada' })).not.toContain('Name is required')
    })

    it('shows no message row for a failing rule that carries none, but still fails it', () => {
        const body = rendered([{ id: 'root', component: 'TextField', label: 'Email', value: 'x', checks: [{ condition: false }] as never }])

        expect(body).toContain('"rawValue":"red"')
        expect(count(body, '"type":"Text"')).toBe(1)
    })

    it('disables a Button whose checks fail, and only then', () => {
        const label: A2UIComponent = { id: 'a', component: 'Text', text: 'Submit' }
        const gated: A2UIComponent = {
            id: 'root',
            component: 'Button',
            child: 'a',
            checks: [{ condition: false, message: 'Not yet' }],
            action: { event: { name: 'submit' } },
        }
        const open: A2UIComponent = { ...gated, checks: [{ condition: true, message: 'Not yet' }] }

        expect(rendered([gated, label])).toContain('"type":"disabled"')
        expect(rendered([open, label])).not.toContain('"type":"disabled"')
    })

    it.each([
        ['shoppingCart', 'cart'],
        ['favorite', 'heart.fill'],
        ['notAnIcon', 'questionmark.circle'],
    ])('draws Icon %j as the symbol %j', (name, symbol) => {
        expect(rendered([{ id: 'root', component: 'Icon', name }])).toContain(`"systemName":"${symbol}"`)
    })

    it('draws an Icon from svgPath, literal or bound', () => {
        const literal = rendered([{ id: 'root', component: 'Icon', name: { svgPath: 'M12 2L2 22h20z' } }])
        const bound = rendered([{ id: 'root', component: 'Icon', name: { path: '/icon' } }], { icon: { svgPath: 'M0 0h24v24z' } })

        expect(literal).toContain('<svg')
        expect(literal).toContain('M12 2L2 22h20z')
        expect(bound).toContain('M0 0h24v24z')
        expect(literal).not.toContain('systemName')
    })

    it.each(['icon', 'avatar', 'smallFeature', 'mediumFeature', 'largeFeature', 'header'])('renders Image variant %s', (variant) => {
        const text = rendered([{ id: 'root', component: 'Image', url: 'https://example.com/a.png', variant }])

        if (variant === 'avatar') {
            expect(text).toContain('"type":"clipShape"')
        }

        if (variant === 'icon') {
            expect(text).toContain('"width":24')
        }
    })

    it('fits an Image for contain and scaleDown, fills otherwise', () => {
        const fitted = rendered([{ id: 'root', component: 'Image', url: 'https://example.com/a.png', fit: 'scaleDown' }])
        const filled = rendered([{ id: 'root', component: 'Image', url: 'https://example.com/a.png', fit: 'none' }])

        expect(fitted).toContain('"contentMode":"fit"')
        expect(filled).toContain('"contentMode":"fill"')
    })

    it.each([
        ['contain', 'mediumFeature', 'fit'],
        ['scaleDown', 'mediumFeature', 'fit'],
        ['cover', 'mediumFeature', 'fill'],
        ['fill', 'mediumFeature', 'fill'],
        ['none', 'mediumFeature', 'fill'],
        ['contain', 'header', 'fill'],
    ])('sends Image %s/%s scaling to the native image props', (fit, variant, contentMode) => {
        const text = rendered([{ id: 'root', component: 'Image', url: 'https://example.com/a.png', fit, variant }])
        const images: Array<{ props: Record<string, unknown> }> = []
        const visit = (value: unknown) => {
            if (!value || typeof value !== 'object') return
            const node = value as { type?: string; props: Record<string, unknown> }
            if (node.type === 'Image') images.push(node)
            Object.values(value).forEach(visit)
        }
        visit(JSON.parse(text))

        expect(images).toHaveLength(1)
        expect(images[0].props).toMatchObject({ contentMode, resizable: true })
        // A mode-only aspectRatio modifier becomes a 1:1 layout on Android.
        expect(text).not.toContain('"type":"aspectRatio"')
        expect(text).toContain('"minHeight":200')
        expect(text).toContain('"maxHeight":200')
        expect(text).toContain('"type":"clipped"')
    })

    it.each([
        ['smallFeature', 100],
        ['mediumFeature', 200],
        ['largeFeature', 320],
        ['header', 200],
    ])('preserves Image %s height in the Apple flexible frame', (variant, height) => {
        const text = rendered([{ id: 'root', component: 'Image', url: 'https://example.com/a.png', variant }])
        const frames: Array<Record<string, unknown>> = []
        const visit = (value: unknown) => {
            if (!value || typeof value !== 'object') return
            const node = value as { type?: string; props: Record<string, unknown> }
            if (node.type === 'frame') frames.push(node.props)
            Object.values(value).forEach(visit)
        }
        visit(JSON.parse(text))
        const flexible = frames.find((frame) => 'maxWidth' in frame)
        expect(flexible).toMatchObject({ minHeight: height, maxHeight: height })
        expect(flexible).not.toHaveProperty('height')
    })

    it.each(['Row', 'Column'])('distributes %s children for spaceEvenly with a Spacer at each end', (component) => {
        const text = rendered([
            { id: 'root', component, justify: 'spaceEvenly', children: ['a', 'b', 'c'] },
            { id: 'a', component: 'Text', text: 'A' },
            { id: 'b', component: 'Text', text: 'B' },
            { id: 'c', component: 'Text', text: 'C' },
        ])

        expect(count(text, '"type":"Spacer"')).toBe(4)
    })

    it('top-aligns a Row that sets no align, as the spec default stretch reads', () => {
        const row = (align?: string): string =>
            rendered([
                { id: 'root', component: 'Row', ...(align ? { align } : {}), children: ['a'] },
                { id: 'a', component: 'Text', text: 'A' },
            ])

        expect(row()).toContain('"alignment":"top"')
        expect(row('stretch')).toContain('"alignment":"top"')
        expect(row('center')).toContain('"alignment":"center"')
    })

    it('places a Column where its align says, not only its children', () => {
        const column = (align: string): string =>
            rendered([
                { id: 'root', component: 'Column', align, children: ['a'] },
                { id: 'a', component: 'Text', text: 'A' },
            ])

        expect(column('center')).toContain('"alignment":"center"')
        expect(column('center')).not.toContain('"alignment":"leading"')
        expect(column('end')).toContain('"alignment":"trailing"')
    })

    it('leaves a single markdown heading unwrapped so a centred parent can centre it', () => {
        const body = rendered([{ id: 'root', component: 'Text', text: '### Location' }])

        expect(body).toContain('"markdown":"Location"')
        expect(body).not.toContain('"type":"VStack"')
        expect(body).not.toContain('"alignment":"leading"')
    })

    it('gives weighted Row children a share of the width and never a layout priority', () => {
        const body = rendered([
            { id: 'root', component: 'Row', children: ['a', 'b'] },
            { id: 'a', component: 'Text', text: 'A', weight: 2 },
            { id: 'b', component: 'Text', text: 'B', weight: 1 },
        ])

        expect(count(body, '"alignment":"leading"')).toBeGreaterThanOrEqual(2)
        expect(body).not.toContain('layoutPriority')
    })

    it('draws body text on the platform body font', () => {
        expect(rendered([{ id: 'root', component: 'Text', text: 'Hello' }])).toContain('"rawValue":"body"')
    })

    it.each(['spaceAround', 'stretch'])('renders a Row with justify %s', (justify) => {
        rendered([
            { id: 'root', component: 'Row', justify, children: ['a'] },
            { id: 'a', component: 'Text', text: 'A' },
        ])
    })

    it('derives the Slider step from steps and shows the value', () => {
        const text = rendered([{ id: 'root', component: 'Slider', label: 'Budget', value: 40, min: 0, max: 100, steps: 20 }])

        expect(text).toContain('"step":5')
        expect(text).toContain('"rawValue":"40"')
    })

    it('passes a Video poster frame', () => {
        const text = rendered([
            { id: 'root', component: 'Video', url: 'https://example.com/a.mp4', posterUrl: 'https://example.com/p.jpg' },
        ])

        expect(text).toContain('"poster":"https://example.com/p.jpg"')
    })

    it('asks DateTimeInput for a date when neither flag is set', () => {
        const neither = rendered([{ id: 'root', component: 'DateTimeInput', value: '' }])
        const timeOnly = rendered([{ id: 'root', component: 'DateTimeInput', value: '', enableTime: true }])

        expect(neither).toContain('"placeholder":"YYYY-MM-DD"')
        expect(timeOnly).toContain('"placeholder":"HH:MM"')
    })

    // The spec's route to a heading is `# Heading` — `variant` has no heading value — and
    // 19 of its 43 examples take it. Natively, Text handles inline markdown only.
    describe('block markdown in Text', () => {
        function text(value: string, variant?: string): string {
            return rendered([{ id: 'root', component: 'Text', text: value, ...(variant ? { variant } : {}) }])
        }

        it.each([
            ['# Title', 'title'],
            ['## Title', 'title2'],
            ['### Title', 'title3'],
            ['#### Title', 'headline'],
            ['##### Title', 'subheadline'],
        ])('draws %j as a heading on the type ramp', (value, font) => {
            const body = text(value)

            expect(body).toContain('"markdown":"Title"')
            expect(body).toContain(`"rawValue":"${font}"`)
            expect(body).not.toContain('#')
        })

        it('keeps a plain value as one Text', () => {
            expect(text('Just **bold** and _italic_')).not.toContain('"type":"VStack"')
        })

        it('does not read a dash after a space as a list marker', () => {
            expect(text(' - Qty: ')).not.toContain('•')
        })

        it('stacks the blocks of the spec markdown example', () => {
            const body = text('# Heading 1\n\nThis is **bold** text.\n\n- List item 1\n- List item 2\n\n[Link](https://a2ui.org)')

            expect(body).toContain('"type":"VStack"')
            expect(body).toContain('"markdown":"Heading 1"')
            expect(body).toContain('"markdown":"• List item 1"')
            expect(body).toContain('"markdown":"• List item 2"')
            expect(body).toContain('[Link](https://a2ui.org)')
        })

        it('draws numbered lists, quotes and code', () => {
            const body = text('1. One\n2. Two\n\n> Quoted\n\n```\nlet x = 1\n```')

            expect(body).toContain('"markdown":"1. One"')
            expect(body).toContain('"markdown":"Quoted"')
            expect(body).toContain('"type":"Rectangle"')
            expect(body).toContain('"markdown":"let x = 1"')
            expect(body).toContain('"type":"monospaced"')
        })

        it('keeps the caption size for list items in a caption', () => {
            expect(text('- a\n- b', 'caption')).toContain('"rawValue":"caption"')
        })

        it('renders every heading the spec examples write without a literal hash', () => {
            const dir = join(__dirname, '..', '..', 'vendor', 'spec', 'v1_0', 'catalogs', 'basic', 'examples')
            const headings: string[] = []

            for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
                const example = JSON.parse(readFileSync(join(dir, file), 'utf8')) as { messages: Array<Record<string, unknown>> }

                for (const message of example.messages) {
                    for (const payload of Object.values(message)) {
                        const components = (payload as { components?: A2UIComponent[] }).components ?? []

                        for (const component of components) {
                            if (component.component === 'Text' && typeof component.text === 'string' && component.text.startsWith('#')) {
                                headings.push(component.text)
                            }
                        }
                    }
                }
            }

            expect(headings.length).toBeGreaterThanOrEqual(19)

            for (const value of headings) {
                expect(text(value), value).not.toContain('"markdown":"#')
            }
        })
    })

    // The filter text has nowhere to live in the A2UI properties, so it is a BindJS
    // hook — which the engine notices for itself now rather than being told. Nothing on
    // the catalog entry says so; `engine/hookState.ts` watches the runtime instead.
    it('keeps ChoicePicker filter text in the component', () => {
        const text = rendered([
            { id: 'root', component: 'ChoicePicker', filterable: true, value: [], options: [{ label: 'A', value: 'a' }] },
        ])

        expect(text).toContain('Search options')
    })
})

describe('non-string bindings', () => {
    // A2UI's DynamicString resolves to whatever the data model holds, so a binding to a
    // number or boolean arrives as one. A builder that throws on it takes out the entire
    // surface, because bindjs-react's ErrorBoundary falls back to an empty div — the
    // failure is silent and total, so it is worth pinning per component.
    it.each([
        ['number', 4.9],
        ['boolean', true],
        ['zero', 0],
        ['null', null],
    ])('renders Text bound to %s', (_label, value) => {
        const { unwrapped, diagnostics } = render({
            components: [{ id: 'root', component: 'Text', text: { path: '/v' } }],
            dataModel: { v: value as JsonValue },
        })

        expect(diagnostics).toEqual([])
        expect(unwrapped).not.toBeNull()
        expect(consoleErrors).toEqual([])
    })

    it.each([
        ['Icon', 'name'],
        ['CheckBox', 'label'],
        ['Slider', 'label'],
        ['TextField', 'label'],
        ['DateTimeInput', 'label'],
        ['Image', 'description'],
    ])('renders %s with a numeric %s', (component, prop) => {
        const { unwrapped, diagnostics } = render({
            components: [{ id: 'root', component, [prop]: { path: '/v' }, url: 'https://example.com/a.png' }],
            dataModel: { v: 42 },
        })

        expect(diagnostics).toEqual([])
        expect(unwrapped).not.toBeNull()
        expect(consoleErrors).toEqual([])
    })
})

describe('catalog resolution', () => {
    const CUSTOM_ID = 'https://metabind.ai/a2ui/catalogs/demo/catalog.json'
    const DEMO_TEXT = 'exports.default = defineComponent({ body: (props) => Text(props.text), properties: {} })'

    function renderWith(components: A2UIComponent[], catalogs?: Record<string, Catalog>, catalogId?: string) {
        const store = new SurfaceStore()
        store.apply({ createSurface: { surfaceId: 's', catalogId, components } })

        return renderSurface({
            runtime: runtime as unknown as BindJSRuntimeLike,
            surface: store.requireSurface('s'),
            catalog: BASIC_CATALOG,
            catalogs,
            registry: createStandardRegistry(),
        })
    }

    it('renders through the surface catalog when it is the default one', () => {
        const result = renderWith([{ id: 'root', component: 'Text', text: 'hi' }], undefined, BASIC_CATALOG_ID)

        expect(result.diagnostics).toEqual([])
        expect(result.ast).toBeDefined()
    })

    it('renders through a registered custom catalog', () => {
        runtime.registerComponent('DemoText', DEMO_TEXT)

        const result = renderWith([{ id: 'root', component: 'Text', text: 'hi' }], { [CUSTOM_ID]: { Text: 'DemoText' } }, CUSTOM_ID)

        expect(result.diagnostics).toEqual([])
        expect(propsOf(runtime.unwrapComponentAST(result.ast)).text).toBe('hi')
    })

    it("lets a component override its surface's catalog", () => {
        runtime.registerComponent('DemoText', DEMO_TEXT)

        const result = renderWith(
            [
                { id: 'root', component: 'Column', children: ['a'] },
                { id: 'a', component: 'Text', text: 'hi', catalogId: CUSTOM_ID },
            ],
            { [CUSTOM_ID]: { Text: 'DemoText' } },
            BASIC_CATALOG_ID
        )

        expect(result.diagnostics).toEqual([])

        const rendered = JSON.stringify(runtime.unwrapComponentAST(result.ast))
        expect(rendered).toContain('DemoText')
        expect(rendered).toContain('A2UIColumn')
    })
})
