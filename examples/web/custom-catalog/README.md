# Your own components, in an agent's surface

Six screens behind an index, in two sections, split by what the *agent* named rather than
by what the app supplied. **Built-in catalog** is types the bundled catalog already has:
the offer card as it ships, and again with `Text` and `Button` replaced. **Custom
components** is types it does not have at all: a `Rating`, a `FlightCard`, a `Chart`, and a
`SortBoard`, all written by this app as BindJS source and named by the agent as if they had
always been there. The A2UI messages and the sources are the ones
[`examples/ios/custom-catalog`](../../ios/custom-catalog/README.md) and
[`examples/android/custom-catalog`](../../android/custom-catalog/README.md) use, byte for
byte.

Start it from the repository root:

```bash
pnpm dev:custom-catalog                                     # builds core and react, then serves on :5183
pnpm --filter @metabindai/a2ui-bindjs-custom-catalog test   # every screen, in jsdom
```

## Offer card and Overrides

Both screens draw the same `main` surface from the same store. *Offer card* renders it on
the basic catalog; *Overrides* renders it with three BindJS sources and three catalog
entries:

```tsx
<A2UIRenderer store={store} surfaceId="main" sources={BRAND_SOURCES} catalog={BRAND_CATALOG} />
```

`sources` is BindJS component name → source. `catalog` is A2UI type → BindJS component
name, spread over `BASIC_CATALOG` so only what changes is named: two overrides (`Text`,
`Button`) and one addition (`Rating`). There is no runtime to build: the renderer registers
the sources on the runtime it already owns, during render rather than in an effect, so the
first paint already has them. Both objects are module constants so their identity is stable
across renders.

## Rating

A type the basic catalog has no entry for. The `review` surface is drawn twice on this
screen: once on a renderer handed the catalog, where five tappable stars write the number
back into the data model and the caption bound to the same path repaints from it, and once
below, under **Without the catalog**, on a renderer never told about `Rating`, which
reports it as unknown instead of drawing it.

## Flight search

A `Column` templated over three rows of the data model, each drawn by `FlightCard`, one
A2UI type standing in for a whole row of chrome. The agent binds the properties and an
action whose context is resolved per row, so the third card's tap arrives carrying
`AA 184`. The paper plane that flies across the card on a tap is BindJS `useState` and
timers, entirely inside the component; neither the agent nor the host knows about it.

## Sales dashboard

One A2UI type over three chart shapes. `Chart` takes `data` (an array of
`{ label, value }`), a variant, and a title, and the surface names it three times: revenue
by quarter, sessions this week, traffic sources. The total above them, `$708,550.00`, is
formatted by the engine's `formatCurrency` before the surface is built; each chart formats
its own readout inside the component, where the engine cannot reach.

## Habitat sort

`SortBoard` is one A2UI type standing in for a whole interaction: nine animals dealt in a
shuffled deck, dragged one at a time onto one of three habitats, and scored against the
answer key traveling on each card. None of that state reaches the data model, deliberately.
The agent supplies the cards, the bins, and the key, and gets back whatever action the
surface declared.

## What a surface says back

Nothing is shown inline. A floating pill counts what the visible screen's surfaces
dispatched and what they could not draw, and a sheet shows the detail, keyed by screen and
slot so the Rating screen's two renderers do not erase each other's reports.

## The files

`App.tsx` holds the offer and review messages, the brand sources, the index, and the chrome.
`flights.ts`, `dashboard.ts`, and `habitat.ts` each hold one component and the surface that
names it. `tests/app.test.tsx` opens every screen and checks what it draws. One thing it
does not cover: the diagnostic for the missing `Rating` entry, because `A2UIRenderer`
reports diagnostics from an effect that can run before the first build fills them in, so
the pill picks it up only once something else re-renders the screen.

## Writing a component

Props arrive under their A2UI names, plus the two things only the engine can supply: an
`action` callback on nodes with an A2UI action, and `set<Prop>` for every prop bound to a
data-model path (`value` → `setValue`). A bound value arrives as whatever the data model
holds, so convert it (`String(props.text)`) before handing it to a builder that expects a
string. Stick to components, modifiers, and color names BindJS has on every platform and
the same source draws the iOS and Android apps too.

## What to read next

- [`examples/web/minimal`](../minimal/README.md) is the same loop with nothing overridden.
- [`examples/web/metabind`](../metabind/README.md) fetches the sources from a Metabind
  project instead of shipping them in the bundle.
- [Getting started](../../../docs/getting-started.md) walks through one override in your
  own app.
