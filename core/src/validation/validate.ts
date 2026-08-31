/**
 * Structural validation of a surface, before anything is drawn.
 *
 * `parseMessage` answers "is this a well-formed message". This answers the other question:
 * do these components refer to each other sensibly? Dangling ids, a component containing
 * itself, cycles, components nothing can reach, malformed data paths, graphs deep enough to
 * be a mistake.
 *
 * This is deliberately **not** part of rendering. The engine degrades: an unresolvable
 * child becomes a diagnostic and the rest of the surface still draws, which is what you
 * want when an agent is streaming a UI at you. A host that would rather reject a payload up
 * front — and answer the agent with an `error` — calls this instead. Neither behaviour is
 * imposed on the other.
 *
 * The A2UI conformance suite exercises exactly these rules; see
 * `core/tests/conformance.suite.test.ts`.
 */
import { BASIC_CATALOG } from '../engine/catalog.js'
import type { Catalog, ChildSlot } from '../engine/types.js'
import {
    isChildTemplate,
    isFunctionCall,
    isPathBinding,
    isPlainObject,
    type A2UIComponent,
    type AgentMessage,
    type ComponentId,
    type ErrorMessage,
    type JsonValue,
} from '../protocol/types.js'

// MARK: - Types

export type ValidationCode =
    | 'MISSING_ROOT'
    | 'DANGLING_REFERENCE'
    | 'SELF_REFERENCE'
    | 'CYCLE'
    | 'UNREACHABLE'
    | 'INVALID_PATH'
    | 'DEPTH_EXCEEDED'
    | 'FUNCTION_DEPTH_EXCEEDED'

export interface ValidationIssue {
    code: ValidationCode
    message: string
    surfaceId: string

    /**
     * JSON Pointer to the field that failed, e.g. `/components/0/child`.
     *
     * The shape A2UI's `error` message asks for. The index is the component's position in
     * the message that last defined it.
     */
    path: string

    componentId?: ComponentId
}

/** Turns an issue into the `error` message the agent is sent. */
export function validationError(issue: ValidationIssue): ErrorMessage {
    return {
        code: 'VALIDATION_FAILED',
        surfaceId: issue.surfaceId,
        path: issue.path,
        message: issue.message,
    }
}

export interface ValidationOptions {
    /**
     * Whether the surface is expected to be complete.
     *
     * A run of messages that creates a surface must produce a `root`, and everything in it
     * must be reachable from there. A run that only *updates* one cannot be judged on
     * either: the root arrived in an earlier batch this validator never saw. References,
     * self-reference and cycles are checked either way.
     */
    complete?: boolean

    /**
     * How deep the component graph, and the data model, may go.
     *
     * The deepest surface in the official examples is 7, so this is not a budget anyone
     * renders against — it is the line past which a graph is a bug rather than a design.
     */
    maxDepth?: number

    /** How deeply function calls may nest as each other's arguments. */
    maxFunctionCallDepth?: number

    /** Used to know which properties of a component hold child ids. */
    catalog?: Catalog

    /**
     * Where each component sat in the message that defined it, for the error pointer.
     *
     * Defaults to its position in the surface, which is the best a caller validating an
     * assembled surface can mean.
     */
    indexOf?: ReadonlyMap<ComponentId, number>

    /**
     * Ids referenced at any point while the messages were replayed.
     *
     * Used to tell a superseded component from an orphaned one. Defaults to whatever the
     * final component map references, which is right for a surface validated on its own.
     */
    everReferenced?: ReadonlySet<ComponentId>
}

const DEFAULT_MAX_DEPTH = 50
const DEFAULT_MAX_FUNCTION_CALL_DEPTH = 5

/** The id A2UI gives the component a surface is drawn from. */
const ROOT_ID = 'root'

// MARK: - Entry points

/**
 * Validates the surfaces a run of messages describes.
 *
 * Components are accumulated here rather than through `SurfaceStore`, so validation says
 * nothing about message *lifecycle* — an `updateComponents` for a surface no
 * `createSurface` announced is somebody else's complaint, and should not mask the
 * structural answer.
 */
export function validateMessages(messages: readonly AgentMessage[], options: ValidationOptions = {}): ValidationIssue[] {
    const catalog = options.catalog ?? BASIC_CATALOG
    const surfaces = accumulate(messages, catalog)
    const issues: ValidationIssue[] = []

    for (const [surfaceId, surface] of surfaces) {
        // Only a surface this run created is judged whole.
        issues.push(
            ...validateSurface(surfaceId, surface.components, surface.dataModel, {
                ...options,
                catalog,
                complete: options.complete ?? surface.created,
                everReferenced: surface.everReferenced,
                indexOf: surface.indexOf,
            })
        )
    }

    return issues
}

/** Validates one already-assembled surface. */
export function validateSurface(
    surfaceId: string,
    components: ReadonlyMap<ComponentId, A2UIComponent>,
    dataModel: JsonValue | undefined,
    options: ValidationOptions = {}
): ValidationIssue[] {
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH
    const catalog = options.catalog ?? BASIC_CATALOG
    const complete = options.complete ?? true
    const issues: ValidationIssue[] = []

    // Falls back to the component's position in the surface, which is what a caller
    // validating an assembled surface has: there is no single message to point into.
    const indexOf = options.indexOf ?? new Map([...components.keys()].map((id, index) => [id, index]))

    /** `/components/2/child` — the field, where one can be named, else the component. */
    const pointerFor = (componentId?: ComponentId, field?: string): string => {
        if (componentId === undefined) {
            return '/components'
        }

        const index = indexOf.get(componentId)
        const base = index === undefined ? '/components' : `/components/${index}`

        return field ? `${base}/${field}` : base
    }

    const report = (code: ValidationCode, message: string, componentId?: ComponentId, field?: string): void => {
        issues.push({ code, message, surfaceId, path: pointerFor(componentId, field), componentId })
    }

    // A surface with nothing in it is empty, not broken; one with components but no root
    // has nowhere to start.
    if (complete && components.size > 0 && !components.has(ROOT_ID)) {
        report('MISSING_ROOT', `Missing root component in surface '${surfaceId}'.`)
    }

    checkReferences(components, catalog, report)
    checkPathsAndCalls(components, options.maxFunctionCallDepth ?? DEFAULT_MAX_FUNCTION_CALL_DEPTH, report)

    const reached = walk(components, catalog, maxDepth, report)

    for (const id of components.keys()) {
        const superseded = options.everReferenced?.has(id) ?? false

        if (complete && !reached.has(id) && !superseded && id !== ROOT_ID && components.has(ROOT_ID)) {
            report('UNREACHABLE', `Component '${id}' is not reachable from '${ROOT_ID}'.`, id)
        }
    }

    if (depthOf(dataModel) > maxDepth) {
        report('DEPTH_EXCEEDED', `Data model in surface '${surfaceId}' nests deeper than ${maxDepth} levels.`)
    }

    return issues
}

// MARK: - Assembling surfaces

interface AccumulatedSurface {
    components: Map<ComponentId, A2UIComponent>
    dataModel: JsonValue | undefined

    /** Whether this run of messages created the surface, rather than only updating it. */
    created: boolean

    /** Each component's position in the message that last defined it. */
    indexOf: Map<ComponentId, number>

    /**
     * Every id referenced by any version of any component along the way.
     *
     * A stream that shows a loading placeholder and then replaces it leaves that
     * placeholder unreferenced at the end. It is superseded, not orphaned, and the
     * difference is only visible while the messages are still being replayed.
     */
    everReferenced: Set<ComponentId>
}

function accumulate(messages: readonly AgentMessage[], catalog: Catalog): Map<string, AccumulatedSurface> {
    const surfaces = new Map<string, AccumulatedSurface>()

    const surfaceFor = (surfaceId: string): AccumulatedSurface => {
        let surface = surfaces.get(surfaceId)

        if (!surface) {
            surface = {
                components: new Map(),
                dataModel: undefined,
                created: false,
                everReferenced: new Set(),
                indexOf: new Map(),
            }
            surfaces.set(surfaceId, surface)
        }

        return surface
    }

    const add = (surface: AccumulatedSurface, components: readonly A2UIComponent[] | undefined): void => {
        ;(components ?? []).forEach((component, index) => {
            if (!component || typeof component.id !== 'string') {
                return
            }

            surface.components.set(component.id, component)
            surface.indexOf.set(component.id, index)

            for (const childId of childIdsOf(component, catalog)) {
                surface.everReferenced.add(childId)
            }
        })
    }

    for (const message of messages) {
        if (!isPlainObject(message)) {
            continue
        }

        const created = (message as Record<string, unknown>).createSurface

        if (isPlainObject(created) && typeof created.surfaceId === 'string') {
            const surface = surfaceFor(created.surfaceId)

            surface.created = true
            add(surface, created.components as A2UIComponent[] | undefined)

            if (created.dataModel !== undefined) {
                surface.dataModel = created.dataModel as JsonValue
            }
        }

        const updated = (message as Record<string, unknown>).updateComponents

        if (isPlainObject(updated) && typeof updated.surfaceId === 'string') {
            add(surfaceFor(updated.surfaceId), updated.components as A2UIComponent[] | undefined)
        }

        const model = (message as Record<string, unknown>).updateDataModel

        if (isPlainObject(model) && typeof model.surfaceId === 'string') {
            const surface = surfaceFor(model.surfaceId)
            const path = typeof model.path === 'string' ? model.path : '/'

            // Only a whole-model write is tracked: a write to a path can only make the
            // model shallower or equal, so it cannot introduce a depth problem the
            // original did not have.
            if (path === '/' || path === '') {
                surface.dataModel = model.value as JsonValue
            }
        }
    }

    return surfaces
}

// MARK: - References

type Report = (code: ValidationCode, message: string, componentId?: ComponentId, field?: string) => void

/** A child reference, and the property it was written in — the pointer needs both. */
interface ChildRef {
    id: ComponentId
    field: string
}

/**
 * The component ids a component points at, according to the catalog's child slots, each
 * paired with the property path it came from (`child`, `children/2`, `tabs/0/child`).
 */
function childRefsOf(component: A2UIComponent, catalog: Catalog): ChildRef[] {
    const entry = catalog[component.component as keyof Catalog]
    const slots = (entry as { slots?: ChildSlot[] } | undefined)?.slots

    // Unknown component type: fall back to the two names the protocol uses everywhere, so
    // a custom catalog still gets its graph checked.
    const effective: ChildSlot[] = slots?.length
        ? slots
        : [
              { prop: 'child', kind: 'single' },
              { prop: 'children', kind: 'list' },
          ]

    const refs: ChildRef[] = []
    const source = component as unknown as Record<string, unknown>

    for (const slot of effective) {
        const value = source[slot.prop]

        if (value === undefined || value === null) {
            continue
        }

        if (slot.kind === 'single') {
            if (typeof value === 'string') {
                refs.push({ id: value, field: slot.prop })
            }

            continue
        }

        // A list is either literal ids or a template naming one component to repeat.
        if (isChildTemplate(value)) {
            refs.push({ id: value.componentId, field: `${slot.prop}/componentId` })

            continue
        }

        if (Array.isArray(value)) {
            value.forEach((entryValue, index) => {
                if (typeof entryValue === 'string') {
                    refs.push({ id: entryValue, field: `${slot.prop}/${index}` })

                    return
                }

                if (slot.kind === 'objectList' && isPlainObject(entryValue)) {
                    const child = entryValue[slot.childKey]

                    if (typeof child === 'string') {
                        refs.push({ id: child, field: `${slot.prop}/${index}/${slot.childKey}` })
                    }
                }
            })
        }
    }

    return refs
}

/** Just the ids, for the walks that do not report a field. */
function childIdsOf(component: A2UIComponent, catalog: Catalog): ComponentId[] {
    return childRefsOf(component, catalog).map((ref) => ref.id)
}

function checkReferences(components: ReadonlyMap<ComponentId, A2UIComponent>, catalog: Catalog, report: Report): void {
    for (const [id, component] of components) {
        for (const { id: childId, field } of childRefsOf(component, catalog)) {
            if (childId === id) {
                report('SELF_REFERENCE', `Self-reference detected: component '${id}' contains itself.`, id, field)

                continue
            }

            if (!components.has(childId)) {
                report('DANGLING_REFERENCE', `Component '${id}' references non-existent component '${childId}'.`, id, field)
            }
        }
    }
}

// MARK: - Walking the graph

/**
 * Depth-first over the graph, reporting cycles and over-deep branches.
 *
 * Two passes, because the two questions differ. Reachability is only meaningful from the
 * root. Cycles are not: a batch that updates components without naming a root still has to
 * be told that two of them point at each other, so every component is used as a starting
 * point as well.
 *
 * Returns the ids reachable from the root, which is what the reachability check needs.
 */
function walk(components: ReadonlyMap<ComponentId, A2UIComponent>, catalog: Catalog, maxDepth: number, report: Report): Set<ComponentId> {
    const reached = new Set<ComponentId>()
    const reportedCycles = new Set<ComponentId>()
    let reportedDepth = false

    const visit = (id: ComponentId, stack: Set<ComponentId>, depth: number, collect: boolean): void => {
        const component = components.get(id)

        if (!component) {
            return
        }

        if (stack.has(id)) {
            if (!reportedCycles.has(id)) {
                reportedCycles.add(id)
                report('CYCLE', `Circular reference detected at component '${id}'.`, id)
            }

            return
        }

        if (depth > maxDepth) {
            if (!reportedDepth) {
                reportedDepth = true
                report('DEPTH_EXCEEDED', `Component graph nests deeper than ${maxDepth} levels.`, id)
            }

            return
        }

        if (collect) {
            reached.add(id)
        }

        stack.add(id)

        for (const childId of childIdsOf(component, catalog)) {
            visit(childId, stack, depth + 1, collect)
        }

        stack.delete(id)
    }

    if (components.has(ROOT_ID)) {
        visit(ROOT_ID, new Set(), 1, true)
    }

    // Second pass for the components the root does not lead to. Cycles among them are
    // still cycles, and this is the only pass an incremental update gets.
    for (const id of components.keys()) {
        if (!reached.has(id)) {
            visit(id, new Set(), 1, false)
        }
    }

    return reached
}

// MARK: - Paths and function calls

function checkPathsAndCalls(components: ReadonlyMap<ComponentId, A2UIComponent>, maxFunctionCallDepth: number, report: Report): void {
    for (const [id, component] of components) {
        inspect(component as unknown as JsonValue, 0)
    }

    function inspect(value: unknown, callDepth: number, componentId?: ComponentId): void {
        if (Array.isArray(value)) {
            for (const entry of value) {
                inspect(entry, callDepth, componentId)
            }

            return
        }

        if (!isPlainObject(value)) {
            return
        }

        if (isPathBinding(value)) {
            if (!isValidPointer(value.path)) {
                report('INVALID_PATH', `Invalid path syntax: '${value.path}'.`, componentId)
            }

            return
        }

        // v1.0 spells a call `{ call, args }`; v0.9 wraps it as `{ functionCall: … }`.
        const call = isFunctionCall(value) ? value : isPlainObject(value.functionCall) ? value.functionCall : undefined

        if (call) {
            const depth = callDepth + 1

            if (depth > maxFunctionCallDepth) {
                report(
                    'FUNCTION_DEPTH_EXCEEDED',
                    `Recursion limit exceeded: function calls nest deeper than ${maxFunctionCallDepth}.`,
                    componentId
                )

                return
            }

            inspect((call as Record<string, unknown>).args, depth, componentId)

            return
        }

        for (const entry of Object.values(value)) {
            inspect(entry, callDepth, componentId)
        }
    }
}

/**
 * RFC 6901 syntax, as A2UI uses it.
 *
 * A leading `/` is optional: inside a child template a path is written relative to the item
 * being repeated (`title`, not `/items/0/title`) and resolved against that scope. Requiring
 * one rejected eleven of the official examples.
 *
 * What is never valid is a stray `~`, which only ever introduces `~0` or `~1`.
 */
function isValidPointer(path: unknown): boolean {
    if (typeof path !== 'string') {
        return false
    }

    for (let index = 0; index < path.length; index += 1) {
        if (path[index] !== '~') {
            continue
        }

        const next = path[index + 1]

        if (next !== '0' && next !== '1') {
            return false
        }
    }

    return true
}

// MARK: - Depth

function depthOf(value: JsonValue | undefined, seen = 0): number {
    // Guarded rather than unbounded: the input is untrusted, and a cyclic object would
    // otherwise take the stack with it.
    if (seen > DEFAULT_MAX_DEPTH * 2 || value === null || typeof value !== 'object') {
        return seen
    }

    let deepest = seen + 1

    for (const entry of Object.values(value)) {
        deepest = Math.max(deepest, depthOf(entry as JsonValue, seen + 1))
    }

    return deepest
}
