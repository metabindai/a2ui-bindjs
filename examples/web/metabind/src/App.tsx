/**
 * The same A2UI surface, drawn with a catalog fetched from a Metabind project.
 *
 * Copy `.env.example` to `.env.local` and fill it in to pull the project's package;
 * without it the example runs on the catalog bundled in `@metabindai/a2ui-bindjs`.
 */
import type { AgentMessage } from '@metabindai/a2ui-bindjs'
import { A2UIRenderer, useA2UIStore } from '@metabindai/a2ui-bindjs-react'

import { CatalogSource } from './CatalogSource'
import { readConfigFromEnv, useRemoteCatalog } from './useRemoteCatalog'

const MESSAGES: AgentMessage[] = [
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'main',
            components: [
                { id: 'root', component: 'Card', child: 'body' },
                { id: 'body', component: 'Column', children: ['title', 'blurb', 'cta'] },
                { id: 'title', component: 'Text', variant: 'h2', text: { path: '/offer/title' } },
                { id: 'blurb', component: 'Text', variant: 'caption', text: { path: '/offer/blurb' } },
                { id: 'ctaLabel', component: 'Text', text: 'Book it' },
                { id: 'cta', component: 'Button', variant: 'primary', child: 'ctaLabel', action: { event: { name: 'book' } } },
            ],
            dataModel: {
                offer: { title: 'Weekend upgrade', blurb: 'Two nights, sea view, breakfast included.' },
            },
        },
    },
]

// Read once: the environment does not change while the app is running.
const CONFIG = readConfigFromEnv(import.meta.env as unknown as Record<string, string | undefined>)

export function App() {
    const { store } = useA2UIStore(MESSAGES)
    const catalog = useRemoteCatalog(CONFIG)

    return (
        <main className="app">
            <h1>A2UI with a Metabind catalog</h1>

            <CatalogSource catalog={catalog} />

            {catalog.status !== 'loading' && (
                <A2UIRenderer
                    // Remounting on the runtime keeps hook state from carrying across catalogs.
                    key={catalog.status}
                    store={store}
                    runtime={catalog.status === 'loaded' ? catalog.runtime : undefined}
                    locale="en-US"
                />
            )}
        </main>
    )
}
