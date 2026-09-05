/**
 * Noticing when BindJS renderer state changes.
 *
 * The engine memoises a subtree whose A2UI inputs have not changed, and decides that by
 * comparing the data model. A component holding a BindJS hook can change what it draws
 * with nothing in the data model moving — a `Modal` opening, a card following a finger —
 * so the cache has to be told, and the data model will never tell it.
 *
 * BindJS already funnels exactly that: `useState`, `useStore` and `useAppState` each call
 * `runtime.needsRerender` from their setter, and nothing else does. Observing it is
 * therefore the whole signal, and it does not matter which component the hook was in or
 * who called it — which is why nothing has to declare itself stateful.
 *
 * A change invalidates the entire cache rather than the subtree the hook sits in. The
 * setter knows its hook path and could narrow it, but that is an optimisation: one full
 * rebuild per interaction is already cheaper than the alternative of never caching a
 * component that holds state.
 */
import type { BindJSRuntimeLike } from './types.js'

// MARK: - State

type Delegate = (...args: unknown[]) => unknown

interface Observed {
    /** Bumped by every hook setter. Sessions compare it against what they last saw. */
    revision: number

    /** Whatever the host last assigned, which we call through to. */
    delegate: Delegate

    /** Hosts that want to re-render when renderer state moves. */
    listeners: Set<() => void>
}

/**
 * Keyed by runtime, not by session: several surfaces can render through one runtime, and
 * each has to learn about a change without wrapping `needsRerender` again behind the
 * others.
 */
const OBSERVED = new WeakMap<object, Observed>()

// MARK: - Observing

/**
 * Starts watching a runtime's hook setters, and reports the current revision.
 *
 * Installed as an accessor rather than by overwriting the property, because the property
 * is contested. bindjs-react assigns `runtime.needsRerender = performRerender` on every
 * render of its own, and `useState` captures whatever is there at the moment a component
 * body runs — so a plain wrapper is a race with two ways to lose: the host overwrites us
 * and the revision never moves, or a hook captured us and we forward to a handler the
 * host has since replaced. Either way a gesture stops repainting.
 *
 * With a getter and a setter there is nothing to race. Everyone who reads the property
 * gets the same wrapper, whenever they read it; everyone who assigns is recorded as the
 * delegate and called through. The host keeps its repaint, we keep our count.
 *
 * Returns `undefined` when the runtime has no `needsRerender` to watch. That is not a
 * detail a caller may ignore: without it there is no way to know a hook fired, and a
 * cached subtree would keep redrawing the state it was built with. Callers must not
 * memoise at all in that case — a slow renderer is a great deal better than one that
 * silently stops repainting.
 */
export function observeHookState(runtime: BindJSRuntimeLike): number | undefined {
    const installed = OBSERVED.get(runtime)

    if (installed !== undefined) {
        return installed.revision
    }

    const target = runtime as { needsRerender?: unknown }

    if (typeof target.needsRerender !== 'function') {
        return undefined
    }

    const state: Observed = { revision: 0, delegate: target.needsRerender as Delegate, listeners: new Set() }

    const wrapper = (...args: unknown[]): unknown => {
        state.revision += 1


        // The host's own repaint first, then ours. bindjs-react repaints the tree it
        // built and stops there; nothing in that path re-runs the A2UI engine, so a
        // memoised subtree would go on being served after the state under it moved.
        const result = state.delegate.apply(runtime, args)

        for (const listener of state.listeners) {
            listener()
        }

        return result
    }

    Object.defineProperty(runtime, 'needsRerender', {
        configurable: true,

        get: () => wrapper,

        // A host assigning its own handler replaces the delegate, never the wrapper.
        set: (value: unknown) => {
            if (typeof value === 'function') {
                state.delegate = value as Delegate
            }
        },
    })

    OBSERVED.set(runtime, state)

    return state.revision
}

// MARK: - Subscribing

/**
 * Calls `listener` whenever renderer state moves, and returns the unsubscribe.
 *
 * For hosts that do not redraw on their own. The native ones already do — a hook setter
 * makes the runtime publish and the host asks for the surface again, which re-runs the
 * engine and picks the change up. On the web nothing does: bindjs-react repaints the tree
 * it built, and the A2UI engine is never re-entered, so a memoised subtree is served
 * unchanged for as long as the surface is mounted.
 */
export function subscribeToHookState(runtime: BindJSRuntimeLike, listener: () => void): () => void {
    observeHookState(runtime)

    const state = OBSERVED.get(runtime)

    if (state === undefined) {
        return () => {}
    }

    state.listeners.add(listener)

    return () => {
        state.listeners.delete(listener)
    }
}

/** The current revision, for a host comparing it across renders. */
export function hookStateRevision(runtime: BindJSRuntimeLike): number {
    return OBSERVED.get(runtime)?.revision ?? 0
}
