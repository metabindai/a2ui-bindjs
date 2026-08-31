// Replays a message stream through a fresh SurfaceStore, recording what happened
// after each message so the UI can scrub through cause and effect.
import { A2UIProtocolError, SurfaceStore, messageType, parseMessage, type AgentMessage } from '@metabindai/a2ui-bindjs'

import { snapshotSurface, type SurfaceSnapshot } from './snapshot'

export type { SurfaceSnapshot }


export interface ReplayStep {
    index: number
    raw: unknown
    /** Message type if the envelope parsed, else undefined. */
    type?: string
    surfaceId?: string
    error?: { name: string; message: string; code?: string; path?: string }
    /** Store state after this message was applied (or attempted). */
    surfaces: SurfaceSnapshot[]
}

export interface ReplayResult {
    steps: ReplayStep[]
    /** Set when the editor text itself is not a JSON array. */
    sourceError?: string
}

export function replay(source: string): ReplayResult {
    let messages: unknown[]

    try {
        const parsed = JSON.parse(source)
        messages = Array.isArray(parsed) ? parsed : [parsed]
    } catch (error) {
        return { steps: [], sourceError: (error as Error).message }
    }

    const store = new SurfaceStore()
    const steps: ReplayStep[] = []

    messages.forEach((raw, index) => {
        const step: ReplayStep = { index, raw, surfaces: [] }

        try {
            const message = parseMessage(raw)
            const type = messageType(message)

            step.type = type
            step.surfaceId = readSurfaceId(message, type)

            store.apply(message)
        } catch (error) {
            step.error = describeError(error)
        }

        step.surfaces = store.surfaceIds.map((id) => snapshotSurface(store.requireSurface(id)))
        steps.push(step)
    })

    return { steps }
}

function readSurfaceId(message: AgentMessage, type: string): string | undefined {
    const body = (message as Record<string, { surfaceId?: string }>)[type]

    return body?.surfaceId
}

function describeError(error: unknown): ReplayStep['error'] {
    if (error instanceof A2UIProtocolError) {
        return { name: error.name, message: error.message, code: error.code, path: error.path }
    }

    const generic = error as Error

    return { name: generic.name ?? 'Error', message: generic.message ?? String(error) }
}

