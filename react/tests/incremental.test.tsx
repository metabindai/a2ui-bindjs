/**
 * @vitest-environment jsdom
 *
 * What an incremental update costs the user.
 *
 * The engine rebuilds the whole tree on every update, so the thing worth pinning down
 * is that a rebuild is not a reset: runtime hook state (an open Modal, a selected tab)
 * has to survive, or pushing data into a live surface would yank the UI out from under
 * whoever is using it.
 */
import { BindJSRuntime } from '@metabindai/bindjs-runtime'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { A2UIRenderer } from '../src/A2UIRenderer'
import { registerCatalog, SurfaceStore, type RegistrarRuntime, type BindJSRuntimeLike } from '@metabindai/a2ui-bindjs'

afterEach(cleanup)

describe('incremental updates', () => {
    it('keeps component-local state across a data update', async () => {
        const runtime = new BindJSRuntime()
        const catalog = registerCatalog(runtime as unknown as RegistrarRuntime)
        const store = new SurfaceStore()

        store.apply({
            createSurface: {
                surfaceId: 'main',
                components: [
                    { id: 'root', component: 'Column', children: ['modal', 'label'] },
                    { id: 'modal', component: 'Modal', trigger: 'trg', content: 'body' },
                    { id: 'trg', component: 'Text', text: 'Open me' },
                    { id: 'body', component: 'Text', text: 'MODAL BODY' },
                    { id: 'label', component: 'Text', text: { path: '/name' } },
                ],
                dataModel: { name: 'Before' },
            },
        })

        render(
            <A2UIRenderer
                runtime={runtime as unknown as BindJSRuntimeLike}
                store={store}
                surfaceId="main"
                catalog={catalog}
                locale="en-US"
            />
        )

        expect(await screen.findByText('Before')).toBeDefined()
        expect(screen.queryByText('MODAL BODY')).toBeNull()

        // Open the modal — this is runtime-local useState, not in the data model.
        // BindJS's web renderer does not emit a <button>; the handler sits on an ancestor.
        const trigger = await screen.findByText('Open me')
        await act(async () => {
            let node: HTMLElement | null = trigger
            for (let i = 0; i < 3 && node; i++) {
                node.click()
                node = node.parentElement
            }
        })
        expect(await screen.findByText('MODAL BODY')).toBeDefined()

        // Now push an unrelated data update.
        await act(async () => {
            store.apply({ updateDataModel: { surfaceId: 'main', path: '/name', value: 'After' } })
        })

        // The bound text repaints...
        expect(await screen.findByText('After')).toBeDefined()

        // ...and the modal is still open. Rebuilding the AST does not reset runtime
        // hook state, so incremental updates never cost the user their place.
        expect(screen.queryByText('MODAL BODY')).not.toBeNull()
    })
})

/**
 * Whether a reused subtree is still live.
 *
 * The engine hands a memoised subtree back verbatim — `#reuse` wraps the cached AST in a
 * `makeComponent` and nothing in it is rebuilt. Anything the renderer resolves by id at
 * *use* time rather than by value, an action handler above all, therefore has to survive
 * being carried across a render it did not take part in. If it does not, the symptom is
 * the worst kind: the surface looks right and does nothing at all.
 */
describe('reused subtrees', () => {
    it('still dispatches an action after its subtree has been reused', async () => {
        const runtime = new BindJSRuntime()
        const catalog = registerCatalog(runtime as unknown as RegistrarRuntime)
        const store = new SurfaceStore()
        const actions: string[] = []

        store.apply({
            createSurface: {
                surfaceId: 'main',
                components: [
                    { id: 'root', component: 'Column', children: ['cta', 'label'] },
                    { id: 'ctaLabel', component: 'Text', text: 'Press me' },
                    { id: 'cta', component: 'Button', child: 'ctaLabel', action: { event: { name: 'pressed' } } },
                    { id: 'label', component: 'Text', text: { path: '/name' } },
                ],
                dataModel: { name: 'Before' },
            },
        })

        render(
            <A2UIRenderer
                runtime={runtime as unknown as BindJSRuntimeLike}
                store={store}
                surfaceId="main"
                catalog={catalog}
                locale="en-US"
                onAction={((message: { name: string }) => actions.push(message.name)) as never}
            />
        )

        const press = async () => {
            const label = await screen.findByText('Press me')
            const button = label.closest('button') ?? label

            await act(async () => {
                ;(button as HTMLElement).click()
            })
        }

        await press()
        expect(actions).toEqual(['pressed'])

        // An unrelated write. The button reads nothing that changed, so its subtree is
        // served from the cache and its body never runs again.
        await act(async () => {
            store.apply({ updateDataModel: { surfaceId: 'main', path: '/name', value: 'After' } })
        })

        expect(await screen.findByText('After')).toBeDefined()

        await press()
        expect(actions).toEqual(['pressed', 'pressed'])
    })
})
