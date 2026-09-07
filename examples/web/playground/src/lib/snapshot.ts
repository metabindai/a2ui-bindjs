/**
 * A plain, serialisable view of one surface — shared by the replayed timeline and the
 * live session so both tabs render identically.
 */
import { createStandardRegistry, resolveProps, type Surface } from '@metabindai/a2ui-bindjs'

// One shared registry: the standard function set, no custom catalog functions yet.
const registry = createStandardRegistry()

export interface SurfaceSnapshot {
    id: string
    catalogId?: string
    sendDataModel: boolean
    version: number
    components: Record<string, unknown>

    /** Each component's props with `{ path }` bindings read and `{ call }` functions invoked. */
    resolved: Record<string, unknown>

    /** Anything that failed to resolve (unknown function, boundary violation). */
    resolveErrors: string[]
    dataModel: unknown
}

export function snapshotSurface(surface: Surface): SurfaceSnapshot {
    const resolveErrors: string[] = []
    const context = {
        dataModel: surface.dataModel,
        registry,
        onError: (error: Error) => {
            resolveErrors.push(error.message)
        },
    }

    // Top-level resolution only: template rows each have their own scope, which is
    // the engine's job (plan phase 3).
    const resolved: Record<string, unknown> = {}

    for (const [id, component] of surface.components) {
        resolved[id] = resolveProps(component, context)
    }

    return {
        id: surface.id,
        catalogId: surface.catalogId,
        sendDataModel: surface.sendDataModel,
        version: surface.version,
        components: Object.fromEntries(surface.components),
        resolved,
        resolveErrors: [...new Set(resolveErrors)],
        dataModel: surface.dataModel,
    }
}
