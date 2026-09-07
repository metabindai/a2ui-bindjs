/**
 * The live session behind the Render tab.
 *
 * The editor pane is an authoring surface: changing it replays the whole stream, which
 * is the right model for composing a document but not for what an agent actually does.
 * An agent holds one long-lived surface and pushes incremental messages into it, so a
 * sent message is applied to the existing store — no replay, and anything the user has
 * typed into a rendered input survives it.
 *
 * Editing the base stream still reseeds (you changed the script), and sent messages are
 * replayed on top so the session is reproducible rather than lost.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { A2UIProtocolError, SurfaceStore, type AgentMessage } from '@metabindai/a2ui-bindjs'

export interface SentEntry {
    message: AgentMessage
    at: string
    error?: string
}

export interface LiveStore {
    store: SurfaceStore

    /** Bumped on every applied message so consumers re-render. */
    tick: number

    /** Applies one message to the live store. Returns an error message on failure. */
    send(message: AgentMessage): string | undefined
    sent: SentEntry[]

    /**
     * Discards sent messages and rebuilds from the authored stream. Bumping `epoch`
     * also remounts the renderer, so component-local state (an open Modal, a selected
     * tab) is cleared too — otherwise "reset" would only be half true.
     */
    reset(): void

    /** Increments on every reset; use it as a React key to force a clean remount. */
    epoch: number
}

export function useLiveStore(baseMessages: AgentMessage[]): LiveStore {
    const [tick, setTick] = useState(0)
    const [epoch, setEpoch] = useState(0)
    const sentRef = useRef<SentEntry[]>([])
    const [sent, setSent] = useState<SentEntry[]>([])

    // Identity of the authored stream. Changing it starts a new session.
    const baseKey = useMemo(() => JSON.stringify(baseMessages), [baseMessages])

    const store = useMemo(() => {
        const created = new SurfaceStore()

        // One notification for the whole seed, so nothing renders the half-built surface.
        created.batch(() => {
            for (const message of baseMessages) {
                try {
                    created.apply(message)
                } catch {
                    // Already reported in the Events tab.
                }
            }

            // Replay the session's sent messages so a base edit does not discard them.
            for (const entry of sentRef.current) {
                try {
                    created.apply(entry.message)
                } catch {
                    // Kept in the log with its original error.
                }
            }
        })

        return created
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseKey, epoch])

    const send = useCallback(
        (message: AgentMessage) => {
            let error: string | undefined

            try {
                store.apply(message)
            } catch (thrown) {
                const protocolError = thrown as A2UIProtocolError
                error = protocolError.path ? `${protocolError.message} (at ${protocolError.path})` : protocolError.message
            }

            const entry: SentEntry = { message, at: new Date().toLocaleTimeString(), error }

            sentRef.current = [...sentRef.current, entry]
            setSent(sentRef.current)
            setTick((previous) => previous + 1)

            return error
        },
        [store]
    )

    const reset = useCallback(() => {
        sentRef.current = []
        setSent([])
        setEpoch((previous) => previous + 1)
        setTick((previous) => previous + 1)
    }, [])

    return { store, tick, send, sent, reset, epoch }
}
