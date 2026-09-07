/**
 * Types for the A2UI → BindJS engine.
 *
 * The engine is host-side TypeScript: it walks a surface, resolves bindings, and
 * calls the registered BindJS catalog components to produce an AST. It makes no
 * presentation decisions — spacing, fonts and layout live in the catalog components.
 */
import type { ActionMessage, JsonValue } from '../protocol/types.js'
import type { FunctionRegistry } from '../functions/registry.js'
import type { Surface } from '../store/SurfaceStore.js'

// ---------------------------------------------------------------------------
// MARK: - Runtime
// ---------------------------------------------------------------------------

/**
 * The slice of `BindJSRuntime` the engine uses. Kept structural so this package
 * does not depend on the runtime's types at build time.
 */
export interface BindJSRuntimeLike {
    /** Invokes a registered component. `unwrap: false` keeps it composable as a child. */
    callComponent(name: string, props: unknown, children: unknown[], unwrap?: boolean): unknown

    /** Drives a built component to its plain AST. */
    unwrapComponentAST(component: unknown): unknown

    /**
     * Wraps a body function as a component, with modifier chaining.
     *
     * The parameter list mirrors the real runtime's, which takes props and children too:
     * a function declaring more parameters than this interface would not be assignable,
     * and hosts pass their own `BindJSRuntime` straight in.
     */
    makeComponent(body: (props?: unknown, children?: unknown[]) => unknown, props?: unknown, children?: unknown[]): unknown

    /** Registered component and built-in functions, including `ForEach`. */
    context: Record<string, (...args: never[]) => unknown>

    /**
     * Registered component sources, keyed by name. Optional so a host can supply a
     * minimal runtime; when present the engine checks a catalog entry actually resolves
     * before calling it.
     */
    components?: Record<string, unknown>

    /**
     * Called by every BindJS hook setter — `useState`, `useStore`, `useAppState` — and by
     * nothing else. Hosts assign it to schedule their own repaint; the engine wraps it to
     * learn that a component redraws differently with no A2UI input having changed, which
     * is the only way it can know to drop a memoised subtree.
     *
     * Optional, so a minimal runtime still renders. Without it the engine memoises
     * nothing, because it would have no way to notice the subtree had gone stale.
     */
    needsRerender?: (...args: never[]) => unknown
}

// ---------------------------------------------------------------------------
// MARK: - Catalog
// ---------------------------------------------------------------------------

/**
 * A property that holds references to other components.
 *
 * `children` / `child` are passed to the BindJS component positionally; every other
 * slot becomes a named prop carrying the built component(s) — so `Modal` receives
 * `trigger` and `content`, and `Tabs` receives `tabs: [{ title, child }]`.
 */
export type ChildSlot =
    { prop: string; kind: 'single' } | { prop: string; kind: 'list' } | { prop: string; kind: 'objectList'; childKey: string }

export interface CatalogEntry {
    /** Registered BindJS component name. */
    component: string

    /**
     * Child-bearing properties for this type. Defaults to `child` and `children`
     * when omitted, which covers most components.
     */
    slots?: ChildSlot[]
}

/**
 * Maps an A2UI component type to the BindJS component that renders it.
 *
 * That is the entire abstraction: swap the map (or the sources behind it) and you
 * have a different presentation of the same A2UI surface. A bare string is shorthand
 * for `{ component: name }`.
 */
export type Catalog = Record<string, string | CatalogEntry>

/** Normalises the shorthand form. */
export function catalogEntry(value: string | CatalogEntry | undefined): CatalogEntry | undefined {
    if (value === undefined) {
        return undefined
    }

    return typeof value === 'string' ? { component: value } : value
}

/** Used when a catalog entry does not declare its own slots. */
export const DEFAULT_SLOTS: ChildSlot[] = [
    { prop: 'child', kind: 'single' },
    { prop: 'children', kind: 'list' },
]

// ---------------------------------------------------------------------------
// MARK: - Diagnostics
// ---------------------------------------------------------------------------

export type DiagnosticCode =
    | 'UNKNOWN_CATALOG'
    | 'UNKNOWN_COMPONENT'
    | 'UNREGISTERED_COMPONENT'
    | 'MISSING_COMPONENT'
    | 'MISSING_ROOT'
    | 'CYCLE'
    | 'DEPTH_EXCEEDED'
    | 'NODE_LIMIT'
    | 'RESOLVE_FAILED'
    | 'TEMPLATE_NOT_ARRAY'

export interface Diagnostic {
    code: DiagnosticCode
    message: string

    /** Component id the problem was found at, when there is one. */
    componentId?: string
}

// ---------------------------------------------------------------------------
// MARK: - Options and result
// ---------------------------------------------------------------------------

export interface RenderOptions {
    runtime: BindJSRuntimeLike
    surface: Surface

    /**
     * The default catalog — used when a surface names no `catalogId`, or names the one
     * given as `defaultCatalogId`.
     */
    catalog: Catalog

    /**
     * Further catalogs, keyed by `catalogId`. A2UI resolves a component's catalog from
     * its own `catalogId`, then the surface's, and treats an unknown one as an error
     * rather than falling back — so a catalog absent from here is a diagnostic, not a
     * silent substitution.
     */
    catalogs?: Record<string, Catalog>

    /**
     * The id — or ids — `catalog` answers to. Defaults to the basic catalog's v1.0 and
     * v0.9 identifiers, which describe the same components.
     */
    defaultCatalogId?: string | readonly string[]

    /**
     * Reuse unchanged subtrees between renders. On by default.
     *
     * Turn it off when a host cannot guarantee the engine is re-entered after renderer
     * state moves. A memoised subtree comes back as a built AST whose body does not run
     * again, so a component holding a BindJS hook keeps drawing what it was built with —
     * and the symptom is the bad kind, a surface that looks right and does nothing.
     */
    memoise?: boolean

    /** Functions available to `{ call }` values. */
    registry?: FunctionRegistry

    locale?: string
    timeZone?: string

    /** Fired when a component dispatches an A2UI action. */
    onAction?(message: ActionMessage): void

    /**
     * Two-way writes. The engine injects a `set<Prop>` callback for every prop bound
     * to a data-model path, and each one calls this.
     */
    setValue?(path: string, value: JsonValue): void

    /** Host hook for the `openUrl` function and `functionCall` actions. */
    openUrl?(url: string, target?: string): void

    /** Guards against malformed or hostile input. */
    maxDepth?: number
    maxNodes?: number
}

export interface RenderResult {
    /** The unwrapped BindJS AST, or `undefined` when nothing could be built. */
    ast: unknown

    /** Everything that went wrong. Rendering is best-effort and never throws for content. */
    diagnostics: Diagnostic[]

    /** Components actually built this pass (templates count once, not once per row). */
    nodeCount: number

    /** Subtrees reused from the previous render instead of being rebuilt. */
    reused: number
}

export const DEFAULT_MAX_DEPTH = 50
export const DEFAULT_MAX_NODES = 10000
