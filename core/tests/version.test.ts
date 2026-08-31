/**
 * A2UI v0.9 payloads.
 *
 * v0.9 and v1.0 declare the same components and functions — v1.0 only adds properties —
 * so a v0.9 surface is a subset of what this renderer draws. The fixture is the official
 * `a2ui-over-mcp-recipe` sample, unmodified, which is as close to a real v0.9 agent as we
 * can get without one.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BindJSRuntime } from '@metabindai/bindjs-runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BASIC_CATALOG, BASIC_CATALOG_ID_V0_9 } from '../src/engine/catalog'
import { renderSurface } from '../src/engine/render'
import type { BindJSRuntimeLike } from '../src/engine/types'
import { createStandardRegistry } from '../src/functions/registry'
import { registerCatalog, type RegistrarRuntime } from '../src/catalog/register'
import { parseMessage } from '../src/protocol/parse'
import { SurfaceStore } from '../src/store/SurfaceStore'
import type { AgentMessage } from '../src/protocol/types'

const recipe = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/recipe-v0_9.json', import.meta.url)), 'utf8')) as AgentMessage[]

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

describe('v0.9 payloads', () => {
    it('is a v0.9 fixture using the v0.9 catalog', () => {
        expect(recipe.length).toBeGreaterThan(0)
        expect([...new Set(recipe.map((message) => message.version))]).toEqual(['v0.9'])
    })

    it('parses without complaint', () => {
        for (const message of recipe) {
            expect(() => parseMessage(message)).not.toThrow()
        }
    })

    it('renders through the bundled catalog', () => {
        const store = new SurfaceStore()
        store.applyAll(recipe)

        const surfaceId = store.surfaceIds[0]
        expect(store.requireSurface(surfaceId).catalogId).toBe(BASIC_CATALOG_ID_V0_9)

        const result = renderSurface({
            runtime: runtime as unknown as BindJSRuntimeLike,
            surface: store.requireSurface(surfaceId),
            catalog: BASIC_CATALOG,
            registry: createStandardRegistry(),
            locale: 'en-US',
        })

        expect(result.diagnostics).toEqual([])
        expect(runtime.unwrapComponentAST(result.ast)).not.toBeNull()
        expect(consoleErrors).toEqual([])
    })

    it.each(['https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json', 'https://a2ui.org/specification/v0_9/basic_catalog.json'])(
        'accepts the v0.9 catalog spelled %s',
        (catalogId) => {
            const store = new SurfaceStore()
            store.apply({
                createSurface: { surfaceId: 's', catalogId, components: [{ id: 'root', component: 'Text', text: 'x' }] },
            })

            const result = renderSurface({
                runtime: runtime as unknown as BindJSRuntimeLike,
                surface: store.requireSurface('s'),
                catalog: BASIC_CATALOG,
            })

            expect(result.diagnostics).toEqual([])
        }
    )

    it('still refuses a catalog it was never given', () => {
        const store = new SurfaceStore()
        store.apply({
            createSurface: {
                surfaceId: 's',
                catalogId: 'https://example.com/catalogs/other.json',
                components: [{ id: 'root', component: 'Text', text: 'x' }],
            },
        })

        const result = renderSurface({
            runtime: runtime as unknown as BindJSRuntimeLike,
            surface: store.requireSurface('s'),
            catalog: BASIC_CATALOG,
        })

        expect(result.diagnostics[0].code).toBe('UNKNOWN_CATALOG')
    })
})
