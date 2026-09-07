/**
 * The smallest useful A2UI app.
 *
 * An agent sends messages; you keep them in a store; `<A2UIRenderer>` draws whatever the
 * store holds. Nothing else is required — no BindJS runtime to construct, no catalog to
 * register, no surface to name.
 */
import { useState } from 'react'
import type { ActionMessage, AgentMessage } from '@metabindai/a2ui-bindjs'
import { A2UIRenderer, useA2UIStore } from '@metabindai/a2ui-bindjs-react'

import { ActionLog } from './ActionLog'

// What an agent would send you. A flat list of components — `root` is the entry point —
// and a data model the components bind to.
const MESSAGES: AgentMessage[] = [
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'main',
            components: [
                { id: 'root', component: 'Card', child: 'body' },
                { id: 'body', component: 'Column', children: ['title', 'price', 'buy'] },
                { id: 'title', component: 'Text', variant: 'h2', text: { path: '/product/name' } },
                {
                    id: 'price',
                    component: 'Text',
                    variant: 'caption',
                    text: { call: 'formatCurrency', args: { value: { path: '/product/price' }, currency: 'USD' } },
                },
                { id: 'buyLabel', component: 'Text', text: { path: '/buttonLabel' } },
                {
                    id: 'buy',
                    component: 'Button',
                    variant: 'primary',
                    child: 'buyLabel',
                    action: { event: { name: 'add_to_cart', context: { product: { path: '/product/name' } } } },
                },
            ],
            dataModel: {
                product: { name: 'Trail Runner X2', price: 129 },
                buttonLabel: 'Add to cart',
            },
        },
    },
]

export function App() {
    // Builds a store and applies the messages to it. The store is yours — it holds every
    // surface on the connection, and you keep applying to it as the agent sends more.
    const { store } = useA2UIStore(MESSAGES)

    const [actions, setActions] = useState<ActionMessage[]>([])

    // A user action goes to the agent. Here we answer it ourselves, which is the whole
    // loop in miniature: the reply is just another message applied to the same store.
    function handleAction(action: ActionMessage) {
        setActions((previous) => [action, ...previous])

        store.apply({
            version: 'v1.0',
            updateDataModel: { surfaceId: 'main', path: '/buttonLabel', value: 'Added ✓' },
        })
    }

    return (
        <main className="app">
            <h1>A2UI Render</h1>

            <A2UIRenderer store={store} locale="en-US" onAction={handleAction} />

            <ActionLog actions={actions} />
        </main>
    )
}
