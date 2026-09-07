/**
 * Conformance against the vendored A2UI v1.0 specification.
 *
 * Every example the spec ships is validated against the official message schema and
 * then rendered through the engine and the real catalog. This is the check that caught
 * `Tabs` and `Modal` being built against guessed property names: hand-written fixtures
 * only ever prove the renderer agrees with itself.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BindJSRuntime } from '@metabindai/bindjs-runtime'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BASIC_CATALOG, BASIC_CATALOG_FUNCTIONS, BASIC_CATALOG_ID } from '../src/engine/catalog'
import { renderSurface } from '../src/engine/render'
import type { BindJSRuntimeLike } from '../src/engine/types'
import { createStandardRegistry } from '../src/functions/registry'
import { registerCatalog, type RegistrarRuntime } from '../src/catalog/register'
import { parseMessage } from '../src/protocol/parse'
import { PROTOCOL_VERSION } from '../src/protocol/types'
import { SurfaceStore } from '../src/store/SurfaceStore'
import type { AgentMessage } from '../src/protocol/types'

const specDir = fileURLToPath(new URL('../../vendor/spec/v1_0/', import.meta.url))
const examplesDir = `${specDir}catalogs/basic/examples/`

interface Example {
    file: string
    name: string
    messages: AgentMessage[]
}

function loadJson(path: string): Record<string, unknown> {
    return JSON.parse(readFileSync(path, 'utf8'))
}

const examples: Example[] = readdirSync(examplesDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
        const parsed = loadJson(`${examplesDir}${file}`)

        return { file, name: (parsed.name as string) ?? file, messages: (parsed.messages ?? []) as AgentMessage[] }
    })

// Every schema is registered by its $id so the cross-file $refs resolve offline.
function buildValidator() {
    const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false })
    addFormats(ajv)

    for (const file of ['common_types.json', 'agent_to_renderer.json', 'renderer_to_agent.json', 'catalog_definition.json']) {
        const schema = loadJson(`${specDir}${file}`)
        ajv.addSchema(schema, schema.$id as string)
    }

    // The message schema refs `catalog.json#/$defs/anyComponent` relative to its own
    // $id — a placeholder the host binds to whichever catalog is in use. Register the
    // basic catalog under both its real id and that slot.
    const basicCatalog = loadJson(`${specDir}catalogs/basic/catalog.json`)

    ajv.addSchema(basicCatalog, basicCatalog.$id as string)
    ajv.addSchema(basicCatalog, 'https://a2ui.org/specification/v1_0/catalog.json')

    return ajv.getSchema(loadJson(`${specDir}agent_to_renderer.json`).$id as string)!
}

const validateMessage = buildValidator()

let runtime: BindJSRuntime
let consoleErrors: unknown[][]

beforeEach(() => {
    runtime = new BindJSRuntime()
    registerCatalog(runtime as unknown as RegistrarRuntime)

    consoleErrors = []
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        consoleErrors.push(args)
    })
})

describe('spec examples', () => {
    it('found the vendored corpus', () => {
        expect(examples.length).toBeGreaterThanOrEqual(40)
    })

    it.each(examples.map((example) => [example.file, example] as const))('%s validates against the official schema', (_file, example) => {
        for (const message of example.messages) {
            const valid = validateMessage(message)

            expect(valid, JSON.stringify(validateMessage.errors?.slice(0, 2))).toBe(true)
        }
    })

    it.each(examples.map((example) => [example.file, example] as const))('%s is accepted by our parser', (_file, example) => {
        for (const message of example.messages) {
            expect(() => parseMessage(message)).not.toThrow()
        }
    })

    it.each(examples.map((example) => [example.file, example] as const))('%s renders through the catalog', (_file, example) => {
        const store = new SurfaceStore()
        store.applyAll(example.messages)

        for (const surfaceId of store.surfaceIds) {
            const result = renderSurface({
                runtime: runtime as unknown as BindJSRuntimeLike,
                surface: store.requireSurface(surfaceId),
                catalog: BASIC_CATALOG,
                registry: createStandardRegistry(),
                locale: 'en-US',
            })

            expect(result.diagnostics, `${surfaceId}: ${JSON.stringify(result.diagnostics)}`).toEqual([])
            expect(runtime.unwrapComponentAST(result.ast), `${surfaceId} produced no AST`).not.toBeNull()
        }

        expect(consoleErrors, `runtime errors: ${JSON.stringify(consoleErrors.slice(0, 1))}`).toEqual([])
    })
})

// The v0.9 corpus is what every upstream renderer, gallery and demo still shows, so it is
// the like-for-like comparison. Its schemas are not vendored; the engine answers to the
// v0.9 catalog id and renders the same components, so it is parsed and rendered, not
// validated.
describe('v0.9 spec examples', () => {
    const legacyDir = fileURLToPath(new URL('../../vendor/spec/v0_9/catalogs/basic/examples/', import.meta.url))

    const legacy: Example[] = readdirSync(legacyDir)
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => {
            const parsed = loadJson(`${legacyDir}${file}`)

            return { file, name: (parsed.name as string) ?? file, messages: (parsed.messages ?? []) as AgentMessage[] }
        })

    it('found the vendored corpus', () => {
        expect(legacy.length).toBe(43)
    })

    it.each(legacy.map((example) => [example.file, example] as const))('%s is accepted by our parser', (_file, example) => {
        for (const message of example.messages) {
            expect(() => parseMessage(message)).not.toThrow()
        }
    })

    it.each(legacy.map((example) => [example.file, example] as const))('%s renders through the catalog', (_file, example) => {
        const store = new SurfaceStore()
        store.applyAll(example.messages)

        for (const surfaceId of store.surfaceIds) {
            const result = renderSurface({
                runtime: runtime as unknown as BindJSRuntimeLike,
                surface: store.requireSurface(surfaceId),
                catalog: BASIC_CATALOG,
                registry: createStandardRegistry(),
                locale: 'en-US',
            })

            expect(result.diagnostics, `${surfaceId}: ${JSON.stringify(result.diagnostics)}`).toEqual([])
            expect(runtime.unwrapComponentAST(result.ast), `${surfaceId} produced no AST`).not.toBeNull()
        }

        expect(consoleErrors, `runtime errors: ${JSON.stringify(consoleErrors.slice(0, 1))}`).toEqual([])
    })
})

describe('vendored spec version', () => {
    // Dropping in a different spec version would otherwise regenerate happily and only
    // fail somewhere less obvious.
    it('matches the protocol version this package targets', () => {
        const catalog = loadJson(`${specDir}catalogs/basic/catalog.json`)

        expect(`v${catalog.protocolVersion}`).toBe(PROTOCOL_VERSION)
    })

    it('declares only message versions we accept', () => {
        const raw = readFileSync(`${specDir}agent_to_renderer.json`, 'utf8')
        const declared = [...new Set([...raw.matchAll(/"const":\s*"(v[\d.]+)"/g)].map((match) => match[1]))]

        expect(declared).toEqual([PROTOCOL_VERSION])
    })

    it('advertises the catalog id the engine defaults to', () => {
        const catalog = loadJson(`${specDir}catalogs/basic/catalog.json`)

        expect(catalog.catalogId).toBe(BASIC_CATALOG_ID)
    })
})

describe('catalog agreement with the spec', () => {
    it('implements every standard function the catalog declares', () => {
        const registry = createStandardRegistry()
        const missing = BASIC_CATALOG_FUNCTIONS.filter((name) => !registry.has(name))

        expect(missing).toEqual([])
    })

    it('maps every component type the catalog declares', () => {
        const unmapped = Object.keys(BASIC_CATALOG).filter((type) => BASIC_CATALOG[type] === undefined)

        expect(unmapped).toEqual([])
    })
})
