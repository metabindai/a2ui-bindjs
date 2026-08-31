/**
 * The bridge a native host talks to.
 *
 * `bindjs-apple` (and its Android equivalent) already embed a JavaScript context holding
 * **one** `BindJSRuntime`. That instance owns two things interaction depends on: hook
 * state, keyed by component path, and stored functions, where a `handlerId` in the AST is
 * resolved back to a closure when the user taps something.
 *
 * So this bundle must not carry its own runtime. It attaches to the host's, renders
 * through it, and hands back an AST the native renderer decodes exactly as it decodes
 * anything else — handler ids included. A second runtime would render correctly and then
 * fail on the first tap, which is a bad way to find out.
 *
 * Everything crossing the boundary is a JSON string: JavaScriptCore bridges those
 * cheaply and unambiguously, and it keeps the Swift side free of structural assumptions.
 *
 * Usage from the host, once:
 *
 * ```js
 * const runtime = new BindJSRuntime()   // the host already has this
 * a2ui.attach(runtime)
 * ```
 */
import { registerCatalog, type RegistrarRuntime } from '../catalog/register.js'
import { BASIC_CATALOG } from '../engine/catalog.js'
import { RenderSession } from '../engine/render.js'
import type { BindJSRuntimeLike, Catalog, Diagnostic } from '../engine/types.js'
import { createStandardRegistry, type FunctionRegistry } from '../functions/registry.js'
import type { ActionMessage, AgentMessage, ErrorMessage, JsonValue } from '../protocol/types.js'
import { SurfaceStore, type StoreEvent } from '../store/SurfaceStore.js'
import { validateSurface, validationError } from '../validation/validate.js'

export interface NativeBridgeOptions {
    locale?: string
    timeZone?: string

    /**
     * Validate each surface structurally after applying messages, and queue what it finds
     * as A2UI `error` messages for the host to send on.
     *
     * Off by default. Validation judges a surface as it stands, and one being streamed is
     * legitimately incomplete part-way through — the official `00_incremental` example has
     * a dangling reference at message three of six. Turn this on when the host applies
     * whole payloads rather than a live stream.
     */
    validate?: boolean
}

/** What `render` hands back. The AST is already unwrapped and ready to decode. */
export interface NativeRenderResult {
    ast: unknown
    diagnostics: Diagnostic[]
}

/**
 * Actions are queued rather than pushed.
 *
 * A tap arrives as the host invoking a stored function inside the JS context; there is no
 * Swift callback to call from there. The host drains the queue after handling a tap and
 * forwards whatever it finds to the agent.
 */
export class A2UINativeBridge {
    #store = new SurfaceStore()
    #sessions = new Map<string, RenderSession>()
    #actions: ActionMessage[] = []
    #errors: ErrorMessage[] = []
    #runtime?: BindJSRuntimeLike
    #catalog: Catalog = BASIC_CATALOG
    #registry: FunctionRegistry = createStandardRegistry()
    #options: NativeBridgeOptions = {}
    #onActions?: () => void

    /** Attaches to the host's runtime and registers the catalog on it. */
    attach(runtime: BindJSRuntimeLike, options: NativeBridgeOptions = {}): void {
        this.#runtime = runtime
        this.#options = options

        registerCatalog(runtime as RegistrarRuntime)
    }

    /**
     * Registers a callback fired whenever a surface changes.
     *
     * This is the signal a host redraws on, and without it nothing does. A control writing
     * back into the data model does not touch BindJS hook state — the model owns the value,
     * which is the whole point — so the runtime never marks itself dirty and the host has
     * no other way to learn that the tree it drew is now stale.
     *
     * `useA2UIStore` is the web equivalent, via `useSyncExternalStore`.
     */
    onChange(callback: (surfaceId: string, kind: string) => void): () => void {
        return this.#store.subscribe((event: StoreEvent) => {
            const surfaceId = 'surfaceId' in event ? event.surfaceId : ''

            callback(surfaceId, event.type)
        })
    }

    /**
     * Registers a callback fired whenever an action is queued.
     *
     * A tap does not always change the data model, so a host cannot rely on its own
     * redraw to notice one. This lets the host drain the queue on the tap itself rather
     * than polling for something that may never come.
     */
    onActions(callback: () => void): void {
        this.#onActions = callback
    }

    configure(options: NativeBridgeOptions): void {
        this.#options = { ...this.#options, ...options }
    }

    /** Registers extra BindJS sources and points catalog entries at them. */
    useCatalog(sources: Record<string, string>, catalog?: Catalog): void {
        const runtime = this.#require()

        registerCatalog(runtime as RegistrarRuntime, { sources })

        if (catalog) {
            this.#catalog = catalog
            this.#sessions.clear()
        }
    }

    /** Applies agent messages. Accepts one message, an array, or a JSON string of either. */
    applyMessages(input: string | AgentMessage | AgentMessage[]): { applied: number; errors: string[] } {
        const parsed = typeof input === 'string' ? (JSON.parse(input) as AgentMessage | AgentMessage[]) : input
        const messages = Array.isArray(parsed) ? parsed : [parsed]
        const errors: string[] = []
        let applied = 0

        // One notification for the batch: a native host redraws on the result, and should
        // not be asked to draw each intermediate state.
        this.#store.batch(() => {
            for (const message of messages) {
                try {
                    this.#store.apply(message)
                    applied += 1
                } catch (error) {
                    errors.push((error as Error).message)
                }
            }
        })

        if (this.#options.validate) {
            this.#validateAll()
        }

        return { applied, errors }
    }

    /** Everything validation reported since the last call. Clears the queue. */
    takeErrors(): ErrorMessage[] {
        const errors = this.#errors

        this.#errors = []

        return errors
    }

    takeErrorsJSON(): string {
        return JSON.stringify(this.takeErrors())
    }

    #validateAll(): void {
        for (const surfaceId of this.#store.surfaceIds) {
            const surface = this.#store.getSurface(surfaceId)

            if (!surface) {
                continue
            }

            for (const issue of validateSurface(surfaceId, surface.components, surface.dataModel, {
                catalog: this.#catalog,
            })) {
                this.#errors.push(validationError(issue))
            }
        }
    }

    surfaceIds(): string[] {
        return this.#store.surfaceIds
    }

    /** Builds the AST for one surface. Returns `null` when there is no such surface. */
    render(surfaceId?: string): NativeRenderResult | null {
        const runtime = this.#require()
        const id = surfaceId ?? this.#store.surfaceIds[0]
        const surface = id === undefined ? undefined : this.#store.getSurface(id)

        if (!surface) {
            return null
        }

        const result = this.#sessionFor(surface.id).render({
            runtime,
            surface,
            catalog: this.#catalog,
            registry: this.#registry,
            locale: this.#options.locale,
            timeZone: this.#options.timeZone,
            setValue: (path, value) => this.#store.setValue(surface.id, path, value),
            onAction: (action) => {
                this.#actions.push(action)
                this.#onActions?.()
            },
        })

        return { ast: result.ast ?? null, diagnostics: result.diagnostics }
    }

    /** `render`, serialised — the form a JavaScriptCore host can read directly. */
    renderJSON(surfaceId?: string): string {
        return JSON.stringify(this.render(surfaceId))
    }

    /** Writes into the data model, as a two-way bound control would. */
    setValue(surfaceId: string, path: string, value: JsonValue): void {
        this.#store.setValue(surfaceId, path, value)
    }

    /** Everything the surface dispatched since the last call. Clears the queue. */
    takeActions(): ActionMessage[] {
        const actions = this.#actions

        this.#actions = []

        return actions
    }

    takeActionsJSON(): string {
        return JSON.stringify(this.takeActions())
    }

    /** Version counter for a surface, so a host can skip redrawing an unchanged one. */
    versionOf(surfaceId: string): number {
        return this.#store.getSurface(surfaceId)?.version ?? 0
    }

    reset(): void {
        this.#store.clear()
        this.#sessions.clear()
        this.#actions = []
        this.#errors = []
    }

    /** One session per surface, so subtrees are reused across redraws. */
    #sessionFor(surfaceId: string): RenderSession {
        let session = this.#sessions.get(surfaceId)

        if (!session) {
            session = new RenderSession()
            this.#sessions.set(surfaceId, session)
        }

        return session
    }

    #require(): BindJSRuntimeLike {
        if (!this.#runtime) {
            throw new Error('a2ui: call attach(runtime) with the host runtime before rendering')
        }

        return this.#runtime
    }
}
