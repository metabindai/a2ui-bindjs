import { useCallback, useState } from 'react'
import { A2UIRenderer } from '@metabindai/a2ui-bindjs-react'
import type { ActionMessage, Diagnostic, SurfaceStore } from '@metabindai/a2ui-bindjs'
import styled from 'styled-components'

interface RenderViewProps {
    /** The live session store — mutated in place by sent updates, never replayed. */
    store: SurfaceStore

    /** Bumped by the live store on every applied message. */
    tick: number
}

const Wrap = styled.div`
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`

const Empty = styled.div`
    padding: 24px;
    color: #777;
    text-align: center;
`

const SurfaceLabel = styled.div`
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #888;
    margin-bottom: 6px;
`

const Surface = styled.div`
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 16px;
    background: #fff;

    /*
     * TEMPORARY. bindjs-react's Renderer hard-codes overflow:hidden and height:100% on
     * its container and exposes no prop for either, so a surface taller than its box is
     * clipped. Marked important because styled-components injects its own rule at
     * runtime, so a rule of matching specificity loses on order. Remove once Renderer
     * takes an overflow prop and A2UIRenderer forwards it.
     */
    & .rendererContainer {
        overflow: visible !important;
        height: auto !important;
    }
`

const Diagnostics = styled.div`
    margin-top: 12px;
    padding: 8px 10px;
    background: #fffbea;
    border: 1px solid #f5e0a3;
    border-radius: 6px;
    font-size: 12px;
    color: #7c5b02;
`

const Actions = styled.pre`
    padding: 8px 10px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    font-size: 12px;
    color: #14532d;
    white-space: pre-wrap;
`

export function RenderView({ store, tick }: RenderViewProps) {
    // Kept per surface: a bad component on one must not blank the others' reports.
    const [diagnostics, setDiagnostics] = useState<Record<string, Diagnostic[]>>({})
    const [actions, setActions] = useState<ActionMessage[]>([])

    const report = useCallback((surfaceId: string) => {
        return (found: Diagnostic[]) => {
            setDiagnostics((previous) => ({ ...previous, [surfaceId]: found }))
        }
    }, [])

    // Read so a sent message re-renders this view; the store itself is stable.
    void tick

    // Every surface the stream created, not just the first — an agent can drive several
    // at once, and each gets its own renderer over the one shared store.
    const surfaceIds = store.surfaceIds

    if (surfaceIds.length === 0) {
        return <Empty>No surface yet — apply a createSurface message.</Empty>
    }

    return (
        <Wrap>
            {surfaceIds.map((surfaceId) => {
                const found = diagnostics[surfaceId] ?? []

                return (
                    <section key={surfaceId}>
                        {/* Named only when there is more than one to tell apart. */}
                        {surfaceIds.length > 1 && <SurfaceLabel>{surfaceId}</SurfaceLabel>}

                        <Surface>
                            <A2UIRenderer
                                store={store}
                                surfaceId={surfaceId}
                                locale="en-US"
                                onDiagnostics={report(surfaceId)}
                                onAction={(message) => setActions((previous) => [message, ...previous].slice(0, 5))}
                            />
                        </Surface>

                        {found.length > 0 && (
                            <Diagnostics>
                                {found.map((diagnostic, index) => (
                                    <div key={index}>
                                        {diagnostic.code}
                                        {diagnostic.componentId ? ` (${diagnostic.componentId})` : ''}: {diagnostic.message}
                                    </div>
                                ))}
                            </Diagnostics>
                        )}
                    </section>
                )
            })}

            {actions.length > 0 && <Actions>{actions.map((action) => JSON.stringify(action, null, 2)).join('\n\n')}</Actions>}
        </Wrap>
    )
}
