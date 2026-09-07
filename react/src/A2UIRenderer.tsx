/**
 * <A2UIRenderer /> — renders one A2UI surface into React.
 *
 * The engine builds a BindJS AST; `bindjs-react`'s `<Renderer>` paints it. The `ast`
 * prop takes a callback that the Renderer invokes inside its own render pass, after
 * `willRender()` — so catalog components that use runtime hooks (`useState` in Modal
 * and Tabs) get a correct hook context.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Renderer } from '@metabindai/bindjs-react'

import {
    BASIC_CATALOG,
    RenderSession,
    createStandardRegistry,
    ensureCatalogRegistered,
    registerCatalog,
    validateSurface,
    validationError,
    type BindJSRuntimeLike,
    type Catalog,
    type Diagnostic,
    type FunctionRegistry,
    type ActionMessage,
    type ErrorMessage,
    type JsonValue,
    type SurfaceStore,
    type RegistrarRuntime,
} from '@metabindai/a2ui-bindjs'
import { SURFACE_CLASS, useHostStyleReset } from './hostStyles.js'
import { useFirstSurfaceId, useSurface } from './useA2UIStore.js'
import { useA2UIRuntime } from './runtime.js'

export interface A2UIRendererProps {
    /** The surfaces to render from. Owned by whoever owns the connection. */
    store: SurfaceStore

    /**
     * A runtime with the catalog already registered — see `registerCatalog`. Omit it and
     * one is created, with the basic catalog on it, for the life of this component. Pass
     * your own when you have other BindJS components to register, or several renderers
     * that should share hook state.
     */
    runtime?: BindJSRuntimeLike

    /** Defaults to the store's first surface, which is the only one for most hosts. */
    surfaceId?: string

    /**
     * Component name → BindJS source, registered on whichever runtime is in play.
     *
     * The short way to override how something looks: supply the component and point the
     * `catalog` at it. Only needed for what you are replacing — everything else still
     * comes from the bundled catalog. Bring a `runtime` instead when you have components
     * of your own to register, or several renderers that should share hook state.
     */
    sources?: Record<string, string>

    /** A2UI type → registered component name. Defaults to the basic catalog. */
    catalog?: Catalog

    /**
     * Reuse unchanged subtrees between renders. **Off by default here**, unlike the
     * engine's own default.
     *
     * A memoised subtree comes back as a built AST whose body does not run again. The
     * native hosts re-enter the engine whenever renderer state moves, so they rebuild it;
     * on the web we have not established what does, and with reuse on the two catalog
     * components that hold their own state — a chart's selection, a card following a
     * finger — draw correctly and then ignore every gesture. Turn it on if you have
     * measured that you need it and your surfaces hold no renderer state.
     */
    memoise?: boolean

    /** Defaults to the standard function set. */
    registry?: FunctionRegistry

    locale?: string
    timeZone?: string

    /** Fired when a component dispatches an action. Send this to the agent. */
    onAction?(message: ActionMessage): void

    /** Called after each build with everything that failed to render. */
    onDiagnostics?(diagnostics: Diagnostic[]): void

    /**
     * Validate the surface structurally and report failures to the agent.
     *
     * Off by default, and deliberately: validation judges the surface as it stands, and a
     * surface being streamed is legitimately incomplete part-way through — the official
     * `00_incremental` example has a dangling reference at message three of six that the
     * fourth resolves. Turn this on when a host applies whole payloads, or call
     * `validateSurface` yourself once the stream settles.
     */
    validate?: boolean

    /** Where `validate` sends what it finds, as A2UI `error` messages. */
    onError?(error: ErrorMessage): void

    /**
     * Two-way writes. Defaults to writing straight back into the store, which is the
     * A2UI model: one data model, edited in place.
     */
    setValue?(path: string, value: JsonValue): void

    openUrl?(url: string, target?: string): void

    /**
     * Values exposed to the BindJS environment.
     *
     * `colorScheme` defaults to `'light'`: left unset, the renderer follows the viewer's
     * system preference, so an embedded surface would flip to dark inside a host that is
     * not. Pass `'dark'`, or `{ colorScheme: undefined }` to opt back into following the
     * system.
     */
    environment?: Record<string, unknown>

    /**
     * Neutralises the browser's default margins inside the surface, so a `<p>` from a
     * Text does not add spacing the catalog never asked for. On by default; turn it off
     * to style the emitted HTML yourself.
     */
    resetHostStyles?: boolean
}

/** A registered component name is required by the Renderer even when `ast` supplies the tree. */
const HOST_COMPONENT_NAME = 'A2UISurfaceHost'

export function A2UIRenderer(props: A2UIRendererProps) {
    const {
        runtime: providedRuntime,
        sources,
        store,
        surfaceId: requestedSurfaceId,
        catalog = BASIC_CATALOG,
        memoise = false,
        registry,
        locale,
        timeZone,
        onAction,
        onDiagnostics,
        validate = false,
        onError,
        setValue,
        openUrl,
        environment,
        resetHostStyles = true,
    } = props

    // Always created so hook order stays stable; only used when none was passed.
    const ownRuntime = useA2UIRuntime()
    const runtime = providedRuntime ?? ownRuntime

    const firstSurfaceId = useFirstSurfaceId(store)
    const surfaceId = requestedSurfaceId ?? firstSurfaceId

    useHostStyleReset(resetHostStyles)

    const resolvedEnvironment = useMemo(() => ({ colorScheme: 'light', ...environment }), [environment])

    const surface = useSurface(store, surfaceId)
    const defaultRegistry = useMemo(() => createStandardRegistry(), [])

    // One session per mounted renderer: it carries the subtree cache between renders,
    // so an incremental update only re-invokes the components that depend on it.
    const session = useMemo(() => new RenderSession(), [])

    // `buildAst` runs inside the Renderer's render pass, so diagnostics cannot be
    // handed to the consumer there — that would be a setState during another
    // component's render. They are parked here and emitted from an effect.
    const diagnosticsRef = useRef<Diagnostic[]>([])
    const lastDiagnosticsKey = useRef<string>()

    // The Renderer invokes `ast` during its own render, so the latest callbacks are read
    // through a ref rather than baked into it. The resolved runtime and surface id ride
    // along, since neither is necessarily what was passed in.
    const latest = useRef({ ...props, runtime, surfaceId })
    latest.current = { ...props, runtime, surfaceId }

    const buildAst = useCallback(() => {
        const current = latest.current

        if (current.surfaceId === undefined) {
            return null
        }

        const liveSurface = current.store.getSurface(current.surfaceId)

        if (!liveSurface) {
            return null
        }

        const result = session.render({
            runtime: current.runtime,
            surface: liveSurface,
            catalog: current.catalog ?? BASIC_CATALOG,
            registry: current.registry ?? defaultRegistry,
            memoise: current.memoise ?? false,
            locale: current.locale,
            timeZone: current.timeZone,
            onAction: current.onAction,
            openUrl: current.openUrl,
            setValue: (path, value) => {
                if (current.setValue) {
                    current.setValue(path, value)
                    return
                }

                current.store.setValue(current.surfaceId as string, path, value)
            },
        })

        diagnosticsRef.current = result.diagnostics

        return result.ast ?? null
    }, [defaultRegistry, session])

    // No dependency array: diagnostics change with each build. The key guard keeps an
    // always-new array from looping through a consumer that stores it in state.
    useEffect(() => {
        const key = JSON.stringify(diagnosticsRef.current)

        if (key === lastDiagnosticsKey.current) {
            return
        }

        lastDiagnosticsKey.current = key
        latest.current.onDiagnostics?.(diagnosticsRef.current)
    })

    // Registered during render rather than in an effect, so the first paint already has
    // them — an effect would draw one frame of missing components first.
    //
    // Guarded by content rather than identity: a caller passing an inline object would
    // otherwise re-register on every render, throwing away memoised subtrees.
    const registeredSources = useRef<Record<string, string> | undefined>(undefined)

    useMemo(() => {
        if (!sources || sameSources(registeredSources.current, sources)) {
            return
        }

        registerCatalog(runtime as RegistrarRuntime, { sources })
        registeredSources.current = sources
    }, [runtime, sources])

    // Fill any catalog components the runtime is missing — including on a runtime the
    // host passed in, so bringing your own does not mean remembering to register.
    // Existing registrations are left alone, so overriding a component still works.
    useMemo(() => {
        ensureCatalogRegistered(runtime as RegistrarRuntime, catalog)
    }, [runtime, catalog])

    // Structural validation, reported to the agent as A2UI `error` messages.
    //
    // Keyed on the surface version so a redraw does not re-report, and run in an effect
    // because it hands results to the consumer.
    const lastValidated = useRef<string>()

    useEffect(() => {
        if (!validate || !surface || !surfaceId) {
            return
        }

        const key = `${surfaceId}:${surface.version}`

        if (key === lastValidated.current) {
            return
        }

        lastValidated.current = key

        for (const issue of validateSurface(surfaceId, surface.components, surface.dataModel, { catalog })) {
            latest.current.onError?.(validationError(issue))
        }
    }, [validate, surface, surfaceId, catalog])

    ensureHostComponent(runtime)

    return (
        <div className={SURFACE_CLASS}>
            <Renderer
                runtime={runtime}
                componentName={HOST_COMPONENT_NAME}
                ast={buildAst}
                version={`${surfaceId ?? ''}:${surface?.version ?? 0}`}
                usePreviews={false}
                environment={resolvedEnvironment}
            />
        </div>
    )
}

/**
 * The Renderer aliases `componentName` to `Self` before rendering, so the name has to
 * resolve even though the tree comes from `ast`. This registers a placeholder once.
 */
function ensureHostComponent(runtime: BindJSRuntimeLike): void {
    const registrar = runtime as BindJSRuntimeLike & {
        components?: Record<string, unknown>
        registerComponent?(name: string, source: string): void
    }

    if (registrar.components?.[HOST_COMPONENT_NAME] !== undefined) {
        return
    }

    registrar.registerComponent?.(HOST_COMPONENT_NAME, 'exports.default = defineComponent({ body: () => Empty(), properties: {} })')
}

/** Whether two source maps hold the same components, by name and body. */
function sameSources(a: Record<string, string> | undefined, b: Record<string, string>): boolean {
    if (!a) {
        return false
    }

    const names = Object.keys(b)

    if (names.length !== Object.keys(a).length) {
        return false
    }

    return names.every((name) => a[name] === b[name])
}
