/**
 * Creating a BindJS runtime with the A2UI catalog on it.
 *
 * Constructing a runtime and remembering to register the catalog before rendering is the
 * one bit of setup every host had to get right, so `<A2UIRenderer>` does it for you when
 * you do not pass a runtime of your own.
 */
import { useMemo } from 'react'
import { BindJSRuntime } from '@metabindai/bindjs-runtime'

import {
    BASIC_CATALOG_SOURCES,
    registerCatalog,
    type RegisterCatalogOptions,
    type RegistrarRuntime,
    type BindJSRuntimeLike,
} from '@metabindai/a2ui-bindjs'

/**
 * A fresh runtime with the basic catalog registered.
 *
 * A runtime carries the hook state of everything rendered through it, so hosts should
 * keep one per surface tree rather than making one per render — `useA2UIRuntime` does
 * that for React.
 */
export function createA2UIRuntime(options: RegisterCatalogOptions = {}): BindJSRuntimeLike {
    const runtime = new BindJSRuntime() as unknown as RegistrarRuntime

    // Bundled sources first, then whatever was passed on top. A caller supplying its own
    // — a catalog fetched from a server, say — usually has only some of the components,
    // and wants those to win while the rest still work. `registerCatalog` stays literal
    // for anyone who wants exactly what they asked for and nothing else.
    registerCatalog(runtime, { ...options, sources: { ...BASIC_CATALOG_SOURCES, ...(options.sources ?? {}) } })

    return runtime
}

/** A runtime that lives as long as the component holding it. */
export function useA2UIRuntime(options: RegisterCatalogOptions = {}): BindJSRuntimeLike {
    // Registering is idempotent, and the options only matter on first construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => createA2UIRuntime(options), [])
}
