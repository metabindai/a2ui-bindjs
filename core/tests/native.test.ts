/**
 * The contract a native host uses.
 *
 * `bindjs-apple` owns one `BindJSRuntime` in its JavaScriptCore context; this bundle
 * attaches to it rather than carrying its own, so hook state and stored `handlerId`s stay
 * in the instance the native renderer resolves them against. These run against a real
 * runtime to make sure the attach path works, plus one pass in a bare `vm` context to
 * check the bundle needs nothing but the language.
 */
import vm from 'node:vm'
import { BindJSRuntime } from '@metabindai/bindjs-runtime'
import { beforeEach, describe, expect, it } from 'vitest'

import { A2UINativeBridge } from '../src/native/bridge'
import type { BindJSRuntimeLike } from '../src/engine/types'
import { buildBundle } from '../scripts/build-bundle.mjs'

const MESSAGES = [
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'main',
            components: [
                { id: 'root', component: 'Column', children: ['title', 'go'] },
                { id: 'title', component: 'Text', text: { path: '/name' } },
                { id: 'label', component: 'Text', text: 'Go' },
                {
                    id: 'go',
                    component: 'Button',
                    child: 'label',
                    action: { event: { name: 'tapped', context: { who: { path: '/name' } } } },
                },
            ],
            dataModel: { name: 'Ada' },
        },
    },
]

let bridge: A2UINativeBridge
let runtime: BindJSRuntime

beforeEach(() => {
    runtime = new BindJSRuntime()
    bridge = new A2UINativeBridge()
    bridge.attach(runtime as unknown as BindJSRuntimeLike, { locale: 'en-US' })
})

describe('native bridge', () => {
    it('refuses to render before it is attached', () => {
        expect(() => new A2UINativeBridge().render()).toThrow(/attach\(runtime\)/)
    })

    it('applies messages and reports what failed', () => {
        expect(bridge.applyMessages(JSON.stringify(MESSAGES))).toEqual({ applied: 1, errors: [] })
        expect(bridge.surfaceIds()).toEqual(['main'])

        const bad = bridge.applyMessages([{ updateComponents: { surfaceId: 'nope', components: [] } } as never])
        expect(bad.applied).toBe(0)
        expect(bad.errors[0]).toMatch(/Unknown surface/)
    })

    it('renders a surface the host can decode', () => {
        bridge.applyMessages(MESSAGES as never)

        const result = bridge.render('main')

        expect(result?.diagnostics).toEqual([])
        expect(JSON.stringify(result?.ast)).toContain('Ada')
    })

    it('defaults to the only surface, and reports an unknown one as null', () => {
        bridge.applyMessages(MESSAGES as never)

        expect(bridge.render()).not.toBeNull()
        expect(bridge.render('missing')).toBeNull()
    })

    it('queues actions for the host to drain', () => {
        bridge.applyMessages(MESSAGES as never)

        const ast = runtime.unwrapComponentAST(bridge.render('main')?.ast) as unknown
        const handlerIds: string[] = []
        JSON.stringify(ast, (key, value) => {
            if (key === 'handlerId') handlerIds.push(value as string)
            return value
        })

        expect(handlerIds.length).toBeGreaterThan(0)
        expect(bridge.takeActions()).toEqual([])

        // What the native renderer does on a tap: resolve the id in *this* runtime.
        runtime.restoreFunction(handlerIds[0])?.()

        const actions = bridge.takeActions()
        expect(actions[0]).toMatchObject({ name: 'tapped', surfaceId: 'main', context: { who: 'Ada' } })

        // Draining clears them.
        expect(bridge.takeActions()).toEqual([])
    })

    it('tells the host an action arrived, rather than making it poll', () => {
        // A tap need not change the data model, so the host may get no redraw to notice
        // one on. The callback is the only signal.
        const notified: number[] = []

        bridge.onActions(() => notified.push(bridge.surfaceIds().length))
        bridge.applyMessages(MESSAGES as never)

        const ast = bridge.render('main')?.ast
        const handlerIds: string[] = []

        JSON.stringify(ast, (key, value) => {
            if (key === 'handlerId') handlerIds.push(value as string)
            return value
        })

        expect(notified).toEqual([])

        runtime.restoreFunction(handlerIds[0])?.()

        // Fired once, and the action is already queued by the time it fires.
        expect(notified).toEqual([1])
        expect(bridge.takeActions()).toHaveLength(1)
    })

    it('reports validation failures as A2UI error messages, when asked to', () => {
        const validating = new A2UINativeBridge()

        validating.attach(runtime, { validate: true })
        validating.applyMessages([
            {
                createSurface: {
                    surfaceId: 'main',
                    components: [{ id: 'root', component: 'Card', child: 'missing' }],
                    dataModel: {},
                },
            },
        ] as never)

        const errors = validating.takeErrors()

        expect(errors[0]).toMatchObject({
            code: 'VALIDATION_FAILED',
            surfaceId: 'main',
            path: '/components/0/child',
        })

        // Draining clears them.
        expect(validating.takeErrors()).toEqual([])
    })

    it('says nothing about structure unless validation is turned on', () => {
        bridge.applyMessages([
            {
                createSurface: {
                    surfaceId: 'main',
                    components: [{ id: 'root', component: 'Card', child: 'missing' }],
                    dataModel: {},
                },
            },
        ] as never)

        expect(bridge.takeErrors()).toEqual([])
    })

    it('writes back into the data model and bumps the version', () => {
        bridge.applyMessages(MESSAGES as never)

        const before = bridge.versionOf('main')
        bridge.setValue('main', '/name', 'Grace')

        expect(bridge.versionOf('main')).toBeGreaterThan(before)
        expect(JSON.stringify(bridge.render('main')?.ast)).toContain('Grace')
    })

    it('renders a component the basic catalog lacks, once the host adds it', () => {
        const surface = {
            version: 'v1.0',
            createSurface: {
                surfaceId: 'review',
                components: [{ id: 'root', component: 'Rating', value: { path: '/stars' }, max: 5 }],
                dataModel: { stars: 3 },
            },
        }

        bridge.applyMessages([...MESSAGES, surface] as never)
        expect(bridge.render('review')?.diagnostics[0]?.code).toBe('UNKNOWN_COMPONENT')

        // One source, one catalog entry. The basic catalog stays underneath: Card, Column
        // and the rest still resolve without being named again.
        bridge.useCatalog(
            {
                Rating: `exports.default = defineComponent({
                    body: (props) => Text('★'.repeat(props.value) + '☆'.repeat(props.max - props.value)),
                    properties: {},
                })`,
            },
            { Rating: 'Rating' }
        )

        const result = bridge.render('review')

        expect(result?.diagnostics).toEqual([])
        expect(JSON.stringify(result?.ast)).toContain('★★★☆☆')
        expect(JSON.stringify(bridge.render('main')?.diagnostics)).toBe('[]')
    })

    it('serialises for a host that only exchanges strings', () => {
        bridge.applyMessages(MESSAGES as never)

        expect(JSON.parse(bridge.renderJSON('main')).diagnostics).toEqual([])
        expect(JSON.parse(bridge.takeActionsJSON())).toEqual([])
    })
})

describe('the native bundle', () => {
    it('installs an `a2ui` global in a context with nothing but the language', async () => {
        const { readable } = (await buildBundle({ write: false, entry: 'native' })) as { readable: string }

        const sandbox = {
            JSON,
            Math,
            Date,
            Object,
            Array,
            String,
            Number,
            Boolean,
            RegExp,
            Error,
            TypeError,
            Map,
            Set,
            WeakSet,
            WeakMap,
            Symbol,
            Promise,
            Intl,
        }
        const context = vm.createContext(sandbox)

        vm.runInContext(readable, context)

        expect(vm.runInContext('typeof a2ui.attach', context)).toBe('function')
        expect(vm.runInContext('typeof a2ui.applyMessages', context)).toBe('function')
        expect(vm.runInContext('typeof a2ui.renderJSON', context)).toBe('function')
        expect(vm.runInContext('typeof a2ui.takeActionsJSON', context)).toBe('function')
    })
})
