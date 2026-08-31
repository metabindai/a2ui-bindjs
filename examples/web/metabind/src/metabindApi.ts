/**
 * The one Metabind API call this example makes.
 *
 * Fetching a published package means a single GraphQL query and one header, so the example
 * does it directly rather than depending on a client library. What a package carries is
 * `name → compiled JavaScript`, which is exactly the shape `createA2UIRuntime` takes.
 *
 * A real app with more than one call to make would want the SDK; this is here to keep the
 * example's dependencies down to what it actually uses.
 */

// MARK: - Types

export interface MetabindConfig {
    organizationId: string
    projectId: string

    /** Ignored when `previewToken` is set. */
    apiKey?: string
    previewToken?: string

    /** Defaults to the public API. Relative values are resolved against the page origin. */
    url?: string

    /** Injectable for tests. */
    fetch?: typeof globalThis.fetch
}

/** A published package: its version, and its components as compiled sources. */
export interface PackageComponents {
    version: string
    components: Record<string, string>
}

const DEFAULT_API_URL = 'https://api.metabind.ai/graphql'

// MARK: - Queries

// Only `version` and `components` are selected. The package also carries `id` and
// `assets`, which this example has no use for.
const PACKAGE_QUERY = `
    query ResolvedPackageData($packageId: ID!) {
        resolvedPackageData(packageId: $packageId) {
            version
            components
        }
    }
`

const PREVIEW_PACKAGE_QUERY = `
    query PreviewResolvedPackageData($token: String!, $packageId: ID!) {
        previewResolvedPackageData(token: $token, packageId: $packageId) {
            version
            components
        }
    }
`

// MARK: - Fetching

export async function fetchPackageComponents(config: MetabindConfig, packageId: string): Promise<PackageComponents> {
    const preview = config.previewToken

    const data = await query<Record<string, ResolvedPackageData | null>>(
        config,
        preview ? PREVIEW_PACKAGE_QUERY : PACKAGE_QUERY,
        preview ? { token: preview, packageId } : { packageId }
    )

    const packageData = data[preview ? 'previewResolvedPackageData' : 'resolvedPackageData']

    if (!packageData) {
        throw new Error('No package data returned — check the package id and the key.')
    }

    return { version: packageData.version, components: parseComponents(packageData.components) }
}

interface ResolvedPackageData {
    version: string

    /** A JSON string, not an object: the API returns the component map encoded. */
    components: string
}

function parseComponents(encoded: string): Record<string, string> {
    try {
        return JSON.parse(encoded) as Record<string, string>
    } catch {
        throw new Error('The package components were not valid JSON.')
    }
}

// MARK: - Transport

async function query<T>(config: MetabindConfig, document: string, variables: Record<string, unknown>): Promise<T> {
    const request = config.fetch ?? globalThis.fetch

    const response = await request(resolveEndpoint(config.url ?? DEFAULT_API_URL), {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            // The API identifies the project and the key together, in one header.
            'x-api-key': `${config.organizationId}:${config.projectId}:${config.apiKey ?? ''}`,
        },
        body: JSON.stringify({ query: document, variables }),
    })

    if (!response.ok) {
        throw new Error(`The Metabind API returned ${response.status} ${response.statusText}.`)
    }

    const payload = (await response.json()) as { data?: T; errors?: { message: string }[] }

    // GraphQL reports failures in a 200 body, so a status check alone proves nothing.
    if (payload.errors?.length) {
        throw new Error(payload.errors.map((error) => error.message).join('; '))
    }

    if (!payload.data) {
        throw new Error('The Metabind API returned no data.')
    }

    return payload.data
}

/**
 * `fetch` rejects a relative URL outside a document context, and the example's default
 * endpoint is the path Vite proxies. Absolute URLs pass through untouched.
 */
function resolveEndpoint(url: string): string {
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url)

    if (isAbsolute) {
        return url
    }

    if (typeof globalThis.location?.origin === 'string') {
        return new URL(url, globalThis.location.origin).toString()
    }

    return url
}
