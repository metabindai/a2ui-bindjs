/**
 * A2UI v1.0 protocol types.
 * Spec: https://a2ui.org/specification/v1.0-a2ui/
 *
 * Only wire-level shapes live here — no rendering concerns.
 */

export const PROTOCOL_VERSION = 'v1.0'

// ---------------------------------------------------------------------------
// MARK: - Dynamic values (literal | data-model path | function call)
// ---------------------------------------------------------------------------

/** JSON Pointer (RFC 6901). Leading `/` = absolute; otherwise relative to the current template scope. */
export type DataPath = string

export interface PathBinding {
    path: DataPath
}

export interface FunctionCall {
    call: string
    catalogId?: string
    args?: Record<string, unknown>
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type DynamicValue<T = JsonValue> = T | PathBinding | FunctionCall
export type DynamicString = DynamicValue<string>
export type DynamicNumber = DynamicValue<number>
export type DynamicBoolean = DynamicValue<boolean>

export function isPathBinding(value: unknown): value is PathBinding {
    if (!isPlainObject(value)) {
        return false
    }

    return typeof value.path === 'string' && !('call' in value)
}

export function isFunctionCall(value: unknown): value is FunctionCall {
    if (!isPlainObject(value)) {
        return false
    }

    return typeof value.call === 'string'
}

// ---------------------------------------------------------------------------
// MARK: - Components
// ---------------------------------------------------------------------------

export type ComponentId = string

/** Reserved id of the component mounted under the implicit Surface. */
export const ROOT_COMPONENT_ID = 'root'

/** Reserved component name for the implicit surface container. */
export const SURFACE_COMPONENT = 'Surface'

export interface ChildTemplate {
    /** Path to an array in the data model. */
    path: DataPath

    /** Component instantiated once per array element, with relative paths scoped to the element. */
    componentId: ComponentId
}

export type ChildList = ComponentId[] | ChildTemplate

export function isChildTemplate(value: unknown): value is ChildTemplate {
    if (!isPlainObject(value)) {
        return false
    }

    return typeof value.componentId === 'string'
}

export interface Accessibility {
    label?: DynamicString
    description?: DynamicString
    live?: 'polite' | 'assertive' | 'off'
    hidden?: DynamicBoolean
}

export interface ActionEvent {
    name: string
    context?: Record<string, DynamicValue>
}

/** `action` property carried by interactive components (Button, etc). */
export interface ComponentAction {
    event?: ActionEvent

    /** Function to run renderer-side instead of / before an event. */
    functionCall?: FunctionCall
}

/**
 * A component instance as it appears in the flat `components` array.
 * Catalog-specific properties are open-ended.
 */
export interface A2UIComponent {
    id: ComponentId
    component: string
    catalogId?: string
    children?: ChildList
    child?: ComponentId
    accessibility?: Accessibility
    action?: ComponentAction
    [property: string]: unknown
}

// ---------------------------------------------------------------------------
// MARK: - Agent → renderer messages
// ---------------------------------------------------------------------------

export interface CreateSurface {
    surfaceId: string
    catalogId?: string
    sendDataModel?: boolean
    components?: A2UIComponent[]
    dataModel?: Record<string, JsonValue>
}

export interface UpdateComponents {
    surfaceId: string
    components: A2UIComponent[]
}

export interface UpdateDataModel {
    surfaceId: string

    /** JSON Pointer; omitted or `/` replaces the whole model. */
    path?: DataPath

    /** `null` deletes the key at `path`. */
    value: JsonValue
}

export interface DeleteSurface {
    surfaceId: string
}

export interface CallRendererFunction {
    functionCallId: string
    surfaceId?: string
    callFunction: FunctionCall
}

export interface FunctionError {
    code: string
    message: string
}

export interface AgentFunctionResponse {
    functionCallId: string
    value?: JsonValue
    error?: FunctionError
}

export type AgentMessage =
    | { version?: string; createSurface: CreateSurface }
    | { version?: string; updateComponents: UpdateComponents }
    | { version?: string; updateDataModel: UpdateDataModel }
    | { version?: string; deleteSurface: DeleteSurface }
    | { version?: string; callRendererFunction: CallRendererFunction }
    | { version?: string; agentFunctionResponse: AgentFunctionResponse }

export type AgentMessageType =
    'createSurface' | 'updateComponents' | 'updateDataModel' | 'deleteSurface' | 'callRendererFunction' | 'agentFunctionResponse'

export const AGENT_MESSAGE_TYPES: readonly AgentMessageType[] = [
    'createSurface',
    'updateComponents',
    'updateDataModel',
    'deleteSurface',
    'callRendererFunction',
    'agentFunctionResponse',
]

// ---------------------------------------------------------------------------
// MARK: - Renderer → agent messages
// ---------------------------------------------------------------------------

export interface ActionMessage {
    name: string
    surfaceId: string
    sourceComponentId?: string
    timestamp: string
    context?: Record<string, JsonValue>

    /** Full surface data model, attached when the surface was created with `sendDataModel: true`. */
    dataModel?: Record<string, JsonValue>
}

/**
 * The renderer answering a function the agent asked it to call.
 *
 * Named for the wire, not for the direction: v1.0 spells this `functionResponse`. Two
 * earlier spellings this package used — `callAgentFunction` and `rendererFunctionResponse`
 * — appear nowhere in the specification.
 */
export interface FunctionResponse {
    /** Copied verbatim from the invocation. */
    functionCallId: string

    /** The function's name, copied verbatim from the invocation. Useful for logging. */
    call: string

    value: JsonValue
}

export type ErrorCode = 'VALIDATION_FAILED' | 'UNALLOWED_PARENT' | 'UNALLOWED_CHILD' | 'INVALID_FUNCTION_CALL'

/**
 * A renderer-side failure, reported to the agent.
 *
 * The schema is stricter than this type: a `VALIDATION_FAILED` error requires `surfaceId`,
 * `path` and `message`, and any other code requires `message` plus exactly one of
 * `surfaceId` or `functionCallId`. Both are expressible here; `validationError` below
 * builds the first form correctly.
 */
export interface ErrorMessage {
    code: ErrorCode
    message: string
    surfaceId?: string

    /** JSON Pointer to the field that failed, e.g. `/components/0/text`. */
    path?: string
    functionCallId?: string
}

/** Everything the renderer may send back. v1.0 defines exactly these three. */
export type RendererMessage =
    | { version: string; action: ActionMessage }
    | { version: string; functionResponse: FunctionResponse }
    | { version: string; error: ErrorMessage }

// ---------------------------------------------------------------------------
// MARK: - Helpers
// ---------------------------------------------------------------------------

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}
