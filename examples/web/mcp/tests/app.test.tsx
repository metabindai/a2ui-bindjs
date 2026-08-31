/**
 * Runs offline: the MCP client is stubbed, so these cover the wiring — tool call in,
 * A2UI surface out — without needing the server process. The server itself is exercised
 * by `pnpm dev` and the README's instructions.
 */
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The same payload the server serves, imported rather than read from disk so the test
// does not depend on how the runner resolves `import.meta.url`.
import recipe from '../server/recipe.json'

const RECIPE = JSON.stringify(recipe)

import form from '../server/recipe-form.json'

const FORM = JSON.stringify(form)

const listTools = vi.fn(async () => ({ tools: [{ name: 'get_recipe_a2ui' }, { name: 'get_recipe_form_a2ui' }] }))
const UPDATE = JSON.stringify([
    {
        version: 'v0.9',
        updateDataModel: { surfaceId: 'recipe-card', path: '/title', value: 'Baked Tofu Bowl' },
    },
])

const callTool = vi.fn(async ({ name }: { name: string }) => ({
    content: [
        {
            type: 'resource',
            resource: {
                uri: `ui://${name}`,
                mimeType: 'application/a2ui+json',
                text: name === 'a2ui_action' ? UPDATE : name === 'get_recipe_form_a2ui' ? FORM : RECIPE,
            },
        },
    ],
}))
const connect = vi.fn(async () => {})

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
    Client: class {
        connect = connect
        listTools = listTools
        callTool = callTool
        close = async () => {}
    },
}))

vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
    SSEClientTransport: class {
        constructor(public url: URL) {}
    },
}))

const { App } = await import('../src/App')
const { extractMessages } = await import('../src/useMcpSurface')

afterEach(cleanup)

beforeEach(() => {
    connect.mockClear()
    callTool.mockClear()
})

describe('extractMessages', () => {
    it('takes the A2UI resource and ignores prose alongside it', () => {
        const messages = extractMessages([
            { type: 'text', text: 'Here is a recipe.' },
            { type: 'resource', resource: { mimeType: 'application/a2ui+json', text: '[{"version":"v1.0"}]' } },
        ])

        expect(messages).toEqual([{ version: 'v1.0' }])
    })

    it('ignores resources of other types', () => {
        expect(extractMessages([{ type: 'resource', resource: { mimeType: 'text/plain', text: 'nope' } }])).toEqual([])
        expect(extractMessages(undefined)).toEqual([])
    })

    it('accepts a single message as well as a list', () => {
        const messages = extractMessages([
            { type: 'resource', resource: { mimeType: 'application/a2ui+json', text: '{"version":"v1.0"}' } },
        ])

        expect(messages).toHaveLength(1)
    })
})

describe('the example', () => {
    it('calls the tool and renders the surface it returns', async () => {
        render(<App />)

        // The official recipe fixture is v0.9 — rendered without conversion.
        expect(await screen.findByText(/Mediterranean Quinoa Bowl/i)).toBeDefined()
        expect(callTool).toHaveBeenCalledWith({ name: 'get_recipe_a2ui', arguments: {} })
    })

    it('renders every surface the tools returned, each labelled', async () => {
        render(<App />)

        // Two tools, two surfaces, one store.
        expect(await screen.findByText(/Mediterranean Quinoa Bowl/i)).toBeDefined()
        expect(await screen.findByText(/Customize Your Recipe/i)).toBeDefined()
        expect(await screen.findByText('recipe-card')).toBeDefined()
        expect(await screen.findByText('recipe-form')).toBeDefined()
        expect(await screen.findByText(/2 surfaces/)).toBeDefined()
    })

    it('calls every A2UI tool the server advertises', async () => {
        render(<App />)

        await screen.findByText(/Customize Your Recipe/i)

        expect(callTool).toHaveBeenCalledWith({ name: 'get_recipe_a2ui', arguments: {} })
        expect(callTool).toHaveBeenCalledWith({ name: 'get_recipe_form_a2ui', arguments: {} })
    })

    // The half that makes it a loop rather than a fetch: the action goes back as an
    // ordinary MCP tool call, and the agent's reply is more A2UI applied to the same
    // store — so one surface updates another.
    it('sends an action back and applies the A2UI it gets in reply', async () => {
        const { findByText } = render(<App />)

        const go = await findByText('Get Recipe')

        await act(async () => {
            go.click()
        })

        expect(callTool).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'a2ui_action', arguments: expect.objectContaining({ name: 'generate_recipe' }) })
        )

        // The card, a different surface, repaints from the form's action.
        expect(await findByText('Baked Tofu Bowl')).toBeDefined()
    })

    it('renders the same messages through either catalog', async () => {
        const { findByText, getByText } = render(<App />)

        await findByText(/Mediterranean Quinoa Bowl/i)

        // Swapping the catalog must not touch the agent's payload.
        getByText('Use the bundled catalog').click()

        expect(await findByText(/Mediterranean Quinoa Bowl/i)).toBeDefined()
        expect(callTool).toHaveBeenCalledTimes(2)
    })
})
