import {
    AGENT_MESSAGE_TYPES,
    isChildTemplate,
    isPlainObject,
    type A2UIComponent,
    type AgentMessage,
    type AgentMessageType,
    type ErrorCode,
} from './types.js'

// ---------------------------------------------------------------------------
// MARK: - Errors
// ---------------------------------------------------------------------------

interface ProtocolErrorOptions {
    code?: ErrorCode
    path?: string
    surfaceId?: string
}

/** Thrown by `parseMessage` / `validateComponent`. Mirrors the spec's `error` message. */
export class A2UIProtocolError extends Error {
    readonly code: ErrorCode
    readonly path?: string
    readonly surfaceId?: string

    constructor(message: string, options: ProtocolErrorOptions = {}) {
        super(message)

        this.name = 'A2UIProtocolError'
        this.code = options.code ?? 'VALIDATION_FAILED'
        this.path = options.path
        this.surfaceId = options.surfaceId
    }
}

// ---------------------------------------------------------------------------
// MARK: - Message envelope
// ---------------------------------------------------------------------------

const LEGACY_V09_KEYS = ['beginRendering', 'surfaceUpdate', 'dataModelUpdate']

/** Returns the single message-type key of an envelope, or throws. */
export function messageType(message: AgentMessage): AgentMessageType {
    const keys = Object.keys(message).filter((key) => key !== 'version')
    const found = keys.filter((key) => (AGENT_MESSAGE_TYPES as readonly string[]).includes(key))

    if (found.length === 1) {
        return found[0] as AgentMessageType
    }

    if (found.length > 1) {
        throw new A2UIProtocolError(`Message has multiple type keys: ${found.join(', ')}`, { path: '/' })
    }

    const legacy = keys.find((key) => LEGACY_V09_KEYS.includes(key))

    if (legacy) {
        throw new A2UIProtocolError(`'${legacy}' is an A2UI v0.9 message; this renderer targets v1.0.`, { path: `/${legacy}` })
    }

    throw new A2UIProtocolError(`Message has no recognised type key (expected one of ${AGENT_MESSAGE_TYPES.join(', ')})`, {
        path: '/',
    })
}

/**
 * Parse and structurally validate an agent → renderer message.
 * Accepts a JSON string or an already-parsed object.
 */
export function parseMessage(input: string | unknown): AgentMessage {
    const raw = typeof input === 'string' ? parseJson(input) : input

    if (!isPlainObject(raw)) {
        throw new A2UIProtocolError('Message must be a JSON object', { path: '/' })
    }

    const message = raw as AgentMessage
    const type = messageType(message)
    const body = (message as Record<string, unknown>)[type]

    if (!isPlainObject(body)) {
        throw new A2UIProtocolError(`'${type}' must be an object`, { path: `/${type}` })
    }

    const surfaceId = validateSurfaceId(type, body)

    switch (type) {
        case 'createSurface':
            validateCreateSurface(body, surfaceId)
            break

        case 'updateComponents':
            validateComponents(body.components, '/updateComponents/components', surfaceId)
            break

        case 'updateDataModel':
            validateUpdateDataModel(body, surfaceId)
            break

        case 'deleteSurface':
            break

        case 'callRendererFunction':
            validateFunctionCallId(body, type)

            if (!isPlainObject(body.callFunction) || typeof body.callFunction.call !== 'string') {
                throw new A2UIProtocolError('callFunction.call is required', { path: `/${type}/callFunction` })
            }
            break

        case 'agentFunctionResponse':
            validateFunctionCallId(body, type)
            break
    }

    return message
}

function parseJson(input: string): unknown {
    try {
        return JSON.parse(input)
    } catch (error) {
        throw new A2UIProtocolError(`Invalid JSON: ${(error as Error).message}`, { path: '/' })
    }
}

// ---------------------------------------------------------------------------
// MARK: - Per-message validation
// ---------------------------------------------------------------------------

/** `surfaceId` is required on every surface-scoped message. Returns it (or undefined for function messages). */
function validateSurfaceId(type: AgentMessageType, body: Record<string, unknown>): string | undefined {
    const isSurfaceScoped = type !== 'agentFunctionResponse' && type !== 'callRendererFunction'
    const surfaceId = body.surfaceId

    if (typeof surfaceId === 'string' && surfaceId.length > 0) {
        return surfaceId
    }

    if (isSurfaceScoped) {
        throw new A2UIProtocolError('surfaceId is required', { path: `/${type}/surfaceId` })
    }

    return undefined
}

function validateCreateSurface(body: Record<string, unknown>, surfaceId?: string): void {
    if (body.components !== undefined) {
        validateComponents(body.components, '/createSurface/components', surfaceId)
    }

    if (body.dataModel !== undefined && !isPlainObject(body.dataModel)) {
        throw new A2UIProtocolError('dataModel must be an object', { path: '/createSurface/dataModel', surfaceId })
    }

    if (body.catalogId !== undefined && typeof body.catalogId !== 'string') {
        throw new A2UIProtocolError('catalogId must be a string', { path: '/createSurface/catalogId', surfaceId })
    }
}

function validateUpdateDataModel(body: Record<string, unknown>, surfaceId?: string): void {
    if (!('value' in body)) {
        throw new A2UIProtocolError('value is required', { path: '/updateDataModel/value', surfaceId })
    }

    if (body.path !== undefined && typeof body.path !== 'string') {
        throw new A2UIProtocolError('path must be a string', { path: '/updateDataModel/path', surfaceId })
    }
}

function validateFunctionCallId(body: Record<string, unknown>, type: AgentMessageType): void {
    if (typeof body.functionCallId !== 'string') {
        throw new A2UIProtocolError('functionCallId is required', { path: `/${type}/functionCallId` })
    }
}

// ---------------------------------------------------------------------------
// MARK: - Component validation
// ---------------------------------------------------------------------------

/** Validates a flat component array (ids, `component` discriminator, child reference shapes). */
export function validateComponents(value: unknown, basePath: string, surfaceId?: string): asserts value is A2UIComponent[] {
    if (!Array.isArray(value)) {
        throw new A2UIProtocolError('components must be an array', { path: basePath, surfaceId })
    }

    const seen = new Set<string>()

    value.forEach((component, index) => {
        const path = `${basePath}/${index}`

        validateComponent(component, path, surfaceId)

        if (seen.has(component.id)) {
            throw new A2UIProtocolError(`Duplicate component id '${component.id}' in message`, { path: `${path}/id`, surfaceId })
        }

        seen.add(component.id)
    })
}

export function validateComponent(component: unknown, path: string, surfaceId?: string): asserts component is A2UIComponent {
    if (!isPlainObject(component)) {
        throw new A2UIProtocolError('component must be an object', { path, surfaceId })
    }

    if (typeof component.id !== 'string' || component.id.length === 0) {
        throw new A2UIProtocolError('component id is required', { path: `${path}/id`, surfaceId })
    }

    if (typeof component.component !== 'string' || !isIdentifier(component.component)) {
        throw new A2UIProtocolError(`component type must be an identifier, got ${JSON.stringify(component.component)}`, {
            path: `${path}/component`,
            surfaceId,
        })
    }

    if (component.component === 'Surface') {
        throw new A2UIProtocolError(`'Surface' is a reserved component name`, { path: `${path}/component`, surfaceId })
    }

    if (component.children !== undefined && !isValidChildList(component.children)) {
        throw new A2UIProtocolError('children must be an array of ids or {path, componentId}', {
            path: `${path}/children`,
            surfaceId,
        })
    }

    if (component.child !== undefined && typeof component.child !== 'string') {
        throw new A2UIProtocolError('child must be a component id', { path: `${path}/child`, surfaceId })
    }
}

function isValidChildList(children: unknown): boolean {
    if (Array.isArray(children)) {
        return children.every((id) => typeof id === 'string')
    }

    return isChildTemplate(children) && typeof children.path === 'string'
}

/** UAX #31-ish identifier check used for component / function / catalog entity names. */
export function isIdentifier(name: string): boolean {
    return /^[\p{L}_][\p{L}\p{N}_]*$/u.test(name)
}
