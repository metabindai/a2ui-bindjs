import { BindJSRuntime } from '@metabindai/bindjs-runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createStandardRegistry } from '../src/functions/registry'
import { renderSurface } from '../src/engine/render'
import type { BindJSRuntimeLike, Catalog } from '../src/engine/types'
import { SurfaceStore } from '../src/store/SurfaceStore'
import type { AgentMessage } from '../src/protocol/types'
import { fixture } from './helpers'

// Stub catalog components: presentational shells that just render their children,
// so the tests assert what the engine passes rather than how anything looks.
const STUB_SOURCE = `
exports.default = defineComponent({
    body: (props, children) => VStack(children ?? []),
    properties: {}
})
`

const CATALOG: Catalog = {
    Text: 'StubText',
    Column: 'StubColumn',
    Row: 'StubRow',
    List: 'StubList',
    Button: 'StubButton',
    TextField: 'StubTextField',
}

let runtime: BindJSRuntime

beforeEach(() => {
    runtime = new BindJSRuntime()

    for (const name of Object.values(CATALOG)) {
        runtime.registerComponent(name, STUB_SOURCE)
    }
})

function storeWith(messages: AgentMessage[]): SurfaceStore {
    const store = new SurfaceStore()
    store.applyAll(messages)

    return store
}

interface RenderArgs {
    messages: AgentMessage[]
    surfaceId: string
    onAction?: (message: unknown) => void
    setValue?: (path: string, value: unknown) => void
    catalog?: Catalog
}

function render({ messages, surfaceId, onAction, setValue, catalog = CATALOG }: RenderArgs) {
    const store = storeWith(messages)
    const result = renderSurface({
        runtime: runtime as unknown as BindJSRuntimeLike,
        surface: store.requireSurface(surfaceId),
        catalog,
        registry: createStandardRegistry(),
        locale: 'en-US',
        onAction: onAction as never,
        setValue: setValue as never,
    })

    return { ...result, store, unwrapped: result.ast === undefined ? undefined : runtime.unwrapComponentAST(result.ast) }
}

/** ComponentCall AST nodes carry `{ name, props, children }`. */
function callNode(ast: unknown): { name: string; props: Record<string, unknown>; children: unknown[] } {
    const node = ast as { type: string; props: { name: string; props: Record<string, unknown>; children: unknown[] } }
    expect(node.type).toBe('ComponentCall')

    return node.props
}

/**
 * The stub catalog components render `VStack(children)`, so a node's built children sit
 * one level in: ComponentCall → VStack → children.
 */
function stubChildren(ast: unknown): Array<{ type: string; props: Record<string, unknown> }> {
    const wrapper = callNode(ast).children[0] as { props: { children: Array<{ type: string; props: Record<string, unknown> }> } }

    return wrapper.props.children
}

function findByType(ast: unknown, type: string, found: unknown[] = []): unknown[] {
    if (ast && typeof ast === 'object') {
        const node = ast as { type?: string }

        if (node.type === type) {
            found.push(ast)
        }

        for (const value of Object.values(ast)) {
            findByType(value, type, found)
        }
    }

    return found
}

describe('renderSurface', () => {
    it('builds the root component with resolved props', () => {
        const { unwrapped, diagnostics, nodeCount } = render({
            messages: fixture('profile-card').slice(0, 1),
            surfaceId: 'user_profile_card',
        })

        expect(diagnostics).toEqual([])

        const root = callNode(unwrapped)
        expect(root.name).toBe('StubColumn')
        expect(nodeCount).toBe(5)
    })

    it('passes A2UI property names through unchanged', () => {
        const { unwrapped } = render({
            messages: [
                {
                    createSurface: {
                        surfaceId: 's',
                        components: [{ id: 'root', component: 'Text', text: { path: '/name' }, variant: 'h1' }],
                        dataModel: { name: 'Ada' },
                    },
                },
            ],
            surfaceId: 's',
        })

        expect(callNode(unwrapped).props).toMatchObject({ text: 'Ada', variant: 'h1' })
    })

    it('emits a lazy ForEach for template children', () => {
        const { unwrapped, nodeCount, diagnostics } = render({
            messages: fixture('employee-list').slice(0, 1),
            surfaceId: 'employees',
        })

        expect(diagnostics).toEqual([])

        const forEachNodes = findByType(unwrapped, 'ForEach') as Array<{ props: { count: number; functionId: string } }>
        expect(forEachNodes).toHaveLength(1)
        expect(forEachNodes[0].props.count).toBe(2)

        // The template subtree is NOT expanded: only List itself was built.
        expect(nodeCount).toBe(1)
    })

    it('scopes relative paths per template row when a row is built', () => {
        const store = storeWith(fixture('employee-list').slice(0, 1))
        const built: string[] = []

        // Re-render with a catalog whose Text stub records the text it received.
        runtime.registerComponent('RecordingText', STUB_SOURCE)

        const result = renderSurface({
            runtime: runtime as unknown as BindJSRuntimeLike,
            surface: store.requireSurface('employees'),
            catalog: { ...CATALOG, Text: 'RecordingText' },
            registry: createStandardRegistry(),
        })

        // Invoke the stored ForEach callback the way a renderer would.
        const unwrapped = runtime.unwrapComponentAST(result.ast)
        const [forEach] = findByType(unwrapped, 'ForEach') as Array<{ props: { functionId: string; dataId: string } }>
        const rows = runtime.restoreData(forEach.props.dataId) as unknown[]

        rows.forEach((row, index) => {
            const component = runtime.callForEachFunction(forEach.props.functionId, row, index)
            const rowAst = runtime.unwrapComponentAST(component)
            const texts = findByType(rowAst, 'ComponentCall') as Array<{ props: { name: string; props: { text?: string } } }>

            for (const text of texts) {
                if (text.props.name === 'RecordingText' && text.props.props.text) {
                    built.push(text.props.props.text)
                }
            }
        })

        expect(built).toContain('Ada')
        expect(built).toContain('Grace')
        expect(built).toContain('Acme')
    })

    it('injects a set<Prop> writer for every path-bound prop', () => {
        const setValue = vi.fn()
        const { unwrapped } = render({
            messages: [
                {
                    createSurface: {
                        surfaceId: 's',
                        components: [{ id: 'root', component: 'TextField', label: 'Email', value: { path: '/contact/email' } }],
                        dataModel: { contact: { email: 'a@b.co' } },
                    },
                },
            ],
            surfaceId: 's',
            setValue,
        })

        const props = callNode(unwrapped).props
        expect(props.value).toBe('a@b.co')
        expect(typeof props.setValue).toBe('function')
        expect(props.setLabel).toBeUndefined()

        ;(props.setValue as (value: unknown) => void)('new@b.co')
        expect(setValue).toHaveBeenCalledWith('/contact/email', 'new@b.co')
    })

    it('dispatches actions with a resolved context', () => {
        const onAction = vi.fn()
        const { unwrapped } = render({
            messages: fixture('profile-card').slice(0, 1),
            surfaceId: 'user_profile_card',
            onAction,
        })

        const button = (findByType(unwrapped, 'ComponentCall') as Array<{ props: { name: string; props: Record<string, unknown> } }>).find(
            (node) => node.props.name === 'StubButton'
        )

        expect(button).toBeDefined()
        ;(button!.props.props.action as () => void)()

        expect(onAction).toHaveBeenCalledOnce()
        expect(onAction.mock.calls[0][0]).toMatchObject({
            name: 'submit_form',
            surfaceId: 'user_profile_card',
            sourceComponentId: 'submit_button',
            context: { itemId: '123', email: 'john@example.com' },
        })

        // sendDataModel was true on this surface, so the model rides along.
        expect(onAction.mock.calls[0][0].dataModel).toMatchObject({ name: 'John Doe' })
    })

    it('runs a functionCall action through the registry', () => {
        const openUrl = vi.fn()
        const store = storeWith([
            {
                createSurface: {
                    surfaceId: 's',
                    components: [
                        {
                            id: 'root',
                            component: 'Button',
                            action: { functionCall: { call: 'openUrl', args: { url: 'https://example.com' } } },
                        },
                    ],
                },
            },
        ])

        const result = renderSurface({
            runtime: runtime as unknown as BindJSRuntimeLike,
            surface: store.requireSurface('s'),
            catalog: CATALOG,
            registry: createStandardRegistry(),
            openUrl,
        })

        const props = callNode(runtime.unwrapComponentAST(result.ast)).props
        ;(props.action as () => void)()

        expect(openUrl).toHaveBeenCalledWith('https://example.com', undefined)
    })
})

describe('renderSurface diagnostics', () => {
    it('reports a missing root', () => {
        const { ast, diagnostics } = render({
            messages: [{ createSurface: { surfaceId: 's', components: [{ id: 'other', component: 'Text', text: 'x' }] } }],
            surfaceId: 's',
        })

        expect(ast).toBeUndefined()
        expect(diagnostics[0].code).toBe('MISSING_ROOT')
    })

    it('reports an unknown component type but keeps its siblings', () => {
        const { unwrapped, diagnostics } = render({
            messages: [
                {
                    createSurface: {
                        surfaceId: 's',
                        components: [
                            { id: 'root', component: 'Column', children: ['a', 'b'] },
                            { id: 'a', component: 'Nonesuch' },
                            { id: 'b', component: 'Text', text: 'kept' },
                        ],
                    },
                },
            ],
            surfaceId: 's',
        })

        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({ code: 'UNKNOWN_COMPONENT', componentId: 'a' })

        const children = stubChildren(unwrapped)
        expect(children).toHaveLength(2)
        expect(children[0].type).toBe('Empty')
        expect((children[1].props as { name: string }).name).toBe('StubText')
    })

    it('keeps a failed child in position so siblings do not inherit its hook state', () => {
        const { unwrapped, diagnostics } = render({
            messages: [
                {
                    createSurface: {
                        surfaceId: 's',
                        components: [
                            { id: 'root', component: 'Column', children: ['ghost', 'b', 'c'] },
                            { id: 'b', component: 'Text', text: 'B' },
                            { id: 'c', component: 'Text', text: 'C' },
                        ],
                    },
                },
            ],
            surfaceId: 's',
        })

        expect(diagnostics[0].code).toBe('MISSING_COMPONENT')

        // Three slots, not two: the runtime keys hook storage on sibling index, so a
        // dropped child would move B and C onto the previous siblings' state.
        const children = stubChildren(unwrapped)
        expect(children).toHaveLength(3)
        expect(children[0].type).toBe('Empty')
    })

    it('reports a surface asking for an unsupported catalog', () => {
        const { ast, diagnostics } = render({
            messages: [
                {
                    createSurface: {
                        surfaceId: 's',
                        catalogId: 'https://example.com/catalogs/unknown.json',
                        components: [{ id: 'root', component: 'Text', text: 'x' }],
                    },
                },
            ],
            surfaceId: 's',
        })

        // Strict resolution: an unknown catalog is an error, never a quiet fallback.
        expect(ast).toBeUndefined()
        expect(diagnostics[0]).toMatchObject({ code: 'UNKNOWN_CATALOG' })
        expect(diagnostics[0].message).toContain('unknown.json')
    })

    it('reports a catalog entry whose component is not registered', () => {
        const { ast, diagnostics } = render({
            messages: [{ createSurface: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'x' }] } }],
            surfaceId: 's',
            catalog: { ...CATALOG, Text: 'NeverRegistered' },
        })

        // Without the check this renders as a silent null rather than saying why.
        expect(ast).toBeUndefined()
        expect(diagnostics[0]).toMatchObject({ code: 'UNREGISTERED_COMPONENT', componentId: 'root' })
        expect(diagnostics[0].message).toContain('NeverRegistered')
    })

    it('reports a dangling child reference', () => {
        const { diagnostics } = render({
            messages: [
                {
                    createSurface: {
                        surfaceId: 's',
                        components: [{ id: 'root', component: 'Column', children: ['ghost'] }],
                    },
                },
            ],
            surfaceId: 's',
        })

        expect(diagnostics[0]).toMatchObject({ code: 'MISSING_COMPONENT', componentId: 'ghost' })
    })

    it('breaks cycles instead of hanging', () => {
        const { diagnostics } = render({
            messages: [
                {
                    createSurface: {
                        surfaceId: 's',
                        components: [
                            { id: 'root', component: 'Column', children: ['a'] },
                            { id: 'a', component: 'Column', children: ['root'] },
                        ],
                    },
                },
            ],
            surfaceId: 's',
        })

        expect(diagnostics[0].code).toBe('CYCLE')
    })

    it('reports a template path that is not an array', () => {
        const { diagnostics } = render({
            messages: [
                {
                    createSurface: {
                        surfaceId: 's',
                        components: [
                            { id: 'root', component: 'List', children: { path: '/nope', componentId: 'row' } },
                            { id: 'row', component: 'Text', text: 'x' },
                        ],
                        dataModel: {},
                    },
                },
            ],
            surfaceId: 's',
        })

        expect(diagnostics[0].code).toBe('TEMPLATE_NOT_ARRAY')
    })

    it('reports a failed function call without aborting the render', () => {
        const { unwrapped, diagnostics } = render({
            messages: [
                {
                    createSurface: {
                        surfaceId: 's',
                        components: [{ id: 'root', component: 'Text', text: { call: 'noSuchFunction' } }],
                    },
                },
            ],
            surfaceId: 's',
        })

        expect(diagnostics[0].code).toBe('RESOLVE_FAILED')
        expect(callNode(unwrapped).name).toBe('StubText')
    })
})
