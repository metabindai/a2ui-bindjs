# Render an A2UI surface in your React app

In this tutorial, you'll add the A2UI renderer to a Vite + React 18 app and draw a product
card that an agent describes as A2UI messages. By the end, you'll have a card whose chips
write into the agent's data model, whose button sends an action back, and whose reply
repaints one line of the card, with no React code describing any of it.

## Prerequisites

Before you start, make sure you have:

- Node.js 20 or later
- pnpm 10 (this repository pins `pnpm@10.13.0`) or npm
- A Vite app on React 18 with TypeScript. The renderer's peer dependency range is
  `react@^18.3.1`, so a project scaffolded on React 19 needs `react` and `react-dom` pinned
  to 18 first.
- Access to the `@metabindai` npm packages. Both `@metabindai/a2ui-bindjs` and
  `@metabindai/a2ui-bindjs-react` are published with `publishConfig.access` set to
  `restricted`, so the npm account you install with has to be a member of the
  `@metabindai` organization and logged in with `npm login`.

## What you'll build

The card from [`examples/web/minimal`](../examples/web/minimal/README.md), plus a row of
chips: a product name, a price formatted by the `formatCurrency` function, two chips for
extras, an **Add to cart** button, and a status line. The agent's messages are a hardcoded
array in this tutorial; a real agent streams the same JSON over whatever transport your app
uses.

Toggling a chip writes into the data model and the chip repaints from it. Pressing the
button dispatches an `add_to_cart` action carrying the chips' value; you log it and answer
with an `updateDataModel` that fills the status line. Finally, you swap the button for one
of your own without changing a byte of what the agent sent.

## Step 1: Install the packages

Install the renderer, the core package it is built on, and its peer dependencies:

```bash
pnpm add @metabindai/a2ui-bindjs @metabindai/a2ui-bindjs-react @metabindai/bindjs-react @metabindai/bindjs-runtime styled-components
```

With npm, replace `pnpm add` with `npm install`.

`@metabindai/a2ui-bindjs-react` is the renderer. `@metabindai/a2ui-bindjs` is the protocol,
store, and engine underneath it, and it is where the message types you'll write come from.
`@metabindai/bindjs-react`, `@metabindai/bindjs-runtime`, and `styled-components` are the
renderer's peer dependencies: the BindJS web renderer, the BindJS runtime, and the styling
library the web renderer draws with.

If the install fails on an `@metabindai` package, the account npm is using cannot see it.
Run `npm login` with an account in the organization and try again.

## Step 2: Write the agent's messages

An A2UI surface is a flat list of components keyed by `id`, with `root` as the entry point,
plus a data model the components bind to. A `{ path }` value reads from the data model and a
`{ call }` value invokes a function. Create `src/agent.ts` holding two messages: a
`createSurface` that draws the card, and an `updateDataModel` in which the agent lowers the
price.

```typescript
import type { AgentMessage } from '@metabindai/a2ui-bindjs'

export const MESSAGES: AgentMessage[] = [
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'main',
            components: [
                { id: 'root', component: 'Card', child: 'body' },
                { id: 'body', component: 'Column', children: ['title', 'price', 'extras', 'buy', 'status'] },
                { id: 'title', component: 'Text', variant: 'h2', text: { path: '/product/name' } },
                {
                    id: 'price',
                    component: 'Text',
                    variant: 'caption',
                    text: { call: 'formatCurrency', args: { value: { path: '/product/price' }, currency: 'USD' } },
                },
                {
                    id: 'extras',
                    component: 'ChoicePicker',
                    label: 'Extras',
                    variant: 'multipleSelection',
                    displayStyle: 'chips',
                    value: { path: '/order/extras' },
                    options: [
                        { label: 'Gift wrap', value: 'gift' },
                        { label: 'Rush delivery', value: 'rush' },
                    ],
                },
                { id: 'buyLabel', component: 'Text', text: 'Add to cart' },
                {
                    id: 'buy',
                    component: 'Button',
                    variant: 'primary',
                    child: 'buyLabel',
                    action: {
                        event: {
                            name: 'add_to_cart',
                            context: { product: { path: '/product/name' }, extras: { path: '/order/extras' } },
                        },
                    },
                },
                { id: 'status', component: 'Text', variant: 'caption', text: { path: '/order/status' } },
            ],
            dataModel: {
                product: { name: 'Trail Runner X2', price: 129 },
                order: { extras: [], status: '' },
            },
        },
    },

    // A second message in the same stream. Messages apply in order, so the card draws
    // with this price, not the one above.
    { version: 'v1.0', updateDataModel: { surfaceId: 'main', path: '/product/price', value: 99 } },
]
```

Two details are easy to get wrong. A `ChoicePicker` value is always an array, even when
only one option can be selected, so the data model starts it as `[]`. And a single-selection
picker draws as the platform's own control (a `<select>` on the web), so chips need
`variant: 'multipleSelection'`.

## Step 3: Build the store and render the surface

`useA2UIStore` replays the messages into a `SurfaceStore` and keeps it in React state.
`<A2UIRenderer>` draws the store's first surface, creating a BindJS runtime with the basic
catalog on it for the life of the component. Replace `src/App.tsx` with:

```tsx
import { A2UIRenderer, useA2UIStore } from '@metabindai/a2ui-bindjs-react'

import { MESSAGES } from './agent'

import './styles.css'

export function App() {
    const { store } = useA2UIStore(MESSAGES)

    return (
        <main className="app">
            <h1>A2UI Render</h1>

            <A2UIRenderer store={store} locale="en-US" />
        </main>
    )
}
```

`locale` pins the formatting functions; without it they follow the browser's locale.

Make `src/main.tsx` mount the named export:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

import './styles.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)
```

Replace `src/styles.css`. The last rule matters: the BindJS web renderer hard-codes
`overflow: hidden` and `height: 100%` on its container, so without it a card taller than
its box is clipped.

```css
:root {
    font: 14px system-ui, sans-serif;
    color: #111;
}

body {
    margin: 0;
}

.app {
    max-width: 420px;
    margin: 40px auto;
    padding: 0 16px;
}

.app > h1 {
    font-size: 16px;
    margin: 0 0 24px;
}

.log {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e5e5e5;
}

.log > h2 {
    margin: 0 0 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #888;
}

.log > pre {
    margin: 0 0 4px;
    font-size: 12px;
    color: #166534;
}

.error {
    margin: 8px 0 0;
    font-size: 12px;
    color: #b91c1c;
}

/* Temporary: bindjs-react's Renderer sets overflow: hidden and height: 100% with no prop to change either. */
.rendererContainer {
    overflow: visible !important;
    height: auto !important;
}
```

Start the dev server with `pnpm dev` and open the page. You see the card: **Trail Runner
X2**, the caption `$99.00` (the second message applied), the **Extras** label with two
chips, and **Add to cart**. Click **Gift wrap**. The chip fills in, because the chip wrote
`['gift']` into `/order/extras` and the store repainted the surface from the data model. The
data model owns the value; nothing in your React code does.

If the card is cut off at the bottom, the `.rendererContainer` rule from `styles.css` is
missing.

## Step 4: Handle the action round trip

A tap on the button dispatches an `ActionMessage`: its `name`, the `surfaceId`, the
`sourceComponentId`, a `timestamp`, and a `context` resolved against the data model at the
moment of the tap. Pass an `onAction` handler that logs it and answers the way an agent
would, with another message applied to the same store.

Create `src/ActionLog.tsx`, which shows what the surface sent back:

```tsx
import type { ActionMessage } from '@metabindai/a2ui-bindjs'

interface ActionLogProps {
    actions: ActionMessage[]
}

export function ActionLog({ actions }: ActionLogProps) {
    if (actions.length === 0) {
        return null
    }

    return (
        <section className="log">
            <h2>Sent to the agent</h2>

            {actions.map((action, index) => (
                <pre key={index}>
                    {action.name}
                    {action.context ? ` · ${JSON.stringify(action.context)}` : ''}
                </pre>
            ))}
        </section>
    )
}
```

Then update `src/App.tsx`:

```tsx
import { useState } from 'react'
import type { ActionMessage } from '@metabindai/a2ui-bindjs'
import { A2UIRenderer, useA2UIStore } from '@metabindai/a2ui-bindjs-react'

import { ActionLog } from './ActionLog'
import { MESSAGES } from './agent'

import './styles.css'

export function App() {
    const { store } = useA2UIStore(MESSAGES)

    const [actions, setActions] = useState<ActionMessage[]>([])

    // A user action goes to the agent. Here you answer it yourself: the reply is just
    // another message, applied to the same store.
    function handleAction(action: ActionMessage) {
        setActions((previous) => [action, ...previous])

        const extras = action.context?.extras
        const count = Array.isArray(extras) ? extras.length : 0
        const status = count === 0 ? 'Added to your cart' : `Added to your cart with ${count} extra${count === 1 ? '' : 's'}`

        store.apply({
            version: 'v1.0',
            updateDataModel: { surfaceId: 'main', path: '/order/status', value: status },
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
```

Click **Gift wrap**, then **Add to cart**. The status line under the button reads
`Added to your cart with 1 extra`, and the log shows `add_to_cart` followed by its context,
with `extras` holding `["gift"]`. The chip's value traveled in the action because the chip
wrote into the data model, and the reply repainted one bound `Text` without your code
knowing which part of the card changed.

## Step 5: Override one component with sources and catalog

A catalog maps an A2UI component type to the name of a registered BindJS component, so
restyling a type means supplying a component and changing one entry. Create `src/brand.ts`
with a button written as BindJS source. The runtime evaluates the string, so it could as
easily come from a server.

```typescript
import { BASIC_CATALOG, type Catalog } from '@metabindai/a2ui-bindjs'

const BRAND_BUTTON = `
exports.default = defineComponent({
    body: (props, children) => {
        const label = HStack({ spacing: 6 }, children ?? [])
            .padding({ horizontal: 22, vertical: 12 })
            .background(Color('#5b21b6'))
            .foregroundStyle(Color('white'))
            .cornerRadius(999)

        return Button(label, props.action ?? (() => {}))
    },
    properties: {},
})
`

// BindJS component name → source.
export const BRAND_SOURCES = { BrandButton: BRAND_BUTTON }

// A2UI type → BindJS component name. Every type not named here still comes from the
// basic catalog.
export const BRAND_CATALOG: Catalog = { ...BASIC_CATALOG, Button: 'BrandButton' }
```

Props reach a component under their A2UI names, plus two things only the engine can supply:
an `action` callback on a node with an A2UI action, and a `set<Prop>` writer for each prop
bound to a data-model path. The button above calls `props.action`, which is why it still
dispatches `add_to_cart`.

Both exports are module constants rather than objects built inside the component, so their
identity is stable across renders. Pass them to the renderer in `src/App.tsx`:

```tsx
import { useState } from 'react'
import type { ActionMessage } from '@metabindai/a2ui-bindjs'
import { A2UIRenderer, useA2UIStore } from '@metabindai/a2ui-bindjs-react'

import { ActionLog } from './ActionLog'
import { MESSAGES } from './agent'
import { BRAND_CATALOG, BRAND_SOURCES } from './brand'

import './styles.css'

export function App() {
    const { store } = useA2UIStore(MESSAGES)

    const [actions, setActions] = useState<ActionMessage[]>([])

    function handleAction(action: ActionMessage) {
        setActions((previous) => [action, ...previous])

        const extras = action.context?.extras
        const count = Array.isArray(extras) ? extras.length : 0
        const status = count === 0 ? 'Added to your cart' : `Added to your cart with ${count} extra${count === 1 ? '' : 's'}`

        store.apply({
            version: 'v1.0',
            updateDataModel: { surfaceId: 'main', path: '/order/status', value: status },
        })
    }

    return (
        <main className="app">
            <h1>A2UI Render</h1>

            <A2UIRenderer store={store} locale="en-US" sources={BRAND_SOURCES} catalog={BRAND_CATALOG} onAction={handleAction} />

            <ActionLog actions={actions} />
        </main>
    )
}
```

The button is now a purple pill. The agent's messages did not change, and neither did the
`Card`, `Column`, `Text`, or `ChoicePicker` above it, which the renderer still draws from
the bundled catalog.

## Step 6: Verify it works

The screen shows the card with **Trail Runner X2**, `$99.00`, the **Extras** chips, the
purple **Add to cart** pill, and an empty status line. Click **Rush delivery** and the chip
fills in. Click **Add to cart** and the status line reads `Added to your cart with 1 extra`
while the log lists the action with `extras` holding `["rush"]`.

Now see what a malformed message looks like. `useA2UIStore` also returns `errors`, the
messages that failed to apply, in stream order. Each is an `A2UIProtocolError` with a
`code`, a JSON Pointer `path` to the offending field, and a `message`. Add a third message
to the end of the array in `src/agent.ts` whose component type is not an identifier:

```typescript
    { version: 'v1.0', updateComponents: { surfaceId: 'main', components: [{ id: 'title', component: 'Text Heading', text: 'Oops' }] } },
```

Then show the errors in `src/App.tsx`, under the renderer:

```tsx
    const { store, errors } = useA2UIStore(MESSAGES)
```

```tsx
            {errors.map((error, index) => (
                <pre className="error" key={index}>
                    {error.code} at {error.path}: {error.message}
                </pre>
            ))}
```

The card still draws, because the store rejects the bad message as a whole and keeps what
came before, and the page shows:

```text
VALIDATION_FAILED at /updateComponents/components/0/component: component type must be an identifier, got "Text Heading"
```

Remove the third message when you have seen it. Problems found while drawing rather than
while parsing, such as a component type the catalog has no entry for, do not throw either.
They arrive through the renderer's `onDiagnostics` callback as a list of `Diagnostic`
values, each with a `code` (for example `UNKNOWN_COMPONENT`), a `message`, and the
`componentId` it was found at, and the rest of the surface still renders.

## What you've built

A React app that renders an agent-authored card, round-trips an action, and restyles one
component from BindJS source. The complete web version of this card, without the chips,
lives in [`examples/web/minimal`](../examples/web/minimal/README.md); the component
override is [`examples/web/custom-catalog`](../examples/web/custom-catalog/README.md)'s.

## What to read next

- [`examples/web/mcp`](../examples/web/mcp/README.md) feeds the same store from an MCP
  server, with actions going back as tool calls.
- [`examples/web/metabind`](../examples/web/metabind/README.md) fetches the catalog from a
  Metabind project at runtime instead of bundling it.
- [`examples/ios/minimal`](../examples/ios/minimal/README.md) and
  [`examples/android/minimal`](../examples/android/minimal/README.md) draw a card like this
  one as SwiftUI and Jetpack Compose, from the same kind of messages.
- The [protocol support tables](../README.md#protocol-support) in the README list every
  message, catalog component, and function the renderer supports.
