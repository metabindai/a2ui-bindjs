/**
 * Runs offline: unconfigured, the example must still render on the bundled catalog. The
 * remote path is covered by driving the hook with a stubbed transport, so no test needs
 * credentials or a network.
 */
import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from '../src/App'
import { readConfigFromEnv, useRemoteCatalog } from '../src/useRemoteCatalog'

afterEach(cleanup)

describe('metabind example', () => {
    it('renders on the bundled catalog when unconfigured', async () => {
        render(<App />)

        expect(await screen.findByText('Weekend upgrade')).toBeDefined()
        expect(await screen.findByText(/Drawn with the bundled catalog/)).toBeDefined()
    })
})

describe('readConfigFromEnv', () => {
    const complete = {
        VITE_METABIND_ORGANIZATION_ID: 'org1',
        VITE_METABIND_PROJECT_ID: 'proj1',
        VITE_METABIND_PACKAGE_ID: 'pkg1',
        VITE_METABIND_API_KEY: 'secret',
    }

    it('reads a complete configuration', () => {
        expect(readConfigFromEnv(complete)).toMatchObject({ organizationId: 'org1', packageId: 'pkg1' })
    })

    it('accepts a preview token instead of an api key', () => {
        const { VITE_METABIND_API_KEY, ...rest } = complete

        expect(readConfigFromEnv({ ...rest, VITE_METABIND_PREVIEW_TOKEN: 'tok' })).toMatchObject({ previewToken: 'tok' })
    })

    it.each(['VITE_METABIND_ORGANIZATION_ID', 'VITE_METABIND_PROJECT_ID', 'VITE_METABIND_PACKAGE_ID', 'VITE_METABIND_API_KEY'])(
        'is null without %s',
        (missing) => {
            const partial = { ...complete, [missing]: undefined }

            expect(readConfigFromEnv(partial)).toBeNull()
        }
    )
})

describe('useRemoteCatalog', () => {
    const CONFIG = {
        organizationId: 'org1',
        projectId: 'proj1',
        packageId: 'pkg1',
        apiKey: 'secret',
    }

    function stubFetch(payload: unknown) {
        return vi.fn(async () => ({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => payload,
            text: async () => JSON.stringify(payload),
        })) as never
    }

    it('stays on the bundled catalog when there is no config', () => {
        const { result } = renderHook(() => useRemoteCatalog(null))

        expect(result.current.status).toBe('bundled')
    })

    it('registers the package components as a runtime', async () => {
        const components = { A2UIText: 'exports.default = defineComponent({ body: () => Text("x"), properties: {} })' }
        // The API returns the component map as a JSON string.
        const packageData = { id: 'pkg1', version: '2.1.0', components: JSON.stringify(components), assets: '{}' }
        const fetch = stubFetch({ data: { resolvedPackageData: packageData } })

        const { result } = renderHook(() => useRemoteCatalog({ ...CONFIG, fetch }))

        await waitFor(() => expect(result.current.status).toBe('loaded'))

        expect(result.current).toMatchObject({ version: '2.1.0', componentCount: 1 })
    })

    it('reports a failure rather than throwing', async () => {
        const failing = vi.fn(async () => {
            throw new Error('offline')
        }) as never

        const { result } = renderHook(() => useRemoteCatalog({ ...CONFIG, fetch: failing }))

        await waitFor(() => expect(result.current.status).toBe('failed'))
    })
})
