/**
 * React bindings for the surface store.
 */
import { useCallback, useState, useSyncExternalStore } from 'react'

import { A2UIProtocolError, SurfaceStore, type AgentMessage, type Surface } from '@metabindai/a2ui-bindjs'

export interface UseA2UIStoreResult {
    store: SurfaceStore

    /** Messages that failed to apply, in stream order. */
    errors: A2UIProtocolError[]
}

/**
 * Builds a store from a fixed message list. Each change to `messages` replays the
 * stream from scratch, which keeps the result a pure function of its input — the right
 * default for a list that grows by appending, as a streamed response does.
 *
 * For a long-lived connection, create a `SurfaceStore` yourself and call `apply()` as
 * messages arrive; `useSurface` below will still track it.
 */
export function useA2UIStore(messages: Array<string | AgentMessage>): UseA2UIStoreResult {
    // Held in state rather than a memo: the store is mutable — inputs write to it, and
    // so does the host when the agent answers an action — and React is free to discard a
    // memo, which would silently lose all of that. Rebuilding when `messages` changes
    // uses the documented reset-during-render pattern.
    const [state, setState] = useState(() => build(messages))

    if (state.messages !== messages) {
        setState(build(messages))
    }

    return state
}

interface StoreState extends UseA2UIStoreResult {
    /** The list this store was built from, so a new one can be detected. */
    messages: Array<string | AgentMessage>
}

function build(messages: Array<string | AgentMessage>): StoreState {
    const store = new SurfaceStore()
    const errors: A2UIProtocolError[] = []

    store.batch(() => {
        for (const message of messages) {
            try {
                store.apply(message)
            } catch (error) {
                errors.push(error as A2UIProtocolError)
            }
        }
    })

    return { store, errors, messages }
}

/** Subscribes to one surface, re-rendering whenever the store replaces it. */
export function useSurface(store: SurfaceStore, surfaceId: string | undefined): Surface | undefined {
    const subscribe = useCallback((onStoreChange: () => void) => store.subscribe(onStoreChange), [store])
    const getSnapshot = useCallback(() => (surfaceId === undefined ? undefined : store.getSurface(surfaceId)), [store, surfaceId])

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * The store's first surface, tracked as surfaces come and go.
 *
 * Most hosts render one surface, so naming it is noise; a host juggling several passes
 * `surfaceId` explicitly. The snapshot is a string, so it compares by value and does not
 * tear the way an object identity would.
 */
export function useFirstSurfaceId(store: SurfaceStore): string | undefined {
    const subscribe = useCallback((onStoreChange: () => void) => store.subscribe(onStoreChange), [store])
    const getSnapshot = useCallback(() => store.surfaceIds[0], [store])

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
