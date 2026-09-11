# A2UI on the web

A React app whose only screen is written by an agent: the smallest thing that renders an
A2UI surface, action round trip included.

`App.tsx` holds the A2UI. There is no JSX anywhere in this example describing the product
card: the messages name components, bind them to a data model, and the bundled catalog
decides what that looks like in the browser. The same protocol draws
[`examples/ios/minimal`](../../ios/minimal/README.md) as SwiftUI and
[`examples/android/minimal`](../../android/minimal/README.md) as Jetpack Compose.

<img src="https://github.com/user-attachments/assets/53c4fd9c-fdc3-4685-a317-a00b56b109f6" width="600" alt="A product card rendered from one A2UI message: a title, a price formatted as currency, and an Add to cart button">

Start it from the repository root:

```bash
pnpm install
pnpm dev:minimal                                     # builds core and react, then serves on :5182
pnpm --filter @metabindai/a2ui-bindjs-minimal test   # the example, in jsdom
```

`dev:minimal` runs `pnpm build:lib` first because the example resolves the workspace
packages from `core/dist` and `react/dist`.

## Layout

```text
src/App.tsx          the agent's messages, the store, one <A2UIRenderer>, the reply
src/ActionLog.tsx    scaffolding: shows what the surface sent back
src/styles.css       page chrome, plus one override the renderer still needs
tests/app.test.tsx   renders the card, taps the button, sees the reply
```

## How it fits together

```text
MESSAGES (AgentMessage[])
  └── useA2UIStore          ►  SurfaceStore, replayed once and held in React state
        └── <A2UIRenderer>  ►  BindJS AST  ►  bindjs-react  ►  DOM
              onAction      ►  handleAction  ►  store.apply(updateDataModel)  ►  repaint
```

**Nothing to construct.** No BindJS runtime is created and no catalog is registered:
`<A2UIRenderer>` makes a runtime with the basic catalog on it and keeps it for the life of
the component. `useA2UIStore` builds the store from the message list and rebuilds it if the
list's identity changes, which is why `MESSAGES` is a module constant.

**The store is yours.** It holds every surface on the connection, and the host keeps
applying to it as the agent sends more. The reply to an action is exactly that: another
message, applied to the same store, which repaints the one bound `Text` it touched.

**No `<button>` in the DOM.** The BindJS web renderer does not emit one; the click bubbles
to the handler React attached at the root, which is how the test taps the label.

## What to try

Press **Add to cart**. The label becomes `Added ✓`, because `handleAction` answers with an
`updateDataModel` on `/buttonLabel`, and the log underneath shows `add_to_cart` with its
context, `product` resolved against the data model at the moment of the tap.

## Known differences

`styles.css` overrides `.rendererContainer` with `overflow: visible` and `height: auto`.
bindjs-react's `Renderer` hard-codes the opposite with no prop to change it, so a surface
taller than its box would otherwise be clipped. The override is temporary and marked as
such in the file.

## What to read next

- [Getting started](../../../docs/getting-started.md) builds this card in your own Vite app,
  with chips and a component override added.
- [`examples/web/custom-catalog`](../custom-catalog/README.md) swaps and adds catalog
  components with `sources` and `catalog`.
- [`examples/web/playground`](../playground/README.md) is where to paste a message stream
  and watch the store apply it, step by step.
