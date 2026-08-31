import { describe, expect, it, vi } from 'vitest'
import { A2UIProtocolError } from '../src/protocol/parse'
import { SurfaceStore, type StoreEvent } from '../src/store/SurfaceStore'
import { fixture } from './helpers'

describe('SurfaceStore', () => {
    it('replays the profile-card fixture', () => {
        const store = new SurfaceStore()
        const [create, dataUpdate, compUpdate] = fixture('profile-card')

        store.apply(create)
        const s1 = store.requireSurface('user_profile_card')
        expect(s1.sendDataModel).toBe(true)
        expect(s1.catalogId).toContain('catalogs/basic')
        expect(s1.components.size).toBe(5)
        expect(store.getRoot('user_profile_card')?.component).toBe('Column')
        expect(store.getValue('user_profile_card', '/contact/email')).toBe('john@example.com')

        store.apply(dataUpdate)
        expect(store.getValue('user_profile_card', '/name')).toBe('Jane Doe')
        expect(store.requireSurface('user_profile_card').version).toBe(s1.version + 1)

        store.apply(compUpdate)
        expect(store.getComponent('user_profile_card', 'user_name')?.text).toEqual({
            call: 'formatString',
            args: { value: 'Hello, ${/name}' },
        })
        expect(store.requireSurface('user_profile_card').components.size).toBe(5)
    })

    it('replays the employee-list fixture (append + delete)', () => {
        const store = new SurfaceStore()
        store.applyAll(fixture('employee-list'))
        expect(store.getValue('employees', '/employees')).toEqual([{ name: 'Grace' }, { name: 'Linus' }])
    })

    it('resolves relative paths in a template scope', () => {
        const store = new SurfaceStore()
        store.apply(fixture('employee-list')[0])
        expect(store.getValue('employees', 'name', '/employees/1')).toBe('Grace')
        expect(store.getValue('employees', '/company', '/employees/1')).toBe('Acme')
    })

    it('applies defaultCatalogId when createSurface omits one', () => {
        const store = new SurfaceStore({ defaultCatalogId: 'cat' })
        store.apply({ createSurface: { surfaceId: 's' } })
        expect(store.getSurface('s')?.catalogId).toBe('cat')
    })

    it('replaces the whole model when path is omitted or "/"', () => {
        const store = new SurfaceStore()
        store.apply({ createSurface: { surfaceId: 's', dataModel: { a: 1 } } })
        store.apply({ updateDataModel: { surfaceId: 's', value: { b: 2 } } })
        expect(store.getSurface('s')?.dataModel).toEqual({ b: 2 })
        store.apply({ updateDataModel: { surfaceId: 's', path: '/', value: { c: 3 } } })
        expect(store.getSurface('s')?.dataModel).toEqual({ c: 3 })
    })

    it('deletes keys on null', () => {
        const store = new SurfaceStore()
        store.apply({ createSurface: { surfaceId: 's', dataModel: { a: 1, b: 2 } } })
        store.apply({ updateDataModel: { surfaceId: 's', path: '/a', value: null } })
        expect(store.getSurface('s')?.dataModel).toEqual({ b: 2 })
    })

    it('setValue writes locally with scope', () => {
        const store = new SurfaceStore()
        store.apply({ createSurface: { surfaceId: 's', dataModel: { items: [{ done: false }] } } })
        store.setValue('s', 'done', true, '/items/0')
        expect(store.getValue('s', '/items/0/done')).toBe(true)
    })

    it('re-creating a surface resets it', () => {
        const store = new SurfaceStore()
        store.apply({ createSurface: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'a' }], dataModel: { x: 1 } } })
        store.apply({ createSurface: { surfaceId: 's' } })
        const s = store.requireSurface('s')
        expect(s.components.size).toBe(0)
        expect(s.dataModel).toEqual({})
        expect(s.version).toBe(2)
    })

    it('rejects updates to unknown surfaces', () => {
        const store = new SurfaceStore()
        expect(() => store.apply({ updateComponents: { surfaceId: 'nope', components: [] } })).toThrow(A2UIProtocolError)
        expect(() => store.apply({ updateDataModel: { surfaceId: 'nope', value: 1 } })).toThrow(/Unknown surface/)
    })

    it('deleteSurface removes and is idempotent', () => {
        const store = new SurfaceStore()
        store.apply({ createSurface: { surfaceId: 's' } })
        store.apply({ deleteSurface: { surfaceId: 's' } })
        expect(store.getSurface('s')).toBeUndefined()
        expect(() => store.apply({ deleteSurface: { surfaceId: 's' } })).not.toThrow()
    })

    it('emits events', () => {
        const store = new SurfaceStore()
        const seen: StoreEvent['type'][] = []
        const unsub = store.subscribe((e) => seen.push(e.type))
        store.apply({ createSurface: { surfaceId: 's' } })
        store.apply({ updateDataModel: { surfaceId: 's', path: '/a', value: 1 } })
        store.apply({ callRendererFunction: { functionCallId: 'f1', callFunction: { call: 'openUrl', args: { url: 'x' } } } })
        store.apply({ agentFunctionResponse: { functionCallId: 'f2', value: 1 } })
        store.apply({ deleteSurface: { surfaceId: 's' } })
        expect(seen).toEqual(['surfaceCreated', 'surfaceUpdated', 'callRendererFunction', 'agentFunctionResponse', 'surfaceDeleted'])
        unsub()
        const spy = vi.fn()
        store.subscribe(spy)
        store.apply({ createSurface: { surfaceId: 't' } })
        expect(spy).toHaveBeenCalledTimes(1)
    })

    describe('batch', () => {
        function surfaceWith(store: SurfaceStore): void {
            store.apply({ createSurface: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'x' }] } })
        }

        it('reports a surface once however many times it changed', () => {
            const store = new SurfaceStore()
            surfaceWith(store)

            const seen: StoreEvent[] = []
            store.subscribe((event) => seen.push(event))

            store.batch(() => {
                store.apply({ updateDataModel: { surfaceId: 's', path: '/a', value: 1 } })
                store.apply({ updateDataModel: { surfaceId: 's', path: '/a', value: 2 } })
                store.apply({ updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'y' }] } })
            })

            expect(seen).toEqual([{ type: 'surfaceUpdated', surfaceId: 's' }])

            // The final state is what listeners will read.
            expect(store.getValue('s', '/a')).toBe(2)
            expect(store.getComponent('s', 'root')?.text).toBe('y')
        })

        it('reports a surface created in the batch as created, not updated', () => {
            const store = new SurfaceStore()
            const seen: StoreEvent[] = []
            store.subscribe((event) => seen.push(event))

            store.batch(() => {
                surfaceWith(store)
                store.apply({ updateDataModel: { surfaceId: 's', path: '/a', value: 1 } })
            })

            expect(seen).toEqual([{ type: 'surfaceCreated', surfaceId: 's' }])
        })

        it('reports a deleted surface as deleted whatever came before', () => {
            const store = new SurfaceStore()
            surfaceWith(store)

            const seen: StoreEvent[] = []
            store.subscribe((event) => seen.push(event))

            store.batch(() => {
                store.apply({ updateDataModel: { surfaceId: 's', path: '/a', value: 1 } })
                store.apply({ deleteSurface: { surfaceId: 's' } })
            })

            expect(seen).toEqual([{ type: 'surfaceDeleted', surfaceId: 's' }])
        })

        it('keeps every function-call event — each is a distinct request', () => {
            const store = new SurfaceStore()
            const seen: string[] = []
            store.subscribe((event) => seen.push(event.type))

            store.batch(() => {
                store.apply({ callRendererFunction: { functionCallId: 'f1', callFunction: { call: 'openUrl' } } })
                store.apply({ callRendererFunction: { functionCallId: 'f2', callFunction: { call: 'openUrl' } } })
            })

            expect(seen).toEqual(['callRendererFunction', 'callRendererFunction'])
        })

        it('reports each surface separately, in first-touched order', () => {
            const store = new SurfaceStore()
            const seen: StoreEvent[] = []
            store.subscribe((event) => seen.push(event))

            store.batch(() => {
                store.apply({ createSurface: { surfaceId: 'b' } })
                store.apply({ createSurface: { surfaceId: 'a' } })
                store.apply({ updateDataModel: { surfaceId: 'b', path: '/x', value: 1 } })
            })

            expect(seen.map((event) => 'surfaceId' in event && event.surfaceId)).toEqual(['b', 'a'])
        })

        it('flushes only at the outermost nesting level', () => {
            const store = new SurfaceStore()
            let emits = 0
            store.subscribe(() => emits++)

            store.batch(() => {
                store.batch(() => {
                    store.apply({ createSurface: { surfaceId: 's' } })
                })

                expect(emits).toBe(0)

                store.apply({ updateDataModel: { surfaceId: 's', path: '/a', value: 1 } })
            })

            expect(emits).toBe(1)
        })

        it('flushes even when the work throws', () => {
            const store = new SurfaceStore()
            let emits = 0
            store.subscribe(() => emits++)

            expect(() =>
                store.batch(() => {
                    store.apply({ createSurface: { surfaceId: 's' } })
                    store.apply({ updateComponents: { surfaceId: 'nope', components: [] } })
                })
            ).toThrow()

            expect(emits).toBe(1)
        })

        it('applyAll batches', () => {
            const store = new SurfaceStore()
            surfaceWith(store)

            let emits = 0
            store.subscribe(() => emits++)

            store.applyAll([
                { updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'A' }] } },
                { updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'B' }] } },
            ])

            expect(emits).toBe(1)
            expect(store.getComponent('s', 'root')?.text).toBe('B')
        })
    })

    it('does not mutate previous snapshots', () => {
        const store = new SurfaceStore()
        store.apply({ createSurface: { surfaceId: 's', dataModel: { a: { b: 1 } } } })
        const before = store.requireSurface('s')
        store.apply({ updateDataModel: { surfaceId: 's', path: '/a/b', value: 2 } })
        expect(before.dataModel).toEqual({ a: { b: 1 } })
        expect(store.requireSurface('s').dataModel).toEqual({ a: { b: 2 } })
    })
})
