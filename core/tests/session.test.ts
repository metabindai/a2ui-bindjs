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

    // A component holding a BindJS hook — `Modal`'s open state here — redraws with
    // nothing in the data model moving, so the data model can never tell the cache it has
    // gone stale. The runtime can: every hook setter calls `needsRerender` and nothing
    // else does, so the engine watches it. Nothing declares itself stateful, and it does
    // not matter which component the hook was in or who called it.
    describe('renderer state', () => {
        function drawModal() {
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
        }

        it('memoises a component holding a hook while its state is untouched', () => {
            drawModal()

            draw()
            store.apply({ updateDataModel: { surfaceId: 's', path: '/unrelated', value: 1 } })

            // The old contract was that such a component is *never* cached. It is now,
            // right up until its state moves — which is strictly more reuse, not less.
            expect(draw().reused).toBeGreaterThan(0)
        })

        it('drops every cached subtree when a hook setter fires', () => {
            drawModal()

            draw()
            expect(draw().reused).toBeGreaterThan(0)

            // What `useState`'s setter does, and the only thing it does that reaches us.
            runtime.needsRerender('renderer')

            const after = draw()

            expect(after.reused).toBe(0)
            expect(after.nodeCount).toBeGreaterThan(0)
            expect(texts(after.ast)).toContain('Open me')
        })

        it('keeps watching after a host assigns its own needsRerender', () => {
            drawModal()
            draw()

            // bindjs-react and both native hosts assign this to schedule their repaint,
            // and may do it after the first render. Wrapping once at registration would
            // lose the signal here and the cache would go quietly stale.
            let repaints = 0
            runtime.needsRerender = () => {
                repaints += 1
            }

            expect(draw().reused).toBeGreaterThan(0)

            runtime.needsRerender('renderer')

            expect(draw().reused).toBe(0)
            expect(repaints).toBe(1)
        })

        it('memoises nothing when the runtime offers no hooks to watch', () => {
            drawModal()

            const unwatchable = { ...(runtime as unknown as Record<string, unknown>) } as Record<string, unknown>
            const bound = runtime as unknown as Record<string, unknown>

            // A minimal runtime, of the kind `BindJSRuntimeLike` allows. There is no way
            // to know a hook fired, so a cached subtree could keep drawing a state that
            // has moved on — the engine gives up reuse rather than risk it.
            const minimal = {
                callComponent: (...args: never[]) => (bound.callComponent as Function).apply(runtime, args),
                unwrapComponentAST: (...args: never[]) => (bound.unwrapComponentAST as Function).apply(runtime, args),
                makeComponent: (...args: never[]) => (bound.makeComponent as Function).apply(runtime, args),
                context: unwatchable.context,
            } as unknown as BindJSRuntimeLike

            const withoutHooks = new RenderSession()
            const render = () =>
                withoutHooks.render({
                    runtime: minimal,
                    surface: store.requireSurface('s'),
                    catalog: BASIC_CATALOG,
                    registry,
                    locale: 'en-US',
                })

            render()

            expect(render().reused).toBe(0)
        })
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
