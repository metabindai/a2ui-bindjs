/**
 * The example is documentation, so it is worth knowing when it stops working.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { App } from '../src/App'

afterEach(cleanup)

/** Opens one of the index rows. */
async function open(title: string) {
    render(<App />)
    fireEvent.click(await screen.findByText(title))
}

describe('custom catalog example', () => {
    it('lists every screen under its section', async () => {
        render(<App />)

        expect(await screen.findByText('Built-in catalog')).toBeTruthy()
        expect(await screen.findByText('Custom components')).toBeTruthy()

        for (const title of ['Offer card', 'Overrides', 'Rating', 'Flight search', 'Sales dashboard', 'Habitat sort']) {
            expect(screen.getByText(title)).toBeTruthy()
        }
    })

    it('draws the same surface through either catalog', async () => {
        await open('Offer card')
        expect(await screen.findByText('Weekend upgrade')).toBeTruthy()

        cleanup()

        await open('Overrides')
        expect(await screen.findByText('Weekend upgrade')).toBeTruthy()
    })

    it('paints the override differently from the built-in catalog', async () => {
        const { container } = render(<App />)
        fireEvent.click(await screen.findByText('Overrides'))

        // The override paints the heading purple; the built-in catalog does not.
        await waitFor(() => expect(container.innerHTML).toContain('rgb(91, 33, 182)'))
    })

    it('renders a component the basic catalog does not have', async () => {
        await open('Rating')

        expect(await screen.findByText('Rate your stay')).toBeTruthy()
        expect(await screen.findAllByText('★')).toHaveLength(3)
        expect(await screen.findAllByText('☆')).toHaveLength(2)
    })

    it('writes a tap on the new component back into the data model', async () => {
        await open('Rating')

        const empty = await screen.findAllByText('☆')
        fireEvent.click(empty[empty.length - 1])

        // Five filled stars, and the caption bound to the same path shows the new value.
        // `findAllByText`, because the panel below draws the same surface without the
        // catalog and its caption is bound to the same path.
        expect(await screen.findAllByText('★')).toHaveLength(5)
        expect((await screen.findAllByText('5')).length).toBeGreaterThan(0)
    })

    it('binds three rows of the data model to one type of its own', async () => {
        await open('Flight search')

        expect(await screen.findByText('San Francisco → New York')).toBeTruthy()

        for (const flight of ['UA 1201', 'DL 2204', 'AA 184']) {
            expect(await screen.findByText(flight)).toBeTruthy()
        }
    })

    it('draws one chart type in three shapes over three lists', async () => {
        await open('Sales dashboard')

        expect(await screen.findByText('FY26 Performance')).toBeTruthy()

        // `formatCurrency` is the engine's, so the total is formatted before the surface
        // is drawn; the chart formats its own readout separately.
        expect(await screen.findByText('$708,550.00')).toBeTruthy()

        for (const title of ['Revenue by quarter', 'Sessions this week', 'Traffic sources']) {
            expect(await screen.findByText(title)).toBeTruthy()
        }

        // One axis label per point, from three different lists.
        for (const label of ['Q1', 'Q4', 'Mon', 'Sun', 'Direct', 'Referral']) {
            expect((await screen.findAllByText(label)).length).toBeGreaterThan(0)
        }
    })

    it('deals the deck and names the bins', async () => {
        await open('Habitat sort')

        expect(await screen.findByText('Sort the animals into their habitats')).toBeTruthy()

        for (const bin of ['Ocean', 'Savanna', 'Arctic']) {
            expect(await screen.findByText(bin)).toBeTruthy()
        }

        // The deck is shuffled on mount, so which animal is face-up is not fixed — but
        // exactly one is, and the prompt counts the nine.
        expect(await screen.findByText(/Drag the card onto a bin · 1 of 9/)).toBeTruthy()
    })

    it('counts what a surface dispatched and shows it on request', async () => {
        await open('Offer card')

        fireEvent.click(await screen.findByText('Claim offer'))

        // Nothing is shown inline: the pill counts it, and the sheet has the detail.
        const pill = await screen.findByText('1 Action')
        fireEvent.click(pill)

        expect(await screen.findByText('Activity')).toBeTruthy()
        expect(await screen.findByText('claim_offer')).toBeTruthy()
    })

    // Not covered: the diagnostic for the missing `Rating` entry. The engine reports it,
    // but `A2UIRenderer` fires `onDiagnostics` from an effect that runs before the ref it
    // reads is filled, so the first report is empty and nothing renders again to correct
    // it. The pill picks it up only once something else re-renders the screen.
})
