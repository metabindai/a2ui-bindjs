/**
 * Memoisation across renders.
 *
 * A `RenderSession` reuses a subtree whose inputs are unchanged, so a stream of updates
 * only re-invokes the components that actually depend on what changed.
 */
import { BindJSRuntime } from '@metabindai/bindjs-runtime'
import { beforeEach, describe, expect, it } from 'vitest'

import { BASIC_CATALOG } from '../src/engine/catalog'
import { RenderSession } from '../src/engine/render'
import type { BindJSRuntimeLike } from '../src/engine/types'
import { createStandardRegistry } from '../src/functions/registry'
import { registerCatalog, type RegistrarRuntime } from '../src/catalog/register'
import { SurfaceStore } from '../src/store/SurfaceStore'
import type { A2UIComponent, JsonValue } from '../src/protocol/types'

let runtime: BindJSRuntime
let session: RenderSession
let store: SurfaceStore
let registry: ReturnType<typeof createStandardRegistry>

beforeEach(() => {
    runtime = new BindJSRuntime()
    registerCatalog(runtime as unknown as RegistrarRuntime)
    session = new RenderSession()
    store = new SurfaceStore()

    // Held across renders: a new registry object means new function implementations,
    // which the session treats as invalidating every cached subtree.
    registry = createStandardRegistry()
})

function draw() {
    return session.render({
        runtime: runtime as unknown as BindJSRuntimeLike,
        surface: store.requireSurface('s'),
        catalog: BASIC_CATALOG,
        registry,
        locale: 'en-US',
    })
}

/** Every string rendered anywhere in the tree, in order. */
function texts(ast: unknown, found: string[] = []): string[] {
    if (Array.isArray(ast)) {
        ast.forEach((entry) => texts(entry, found))

        return found
    }

    if (ast && typeof ast === 'object') {
        const node = ast as { type?: string; props?: Record<string, unknown> }

        if (node.type === 'Text' && typeof node.props?.markdown === 'string') {
            found.push(node.props.markdown)
        }

        for (const value of Object.values(ast)) {
            texts(value, found)
        }
    }

    return found
}

/** A Column of `count` Text nodes, each bound to its own slot in `/items`. */
function listSurface(count: number): A2UIComponent[] {
    const components: A2UIComponent[] = [{ id: 'root', component: 'Column', children: Array.from({ length: count }, (_, i) => `t${i}`) }]

    for (let i = 0; i < count; i++) {
        components.push({ id: `t${i}`, component: 'Text', text: { path: `/items/${i}` } })
    }

    return components
}

function seed(count: number): void {
    store.apply({
        createSurface: {
            surfaceId: 's',
            components: listSurface(count) as never,
            dataModel: { items: Array.from({ length: count }, (_, i) => `item ${i}`) as JsonValue },
        },
    })
}

describe('RenderSession memoisation', () => {
    it('builds everything on the first render', () => {
        seed(20)

        const first = draw()

        expect(first.nodeCount).toBe(21)
        expect(first.reused).toBe(0)
    })

    it('rebuilds only the branch a data change touches', () => {
        seed(20)
        draw()

        store.apply({ updateDataModel: { surfaceId: 's', path: '/items/7', value: 'CHANGED' } })

        const second = draw()

        // The changed Text and its Column ancestor; every other Text is reused.
        expect(second.nodeCount).toBe(2)
        expect(second.reused).toBe(19)
    })

    it('reuses the whole tree when nothing changed', () => {
        seed(20)
        draw()

        const second = draw()

        expect(second.nodeCount).toBe(0)
        expect(second.reused).toBe(1)
    })

    it('renders the same output whether or not subtrees were reused', () => {
        seed(5)

        const cold = draw()
        const coldTexts = texts(cold.ast)

        store.apply({ updateDataModel: { surfaceId: 's', path: '/items/2', value: 'CHANGED' } })

        const warm = draw()

        expect(warm.reused).toBeGreaterThan(0)
        expect(texts(warm.ast)).toEqual(coldTexts.map((text, index) => (index === 2 ? 'CHANGED' : text)))

        // A cold session must agree with the memoised one.
        const fresh = new RenderSession().render({
            runtime: runtime as unknown as BindJSRuntimeLike,
            surface: store.requireSurface('s'),
            catalog: BASIC_CATALOG,
            registry,
            locale: 'en-US',
        })

        expect(texts(warm.ast)).toEqual(texts(fresh.ast))
    })

    it('invalidates when a component definition is replaced', () => {
        seed(5)
        draw()

        store.apply({
            updateComponents: {
                surfaceId: 's',
                components: [{ id: 't3', component: 'Text', text: 'replaced', variant: 'h1' }],
            },
        })

        const second = draw()

        expect(second.nodeCount).toBe(2)
        expect(texts(second.ast)).toContain('replaced')
    })

    it('invalidates a parent when a descendant changes', () => {
        store.apply({
            createSurface: {
                surfaceId: 's',
                components: [
                    { id: 'root', component: 'Column', children: ['card'] },
                    { id: 'card', component: 'Card', child: 'deep' },
                    { id: 'deep', component: 'Text', text: { path: '/label' } },
                ],
                dataModel: { label: 'before' },
            },
        })

        draw()
        store.apply({ updateDataModel: { surfaceId: 's', path: '/label', value: 'after' } })

        const second = draw()

        // root, card and deep all rebuild — the change is inside the subtree they embed.
        expect(second.nodeCount).toBe(3)
        expect(second.reused).toBe(0)
        expect(texts(second.ast)).toContain('after')
    })

    // Modal and Tabs hold their own state, so a cached subtree would freeze them in
    // whatever state they were last built with.
    it('never memoises a stateful component, and rebuilds its ancestors', () => {
        store.apply({
            createSurface: {
                surfaceId: 's',
                components: [
                    { id: 'root', component: 'Column', children: ['modal', 'label'] },
                    { id: 'modal', component: 'Modal', trigger: 'trg', content: 'body' },
                    { id: 'trg', component: 'Text', text: 'Open me' },
                    { id: 'body', component: 'Text', text: 'Inside' },
                    { id: 'label', component: 'Text', text: { path: '/name' } },
                ],
                dataModel: { name: 'Before' },
            },
        })

        draw()
        store.apply({ updateDataModel: { surfaceId: 's', path: '/unrelated', value: 1 } })

        const second = draw()

        // root and modal rebuild; the Modal's own trigger is reused beneath it.
        expect(second.nodeCount).toBeGreaterThanOrEqual(2)
        expect(second.reused).toBeGreaterThan(0)
    })

    // A cached subtree handed to a named prop must still look like a component: BindJS
    // builders overload on `typeof arg === 'object'`, so a bare AST object is misread
    // (`Button(label, action)` treats it as `{ action, label }` and finds no label).
    it('keeps a reused subtree usable in a named prop slot', () => {
        store.apply({
            createSurface: {
                surfaceId: 's',
                components: [
                    { id: 'root', component: 'Column', children: ['modal'] },
                    { id: 'modal', component: 'Modal', trigger: 'trg', content: 'body' },
                    { id: 'trg', component: 'Text', text: 'Open me' },
                    { id: 'body', component: 'Text', text: 'Inside' },
                ],
                dataModel: {},
            },
        })

        const first = draw()
        expect(texts(first.ast)).toContain('Open me')

        store.apply({ updateDataModel: { surfaceId: 's', path: '/tick', value: 1 } })

        const second = draw()

        expect(second.reused).toBeGreaterThan(0)
        expect(second.diagnostics).toEqual([])
        expect(texts(second.ast)).toContain('Open me')
    })

    it('does not reuse across a different surface', () => {
        seed(5)
        draw()

        store.apply({ createSurface: { surfaceId: 'other', components: listSurface(2) as never, dataModel: { items: ['a', 'b'] } } })

        const other = session.render({
            runtime: runtime as unknown as BindJSRuntimeLike,
            surface: store.requireSurface('other'),
            catalog: BASIC_CATALOG,
            registry,
            locale: 'en-US',
        })

        expect(other.reused).toBe(0)
    })

    // Reused subtrees are shared objects that can appear in several places at once.
    // Walking the AST without tracking what has been seen re-walks them exponentially
    // and overflows the stack — which only showed up after many render cycles.
    it('survives repeated update-and-render cycles', () => {
        seed(10)
        draw()

        for (let round = 0; round < 15; round++) {
            const index = round % 10

            store.apply({ updateDataModel: { surfaceId: 's', path: `/items/${index}`, value: `round ${round}` } })

            const result = draw()

            expect(result.diagnostics).toEqual([])
            expect(texts(result.ast)[index]).toBe(`round ${round}`)
        }
    })

    it('clear() forces a full rebuild', () => {
        seed(5)
        draw()
        session.clear()

        expect(draw().reused).toBe(0)
    })
})
