/**
 * The example is documentation, so it is worth knowing when it stops working.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { App } from '../src/App'

afterEach(cleanup)

describe('custom catalog example', () => {
    it('renders the same surface through both catalogs', async () => {
        render(<App />)

        // One surface, two renderers — so every piece of content appears twice.
        expect(await screen.findAllByText('Weekend upgrade')).toHaveLength(2)
        expect(await screen.findAllByText('Claim offer')).toHaveLength(2)
    })

    it('renders a component the basic catalog does not have', async () => {
        render(<App />)

        expect(await screen.findByText('Rate your stay')).toBeTruthy()
        expect(await screen.findAllByText('★')).toHaveLength(3)
        expect(await screen.findAllByText('☆')).toHaveLength(2)
    })

    it('writes a tap on the new component back into the data model', async () => {
        render(<App />)

        const empty = await screen.findAllByText('☆')
        fireEvent.click(empty[empty.length - 1])

        // Five filled stars, and the caption bound to the same path shows the new value.
        expect(await screen.findAllByText('★')).toHaveLength(5)
        expect(await screen.findByText('5')).toBeTruthy()
    })

    it('gives the two renderers different styling for the same node', async () => {
        const { container } = render(<App />)

        // Three renderers paint in turn; wait for the override's colour before comparing.
        await waitFor(() => expect(container.innerHTML).toContain('rgb(91, 33, 182)'))

        const titles = await screen.findAllByText('Weekend upgrade')
        const colours = titles.map((node) => getComputedStyle(node.closest('div') ?? node).color)

        // The override paints the heading purple; the built-in catalog does not.
        expect(new Set(colours).size).toBe(2)
    })
})
