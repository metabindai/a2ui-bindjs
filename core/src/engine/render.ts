/**
 * Walks an A2UI surface and builds a BindJS component tree.
 *
 * One pass, no intermediate representation: for each node it resolves the props, builds
 * the children, and calls the catalog component. Template children become a BindJS
 * `ForEach`, which is lazy — rows are built by the renderer on demand.
 *
 * A `RenderSession` additionally memoises subtrees across renders, so pushing a stream
 * of updates at a live surface only re-invokes the components whose inputs changed.
 * See `docs/PLAN.md` for why this is safe with the runtime's hook storage.
 */
import {
    ROOT_COMPONENT_ID,
    isChildTemplate,
    isPathBinding,
    isPlainObject,
    type A2UIComponent,
    type ComponentId,
    type JsonValue,
} from '../protocol/types.js'
import { resolveActionContext, resolvePropsExcept, resolveValue, type ResolveContext } from '../functions/resolve.js'
import { getAt, resolvePath } from '../store/jsonPointer.js'
import { BASIC_CATALOG_IDS } from './catalog.js'
import {
    DEFAULT_MAX_DEPTH,
    DEFAULT_MAX_NODES,
    DEFAULT_SLOTS,
    catalogEntry,
    type Catalog,
    type ChildSlot,
    type Diagnostic,
    type DiagnosticCode,
    type RenderOptions,
    type RenderResult,
} from './types.js'

/** Tags each built component so its subtree can be recovered from the unwrapped AST. */
const KEY_PROP = '__a2uiKey'

/** What a node's child slots resolved to. */
interface BuiltSlots {
    /** `child` / `children`, handed to the component positionally. */
    children: unknown[]

    /** Every other slot, handed over as named props. */
    props: Record<string, unknown>

    /** `weight` of each positional child, when any declares one. */
    weights?: number[]
}

/** A node reference, as recorded for invalidation. */
interface NodeRef {
    id: ComponentId
    scope: string
}

interface CacheEntry {
    /** The unwrapped AST subtree, ready to splice into a parent's children. */
    ast: unknown

    /** Identity of the component definition this was built from. */
    definition: A2UIComponent

    /** Every data path read while resolving, with the value seen. */
    reads: Array<[string, JsonValue | undefined]>

    /** Children, so a change deep in the subtree invalidates this entry too. */
    children: NodeRef[]
}

/** Renders one surface, reusing unchanged subtrees between renders. */
export class RenderSession {
    #cache = new Map<string, CacheEntry>()
    #pending = new Map<string, Omit<CacheEntry, 'ast'>>()
    #options!: RenderOptions
    #signature?: string
    #catalog?: unknown
    #catalogs?: unknown
    #registry?: unknown

    #diagnostics: Diagnostic[] = []
    #nodeCount = 0
    #reused = 0
    #maxDepth = DEFAULT_MAX_DEPTH
    #maxNodes = DEFAULT_MAX_NODES

    /** Drops every cached subtree. */
    clear(): void {
        this.#cache.clear()
    }

    render(options: RenderOptions): RenderResult {
        this.#options = options
        this.#maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH
        this.#maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES
        this.#diagnostics = []
        this.#pending = new Map()
        this.#nodeCount = 0
        this.#reused = 0

        // Anything that changes how every node renders invalidates everything. A host
        // that passes a fresh catalog object each render simply gets no reuse.
        const signature = [options.surface.id, options.locale, options.timeZone].join(' ')
        const stale =
            signature !== this.#signature ||
            options.catalog !== this.#catalog ||
            options.catalogs !== this.#catalogs ||
            options.registry !== this.#registry

        if (stale) {
            this.#signature = signature
            this.#catalog = options.catalog
            this.#catalogs = options.catalogs
            this.#registry = options.registry
            this.#cache.clear()
        }

        const root = options.surface.components.get(ROOT_COMPONENT_ID)

        if (!root) {
            this.#report('MISSING_ROOT', `Surface '${options.surface.id}' has no 'root' component.`)

            return { ast: undefined, diagnostics: this.#diagnostics, nodeCount: 0, reused: 0 }
        }

        const built = this.#build(ROOT_COMPONENT_ID, '/', undefined, 0, new Set())

        // Unwrap here rather than leaving it to the renderer: the cache holds unwrapped
        // subtrees, since splicing one is what lets a component's body be skipped.
        const ast = built === undefined ? undefined : this.#options.runtime.unwrapComponentAST(built)

        this.#harvest(ast)

        return { ast, diagnostics: this.#diagnostics, nodeCount: this.#nodeCount, reused: this.#reused }
    }

    // MARK: Cache

    #keyOf(id: ComponentId, scope: string): string {
        return `${scope} ${id}`
    }

    /**
     * True when a node and everything under it would rebuild to exactly what is cached:
     * same definition object, same values at every path it read, and valid children.
     */
    #isValid(id: ComponentId, scope: string, visiting = new Set<string>()): boolean {
        const key = this.#keyOf(id, scope)

        if (visiting.has(key)) {
            return false
        }

        const entry = this.#cache.get(key)

        if (!entry || this.#options.surface.components.get(id) !== entry.definition) {
            return false
        }

        const { dataModel } = this.#options.surface

        for (const [path, value] of entry.reads) {
            // Identity is enough: the store shares structure, so an untouched subtree
            // keeps its reference.
            if (getAt(dataModel, path) !== value) {
                return false
            }
        }

        visiting.add(key)

        for (const child of entry.children) {
            if (!this.#isValid(child.id, child.scope, visiting)) {
                visiting.delete(key)

                return false
            }
        }

        visiting.delete(key)

        return true
    }

    /** Indexes the freshly built subtrees out of the unwrapped AST. */
    #harvest(ast: unknown): void {
        if (this.#pending.size === 0) {
            return
        }

        // Reused subtrees are shared objects and can appear in more than one place, so
        // the walk has to remember what it has seen — without this it re-walks shared
        // branches exponentially and overflows the stack.
        const seen = new WeakSet<object>()

        const visit = (node: unknown): void => {
            if (node === null || typeof node !== 'object') {
                return
            }

            if (seen.has(node)) {
                return
            }

            seen.add(node)

            if (Array.isArray(node)) {
                node.forEach(visit)

                return
            }

            if (!isPlainObject(node)) {
                return
            }

            const call = node as { type?: string; props?: { props?: Record<string, unknown> } }
            const key = call.type === 'ComponentCall' ? call.props?.props?.[KEY_PROP] : undefined

            if (typeof key === 'string') {
                const pending = this.#pending.get(key)

                if (pending) {
                    this.#cache.set(key, { ...pending, ast: node })
                    this.#pending.delete(key)
                }
            }

            for (const value of Object.values(node)) {
                visit(value)
            }
        }

        visit(ast)
    }

    // MARK: Building

    /**
     * Builds one component. `scope` is the JSON Pointer of the enclosing template
     * element; `ancestors` carries the ids on the current path for cycle detection.
     */
    #build(componentId: ComponentId, scope: string, index: number | undefined, depth: number, ancestors: Set<ComponentId>): unknown {
        if (depth > this.#maxDepth) {
            this.#report('DEPTH_EXCEEDED', `Maximum depth of ${this.#maxDepth} exceeded.`, componentId)

            return undefined
        }

        if (this.#nodeCount >= this.#maxNodes) {
            this.#report('NODE_LIMIT', `Maximum of ${this.#maxNodes} components exceeded.`, componentId)

            return undefined
        }

        if (ancestors.has(componentId)) {
            this.#report('CYCLE', `Component '${componentId}' contains itself.`, componentId)

            return undefined
        }

        const node = this.#options.surface.components.get(componentId)

        if (!node) {
            this.#report('MISSING_COMPONENT', `No component with id '${componentId}'.`, componentId)

            return undefined
        }

        const catalog = this.#catalogFor(node, componentId)

        if (!catalog) {
            return undefined
        }

        const entry = catalogEntry(catalog[node.component])

        if (!entry) {
            this.#report('UNKNOWN_COMPONENT', `No catalog entry for component type '${node.component}'.`, componentId)

            return undefined
        }

        // A catalog entry naming a component nobody registered is not an error the
        // runtime reports: `callComponent` returns an AST of `null`, so the subtree just
        // vanishes. Catch it here while there is still a component id to name.
        const registry = this.#options.runtime.components

        if (registry !== undefined && registry[entry.component] === undefined) {
            this.#report(
                'UNREGISTERED_COMPONENT',
                `Catalog maps '${node.component}' to '${entry.component}', which is not registered on the runtime.`,
                componentId
            )

            return undefined
        }

        const key = this.#keyOf(componentId, scope)

        if (this.#isValid(componentId, scope)) {
            this.#reused += 1

            return this.#reuse(this.#cache.get(key)!.ast)
        }

        this.#nodeCount += 1

        const reads: Array<[string, JsonValue | undefined]> = []
        const children: NodeRef[] = []
        const context = this.#contextFor(scope, index, componentId, reads)

        const slotProps = (entry.slots ?? DEFAULT_SLOTS).map((slot) => slot.prop)
        const props = this.#propsFor(node, context, scope, slotProps)
        const slots = this.#buildSlots(
            node,
            entry.slots ?? DEFAULT_SLOTS,
            context,
            scope,
            depth,
            new Set(ancestors).add(componentId),
            children
        )

        Object.assign(props, slots.props)

        // Only the engine can see each child's `weight`, so the parent is told rather
        // than each child deciding for itself.
        if (slots.weights) {
            props.childWeights = slots.weights
        }

        // A stateful component's output can change without any of its inputs changing,
        // so it is never cached — and because its parent then has a child with no cache
        // entry, the parent rebuilds too. Correctness falls out of the same check.
        if (!entry.stateful) {
            props[KEY_PROP] = key
            this.#pending.set(key, { definition: node, reads, children })
        }

        return this.#options.runtime.callComponent(entry.component, props, slots.children, false)
    }

    /**
     * Picks the catalog a node renders through: its own `catalogId`, then the surface's,
     * then the default. v1.0 resolution is strict — an id we were not given is reported,
     * never quietly rendered with a different catalog's components.
     */
    #catalogFor(node: A2UIComponent, componentId: ComponentId): Catalog | undefined {
        const requested = node.catalogId ?? this.#options.surface.catalogId

        if (requested === undefined) {
            return this.#options.catalog
        }

        const answersTo = this.#options.defaultCatalogId ?? BASIC_CATALOG_IDS

        if (typeof answersTo === 'string' ? requested === answersTo : answersTo.includes(requested)) {
            return this.#options.catalog
        }

        const registered = this.#options.catalogs?.[requested]

        if (registered) {
            return registered
        }

        this.#report('UNKNOWN_CATALOG', `Surface asks for catalog '${requested}', which this renderer does not support.`, componentId)

        return undefined
    }

    /**
     * Resolves every child-bearing property the catalog declares for this type.
     * Which properties those are comes from the spec, not a hard-coded pair — `Modal`
     * uses `trigger` / `content`, `Tabs` nests ids under `tabs[].child`.
     */
    #buildSlots(
        node: A2UIComponent,
        slots: ChildSlot[],
        context: ResolveContext,
        scope: string,
        depth: number,
        ancestors: Set<ComponentId>,
        record: NodeRef[]
    ): BuiltSlots {
        const result: BuiltSlots = { children: [], props: {} }

        for (const slot of slots) {
            const raw = node[slot.prop]

            if (raw === undefined) {
                continue
            }

            const positional = slot.prop === 'child' || slot.prop === 'children'

            if (slot.kind === 'single') {
                record.push({ id: raw as ComponentId, scope })

                const built = this.#build(raw as ComponentId, scope, undefined, depth + 1, ancestors)

                if (positional) {
                    result.children.push(built ?? this.#placeholder())
                } else if (built !== undefined) {
                    result.props[slot.prop] = built
                }

                continue
            }

            if (slot.kind === 'objectList') {
                result.props[slot.prop] = this.#buildObjectList(raw, slot, context, scope, depth, ancestors, record)
                continue
            }

            const built = this.#buildChildList(raw, scope, depth, ancestors, record)

            if (positional) {
                result.children.push(...built)
                result.weights = this.#weightsFor(raw, context)
            } else {
                result.props[slot.prop] = built
            }
        }

        return result
    }

    /** An array of objects each carrying a child id, e.g. `Tabs.tabs`. */
    #buildObjectList(
        raw: unknown,
        slot: Extract<ChildSlot, { kind: 'objectList' }>,
        context: ResolveContext,
        scope: string,
        depth: number,
        ancestors: Set<ComponentId>,
        record: NodeRef[]
    ): unknown[] {
        if (!Array.isArray(raw)) {
            return []
        }

        return raw.map((item) => {
            if (!isPlainObject(item)) {
                return item
            }

            const resolved: Record<string, unknown> = {}

            for (const [key, value] of Object.entries(item)) {
                if (key !== slot.childKey) {
                    resolved[key] = resolveValue(value, context)
                    continue
                }

                record.push({ id: value as ComponentId, scope })
                resolved[key] = this.#build(value as ComponentId, scope, undefined, depth + 1, ancestors)
            }

            return resolved
        })
    }

    /**
     * A static id list, or a lazy `ForEach` over a template.
     *
     * A child that fails to build is replaced by a placeholder rather than dropped.
     * The runtime derives a component's hook path from its index among its siblings, so
     * removing one shifts every later sibling onto the previous one's stored state —
     * a dangling reference would silently transplant an open Modal or a typed field.
     */
    #buildChildList(children: unknown, scope: string, depth: number, ancestors: Set<ComponentId>, record: NodeRef[]): unknown[] {
        if (Array.isArray(children)) {
            return children.map((childId) => {
                record.push({ id: childId as ComponentId, scope })

                return this.#build(childId as ComponentId, scope, undefined, depth + 1, ancestors) ?? this.#placeholder()
            })
        }

        if (isChildTemplate(children)) {
            return this.#present(this.#buildTemplate(children.path, children.componentId, scope, depth, ancestors))
        }

        return []
    }

    /**
     * Template children become `ForEach(array, (item, index) => …)`. The callback is
     * stored by the runtime and invoked per visible row, so nothing is expanded here.
     *
     * Rows are not memoised: they are built later, outside this pass. The `ForEach` node
     * itself is, keyed on the identity of the bound array.
     */
    #buildTemplate(path: string, templateId: ComponentId, scope: string, depth: number, ancestors: Set<ComponentId>): unknown {
        const basePath = resolvePath(path, scope)
        const array = resolveValue({ path: basePath }, this.#contextFor(scope, undefined, templateId))

        if (!Array.isArray(array)) {
            this.#report('TEMPLATE_NOT_ARRAY', `Template path '${basePath}' is not an array.`, templateId)

            return undefined
        }

        const forEach = this.#options.runtime.context.ForEach as unknown as (
            data: unknown[],
            content: (item: unknown, index: number) => unknown
        ) => unknown

        return forEach(array, (_item, rowIndex) => {
            return this.#build(templateId, `${basePath}/${rowIndex}`, rowIndex, depth + 1, ancestors)
        })
    }

    // MARK: Props

    /**
     * Resolved catalog props, plus the two things only the engine can supply:
     * an `action` callback, and a `set<Prop>` writer for each path-bound prop.
     */
    #propsFor(node: A2UIComponent, context: ResolveContext, scope: string, slotProps: string[]): Record<string, unknown> {
        const props: Record<string, unknown> = resolvePropsExcept(node, slotProps, context)

        for (const [key, rawValue] of Object.entries(node)) {
            if (!isPathBinding(rawValue)) {
                continue
            }

            const absolutePath = resolvePath(rawValue.path, scope)

            // Reads `this.#options` at call time, not build time — a cached subtree's
            // handlers stay bound to the current render's callbacks.
            props[writerName(key)] = (value: JsonValue) => {
                this.#options.setValue?.(absolutePath, value)
            }
        }

        if (node.action !== undefined) {
            const index = context.index

            props.action = () => {
                this.#dispatch(node, this.#contextFor(scope, index, node.id))
            }
        }

        return props
    }

    #contextFor(
        scope: string,
        index: number | undefined,
        componentId: ComponentId,
        reads?: Array<[string, JsonValue | undefined]>
    ): ResolveContext {
        return {
            dataModel: this.#options.surface.dataModel,
            registry: this.#options.registry,
            scope,
            index,
            locale: this.#options.locale,
            timeZone: this.#options.timeZone,
            openUrl: this.#options.openUrl,
            onRead: reads ? (path, value) => reads.push([path, value]) : undefined,
            onError: (error) => {
                this.#report('RESOLVE_FAILED', error.message, componentId)
            },
        }
    }

    // MARK: Actions

    /** Runs a component's action: a renderer-side function call, an agent event, or both. */
    #dispatch(node: A2UIComponent, context: ResolveContext): void {
        const action = node.action

        if (!action) {
            return
        }

        if (action.functionCall) {
            resolveValue(action.functionCall, context)
        }

        const { event } = action

        if (!event) {
            return
        }

        const { surface, onAction } = this.#options

        onAction?.({
            name: event.name,
            surfaceId: surface.id,
            sourceComponentId: node.id,
            timestamp: new Date().toISOString(),
            context: resolveActionContext(event.context, context),
            // The spec attaches the whole model as transport metadata when asked.
            dataModel: surface.sendDataModel ? (surface.dataModel as Record<string, JsonValue>) : undefined,
        })
    }

    // MARK: Helpers

    /** `weight` lets a Row / Column child claim proportional space. */
    #weightsFor(raw: unknown, context: ResolveContext): number[] | undefined {
        if (!Array.isArray(raw)) {
            return undefined
        }

        let any = false

        const weights = raw.map((childId) => {
            const child = this.#options.surface.components.get(childId as ComponentId)
            const weight = child === undefined ? undefined : resolveValue(child.weight, context)

            if (typeof weight === 'number') {
                any = true

                return weight
            }

            return 0
        })

        return any ? weights : undefined
    }

    /**
     * Wraps a cached subtree so it looks like any other built component.
     *
     * A bare AST object cannot be handed straight to a component: BindJS builders
     * overload on `typeof arg === 'object'` (`Button(label, action)` reads an object
     * first argument as `{ action, label }`), so a spliced object is misread. Going back
     * through `makeComponent` restores the function form and modifier chaining, while
     * the body still just returns the cached tree — no component is re-invoked.
     */
    #reuse(ast: unknown): unknown {
        return this.#options.runtime.makeComponent(() => ast)
    }

    /** Keeps a failed child's slot occupied so sibling hook paths stay put. */
    #placeholder(): unknown {
        const empty = this.#options.runtime.context.Empty as unknown as (() => unknown) | undefined

        return typeof empty === 'function' ? empty() : null
    }

    /** Drops a value that failed to build, where position does not matter. */
    #present(value: unknown): unknown[] {
        return value === undefined ? [] : [value]
    }

    #report(code: DiagnosticCode, message: string, componentId?: string): void {
        this.#diagnostics.push({ code, message, componentId })
    }
}

/**
 * Renders a surface once, with no reuse between calls. Hosts that render the same
 * surface repeatedly should keep a `RenderSession` instead.
 */
export function renderSurface(options: RenderOptions): RenderResult {
    return new RenderSession().render(options)
}

/** `value` → `setValue`. Matches the runtime's `set*` convention for stored callbacks. */
function writerName(propName: string): string {
    return 'set' + propName.charAt(0).toUpperCase() + propName.slice(1)
}
