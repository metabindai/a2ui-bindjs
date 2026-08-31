/**
 * The example is documentation, so it is worth knowing when it stops working.
 */
import { cleanup, render, screen } from '@testing-library/react'
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

    it('gives the two renderers different styling for the same node', async () => {
        const { container } = render(<App />)

        const titles = await screen.findAllByText('Weekend upgrade')
        const colours = titles.map((node) => getComputedStyle(node.closest('div') ?? node).color)

        // The override paints the heading purple; the built-in catalog does not.
        expect(new Set(colours).size).toBe(2)
        expect(container.innerHTML).toContain('rgb(91, 33, 182)')
    })
})
