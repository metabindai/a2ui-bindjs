/**
 * Loading an A2UI catalog from a Metabind project at runtime.
 *
 * A published package carries its components as `name → compiled JavaScript`, which is
 * exactly what `createA2UIRuntime` takes as `sources` — so "restyle the surface by
 * shipping new BindJS" is a fetch and a registration, with no redeploy of this app.
 *
 * Unconfigured, the hook stays idle and the renderer falls back to the catalog bundled in
 * the package. That is not only a convenience for running the example: a host wants the
 * same behaviour when the network is down.
 */
import { useEffect, useRef, useState } from 'react'
import { fetchPackageComponents, type MetabindConfig } from './metabindApi'
import { createA2UIRuntime } from '@metabindai/a2ui-bindjs-react'
import type { BindJSRuntimeLike } from '@metabindai/a2ui-bindjs'

export interface RemoteCatalogConfig extends MetabindConfig {
    packageId: string
}

export type RemoteCatalog =
    | { status: 'bundled' }
    | { status: 'loading'; endpoint: string }
    | { status: 'loaded'; runtime: BindJSRuntimeLike; version: string; componentCount: number; endpoint: string }
    | { status: 'failed'; error: string; endpoint: string }

/** Reads the config Vite injects, or null when the example is unconfigured. */
export function readConfigFromEnv(env: Record<string, string | undefined>): RemoteCatalogConfig | null {
    const organizationId = env.VITE_METABIND_ORGANIZATION_ID
    const projectId = env.VITE_METABIND_PROJECT_ID
    const packageId = env.VITE_METABIND_PACKAGE_ID
    const apiKey = env.VITE_METABIND_API_KEY
    const previewToken = env.VITE_METABIND_PREVIEW_TOKEN

    if (!organizationId || !projectId || !packageId || !(apiKey || previewToken)) {
        return null
    }

    // Defaults to the path Vite proxies (see vite.config.ts): the API sends no CORS
    // headers, so the browser cannot call it directly.
    return { organizationId, projectId, packageId, apiKey, previewToken, url: env.VITE_METABIND_URL || '/metabind-api' }
}

export function useRemoteCatalog(config: RemoteCatalogConfig | null): RemoteCatalog {
    const endpoint = config?.url ?? ''
    const [state, setState] = useState<RemoteCatalog>(config ? { status: 'loading', endpoint } : { status: 'bundled' })

    // Keyed on what identifies the package rather than on the object, so a caller that
    // builds the config inline gets one fetch instead of an endless re-render loop.
    const key = config ? [config.organizationId, config.projectId, config.packageId].join('/') : null

    const latest = useRef(config)
    latest.current = config

    useEffect(() => {
        const config = latest.current

        if (!config) {
            setState({ status: 'bundled' })

            return
        }

        let cancelled = false

        setState({ status: 'loading', endpoint: config.url ?? '' })

        load(config)
            .then((loaded) => {
                if (!cancelled) {
                    setState(loaded)
                }
            })
            .catch((error: Error) => {
                if (!cancelled) {
                    setState({ status: 'failed', error: error.message, endpoint: config.url ?? '' })
                }
            })

        return () => {
            cancelled = true
        }
    }, [key])

    return state
}

async function load(config: RemoteCatalogConfig): Promise<RemoteCatalog> {
    const pkg = await fetchPackageComponents(config, config.packageId)

    // The project's components follow the same `A2UI<Type>` naming as the bundled ones,
    // so the default catalog map already points at them and only the sources change.
    // Anything the package does not carry is filled from the bundled catalog.
    const runtime = createA2UIRuntime({ sources: pkg.components })

    return {
        status: 'loaded',
        runtime,
        version: pkg.version,
        componentCount: Object.keys(pkg.components).length,
        endpoint: config.url ?? '',
    }
}
