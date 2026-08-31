/**
 * An MCP server that answers with A2UI.
 *
 * This is the agent's half of the demo. A tool returns a surface rather than prose, as an
 * embedded resource with the `application/a2ui+json` MIME type, and the client renders it.
 * Nothing here knows about BindJS or React — that is the point of the protocol.
 *
 * Modelled on the A2UI project's `a2ui-over-mcp-recipe` sample (Apache-2.0), rewritten in
 * TypeScript so it runs in this workspace's toolchain. The recipe payload in
 * `recipe.json` is theirs, unmodified — including its `v0.9` version, which this renderer
 * handles alongside v1.0.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { z } from 'zod'

const here = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 8787)

/** The MIME type A2UI uses to mark a payload as a renderable surface. */
const A2UI_MIME_TYPE = 'application/a2ui+json'

const RECIPE = readFileSync(join(here, 'recipe.json'), 'utf8')
const RECIPE_FORM = readFileSync(join(here, 'recipe-form.json'), 'utf8')

/** Wraps an A2UI payload as the embedded resource an MCP tool answers with. */
function a2uiResult(uri: string, text: string) {
    return { content: [{ type: 'resource' as const, resource: { uri, mimeType: A2UI_MIME_TYPE, text } }] }
}

/**
 * The browser talks to this server directly rather than through a dev proxy.
 *
 * A proxy would need the SSE handshake's POST-back path rewritten too — the server tells
 * the client where to post, and that path has to survive the round trip. Since we own
 * this server, allowing the origin is simpler and keeps it usable from MCP Inspector.
 */
function applyCors(response: ServerResponse, origin: string | undefined): void {
    response.setHeader('access-control-allow-origin', origin ?? '*')
    response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS')
    response.setHeader('access-control-allow-headers', 'content-type, mcp-session-id, mcp-protocol-version')
    response.setHeader('access-control-expose-headers', 'mcp-session-id')
}

/** A pretend agent: turns the form's choices into an update for the recipe card. */
function recipeUpdate(context: Record<string, unknown>): unknown[] {
    const first = (value: unknown) => (Array.isArray(value) ? String(value[0] ?? '') : String(value ?? ''))

    const style = first(context.cookingStyle) || 'Grilled'
    const protein = first(context.protein) || 'Chicken'

    return [
        {
            version: 'v0.9',
            updateDataModel: {
                surfaceId: 'recipe-card',
                path: '/',
                value: {
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=180&fit=crop',
                    title: `${style} ${protein} Bowl`,
                    rating: 4.7,
                    reviewCount: '(new for you)',
                    prepTime: '10 min prep',
                    cookTime: `${style === 'Baked' ? 35 : 20} min cook`,
                    servings: 'Serves 2',
                },
            },
        },
    ]
}

function buildServer(): McpServer {
    const server = new McpServer({ name: 'a2ui-recipe', version: '0.1.0' })

    server.registerTool(
        'get_recipe_a2ui',
        { title: 'Recipe card', description: 'Returns a recipe as an A2UI surface, ready to render.' },
        async () => a2uiResult('ui://recipe', RECIPE)
    )

    // A second surface, on the same connection. Interactive where the card is not: it has
    // pickers bound to the data model and a button that dispatches an action back.
    server.registerTool(
        'get_recipe_form_a2ui',
        { title: 'Recipe form', description: 'Returns a form for customising the recipe.' },
        async () => a2uiResult('ui://recipe-form', RECIPE_FORM)
    )

    /*
     * The other half of the loop: the renderer sends a user's action back, and the agent
     * answers with more A2UI. This is the A2UI-over-MCP convention — actions are an
     * ordinary tool call, not a bespoke channel — so the reply is just another batch of
     * messages, here updating the card's data model in place.
     */
    server.registerTool(
        'a2ui_action',
        {
            title: 'Handle a UI action',
            description: 'Receives an action from a rendered surface and returns updated A2UI.',
            inputSchema: {
                name: z.string(),
                surfaceId: z.string().optional(),
                context: z.record(z.string(), z.unknown()).optional(),
            },
        },
        async ({ name, context }) => {
            if (name !== 'generate_recipe') {
                return { content: [{ type: 'text' as const, text: `Ignored action ${name}` }] }
            }

            return a2uiResult('ui://recipe-update', JSON.stringify(recipeUpdate(context ?? {})))
        }
    )

    return server
}

// One transport per connected client, kept so its POSTed messages can be routed back.
const transports = new Map<string, SSEServerTransport>()

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '/', `http://localhost:${PORT}`)

    applyCors(response, request.headers.origin)

    if (request.method === 'OPTIONS') {
        response.writeHead(204).end()

        return
    }

    if (request.method === 'GET' && url.pathname === '/sse') {
        const transport = new SSEServerTransport('/messages', response)

        transports.set(transport.sessionId, transport)
        response.on('close', () => transports.delete(transport.sessionId))

        await buildServer().connect(transport)

        return
    }

    if (request.method === 'POST' && url.pathname === '/messages') {
        const transport = transports.get(url.searchParams.get('sessionId') ?? '')

        if (!transport) {
            response.writeHead(400).end('Unknown session')

            return
        }

        await transport.handlePostMessage(request, response)

        return
    }

    response.writeHead(404).end('Not found')
}

createServer((request, response) => {
    handle(request, response).catch((error: Error) => {
        console.error('mcp server:', error.message)

        if (!response.headersSent) {
            response.writeHead(500).end(error.message)
        }
    })
})
    .listen(PORT, () => {
        console.log(`MCP server on http://localhost:${PORT}/sse  (tool: get_recipe_a2ui)`)
    })
    .on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Stop the other process, or run with PORT=8788.`)
            process.exit(1)
        }

        throw error
    })
