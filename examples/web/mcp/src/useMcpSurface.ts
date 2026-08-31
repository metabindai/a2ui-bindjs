/**
 * Calling an MCP tool and rendering whatever A2UI it returns.
 *
 * The whole integration is: connect, call the tool, pull the `application/a2ui+json`
 * resource out of the result, and apply its messages to a store. Nothing interprets the
 * surface on the way through — the agent describes the UI, the catalog decides how it
 * looks.
 */
import { useCallback, useEffect, useState } from 'react'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { SurfaceStore, type ActionMessage, type AgentMessage } from '@metabindai/a2ui-bindjs'

/**
 * The MCP server, talked to directly. It sets CORS headers for exactly this reason: the
 * SSE handshake hands back a path to POST to, and a dev proxy would have to rewrite that
 * as well as the initial request.
 */
const SSE_URL = import.meta.env.VITE_MCP_URL || 'http://localhost:8787/sse'

const A2UI_MIME_TYPE = 'application/a2ui+json'

export type McpSurface =
    | { status: 'connecting' }
    | {
          status: 'ready'
          store: SurfaceStore
          tools: string[]
          called: string[]
          messageCount: number

          /** Sends a user's action back to the agent and applies whatever it answers. */
          dispatch: (action: ActionMessage) => Promise<void>
      }
    | { status: 'failed'; error: string }

interface ToolResource {
    type?: string
    resource?: { mimeType?: string; text?: string }
}

/** Pulls the A2UI payload out of a tool result, ignoring any prose alongside it. */
export function extractMessages(content: unknown): AgentMessage[] {
    if (!Array.isArray(content)) {
        return []
    }

    for (const part of content as ToolResource[]) {
        if (part.type === 'resource' && part.resource?.mimeType === A2UI_MIME_TYPE && part.resource.text) {
            const parsed = JSON.parse(part.resource.text)

            return Array.isArray(parsed) ? parsed : [parsed]
        }
    }

    return []
}

export function useMcpSurface(): { state: McpSurface; reload: () => void } {
    const [state, setState] = useState<McpSurface>({ status: 'connecting' })
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((previous) => previous + 1), [])

    useEffect(() => {
        let cancelled = false
        let client: Client | undefined

        setState({ status: 'connecting' })

        const run = async () => {
            client = new Client({ name: 'a2ui-bindjs-example', version: '0.1.0' })

            await client.connect(new SSEClientTransport(new URL(SSE_URL, window.location.origin)))

            const { tools } = await client.listTools()

            // Every A2UI tool the server offers, into one store. A connection can hold
            // several surfaces at once, and each gets its own renderer on the page.
            const called = tools.filter((tool) => tool.name.endsWith('_a2ui')).map((tool) => tool.name)
            const messages: AgentMessage[] = []

            for (const name of called) {
                const result = await client.callTool({ name, arguments: {} })

                messages.push(...extractMessages(result.content))
            }

            if (messages.length === 0) {
                throw new Error(`No tool returned an ${A2UI_MIME_TYPE} resource`)
            }

            const store = new SurfaceStore()
            store.applyAll(messages)

            /*
             * A2UI over MCP closes the loop with an ordinary tool call rather than a
             * bespoke channel: the action goes out as `a2ui_action`, and the agent's
             * reply is more A2UI applied to the same store — so the surface updates
             * itself without this code knowing what changed.
             */
            const dispatch = async (action: ActionMessage) => {
                const reply = await client!.callTool({
                    name: 'a2ui_action',
                    arguments: { name: action.name, surfaceId: action.surfaceId, context: action.context ?? {} },
                })

                store.applyAll(extractMessages(reply.content))
            }

            if (!cancelled) {
                setState({
                    status: 'ready',
                    store,
                    tools: tools.map((tool) => tool.name),
                    called,
                    messageCount: messages.length,
                    dispatch,
                })
            }
        }

        run().catch((error: Error) => {
            if (!cancelled) {
                setState({ status: 'failed', error: error.message })
            }
        })

        return () => {
            cancelled = true
            void client?.close()
        }
    }, [attempt])

    return { state, reload }
}
