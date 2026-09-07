/**
 * The example is documentation, so it is worth knowing when it stops working.
 */
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { App } from '../src/App'

afterEach(cleanup)

describe('minimal example', () => {
    it('renders the surface, bindings and functions included', async () => {
        render(<App />)

        expect(await screen.findByText('Trail Runner X2')).toBeDefined()
        expect(await screen.findByText('$129.00')).toBeDefined()
    })

    it('closes the action loop: tap, dispatch, apply, repaint', async () => {
        render(<App />)

        const label = await screen.findByText('Add to cart')

        // BindJS's web renderer does not emit a <button>; the click bubbles to the
        // handler React attached at the root.
        await act(async () => {
            label.click()
        })

        expect(await screen.findByText('Added ✓')).toBeDefined()
        expect(await screen.findByText(/add_to_cart/)).toBeDefined()
    })
})
