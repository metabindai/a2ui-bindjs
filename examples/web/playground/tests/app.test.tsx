/**
 * Smoke test for the playground shell.
 *
 * This exists because a dev-server-only failure (a CommonJS dependency served raw
 * after `optimizeDeps.exclude` skipped pre-bundling) blanked the page while `build`
 * and every package test stayed green. Mounting the real App catches that class of
 * breakage.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { App } from '../src/App'
import { SAMPLES, SAMPLE_GROUPS } from '../src/lib/samples'

// Auto-cleanup only runs when vitest globals are enabled; without this, a previous
// test's App stays mounted and document-wide queries match its stale nodes.
afterEach(cleanup)

describe('samples', () => {
    it('loads the vendored A2UI spec corpus', () => {
        const spec = SAMPLES.filter((sample) => sample.group === 'A2UI spec examples')

        expect(spec.length).toBeGreaterThanOrEqual(40)
        expect(SAMPLE_GROUPS.map((entry) => entry.group)).toEqual(['Playground', 'A2UI spec examples'])
    })

    it('gives every sample a non-empty message stream', () => {
        for (const sample of SAMPLES) {
            const messages = JSON.parse(sample.source)

            expect(Array.isArray(messages), sample.name).toBe(true)
            expect(messages.length, sample.name).toBeGreaterThan(0)
        }
    })
})

describe('playground', () => {
    it('mounts and shows the shell', async () => {
        render(<App />)

        expect(await screen.findByText('A2UI on BindJS')).toBeDefined()
    })

    it('parses the default sample into timeline steps', async () => {
        render(<App />)

        // Chip labels are built from several text nodes ("1." + " createSurface"),
        // so match on the element's combined textContent.
        const chips = await screen.findAllByText((_text, element) => {
            return element?.tagName === 'BUTTON' && /^\d+\.\s*createSurface$/.test(element.textContent ?? '')
        })

        expect(chips.length).toBeGreaterThan(0)
    })

    it('paints the surface in the Render tab', async () => {
        const { findByText, getAllByText } = render(<App />)

        // "Render" also appears in the tab strip's siblings; the tab is the button.
        const tab = getAllByText('Render').find((element) => element.tagName === 'BUTTON')
        tab?.click()

        // By the last step the sample has swapped the Text for a formatString call
        // over the updated /name, so the painted output proves bindings AND functions.
        expect(await findByText('Hello, Jane Doe')).toBeDefined()
    })

    it('applies a sent update to the live surface without replaying the editor', async () => {
        const { findByText, findByTestId, getAllByText } = render(<App />)

        getAllByText('Render').find((element) => element.tagName === 'BUTTON')?.click()
        expect(await findByText('Hello, Jane Doe')).toBeDefined()

        // The composer lives in the left pane, independent of the right-pane tab.
        getAllByText('Send update').find((element) => element.tagName === 'BUTTON')?.click()

        const composer = await findByTestId('file:///update.json')

        const update = JSON.stringify({
            version: 'v1.0',
            updateDataModel: { surfaceId: 'user_profile_card', path: '/name', value: 'Sent Name' },
        })

        fireEvent.change(composer, { target: { value: update } })

        await act(async () => {
            getAllByText('Send').find((element) => element.tagName === 'BUTTON')?.click()
        })

        expect(await findByText('Hello, Sent Name')).toBeDefined()
    })

    it('edits the live data model and repaints', async () => {
        const { findByText, findByTestId, getAllByText } = render(<App />)

        getAllByText('Render').find((element) => element.tagName === 'BUTTON')?.click()
        expect(await findByText('Hello, Jane Doe')).toBeDefined()

        getAllByText('Data model').find((element) => element.tagName === 'BUTTON')?.click()

        const editor = await findByTestId('file:///datamodel.json')

        // The panel shows the live model, so it already carries the replayed edits.
        expect(JSON.parse((editor as HTMLTextAreaElement).value).name).toBe('Jane Doe')

        fireEvent.change(editor, { target: { value: JSON.stringify({ name: 'Edited Directly' }) } })

        await act(async () => {
            getAllByText('Apply').find((element) => element.tagName === 'BUTTON')?.click()
        })

        expect(await findByText('Hello, Edited Directly')).toBeDefined()
    })

    it('resets the session back to the authored stream', async () => {
        const { findByText, findByTestId, getAllByText } = render(<App />)

        getAllByText('Render').find((element) => element.tagName === 'BUTTON')?.click()
        expect(await findByText('Hello, Jane Doe')).toBeDefined()

        getAllByText('Send update').find((element) => element.tagName === 'BUTTON')?.click()

        const composer = await findByTestId('file:///update.json')
        fireEvent.change(composer, {
            target: {
                value: JSON.stringify({
                    version: 'v1.0',
                    updateDataModel: { surfaceId: 'user_profile_card', path: '/name', value: 'Temporary' },
                }),
            },
        })

        await act(async () => {
            getAllByText('Send').find((element) => element.tagName === 'BUTTON')?.click()
        })

        getAllByText('Render').find((element) => element.tagName === 'BUTTON')?.click()
        expect(await findByText('Hello, Temporary')).toBeDefined()

        await act(async () => {
            getAllByText(/^Reset session/).find((element) => element.tagName === 'BUTTON')?.click()
        })

        // Back to the stream's own final state, and the sent log is empty.
        expect(await findByText('Hello, Jane Doe')).toBeDefined()
        expect(getAllByText(/^Reset session$/).length).toBeGreaterThan(0)
    })

    it('renders a sample from the spec corpus', async () => {
        const { findByText, getAllByText, container } = render(<App />)

        const picker = container.querySelector('select') as HTMLSelectElement
        fireEvent.change(picker, { target: { value: 'Interactive Button' } })

        getAllByText('Render').find((element) => element.tagName === 'BUTTON')?.click()

        expect(await findByText('Click the button below')).toBeDefined()
    })

    it('renders every surface the stream created, each labelled', async () => {
        const { findByText, getAllByText, container } = render(<App />)

        fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'Two surfaces' } })

        // Step back before the sample's trailing deleteSurface so both are live.
        const chips = await screen.findAllByText((_text, element) => {
            return element?.tagName === 'BUTTON' && /^3\./.test(element.textContent ?? '')
        })
        chips[0].click()

        getAllByText('Render').find((element) => element.tagName === 'BUTTON')?.click()

        expect(await findByText('Trip to Lisbon')).toBeDefined()
        expect(await findByText('9 nearby places')).toBeDefined()

        // Labelled, because there is more than one to tell apart.
        expect(await findByText('main')).toBeDefined()
        expect(await findByText('sidebar')).toBeDefined()
    })

    it('keeps the remaining surface when one is deleted', async () => {
        const { findByText, getAllByText, container } = render(<App />)

        fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'Two surfaces' } })

        getAllByText('Render').find((element) => element.tagName === 'BUTTON')?.click()

        // The sample ends by deleting the sidebar; the timeline defaults to fully applied.
        expect(await findByText('Trip to Lisbon')).toBeDefined()
        expect(screen.queryByText('9 nearby places')).toBeNull()
    })

    it('shows a sent update in the Surfaces tab too', async () => {
        const { findAllByText, findByTestId, getAllByText } = render(<App />)

        getAllByText('Send update').find((element) => element.tagName === 'BUTTON')?.click()

        const composer = await findByTestId('file:///update.json')
        const update = JSON.stringify({
            version: 'v1.0',
            updateDataModel: { surfaceId: 'user_profile_card', path: '/name', value: 'Visible Everywhere' },
        })

        fireEvent.change(composer, { target: { value: update } })

        await act(async () => {
            getAllByText('Send').find((element) => element.tagName === 'BUTTON')?.click()
        })

        // Surfaces is the default tab and reads the same live store. The composer's own
        // textarea holds the text too, so match the rendered JSON block specifically.
        const matches = await findAllByText((_text, element) => {
            return element?.tagName === 'PRE' && (element.textContent ?? '').includes('Visible Everywhere')
        })

        expect(matches.length).toBeGreaterThan(0)
    })
})
