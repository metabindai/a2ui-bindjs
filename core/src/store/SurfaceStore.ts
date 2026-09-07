/**
 * SurfaceStore — applies A2UI agent messages and holds the live state of every surface.
 * Pure TypeScript: no React, no BindJS. Renderers subscribe and read snapshots.
 */
import {
    ROOT_COMPONENT_ID,
    type A2UIComponent,
    type AgentFunctionResponse,
    type AgentMessage,
    type CallRendererFunction,
    type ComponentId,
    type CreateSurface,
    type DeleteSurface,
    type JsonValue,
    type UpdateComponents,
    type UpdateDataModel,
} from '../protocol/types.js'
import { A2UIProtocolError, messageType, parseMessage } from '../protocol/parse.js'
import { deleteAt, getAt, resolvePath, setAt } from './jsonPointer.js'

// ---------------------------------------------------------------------------
// MARK: - Types
// ---------------------------------------------------------------------------

export interface Surface {
    readonly id: string
    readonly catalogId?: string
    readonly sendDataModel: boolean

    /** Flat component map keyed by id. */
    readonly components: ReadonlyMap<ComponentId, A2UIComponent>
    readonly dataModel: JsonValue

    /** Monotonic counter bumped on every change to this surface. */
    readonly version: number
}

export type StoreEvent =
    | { type: 'surfaceCreated'; surfaceId: string }
    | { type: 'surfaceUpdated'; surfaceId: string }
    | { type: 'surfaceDeleted'; surfaceId: string }
    | { type: 'callRendererFunction'; message: CallRendererFunction }
    | { type: 'agentFunctionResponse'; message: AgentFunctionResponse }

export type StoreListener = (event: StoreEvent, store: SurfaceStore) => void

export interface SurfaceStoreOptions {
    /** Default catalog applied when `createSurface` omits `catalogId`. */
    defaultCatalogId?: string
}

// ---------------------------------------------------------------------------
// MARK: - Store
// ---------------------------------------------------------------------------

export class SurfaceStore {
    #surfaces = new Map<string, Surface>()
    #listeners = new Set<StoreListener>()
    #options: SurfaceStoreOptions
    #batchDepth = 0
    #queued: StoreEvent[] = []

    constructor(options: SurfaceStoreOptions = {}) {
        this.#options = options
    }

    // MARK: Reading

    get surfaceIds(): string[] {
        return [...this.#surfaces.keys()]
    }

    getSurface(surfaceId: string): Surface | undefined {
        return this.#surfaces.get(surfaceId)
    }

    requireSurface(surfaceId: string): Surface {
        const surface = this.#surfaces.get(surfaceId)

        if (!surface) {
            throw new A2UIProtocolError(`Unknown surface '${surfaceId}'`, { surfaceId })
        }

        return surface
    }

    getComponent(surfaceId: string, componentId: ComponentId): A2UIComponent | undefined {
        return this.#surfaces.get(surfaceId)?.components.get(componentId)
    }

    getRoot(surfaceId: string): A2UIComponent | undefined {
        return this.getComponent(surfaceId, ROOT_COMPONENT_ID)
    }

    /** Reads the data model at a pointer, resolving relative paths against `scope`. */
    getValue(surfaceId: string, path: string, scope = '/'): JsonValue | undefined {
        const surface = this.#surfaces.get(surfaceId)

        if (!surface) {
            return undefined
        }

        return getAt(surface.dataModel, resolvePath(path, scope))
    }

    // MARK: Applying agent messages

    /** Applies a single agent message (JSON string or object). Validates first; throws `A2UIProtocolError`. */
    apply(input: string | AgentMessage): void {
        const message = parseMessage(input) as Record<string, unknown>
        const type = messageType(message as AgentMessage)

        switch (type) {
            case 'createSurface':
                this.#createSurface(message.createSurface as CreateSurface)
                break

            case 'updateComponents':
                this.#updateComponents(message.updateComponents as UpdateComponents)
                break

            case 'updateDataModel':
                this.#updateDataModel(message.updateDataModel as UpdateDataModel)
                break

            case 'deleteSurface':
                this.deleteSurface((message.deleteSurface as DeleteSurface).surfaceId)
                break

            case 'callRendererFunction':
                this.#emit({ type: 'callRendererFunction', message: message.callRendererFunction as CallRendererFunction })
                break

            case 'agentFunctionResponse':
                this.#emit({ type: 'agentFunctionResponse', message: message.agentFunctionResponse as AgentFunctionResponse })
                break
        }
    }

    /** Applies a batch (e.g. one streamed chunk containing several messages). */
    applyAll(messages: Iterable<string | AgentMessage>): void {
        this.batch(() => {
            for (const message of messages) {
                this.apply(message)
            }
        })
    }

    /**
     * Applies several messages, notifying listeners once at the end.
     *
     * Without this, a run of messages that supersede each other — two
     * `updateComponents` for the same id, say — makes a renderer draw every
     * intermediate state before the final one. On the web React's own batching hides
     * that when the messages land in the same tick; nothing does on the native hosts,
     * so a stream reader should wrap each chunk in `batch`.
     *
     * Nested calls are fine: only the outermost one flushes.
     */
    batch<T>(work: () => T): T {
        this.#batchDepth += 1

        try {
            return work()
        } finally {
            this.#batchDepth -= 1

            if (this.#batchDepth === 0) {
                this.#flush()
            }
        }
    }

    // MARK: Local writes

    /**
     * Local write from an input component (two-way binding). Relative paths are resolved
     * against `scope` (the template element scope the component was rendered in).
     */
    setValue(surfaceId: string, path: string, value: JsonValue, scope = '/'): void {
        const surface = this.requireSurface(surfaceId)
        const absolutePath = resolvePath(path, scope)
        const dataModel = value === null ? deleteAt(surface.dataModel, absolutePath) : setAt(surface.dataModel, absolutePath, value)

        this.#replace({ ...surface, dataModel, version: surface.version + 1 })
        this.#emit({ type: 'surfaceUpdated', surfaceId })
    }

    deleteSurface(surfaceId: string): void {
        const existed = this.#surfaces.delete(surfaceId)

        if (!existed) {
            return
        }

        this.#emit({ type: 'surfaceDeleted', surfaceId })
    }

    clear(): void {
        for (const surfaceId of this.surfaceIds) {
            this.deleteSurface(surfaceId)
        }
    }

    // MARK: Subscriptions

    subscribe(listener: StoreListener): () => void {
        this.#listeners.add(listener)

        return () => {
            this.#listeners.delete(listener)
        }
    }

    // MARK: Internals

    #createSurface(message: CreateSurface): void {
        const previous = this.#surfaces.get(message.surfaceId)
        const components = new Map<ComponentId, A2UIComponent>()

        for (const component of message.components ?? []) {
            components.set(component.id, component)
        }

        this.#replace({
            id: message.surfaceId,
            catalogId: message.catalogId ?? this.#options.defaultCatalogId,
            sendDataModel: message.sendDataModel ?? false,
            components,
            dataModel: message.dataModel ?? {},
            version: (previous?.version ?? 0) + 1,
        })

        this.#emit({ type: previous ? 'surfaceUpdated' : 'surfaceCreated', surfaceId: message.surfaceId })
    }

    #updateComponents(message: UpdateComponents): void {
        const surface = this.requireSurface(message.surfaceId)
        const components = new Map(surface.components)

        for (const component of message.components) {
            components.set(component.id, component)
        }

        this.#replace({ ...surface, components, version: surface.version + 1 })
        this.#emit({ type: 'surfaceUpdated', surfaceId: message.surfaceId })
    }

    #updateDataModel(message: UpdateDataModel): void {
        const surface = this.requireSurface(message.surfaceId)
        const path = message.path ?? '/'
        const dataModel = message.value === null ? deleteAt(surface.dataModel, path) : setAt(surface.dataModel, path, message.value)

        this.#replace({ ...surface, dataModel, version: surface.version + 1 })
        this.#emit({ type: 'surfaceUpdated', surfaceId: message.surfaceId })
    }

    #replace(surface: Surface): void {
        this.#surfaces.set(surface.id, surface)
    }

    #emit(event: StoreEvent): void {
        if (this.#batchDepth > 0) {
            this.#queued.push(event)

            return
        }

        for (const listener of this.#listeners) {
            listener(event, this)
        }
    }

    /**
     * Sends the batched events. A surface that changed several times is reported once,
     * with its last state — created-then-updated stays 'created', and anything followed
     * by a delete is reported only as deleted. Function-call events are never collapsed;
     * each one is a distinct request.
     */
    #flush(): void {
        const queued = this.#queued
        this.#queued = []

        const order: string[] = []
        const bySurface = new Map<string, StoreEvent>()
        const events: StoreEvent[] = []

        for (const event of queued) {
            if (!('surfaceId' in event)) {
                events.push(event)
                continue
            }

            const previous = bySurface.get(event.surfaceId)

            if (previous === undefined) {
                order.push(event.surfaceId)
            }

            // A surface created in this batch stays 'created' however often it changes.
            const keepCreated = previous?.type === 'surfaceCreated' && event.type === 'surfaceUpdated'

            bySurface.set(event.surfaceId, keepCreated ? previous : event)
        }

        for (const surfaceId of order) {
            events.push(bySurface.get(surfaceId)!)
        }

        for (const event of events) {
            for (const listener of this.#listeners) {
                listener(event, this)
            }
        }
    }
}
