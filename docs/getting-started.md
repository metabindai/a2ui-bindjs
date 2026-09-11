# Render an A2UI surface in your React app

In this tutorial, you'll add the A2UI renderer to a Vite + React app and draw a product
card that an agent describes as A2UI messages. By the end, you'll have a card whose chips
write into the agent's data model, whose button sends an action back, and whose reply
repaints one line of the card, with no React code describing any of it.

## Prerequisites

- Node.js 20 or later, and pnpm
- A Vite + React + TypeScript app (`pnpm create vite --template react-ts`)

## Step 1: Install the packages

```bash
pnpm add @metabindai/a2ui-bindjs @metabindai/a2ui-bindjs-react
```

`@metabindai/a2ui-bindjs-react` is the renderer. `@metabindai/a2ui-bindjs` is the protocol,
store, and engine underneath it, and it is where the message types come from. The
renderer's peer dependencies (`@metabindai/bindjs-react`, `@metabindai/bindjs-runtime`, and
`styled-components`) are installed with it.

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

## Step 3: Render the surface and handle the action

`useA2UIStore` replays the messages into a `SurfaceStore` and keeps it in React state.
`<A2UIRenderer>` draws the store's first surface with the basic catalog. A tap on the button
calls `onAction` with an `ActionMessage`: its `name`, the `surfaceId`, the
`sourceComponentId`, a `timestamp`, and a `context` resolved against the data model at the
moment of the tap. Replace `src/App.tsx` with:

```tsx
import type { ActionMessage } from '@metabindai/a2ui-bindjs'
import { A2UIRenderer, useA2UIStore } from '@metabindai/a2ui-bindjs-react'

import { MESSAGES } from './agent'

export default function App() {
    const { store } = useA2UIStore(MESSAGES)

    // A user action goes to the agent. Here you answer it yourself: the reply is just
    // another message, applied to the same store.
    function handleAction(action: ActionMessage) {
        console.log(action.name, action.context)

        const extras = action.context?.extras
        const count = Array.isArray(extras) ? extras.length : 0
        const status = count === 0 ? 'Added to your cart' : `Added to your cart with ${count} extra${count === 1 ? '' : 's'}`

        store.apply({
            version: 'v1.0',
            updateDataModel: { surfaceId: 'main', path: '/order/status', value: status },
        })
    }

    return <A2UIRenderer store={store} locale="en-US" onAction={handleAction} />
}
```

`locale` pins the formatting functions; without it they follow the browser's locale.

Start the dev server with `pnpm dev` and open the page. You see the card: **Trail Runner
X2**, the caption `$99.00` (the second message applied), the **Extras** label with two
chips, and **Add to cart**.

Click **Gift wrap**. The chip fills in, because it wrote `['gift']` into `/order/extras` and
the store repainted the surface from the data model. Then click **Add to cart**. The console
logs `add_to_cart` with `extras` holding `["gift"]`, and the status line reads
`Added to your cart with 1 extra`. The chip's value traveled in the action because the chip
wrote into the data model, and the reply repainted one bound `Text` without your code
knowing which part of the card changed.

## Step 4: Override one component

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

// Module constants, so their identity is stable across renders.

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

In `src/App.tsx`, import them and pass them to the renderer:

```tsx
import { BRAND_CATALOG, BRAND_SOURCES } from './brand'
```

```tsx
    return <A2UIRenderer store={store} locale="en-US" sources={BRAND_SOURCES} catalog={BRAND_CATALOG} onAction={handleAction} />
```

The button is now a purple pill and still sends `add_to_cart`. The agent's messages did not
change, and neither did the `Card`, `Column`, `Text`, or `ChoicePicker` above it, which the
renderer still draws from the bundled catalog.

## When a message is wrong

Neither kind of problem throws, and the rest of the surface keeps drawing.

- **A message that fails to parse** is rejected whole, and the store keeps what came before.
  `useA2UIStore` returns these as `errors`, in stream order. Each is an
  `A2UIProtocolError` with a `code`, a JSON Pointer `path` to the offending field, and a
  `message`.
- **A problem found while drawing**, such as a component type the catalog has no entry for,
  arrives through the renderer's `onDiagnostics` callback as a list of `Diagnostic` values,
  each with a `code` (for example `UNKNOWN_COMPONENT`), a `message`, and the `componentId` it
  was found at.

## What to read next

- [`examples/web/minimal`](../examples/web/minimal/README.md) is the complete web version of
  this card, without the chips, and
  [`examples/web/custom-catalog`](../examples/web/custom-catalog/README.md) is the component
  override.
- [`examples/web/mcp`](../examples/web/mcp/README.md) feeds the same store from an MCP
  server, with actions going back as tool calls.
- [`examples/web/metabind`](../examples/web/metabind/README.md) fetches the catalog from a
  Metabind project at runtime instead of bundling it.
- [`examples/ios/minimal`](../examples/ios/minimal/README.md) and
  [`examples/android/minimal`](../examples/android/minimal/README.md) draw a card like this
  one as SwiftUI and Jetpack Compose, from the same kind of messages.
- The [protocol support tables](../README.md#protocol-support) in the README list every
  message, catalog component, and function the renderer supports.
