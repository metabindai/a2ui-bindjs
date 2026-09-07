/**
 * A2UI over MCP.
 *
 * MCP tools that answer with a UI instead of prose. The agent has no idea a browser,
 * React or BindJS is involved — it emits A2UI, and the catalog on this side decides how
 * it looks.
 *
 * The server offers two: a recipe card and a form to customise it. They arrive as two
 * surfaces on one connection, into one store, each with its own renderer — which is how
 * an agent drives a main view and a panel independently.
 *
 * Run both halves with `pnpm dev`.
 */
import { useMemo, useState } from 'react'
import { A2UIRenderer } from '@metabindai/a2ui-bindjs-react'
import type { ActionMessage } from '@metabindai/a2ui-bindjs'

import { createRecipeRuntime } from './catalog'
import { useMcpSurface } from './useMcpSurface'

export function App() {
    const { state, reload } = useMcpSurface()
    const [branded, setBranded] = useState(true)
    const [actions, setActions] = useState<ActionMessage[]>([])

    // Built once: a runtime carries the hook state of everything rendered through it.
    const recipeRuntime = useMemo(createRecipeRuntime, [])

    return (
        <main className="app">
            <h1>A2UI over MCP</h1>

            {state.status === 'connecting' && <p className="status">Connecting to the MCP server…</p>}

            {state.status === 'failed' && (
                <p className="status error">
                    {state.error} — is the MCP server running? <code>pnpm dev</code> starts both halves.
                </p>
            )}

            {state.status === 'ready' && (
                <>
                    <p className="status">
                        Called <code>{state.called.join(', ')}</code> over MCP; they returned{' '}
                        <code>{state.messageCount} A2UI messages</code> across{' '}
                        <code>{state.store.surfaceIds.length} surfaces</code>.
                    </p>

                    <div className="toolbar">
                        <button onClick={() => setBranded((previous) => !previous)}>
                            {branded ? 'Use the bundled catalog' : 'Use the recipe catalog'}
                        </button>
                        <button onClick={reload}>Call the tools again</button>
                    </div>

                    {/* One renderer per surface, all reading the same store. */}
                    {state.store.surfaceIds.map((surfaceId) => (
                        <section key={`${surfaceId}:${branded}`} className="surface">
                            <h2>{surfaceId}</h2>

                            <A2UIRenderer
                                store={state.store}
                                surfaceId={surfaceId}
                                runtime={branded ? recipeRuntime : undefined}
                                locale="en-US"
                                onAction={(action) => {
                                    setActions((previous) => [action, ...previous].slice(0, 4))

                                    // The agent answers with more A2UI, applied to the
                                    // same store — so the card updates from the form.
                                    void state.dispatch(action)
                                }}
                            />
                        </section>
                    ))}

                    {actions.length > 0 && (
                        <section className="log">
                            <h2>Sent back to the agent</h2>
                            {actions.map((action, index) => (
                                <pre key={index}>
                                    {action.surfaceId} · {action.name}
                                    {action.context ? ` · ${JSON.stringify(action.context)}` : ''}
                                </pre>
                            ))}
                        </section>
                    )}
                </>
            )}
        </main>
    )
}
