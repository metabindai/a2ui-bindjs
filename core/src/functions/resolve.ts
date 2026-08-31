/**
 * Turns any A2UI `DynamicValue` into plain JSON.
 *
 * Three forms are resolved recursively, so bindings and calls can nest inside
 * objects, arrays, and each other's arguments:
 *
 *   "Hello"                                    → literal
 *   { path: "/user/name" }                     → data model lookup (scope-aware)
 *   { call: "formatString", args: { … } }      → function invocation
 */
import { isFunctionCall, isPathBinding, isPlainObject, type A2UIComponent, type JsonValue } from '../protocol/types.js'
import { getAt, resolvePath } from '../store/jsonPointer.js'
import type { FunctionRegistry } from './registry.js'
import type { Caller, FunctionContext } from './types.js'

// ---------------------------------------------------------------------------
// MARK: - Context
// ---------------------------------------------------------------------------

export interface ResolveContext {
    /** The surface's data model. */
    dataModel: JsonValue

    /** Functions available to `{ call }` values. Calls fail when omitted. */
    registry?: FunctionRegistry

    /** JSON Pointer of the current template element. Relative paths resolve against it. */
    scope?: string

    /** Index of the current template element, backing `@index`. */
    index?: number

    locale?: string
    timeZone?: string

    /** Host hook used by `openUrl`. */
    openUrl?(url: string, target?: string): void

    /** Who is invoking. Defaults to `renderer`. */
    caller?: Caller

    /**
     * Called instead of throwing when a value fails to resolve (unknown function,
     * boundary violation). The value resolves to `undefined`. Omit to let it throw.
     */
    onError?(error: Error, value: unknown): void

    /**
     * Called with every absolute data path read while resolving, and the value found.
     * The engine records these so it can tell whether a component's inputs changed
     * without re-resolving them.
     */
    onRead?(path: string, value: JsonValue | undefined): void
}

/** Structural keys the engine handles itself — never treated as resolvable props. */
const STRUCTURAL_KEYS = new Set(['id', 'component', 'catalogId', 'children', 'child', 'action'])

/**
 * Resolves a component's catalog properties, skipping the structural keys and any
 * extra child-bearing slots the engine builds itself (`Modal.trigger`, `Tabs.tabs`).
 */
export function resolvePropsExcept(component: A2UIComponent, skip: Iterable<string>, context: ResolveContext): Record<string, JsonValue> {
    const skipped = new Set(skip)
    const props: Record<string, JsonValue> = {}

    for (const [key, value] of Object.entries(component)) {
        if (STRUCTURAL_KEYS.has(key) || skipped.has(key)) {
            continue
        }

        const resolved = resolveValue(value, context)

        if (resolved !== undefined) {
            props[key] = resolved
        }
    }

    return props
}

// ---------------------------------------------------------------------------
// MARK: - Resolution
// ---------------------------------------------------------------------------

/** Resolves one value of any shape. */
export function resolveValue(value: unknown, context: ResolveContext): JsonValue | undefined {
    if (isPathBinding(value)) {
        return readPath(value.path, context)
    }

    if (isFunctionCall(value)) {
        return callFunction(value.call, value.args, context)
    }

    if (Array.isArray(value)) {
        return value.map((entry) => resolveValue(entry, context) ?? null)
    }

    if (isPlainObject(value)) {
        return resolveObject(value, context)
    }

    return value as JsonValue
}

/**
 * Resolves a component's catalog properties — everything except the structural keys,
 * which the engine consumes directly. `accessibility` is resolved like any other prop.
 */
export function resolveProps(component: A2UIComponent, context: ResolveContext): Record<string, JsonValue> {
    const props: Record<string, JsonValue> = {}

    for (const [key, value] of Object.entries(component)) {
        if (STRUCTURAL_KEYS.has(key)) {
            continue
        }

        const resolved = resolveValue(value, context)

        if (resolved !== undefined) {
            props[key] = resolved
        }
    }

    return props
}

/**
 * Resolves an action's `context` map at dispatch time, producing the payload sent
 * to the agent in an `action` message.
 */
export function resolveActionContext(
    actionContext: Record<string, unknown> | undefined,
    context: ResolveContext
): Record<string, JsonValue> | undefined {
    if (actionContext === undefined) {
        return undefined
    }

    return resolveObject(actionContext, context)
}

// ---------------------------------------------------------------------------
// MARK: - Internals
// ---------------------------------------------------------------------------

function resolveObject(source: Record<string, unknown>, context: ResolveContext): Record<string, JsonValue> {
    const result: Record<string, JsonValue> = {}

    for (const [key, value] of Object.entries(source)) {
        const resolved = resolveValue(value, context)

        if (resolved !== undefined) {
            result[key] = resolved
        }
    }

    return result
}

function readPath(path: string, context: ResolveContext): JsonValue | undefined {
    const absolute = resolvePath(path, context.scope ?? '/')
    const value = getAt(context.dataModel, absolute)

    context.onRead?.(absolute, value)

    return value
}

function callFunction(name: string, args: Record<string, unknown> | undefined, context: ResolveContext): JsonValue | undefined {
    const { registry } = context

    try {
        if (!registry) {
            throw new Error(`Cannot call '${name}': no function registry was provided.`)
        }

        // Args are resolved first, so implementations only ever see plain JSON.
        const resolvedArgs = args === undefined ? {} : resolveObject(args, context)

        return registry.call(name, resolvedArgs, functionContext(context), context.caller ?? 'renderer')
    } catch (error) {
        if (!context.onError) {
            throw error
        }

        context.onError(error as Error, { call: name, args })

        return undefined
    }
}

/** Narrows the resolve context to what a function implementation is allowed to see. */
function functionContext(context: ResolveContext): FunctionContext {
    return {
        getValue: (path: string) => readPath(path, context),
        scope: context.scope ?? '/',
        index: context.index,
        locale: context.locale,
        timeZone: context.timeZone,
        openUrl: context.openUrl,
    }
}
