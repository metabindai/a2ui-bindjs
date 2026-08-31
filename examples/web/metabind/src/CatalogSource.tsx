/**
 * Says which catalog is drawing the surface. Scaffolding, not A2UI.
 */
import type { RemoteCatalog } from './useRemoteCatalog'

interface CatalogSourceProps {
    catalog: RemoteCatalog
}

export function CatalogSource({ catalog }: CatalogSourceProps) {
    if (catalog.status === 'loading') {
        return (
            <p className="source">
                Fetching the package from <code>{catalog.endpoint}</code>…
            </p>
        )
    }

    if (catalog.status === 'failed') {
        return (
            <p className="source error">
                Could not load the project package from <code>{catalog.endpoint}</code> ({catalog.error}) — falling back to
                the bundled catalog.
            </p>
        )
    }

    if (catalog.status === 'loaded') {
        return (
            <p className="source">
                Drawn with <code>{catalog.componentCount} components</code> from package version{' '}
                <code>{catalog.version}</code>, fetched from <code>{catalog.endpoint}</code>.
            </p>
        )
    }

    return (
        <p className="source">
            Drawn with the bundled catalog. Copy <code>.env.example</code> to <code>.env.local</code> to pull a project&rsquo;s
            package instead.
        </p>
    )
}
