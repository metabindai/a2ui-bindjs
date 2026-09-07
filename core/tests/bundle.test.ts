/**
 * The single-file bundle for native hosts.
 *
 * `bindjs-apple` and `bindjs-android` embed a JavaScript context that has the language
 * and nothing else — no module loader, no Node globals. These tests build the bundle and
 * run it in exactly that: a `vm` context seeded only with ECMAScript built-ins.
 */
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'

// @ts-expect-error — plain ESM build script, no type declarations.
import { buildBundle } from '../scripts/build-bundle.mjs'

const bundle = (await buildBundle({ write: false })) as { readable: string; compact: string }

/** Only what a language-level JS engine guarantees. No console, process, require or timers. */
function bareContext(): Record<string, unknown> {
    const sandbox = {
        Array,
        Boolean,
        Date,
        Error,
        Intl,
        JSON,
        Map,
        Math,
        Number,
        Object,
        Promise,
        RegExp,
        Set,
        String,
        Symbol,
        TypeError,
        WeakMap,
        WeakSet,
    }

    return vm.createContext(sandbox)
}

/**
 * A stand-in for the BindJS runtime, producing the same AST node shape — the engine
 * harvests cached subtrees by looking for `ComponentCall` nodes carrying its key, so a
 * host whose AST differs would still render correctly but lose memoisation.
 */
const RUNTIME_STUB = `
    const runtime = {
        callComponent: (name, props, children) => ({ type: 'ComponentCall', props: { name, props, children } }),
        unwrapComponentAST: (node) => node,
        makeComponent: (body) => body(),
        context: {
            ForEach: (data) => ({ type: 'ForEach', props: { count: data.length } }),
            Empty: () => ({ type: 'Empty', props: {} }),
        },

        // What every BindJS hook setter calls, and what the engine wraps to notice that a
        // component redraws with nothing in the data model having moved. A runtime
        // without it is memoised not at all, so a stub standing in for a real one needs it
        // or this file would be testing the wrong thing.
        needsRerender: () => {},
    }
`

const SURFACE = `
    store.applyAll([
        { version: 'v1.0', createSurface: { surfaceId: 'main', components: [
            { id: 'root', component: 'Column', children: ['title', 'price'] },
            { id: 'title', component: 'Text', text: { path: '/product/name' } },
            { id: 'price', component: 'Text', text: { call: 'formatCurrency', args: { value: { path: '/product/price' }, currency: 'USD' } } },
        ], dataModel: { product: { name: 'Trail Runner', price: 129 } } } },
    ])
`

function run(source: string, script: string): unknown {
    const context = bareContext()

    vm.runInContext(source, context)

    return vm.runInContext(script, context)
}

describe('single-file bundle', () => {
    it('is self-contained and free of host assumptions', () => {
        // buildBundle throws on either count; this asserts it actually produced something.
        expect(bundle.readable.length).toBeGreaterThan(1000)
        expect(bundle.compact.length).toBeLessThan(bundle.readable.length)
    })

    it('evaluates in a context with nothing but ECMAScript built-ins', () => {
        const exported = run(bundle.readable, 'Object.keys(A2UI).length')

        expect(exported).toBeGreaterThan(20)
    })

    it('applies messages, resolves functions and renders', () => {
        const result = run(
            bundle.readable,
            `(() => {
                ${RUNTIME_STUB}
                const store = new A2UI.SurfaceStore()
                ${SURFACE}

                const session = new A2UI.RenderSession()
                const first = session.render({
                    runtime,
                    surface: store.requireSurface('main'),
                    catalog: A2UI.BASIC_CATALOG,
                    registry: A2UI.createStandardRegistry(),
                    locale: 'en-US',
                })

                return {
                    diagnostics: first.diagnostics.length,
                    built: first.nodeCount,
                    json: JSON.stringify(first.ast),
                }
            })()`
        ) as { diagnostics: number; built: number; json: string }

        expect(result.diagnostics).toBe(0)
        expect(result.built).toBe(3)
        expect(result.json).toContain('Trail Runner')
        expect(result.json).toContain('$129.00')
    })

    it('memoises across renders inside the bundle', () => {
        const result = run(
            bundle.readable,
            `(() => {
                ${RUNTIME_STUB}
                const store = new A2UI.SurfaceStore()
                ${SURFACE}

                const session = new A2UI.RenderSession()
                const catalog = A2UI.BASIC_CATALOG
                const registry = A2UI.createStandardRegistry()
                const draw = () => session.render({
                    runtime, surface: store.requireSurface('main'), catalog, registry, locale: 'en-US',
                })

                draw()
                store.apply({ version: 'v1.0', updateDataModel: { surfaceId: 'main', path: '/product/price', value: 149 } })
                const second = draw()

                return { built: second.nodeCount, reused: second.reused, json: JSON.stringify(second.ast) }
            })()`
        ) as { built: number; reused: number; json: string }

        // The price Text and its Column rebuild; the title is reused.
        expect(result.built).toBe(2)
        expect(result.reused).toBe(1)
        expect(result.json).toContain('$149.00')
    })

    it('works minified too', () => {
        const exported = run(bundle.compact, 'typeof A2UI.SurfaceStore')

        expect(exported).toBe('function')
    })
})
