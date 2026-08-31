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
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { A2UIRenderer } from '../src/A2UIRenderer'
import { registerCatalog, SurfaceStore, type RegistrarRuntime, type BindJSRuntimeLike } from '@metabindai/a2ui-bindjs'

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
