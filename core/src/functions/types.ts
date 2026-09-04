/**
 * Types for A2UI functions — the `{ call, args }` form a property value can take.
 *
 * A function is invoked with **already-resolved** args: the resolver walks nested
 * `{ path }` / `{ call }` values first, so an implementation only ever sees plain JSON.
 */
import type { JsonValue } from '../protocol/types.js'

// ---------------------------------------------------------------------------
// MARK: - Runtime boundary
// ---------------------------------------------------------------------------

/** Which side of the connection is allowed to invoke a function. */
export type AllowedCallers = 'rendererOnly' | 'agentOnly' | 'rendererOrAgent'

/** Who is attempting the call. */
export type Caller = 'renderer' | 'agent'

// ---------------------------------------------------------------------------
// MARK: - Return values
// ---------------------------------------------------------------------------

/**
 * Returned by validation functions. The spec allows extra domain-specific
 * properties (a suggested fix, retry parameters) alongside the two standard ones,
 * so this intersects the known shape with an open JSON record — which also keeps
 * a result assignable to `JsonValue`.
 */
export type ValidationResult = {
    valid: boolean
    message?: string
} & Record<string, JsonValue>

// ---------------------------------------------------------------------------
// MARK: - Invocation context
// ---------------------------------------------------------------------------

/** Everything a function implementation may read from the surrounding surface. */
export interface FunctionContext {
    /** Reads the surface data model at a pointer, relative paths resolved against `scope`. */
    getValue(path: string): JsonValue | undefined

    /** JSON Pointer of the template element currently being rendered (`/` at the top level). */
    scope: string

    /** Index of the current template element, when inside one. Backs `@index`. */
    index?: number

    /** BCP 47 locale for the format functions. Defaults to the host locale. */
    locale?: string

    /** IANA time zone for `formatDate`. */
    timeZone?: string

    /** Host hook for `openUrl`. Absent means URL opening is unsupported. */
    openUrl?(url: string, target?: string): void

    /**
     * Calls another registered function with already-resolved arguments. `formatString`
     * uses it for `${formatDate(value: ${/start}, format: 'h:mm a')}`. Absent when the
     * caller supplied no registry, in which case such a placeholder renders as empty.
     */
    call?(name: string, args: Record<string, JsonValue | undefined>): JsonValue | undefined
}

// ---------------------------------------------------------------------------
// MARK: - Function definition
// ---------------------------------------------------------------------------

export interface A2UIFunction {
    /** Call name as it appears in `{ "call": "..." }`. */
    name: string

    /** Defaults to `rendererOrAgent` when registered without one. */
    allowedCallers: AllowedCallers

    /** Advertised in generated catalog schemas; not enforced at runtime. */
    returnType?: string

    /** One-line description used when generating a catalog for agent prompting. */
    description?: string

    invoke(args: Record<string, JsonValue | undefined>, context: FunctionContext): JsonValue
}

/** Convenience shape for declaring a function without repeating defaults. */
export type FunctionInput = Omit<A2UIFunction, 'allowedCallers'> & { allowedCallers?: AllowedCallers }
