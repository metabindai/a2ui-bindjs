/**
 * Registering a catalog with a BindJS runtime.
 *
 * A catalog is two things: BindJS sources to register, and the map from A2UI component
 * type to registered component name that the engine dispatches through. Overriding one
 * component means registering a different source under a new name and pointing that
 * one entry at it — nothing else changes.
 */
import type { BindJSRuntimeLike, Catalog } from '../engine/types.js'
import { BASIC_CATALOG } from '../engine/catalog.js'
import { BASIC_CATALOG_SOURCES } from './basic/sources.generated.js'

/** The runtime methods needed to register components. */
export interface RegistrarRuntime extends BindJSRuntimeLike {
    registerComponent(name: string, source: string, entryPoint?: string): void
}

export interface RegisterCatalogOptions {
    /** Component name → BindJS source. Defaults to the bundled basic catalog. */
    sources?: Record<string, string>

    /** A2UI type → component name. Defaults to the basic catalog map. */
    catalog?: Catalog
}

/**
 * Registers catalog sources on a runtime and returns the map to hand to `renderSurface`.
 * Safe to call more than once; registering the same name again replaces it.
 */
export function registerCatalog(runtime: RegistrarRuntime, options: RegisterCatalogOptions = {}): Catalog {
    const sources = options.sources ?? BASIC_CATALOG_SOURCES

    for (const [name, source] of Object.entries(sources)) {
        runtime.registerComponent(name, source)
    }

    return options.catalog ?? BASIC_CATALOG
}

/**
 * Registers only the catalog components a runtime is missing.
 *
 * Passing your own runtime should not mean remembering to register the catalog, but it
 * must not mean having your own components silently replaced either. So this fills gaps
 * and never overwrites: register `A2UIText` yourself and yours is what renders. A
 * catalog naming a component we have no source for is left alone, and the engine reports
 * it as `UNREGISTERED_COMPONENT`.
 */
export function ensureCatalogRegistered(
    runtime: RegistrarRuntime,
    catalog: Catalog,
    sources: Record<string, string> = BASIC_CATALOG_SOURCES
): void {
    const registered = runtime.components

    for (const value of Object.values(catalog)) {
        const name = typeof value === 'string' ? value : value.component
        const source = sources[name]

        if (source === undefined) {
            continue
        }

        if (registered !== undefined && registered[name] !== undefined) {
            continue
        }

        runtime.registerComponent(name, source)
    }
}

export { BASIC_CATALOG_SOURCES }
