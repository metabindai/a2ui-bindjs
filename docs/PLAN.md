# A2UI renderer on BindJS — build plan

> **Historical.** This is the plan the project was built to, kept for the reasoning behind
> decisions rather than as a description of what exists now. `README.md` says what the
> project is; `CLAUDE.md` carries the rules that still apply. Where this file and the code
> disagree, the code is right.

Status: draft v10 (2026-08-28) — phases 1–5 done; v1.0 and v0.9 both render. Target: **A2UI v1.0** (candidate; v0.9.1 is the current stable — v1.0 is a superset in practice, so we target 1.0 message names and reject 0.9 messages with a clear error).

## Core idea

The A2UI catalog is **not** hard-coded mapping logic. It is a set of ordinary BindJS
components registered with a `BindJSRuntime`. Rendering an A2UI surface = a shipped
BindJS "engine" component walking the surface tree and invoking, by name, whichever
BindJS component is registered for each A2UI component type.

Swapping the presentation of A2UI is therefore just registering a different set of
BindJS components (or overriding a few) — no renderer code changes, and the result
is a normal BindJS AST that `bindjs-react`, `bindjs-apple`, and `bindjs-android` can
all render.

```
A2UI messages ──► SurfaceStore (pure TS)  ──► <Renderer componentName="A2UISurface" props={surface}/>
                                                       │
                                        A2UISurface (BindJS, shipped by us)
                                        walks components[], resolves bindings,
                                        calls  A2UI.<catalog>.<Component>(props, children)
                                                       │
                                  ┌────────────────────┴────────────────────┐
                        default catalog (BindJS src)             custom catalog (BindJS src)
                        Text → Markdown / Text                   Text → your own component
                        Row  → HStack,  Column → VStack          …
```

## Package layout (`core/`, `react/`)

```
src/
  protocol/     A2UI v1.0 TS types (messages, components, DynamicValue, catalog schema),
                parse + validate (v0.9 messages rejected with a hint). No React.
  store/        SurfaceStore: applies createSurface / updateComponents / updateDataModel /
                deleteSurface; JSON-pointer data model (RFC 6901) with relative-path scopes
                for templates; setValue(path) for two-way inputs. Pure, unit-tested.
  functions/    standard function library (@index, required, regex, length, numeric, email,
                formatString, formatNumber, formatCurrency, formatDate, pluralize, openUrl,
                and, or, not) + registry for custom renderer functions.
  engine/       Host-side (TS) tree walker. A BindJS body cannot dispatch to a component by a
                runtime-chosen name, so the engine lives outside BindJS: it walks the surface
                from `root`, resolves DynamicValues in scope, and builds the AST directly via
                `runtime.callComponent(catalogName, props, children)`. Callbacks registered on
                the runtime for the catalog components to use:
                  A2UI_setValue(path, value)  → store write (TextField/CheckBox/…)
                  A2UI_action(name, context)  → onAction → agent
  catalog/      Naming + registration: registerCatalog(runtime, catalogId, { Text: src, … }).
                Components registered as  `A2UI_<catalogKey>_<Component>`.
  catalog/basic/  Default implementation of the v1.0 basic catalog, one BindJS source file
                per component (Text, Image, Icon, Video, AudioPlayer, Row, Column, List,
                Card, Tabs, Divider, Modal, Button, CheckBox, TextField, DateTimeInput,
                ChoicePicker, Slider).
  react/        <A2UIRenderer runtime? messages | store onAction onCallAgentFunction />
                + useA2UISurfaces(stream) hook. Only place React is imported.
tests/          store, functions, engine (AST snapshot per fixture), catalog registration.
tests/fixtures/ sample A2UI message streams from the spec / a2ui-project examples.
```

## Phases

1. **protocol + store** ✅ — types, parser, SurfaceStore with full message semantics
   (upsert, `null` deletes, template children, `root` requirement, catalog resolution
   component → surface default → error). Fixtures + unit tests. _No BindJS yet._
2. **functions** ✅ — `src/functions`: `FunctionRegistry` (caller-boundary enforcement:
   `rendererOnly` / `agentOnly` / `rendererOrAgent` → `INVALID_FUNCTION_CALL`), the v1.0
   standard set split by role (`standard/format|validation|logic|system.ts`), and
   `resolve.ts` turning any `DynamicValue` into plain JSON. Args resolve before invocation,
   so implementations only see plain JSON — and `and` / `or` therefore do not short-circuit.
3. **engine** ✅ — `src/engine`: `renderSurface({ runtime, surface, catalog, … })` walks from
   `root`, resolves props in scope, and calls the catalog component via
   `runtime.callComponent(name, props, children, false)`. Template children emit a lazy
   BindJS `ForEach`. The engine injects exactly two things a component cannot derive itself:
   an `action` callback, a `set<Prop>` writer for every path-bound prop, and `childWeights`
   so a Row / Column can honour its children's `weight`. Everything else is passed under
   its own A2UI name. Child slots come from the catalog, so `Modal` receives built
   `trigger` / `content` components and `Tabs` receives `tabs: [{ title, child }]`. Best-effort: bad nodes become diagnostics, never throws.
   Tested against the real runtime, including invoking a stored ForEach row callback.
4. **basic catalog** ✅ — `src/catalog/basic/*.js`: all 18 v1.0 basic components, authored
   as real BindJS sources on disk (`export default defineComponent(...)`, the format the
   Metabind CLI stores), bundled into `sources.generated.ts` by `scripts/build-catalog.mjs`
   so they register in Node, the browser and native without filesystem access.
   `registerCatalog(runtime)` registers them and returns the map for `renderSurface`.
   Written fresh rather than ported: under a TS engine the components lose all the
   interpreter plumbing (`contextJson`, `actionName`, `editSeq`, `useStore`, `useMCPHost`)
   and take `action` / `setValue` callbacks instead. Every one is tested through the real
   runtime, asserting a non-null AST and no logged errors.
5. **react** ✅ — its own package, `react/`, published as `@metabindai/a2ui-bindjs-react`
   and consuming core as a dependency, so React stays out of core entirely. `<A2UIRenderer runtime store surfaceId … />` passes the engine as a
   callback to `<Renderer ast={…}>`, which invokes it inside its own render pass after
   `willRender()` — so catalog components using runtime hooks get a correct hook context.
   `useSurface` subscribes via `useSyncExternalStore`; two-way writes default to writing
   back into the store. Verified in jsdom: bindings paint, template rows paint, a
   `updateDataModel` repaints, and a button click dispatches a resolved action.
   Still to wire: `callAgentFunction` / `callRendererFunction` round-trips.
6. **playground** (`examples/playground`) ✅ for protocol work — Monaco message-stream
   editor on the left; a timeline scrubber applies messages one at a time; Surfaces tab
   shows store state with a raw / resolved toggle, Events tab shows per-message
   applied / rejected status. Render tab is a placeholder until phases 3–4 land.
   The Render tab runs a **live session**: the editor stream seeds a store, and the
   Send composer applies further messages to it in place — no replay, so text typed
   into a rendered input survives an update, which is how an agent actually drives a
   surface. Editing the editor reseeds and replays sent messages on top.
   The left pane switches between **Stream** (author the whole message stream),
   **Send update** (push one message into the live session), and **Data model** (edit
   the live model directly; applying is just an `updateDataModel`, so it lands in the
   sent log like anything else). Live model changes flow into that editor unless it has
   unsaved edits, so typing there never fights writes coming from a rendered input.
   **Reset session** (top bar) rebuilds from the authored stream, discarding sent
   messages; it also bumps an epoch used as the renderer's React key, so component-local
   state — an open Modal, a selected tab, typed input — is cleared too.
   The sample picker carries the 43 official spec examples alongside the hand-written
   probes, read straight from `spec` — the same corpus the conformance
   suite renders, so the playground exercises real agent output rather than fixtures
   written to match our own assumptions.
   Still to add there: live catalog source editing.

## Decisions

- **Minimal translation, maximum reuse.** Resolved A2UI properties are passed to the
  catalog component _as-is_ (same names: `text`, `label`, `value`, `variant`…); the
  catalog component is the only place a decision like padding/font is made. The
  engine does no per-component mapping.
- **Performance.** Store snapshots are immutable with structural sharing; each surface
  carries a `version` so renderers only re-evaluate surfaces that changed. The engine
  should memoise resolved subtrees by (component, scope, dataModel identity) once the
  basic path works — measure first.
- **Catalog = BindJS components, engine = host-side walker.** Custom
  presentations = different registered sources. A custom catalog can be partial;
  unresolved names fall back to the basic catalog, then to `Unsupported`.
- **Data model + functions live host-side (TS), not in BindJS state.** The engine
  receives an already-resolvable surface snapshot via `props`; inputs write back via
  callback. Keeps the store portable (same code drives native hosts later) and keeps
  BindJS components dumb/presentational.
- **Naming:** `A2UI_<catalogKey>_<Component>`; `catalogKey` derived from `catalogId`
  (basic catalog key = `basic`). Sanitised to what `runtime.sanitizeName` accepts.
- Depend on published `@metabindai/bindjs-runtime` / `bindjs-react`; never fork them.
  If a core primitive is missing (e.g. AudioPlayer), land it upstream in `../bindjs`.

## Runtime facts (verified by spike, 2026-08-27)

- **Structured props work.** `runtime.callComponent(name, props, children, false)` passes objects,
  arrays and functions through to the body intact. Props do NOT have to be inspector-typed
  scalars — that constraint only applies to Composer authoring. So no `contextJson` strings.
- **Callbacks work under any prop name.** A body receives raw functions; handing one to a
  built-in (`Button(label, action)`) stores it and emits a `handlerId` in the AST.
  `processProps` only rewrites `on*` / `set*` functions that pass straight through to the AST.
- **ForEach is genuinely just-in-time.** With the default `expandForEach: false`,
  `ForEach(data, (item, i) => …)` invokes the callback **zero** times at build and emits
  `{ dataId, functionId, count, environmentId }`. Rows are built on demand by the renderer,
  so a 500-row list costs one AST node — this is how template children must be emitted.

## The spec is vendored, not guessed

`vendor/spec/v1_0/` holds the official A2UI v1.0 JSON Schemas and 43 example
surfaces, copied verbatim from `@a2ui/web_core@0.10.6` (Apache-2.0). They are the source
of truth for two generated artefacts and the whole conformance suite:

- `scripts/build-catalog-slots.mjs` derives **which properties hold child references**
  per component type. That list is not uniform — `Row.children` is a list, `Card.child`
  a single id, `Modal` uses `trigger` / `content`, `Tabs` nests ids under `tabs[].child`
  — and hand-writing it is exactly how the first pass shipped a broken Tabs and Modal.
- `tests/conformance.test.ts` validates every example against the official schema with
  ajv (a devDependency only — the runtime stays dependency-free), then renders each one
  through the real catalog asserting no diagnostics and no runtime errors.

We deliberately did **not** adopt `@a2ui/web_core`'s runtime (`DataModel`, `SurfaceModel`,
`message-processor`, `function_invoker`). It ships code for v0.8 / v0.9 only — the v1.0
directory is schemas alone — and it is built on `@preact/signals-core`, whose reactive
model conflicts with our immutable snapshots (chosen so the engine can skip unchanged
surfaces and the same store can drive native hosts). Its function set matches ours
exactly, which the conformance suite now asserts.

## Prior art

The `A2UIRenderer` Metabind project holds an LLM-generated proof of concept: `A2UIRender`,
a ~1,570-line BindJS component that folds the envelope stream and renders it in-runtime.
It works, and its catalog table (A2UI type → `{ render, props }`) is a sound dispatch pattern.
We are not extending it: the interpreter moves to TypeScript (this package), compiled and
shipped inside the native runtimes. Its 18 basic-catalog components are the starting point
for our catalog, minus the scalarized props (`contextJson`, `actionName`, `editSeq`) that
only existed because a BindJS-hosted interpreter could not pass structure.

## Gotchas found while wiring the renderer

- `<Renderer>` gates content on `hasSized` — a width from `useMeasure`'s ResizeObserver.
  Under jsdom (or any non-browser host) a ResizeObserver that never reports leaves the
  container permanently empty. `tests/setup.dom.ts` reports a viewport-sized box.
- The published `@metabindai/bindjs-react@1.0.5` `dist/` uses **extensionless relative
  imports**, which Node's ESM resolver rejects — bundlers paper over it, Node does not.
  Vitest works around it with `server.deps.inline`, but this is a real packaging bug in
  bindjs-react worth fixing upstream: it blocks SSR and any Node-side import.
- **Do not `optimizeDeps.exclude` bindjs-react / bindjs-runtime outside the bindjs
  monorepo.** There they are workspace links; here they are npm packages whose tree
  contains CommonJS modules (`fast-deep-equal`). Excluding them skips Vite's dep
  optimizer, so those CJS modules are served raw and fail to link with "does not
  provide an export named 'default'" — a blank page in dev while `build` stays green,
  because Rollup resolves CJS at build time. Exclude only the workspace package.
- Format functions follow the **host** locale unless `locale` is passed. Node here
  formats USD as `USD 129.00`, not `$129.00`. Embedding apps should always set it.

## Incremental updates — where we actually are (measured 2026-08-27)

Pushing many `updateDataModel` / `updateComponents` messages at a live surface is
**correct and non-destructive today, but not yet cheap**:

- **Redundant messages — collapsed, but only if they arrive together.** The store keeps a
  snapshot per message; it does not look ahead. Measured with two `updateComponents` that
  supersede each other: applied in one tick they cost **2** `callComponent` calls (one
  render of the final shape), applied in separate ticks **4** — the intermediate state is
  drawn and immediately replaced. On the web React's batching provides the collapsing;
  nothing does on native, so `SurfaceStore.batch(fn)` notifies once for a run of messages
  and `applyAll` uses it. A stream reader should wrap each chunk in `batch`.
- **Store layer — incremental.** A data write copies only the objects along the touched
  JSON Pointer; untouched branches, arrays and the component map keep their identity.
  Cost is proportional to the depth of the change, not the size of the surface.
- **State layer — no thrash.** A rebuild is not a reset. Runtime hook state survives, so
  an open Modal stays open and a selected tab stays selected while bound text repaints
  around it (`tests/incremental.test.tsx`). React reconciles the DOM, so nothing remounts.
- **Engine layer — incremental.** `RenderSession` memoises subtrees across renders. A
  20-item list rebuilds **2 nodes and reuses 19** when one bound value changes, and
  reuses the whole tree when nothing does. `renderSurface()` still exists for one-shot
  rendering; `<A2UIRenderer>` holds a session per mount.

The immutable snapshots are what make closing that gap tractable rather than a rewrite:
`before.components.get(id) === after.components.get(id)` identifies which component
definitions changed, and `getAt(before, path) === getAt(after, path)` — cheap because of
structural sharing — identifies which data a node read actually changed. Recording the
paths each node reads during resolution would let the engine rebuild only affected
subtrees. ### How memoisation works — built 2026-08-27

A node is reused when its definition object is unchanged, every data path it read still
holds the same value (identity, cheap thanks to structural sharing), and all its children
are reusable. Reads are recorded during resolution via `ResolveContext.onRead`. Cached
subtrees are the **unwrapped** AST, harvested after the render by walking for a
`__a2uiKey` prop the engine stamps on every component it builds.

Three things that were not obvious and are each pinned by a test:

- **Stateful components can never be memoised.** `Modal` and `Tabs` hold their own
  `useState`, so their output changes with no A2UI input changing; a cached subtree
  would freeze them. `CatalogEntry.stateful` marks them, and because their parent then
  has a child with no cache entry, the parent correctly rebuilds too.
- **A cached subtree cannot be handed to a prop as a bare AST object.** BindJS builders
  overload on `typeof arg === 'object'` — `Button(label, action)` reads an object first
  argument as `{ action, label }` — so a spliced object is misread and the component
  throws. Reused subtrees go back through `runtime.makeComponent()` to restore the
  function form and modifier chaining.
- **The harvest walk needs a seen-set.** Reused subtrees are shared objects appearing in
  several places; walking without one re-walks them exponentially and overflows the
  stack after enough render cycles.

### Why it is safe — verified against the runtime, 2026-08-27

We do **not** need to manage hook indices ourselves. The runtime keys hook storage by an
absolute path string (`componentHookStore['VStack_0.Leaf_1']`) in a store that persists
across renders and is never cleared per render — `willRender()` resets only the cursor,
and `resetStorage()` deliberately leaves `storedFunctions` alone. Skipping a component
therefore leaves its state untouched; there is nothing to save and restore.

The splice works because `processChildren` invokes a child only when it is a function:
a plain AST object is passed through as-is. So a cached, already-unwrapped subtree can be
handed to a parent and its body never runs. Measured directly: rebuilding one sibling
while splicing the other's cached AST produced **0 body calls** for the cached one, and
when it was later rebuilt normally its `useState` value was still intact.

Note that `callComponent` itself is cheap — it returns a lazy proxy. The cost is body
invocation during unwrap, so the cache must hold the **unwrapped AST**, not the proxy.

Two constraints:

1. **Sibling positions must be stable.** A component's hook path uses its index among its
   siblings (`processChildren` sets `childIndex = index`), so removing a child shifts every
   later sibling onto the previous one's stored state. Confirmed experimentally: dropping
   the first of three children made the second render with the first's hook value. The
   engine now substitutes a placeholder for a child that fails to build rather than
   dropping it.
2. **Invalidation must cover everything the body read** — resolved props, children, and the
   component definition. Missing one serves a stale subtree.

## Shipping to the native hosts

`pnpm build:bundle` produces `dist-bundle/a2ui.js` and `a2ui.min.js` — a single IIFE
exposing one `A2UI` global, the same shape `bindjs-runtime` ships as
`dist-runtime/runtime.js` for the native engines to embed.

- **55 KB minified, 15 KB gzipped** for the whole thing: protocol, store, functions,
  engine and the 18 basic-catalog component sources. Roughly half of that is the catalog
  carried as source strings; the engine and store alone are 7.7 KB gzipped. For scale,
  `bindjs-runtime`'s own bundle is 27 KB gzipped.
- **No runtime dependencies.** Nothing under `core/src/` imports anything external at all;
  React lives in a separate package, so the bundle has nothing to exclude. The build fails if a `node_modules` input ever
  appears, or if the output references `require`, `process`, `Buffer`, `__dirname` or a
  `node:` import.
- Built for `es2020` so ES2022 private fields are downlevelled — older Hermes on Android
  does not support them. Costs about 700 bytes gzipped.
- `tests/bundle.test.ts` evaluates the bundle in a `vm` context seeded with nothing but
  ECMAScript built-ins, then drives a full render and a memoised re-render through it.

**The one portability risk is `Intl`**, used by `formatNumber`, `formatCurrency`,
`formatDate` and `pluralize`. JavaScriptCore has it; Hermes frequently ships without it
unless built with it enabled. If that turns out to be the case, those four
implementations need a non-`Intl` fallback behind a capability check — nothing else in
the bundle touches it.

Note one coupling: the engine harvests cached subtrees by finding `ComponentCall` nodes
carrying its `__a2uiKey` prop. A host whose AST is shaped differently still renders
correctly but silently gets no memoisation.

## v0.9 is supported, and cost almost nothing

Measured rather than assumed: v0.9 and v1.0 declare **the same 18 components and the same
14 functions**. v1.0 only _adds_ properties — `weight` on every component, plus
`Slider.steps`, `TextField.placeholder`, `Video.posterUrl` — and drops
`TextField.validationRegexp`. The four agent→renderer message names are identical;
v1.0 adds the function-call messages on top.

So a v0.9 surface is a subset of what this renderer already draws. The only thing that
actually blocked it was strict catalog resolution rejecting the v0.9 catalog id, so the
bundled catalog now answers to both ids (`BASIC_CATALOG_IDS`), and `defaultCatalogId`
accepts a list. Unknown catalogs are still refused.

`tests/version.test.ts` runs the official `a2ui-over-mcp-recipe` sample — a real v0.9
payload, unmodified — through parse, store and render.

What is _not_ supported is pre-0.9.1 naming (`beginRendering`, `surfaceUpdate`,
`dataModelUpdate`), which is a genuinely different message vocabulary rather than a
version flag; those still fail with a pointed error.

## Knowing the catalog ahead of time

A2UI requires it. Catalogs are JSON Schema documents identified by `catalogId`; a renderer
advertises `supportedCatalogIds`, and v1.0 resolution is strict — component-level
`catalogId`, then the surface default, then an error, with no fallback. An agent cannot
invent a component type and expect it drawn. So the constraint is the protocol's, not
ours, and it is what makes agent output predictable.

Our sharp edges on top of that, all now guarded:

- A catalog entry naming a BindJS component nobody registered used to render as a silent
  `null` — `callComponent` does not complain. The engine now reports
  `UNREGISTERED_COMPONENT` when the runtime exposes its component registry.
- `STATEFUL_TYPES` in `src/engine/catalog.ts` is the one part of the catalog **not**
  generated from the spec, because statefulness is a property of our BindJS
  implementations. Forgetting to list a component that uses `useState` means memoisation
  freezes it.
- The `A2UI<Type>` naming is a convention, not a rule. `Catalog` is a plain map, so a host
  can point any A2UI type at any registered component — which is the extension point:
  restyling means registering different BindJS and changing one entry.

## The React entry point's contract

`<A2UIRenderer store={store} />` is the whole minimum — no runtime to construct, no
catalog to register, no surface to name.

- **`store` stays required and external.** It is connection state, not view state:
  A2UI is multi-surface, so two renderers share one store; the transport applies messages
  as they arrive; the action round-trip closes outside React; and the same store drives
  the native hosts with no React at all.
- **`runtime` is optional.** Omitted, one is created for the life of the component.
  Passed, it is used as-is — but the renderer fills in any catalog components it is
  missing, so bringing your own runtime does not mean remembering `registerCatalog`.
  Filling never overwrites: register your own `A2UIText` and yours is what renders.
- **`surfaceId` is optional**, defaulting to the store's first surface and following it as
  surfaces come and go.
- **Browser defaults are neutralised.** The output is real HTML, so a `<p>` from a Text
  would carry the user-agent's 1em margin. `<A2UIRenderer>` wraps the surface in
  `.a2ui-surface` and injects a scoped reset once per document — scoped to our own class
  rather than bindjs-react's `.rendererContainer`, so it cannot affect other renderers.
  Opt out with `resetHostStyles={false}`.
- **`colorScheme` defaults to `light`.** bindjs-react otherwise follows the viewer's system
  preference, which would render an embedded surface dark inside a light host. A host can
  still pass `'dark'`, or `undefined` to follow the system deliberately.

One bug that fell out of testing the default: `<Renderer>` re-evaluates on its `version`
prop, and versions are per-surface — switching between two surfaces both at version 1
showed a stale tree. The prop is now `surfaceId:version`.

## Examples

- `examples/minimal` — a store, a message list, `<A2UIRenderer store={store} />`, and an
  `onAction` handler that answers by applying another message. The whole agent loop in
  about 40 lines, with nothing to configure.
- `examples/custom-catalog` — the same surface rendered twice, once with the built-in
  catalog and once with `Text` and `Button` swapped for BindJS components written inline
  as source strings. Shows that a catalog is a plain map, that only overridden components
  need registering, and that the renderer fills the rest in without replacing them.
- `examples/playground` — the development surface: message editor, timeline scrubber,
  live session with sent updates, and the 43 spec examples.

Each example carries a jsdom smoke test. They are documentation, and untested
documentation rots — the playground's own tests have already caught two real bugs.

## Known upstream gap: Renderer clipping

`bindjs-react`'s `<Renderer>` hard-codes `overflow: hidden` and `height: 100%` on its
container, and exposes no prop for either — `fullHeight` only switches the height between
`100%` and `auto`. A surface taller than its box is therefore clipped with no way to opt
out from props.

Worked around for now with a CSS override on the container's stable
`.rendererContainer` class: scoped inside the render pane in the playground, global in
the two examples. Both are marked TEMPORARY in place.

The real fix is upstream, in the repo we own: give `Renderer` an `overflow` prop
defaulting to `'hidden'`, threaded to the container the way `$fullHeight` already is.
`<A2UIRenderer>` currently forwards a fixed set of props, so it should widen to pass the
presentation ones (`fullHeight`, `overflow`) rather than growing one at a time. Note we
consume the published `@metabindai/bindjs-react`, so the change only lands here once it
is published.

## Validating the shipped catalog

Three layers, because each catches something the others cannot:

- `pnpm validate:catalog` — the Metabind CLI's structural validator over all 18
  prebundled components. It found `VStack(props, caption.concat(...))`: valid JavaScript
  that renders correctly, but the props-form of a layout is strict about receiving a
  literal `Component[]`, so it would be rejected on push.
- `tests/colors.test.ts` — every `Color(...)` literal against BindJS's named set.
- The jsdom tests — that a control's painted state actually _changes_, which is the only
  place an invalid colour shows up at all.

## Colour names are a silent failure mode

BindJS accepts a fixed set of named colours (`primary`, `secondary`, `tertiary`,
`quaternary`, `accent`, `background`, the basic hues) or a `#hex`. An unknown name — a
UIKit-ism like `secondarySystemBackground` or `label` — does **not** throw. It produces no
colour at all, which looks like a control that never changes state: the selected chip
keeps its highlight and the new one gains one, so everything appears "stuck on".

Nothing else catches this. The AST is well formed, there are no diagnostics, no console
errors, and the store is correct. Two tests now cover it: `tests/colors.test.ts` checks
every `Color(...)` literal in the catalog against the valid set, and a jsdom test asserts
a selection actually _moves_ rather than merely arriving.

## Open questions

- `Modal` and `Tabs` state ownership: host-side (data model) vs BindJS `useState`.
- How catalog `instructions` / JSON schema should be exported for agent prompting
  (probably `catalog.schema.json` generated from the registered components' `properties`).
