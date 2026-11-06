# CLAUDE.md

Guidance for AI agents contributing to this repo.

## What this is

An A2UI (Agent-to-UI protocol) renderer built on BindJS. The top level splits by platform:
`vendor/spec/` (the protocol, vendored verbatim), `core/` (`@metabindai/a2ui-bindjs` — protocol,
store, functions, engine, catalog), `react/` (`@metabindai/a2ui-bindjs-react`), `ios/` (Swift), `android/` (Kotlin), plus `examples/`. The metabind example calls the Metabind API directly from
`src/metabindApi.ts` — one query and one header did not justify a client library. The
prototype SDK that used to live here now sits beside the repo at `../metabind-sdk`,
undeployed; its `TODO.md` says what would have to happen first. It consumes the published `@metabindai/bindjs-runtime` and `@metabindai/bindjs-react` packages (sibling repo `../bindjs`); it does not modify them.

## Commands

```bash
pnpm install
pnpm build
pnpm test
```

## Protocol versions

Both v1.0 and v0.9 render. They declare the same components and functions — v1.0 only adds
properties — so the bundled catalog answers to both catalog ids. Pre-0.9.1 message names
(`beginRendering`, `surfaceUpdate`, `dataModelUpdate`) are still rejected: that is a
different vocabulary, not a version flag.

## The spec is the source of truth

`vendor/spec/v1_0/` is a verbatim copy of the A2UI v1.0 schemas and examples — never edit it.
`pnpm build` regenerates `src/engine/basicCatalog.generated.ts` from it, and
`tests/conformance.test.ts` runs all 43 example surfaces through the engine.

When adding or changing a catalog component, read its definition in
`vendor/spec/v1_0/catalogs/basic/catalog.json` first, and check that the body reads every
property it declares. A property the component never mentions is invisible: the engine
passes props through, so an agent setting it gets silence rather than a diagnostic. That is
how `DateTimeInput` came to read a `mode` prop that v1.0 does not define while ignoring
`enableDate`, `enableTime`, `min`, and `max`.

`weight` is the exception — it is declared on a child but read by its `Row` or `Column`
parent, which the engine hands `childWeights` because only the engine can see each child's
node. Guessing a component's shape is how Tabs
(`tabs: [{title, child}]`, not `children` + labels) and Modal (`trigger` / `content`, not
positional children) were shipped broken. Because the engine ignores child ids in
properties it does not know about, neither produced a diagnostic.

## Conformance

Two suites, both run by `pnpm test`:

- `core/tests/conformance.test.ts` — the 43 official v1.0 spec examples, each validated
  against the schemas and rendered through the catalog, plus the 43 v0.9 examples rendered
  (not validated: their schemas are not vendored).
- `android/packages/a2ui-bindjs-android/src/androidTest/…/SpecExamplesTest.kt` — the same
  43 examples again, but rendered through the sandbox into a decoded Compose tree. Node
  proves the engine; this proves the crossing. It needs a device.
- `core/tests/conformance.suite.test.ts` — the official language-agnostic YAML suite,
  vendored in `vendor/conformance/`. It stands at 20 passed, 0 gaps, 53 out of scope of 73
  cases; the out-of-scope ones are v0.8 payloads and agent-SDK catalog operations.
  `KNOWN_GAPS` is empty — anything added to it runs under `it.fails` so it stays counted,
  and `vendor/conformance/README.md` carries the reasoning.

Schema validation is **injected, not bundled**: `validateMessages(messages, { schema })`
takes an engine from the host, because core has no runtime dependencies. Core decides what
to validate and where the failure points; ajv (a devDependency) supplies the evaluation in
tests. Without an engine the structural checks still run.

`core/src/validation/` answers the structural question — dangling ids, self-reference,
cycles, reachability, malformed paths, depth — and is deliberately **not** part of
rendering. The engine degrades (an unresolvable child becomes a diagnostic and the rest of
the surface draws), which is what you want mid-stream; a host that would rather reject a
payload up front calls `validateMessages` instead. Two rules are easy to get wrong and are
covered by tests: a path may be **relative** inside a child template, and a component that
was referenced and later **replaced** is superseded, not orphaned.

Both renderers can report failures to the agent as A2UI `error` messages —
`<A2UIRenderer validate onError={…} />` on the web, `A2UINativeBridge` with
`{ validate: true }` plus `takeErrors()` natively. **Off by default, deliberately:** a
surface being streamed is legitimately incomplete part-way through — the official
`00_incremental` example has a dangling reference at message three of six that the fourth
resolves — so validating on every message would send the agent errors that are not true
yet. Turn it on where whole payloads arrive, or validate once the stream settles.

Neither `vendor/spec/` nor `vendor/conformance/` is ever edited — they are verbatim upstream copies.

## Catalog components

Run `pnpm validate:catalog` after editing one. It runs the Metabind CLI's structural
validator over every prebundled component and catches what neither TypeScript nor the
tests can see — a layout's props-form requiring a literal `Component[]`, for instance,
which is valid JavaScript, renders fine here, and is rejected on push. It skips cleanly
when the CLI is not installed.

Run `pnpm sync:native` and `pnpm sync:native:android` too. The renderer bundle each
native package ships is generated from these sources and committed, so editing one without
regenerating leaves that platform on the previous version — CI fails on exactly that. The
two bundles are byte-identical; only the file name differs, because `res/raw` names may
not contain a hyphen.

Two traps live at the boundary and neither shows up on the web:

- **`Infinity` has no JSON.** `JSON.stringify({ maxWidth: Infinity })` emits `null`, which
  the Kotlin side reads as a `Float` and throws on. BindJS ships `customJSONStringify`,
  which writes the string `"Infinity"` and decodes it back — every AST crossing to Android
  must go through it. Half the catalog carries `.frame({ maxWidth: Infinity })`, so this
  is every surface rather than an edge case.
- **A prop the native renderer never decodes is invisible**, the same way an undeclared
  catalog property is. `A2UICheckBox` drew as an unexplained switch on Android for exactly
  that reason: `ToggleComponentProps` had no `label` field, so Gson dropped it.

`src/catalog/basic/*.js` are real BindJS sources, edited on disk. `pnpm --filter @metabindai/a2ui-bindjs build:catalog`
(also run by `build` and `test`) inlines them into `src/catalog/basic/sources.generated.ts`
— generated, gitignored, never edited by hand.

Authoring rules:

- Prefer a **named control over a hand-drawn one** where BindJS has it. `ChoicePicker`
  builds single selection from `Picker` + `.pickerStyle`, so it arrives as a real
  `UISegmentedControl` on iOS and a `<select>` on the web, instead of styled `Button`s that
  look native on neither, and it produces a smaller AST.
- Props carry their **A2UI names**. The engine passes them through; it makes no
  presentation decisions, so anything about spacing, fonts, or color belongs here.
- The engine injects exactly two things: `action` (a function) on nodes with an A2UI
  action, and `set<Prop>` for each path-bound prop (`value` → `setValue`).
- **A component that calls `useState` needs no registration.** The engine memoizes
  subtrees by comparing the data model, and a stateful component's output can change
  without its A2UI inputs changing, so `src/engine/hookState.ts` observes
  `runtime.needsRerender` (which every hook setter calls) and invalidates the cache on
  each change. Nothing declares itself stateful; the old `STATEFUL_TYPES` list is gone.
- Components are stateless wherever the data model can own the value. Local `useState`
  is only for state A2UI has nowhere to put (`Modal.open`, `Tabs.selectedIndex` when
  unbound) — and those read `set<Prop>` first so a bound path still wins.
- `properties.defaultValue` is inspector metadata and is NOT applied at runtime. Apply
  defaults in the body, and beware boolean props: `!undefined` is `true`.
- Build each branch its own component instance; hanging two modifier stacks off one
  shared instance renders nothing on the web backend.
- **Only use color names BindJS knows**: `clear`, `red`, `orange`, `yellow`, `green`,
  `mint`, `teal`, `cyan`, `blue`, `indigo`, `purple`, `pink`, `brown`, `black`, `white`,
  `gray`, `primary`, `secondary`, `tertiary`, `quaternary`, `accent`, `background`, or a
  `#hex`. UIKit-style names like `secondarySystemBackground` or `label` are **not**
  valid: they do not throw, they produce no color, so a control silently stops
  reflecting its own state. `tests/colors.test.ts` checks every catalog source.

## Releasing

Two packages, versioned in lockstep: `core` and `react`. Everything under `examples/` is
`private: true` and never publishes.

Both publish with `access: public` — set in `publishConfig.access` in both manifests and by
the flag in `release.yml`. Keep the three in agreement: `--access` on publish changes an
existing package's visibility, so a stray `restricted` would make them private again. The
repository itself is still private, so `repository`, `homepage`, and `bugs` point at a URL
that 404s for anyone outside the org until it opens up.

Publishing prompts for a 2FA one-time password unless the token is an npm **automation**
token, which is what `NPM_TOKEN` should be so CI never has to ask.

1. Bump `version` in `core/package.json` and `react/package.json` to the same number, and
   `VERSION` in `core/src/index.ts` to match.
2. Commit, tag `v<version>`, push the tag. `.github/workflows/release.yml` refuses to
   publish if the tag and the manifests disagree.

`workflow_dispatch` on that workflow does a dry run by default — packs and validates
without publishing.

> [!IMPORTANT]
> Publish with `pnpm`, never `npm`. react depends on core through `workspace:^`, and only
> pnpm rewrites that into a real semver range on pack. Publishing with npm ships a dependency
> no consumer can resolve. The packaging job in `ci.yml` asserts the rewrite happened.

Both packages build on `prepack`, because `dist/` and `dist-bundle/` are generated and
gitignored — without it a clean checkout publishes nothing but a `package.json`.

`--provenance` is deliberately not enabled: npm only attests builds from public
repositories. Turn it on when this one becomes public.

## Rules

- `core/` must stay framework-agnostic and free of React imports. React lives in its own
  package, `react/`, which consumes core as a published dependency — so anything core
  needs to expose to it has to be exported from `core/src/index.ts`, not reached into.
- Applying a run of messages? Use `store.applyAll` or wrap them in `store.batch(fn)`, so
  listeners are notified once with the final shape instead of drawing every intermediate
  state. React hides this on the web by batching; the native hosts do not.
- The A2UI → BindJS translation should only emit components/modifiers that exist in the BindJS registry so surfaces stay portable to the native renderers.
- Do not start dev servers from an agent session; ask the user to run them.
- A green `build` does not mean the dev server works: Rollup resolves CommonJS at build
  time, Vite's dev server relies on the dep optimizer. `pnpm --filter @metabindai/a2ui-bindjs-playground test`
  mounts the real App in jsdom and catches that gap. The playground is
  `pnpm --filter @metabindai/a2ui-bindjs-playground dev` on `:5181`; it reads `core/dist` and `react/dist`, so
  `pnpm build` after library changes.

## The native examples

`examples/ios/minimal` is a SwiftUI app drawing an agent-authored surface. It depends on
`ios/packages/a2ui-bindjs-apple` — what would ship: `A2UIHost`, `A2UISurfaceView`, and the
renderer bundle as a resource. Nothing in it knows about the example. The root
`Package.swift` is that package's manifest, and it takes `bindjs-apple` by version: the two
`BindJSContext` members the library stands on (`javaScriptContext`,
`view(id:buildingAST:)`) shipped upstream in 1.2.0. `ios/packages/a2ui-bindjs-apple/README.md`
says why they are shaped that way rather than as an injected `JSContext`.

`pnpm sync:native` rebuilds `a2ui-native.js` into the
Apple package's resources, and regenerates `examples/ios/catalog`'s embedded copy of the 43
spec examples. It does **not** copy `BindJSRuntime.js`: the host already ships one, and
there must only be one — a `handlerId` resolves against the instance that stored it, and
hook state is keyed by path within that instance. `swift run A2UIMinimal --check` runs the
bridge headlessly, which distinguishes a broken bundle from a broken layout.

> [!IMPORTANT]
> A native host must subscribe to the store. Nothing else will make it redraw: a control
> writing back into the data model does not touch BindJS hook state (the model owns the
> value), so the runtime never marks itself dirty and `BindJSContext` publishes nothing.
> `a2ui.onChange(cb)` is the native equivalent of `useA2UIStore`'s `useSyncExternalStore`.
> Without it the store updates correctly and the screen keeps showing the tree it drew first.
> `swift run A2UIMinimal --check` steps 9 and 10 assert the whole chain.

### Android

`examples/android/minimal` is the same surface, message for message, on Compose. Its
Gradle build lives in `android/settings.gradle.kts` — one wrapper for the platform —
alongside `android/packages/a2ui-bindjs-android` (`A2UIHost`, `A2UISurfaceView`, and the
bundle as `res/raw/a2ui_native.js`). There is no vendored copy of `bindjs-android`: the
two members it needs are upstream, so it resolves the published artifact, `mavenLocal()`
first, with an `includeBuild` in the settings file to uncomment for local work.

The engine is the difference worth knowing. `bindjs-apple` embeds JavaScriptCore
in-process with real interop; `bindjs-android` runs `androidx.javascriptengine`, an
out-of-process sandbox where Kotlin sends a script and gets a string back, and nothing
else crosses. So:

- **Everything suspends**, and `A2UISurfaceView` holds its tree in state rather than
  building it in its body. The first render waits on the sandbox process starting and
  ~120 KB of bundle evaluating, which is what `placeholder` is for.
- **Actions are drained, not pushed.** Every way into the runtime is host-initiated, so a
  tap arrives as `A2UIHost.dispatch` and the queue is drained when it returns. The Apple
  side needs `onActions` because a tap there has no Swift frame beneath it.
- **The AST crosses as JSON through `customJSONStringify`**, never `JSON.stringify` — see
  the `Infinity` note under *Catalog components*.
- `JsRuntime.evaluate` and `JsRuntime.renderExternal` are the Android counterparts of
  `javaScriptContext` and `view(id:buildingAST:)`, and `renderExternal` exists for the
  same reason: it holds `willRender` and the build under one lock so this pass's hooks
  cannot bind to the last pass's paths.

`pnpm sync:native:android` rebuilds the bundle. `./gradlew :a2ui:connectedDebugAndroidTest`
from `android/` is the counterpart of `--check`, and has to run on a device:
`JavaScriptSandbox` is served by the system WebView, so Robolectric has nothing to shadow.

`examples/ios/minimal/A2UIMinimal.xcodeproj` is generated from `project.yml` by `xcodegen` and
checked in, so the example opens and runs without tooling; `a2ui-native.js` is committed
for the same reason. `swift run` builds the same sources as a macOS window.

One catalog component does not survive the trip: `Slider` has no native BindJS view. On
macOS only, `Button` picks up platform button chrome, because there is no `buttonStyle`
modifier — iOS draws it as intended.

## Overriding a catalog component

Two ways, and the short one is usually right. Pass `sources` (component name →
BindJS source) and a `catalog` pointing at it, and `<A2UIRenderer>` registers them on the
runtime it already owns — no `BindJSRuntime` to construct. Registration happens in a
`useMemo` during render, not an effect, so the first paint already has them, and it is
guarded by content rather than object identity so an inline literal does not re-register
every render and throw away memoized subtrees.

Pass a `runtime` instead only when you have other BindJS components to register, or several
renderers that should share hook state. `examples/web/custom-catalog` shows the short way;
`react/src/runtime.ts` still exports `createA2UIRuntime` for the long one.

Natively it is `host.useCatalog(sources:catalog:)` on iOS and `host.useCatalog(sources,
catalog)` on Android, before the first surface arrives. The bridge merges `catalog` over the
basic one, so a host names only the entries it adds or replaces. The same call adds a type
the basic catalog lacks — `examples/ios/custom-catalog`, `examples/android/custom-catalog`,
and the web example register a `Rating` from one shared source.

The Android examples (`examples/android/{minimal,catalog,custom-catalog}`) build from
`android/`, one Gradle wrapper for the platform. Their instrumented tests are the
counterpart of the iOS `--check` runs and need a device or emulator; CI compiles them and
nothing more. Locally, the Gradle wrapper needs a JDK: Android Studio's works,
`JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`.

## Rendering defaults

`<A2UIRenderer>` sets `colorScheme: 'light'` unless the host passes one. Left unset,
bindjs-react follows the viewer's _system_ preference, so an embedded surface would flip
to dark inside a host that is not — a surprise the host cannot see coming. Pass
`environment={{ colorScheme: undefined }}` to opt back into following the system.

### Host style reset

`<A2UIRenderer>` wraps its output in `.a2ui-surface` and injects a stylesheet once that
zeroes the browser's default margins on the HTML the renderer emits (`p`, headings, lists,
`pre`, `blockquote`). Without it a `<p>` from a Text adds ~32px between rows on top of
whatever the catalog set.

It is scoped to `.a2ui-surface` — a class this package owns — deliberately, **not** to
bindjs-react's `.rendererContainer`: styling another package's DOM would leak into every
renderer on the page. `resetHostStyles={false}` turns it off.

## Keep the core dependency-free

`core/src/` must not import anything external at all. The package ships a
single-file bundle for the native hosts (`pnpm build:bundle`), and the build fails if a
`node_modules` input appears or the output references `require` / `process` / `Buffer` /
`node:`. `@metabindai/bindjs-runtime` and `bindjs-react` are peer dependencies, not
dependencies — the host supplies the runtime, and the engine only talks to it through the
structural `BindJSRuntimeLike` interface.

## Code style: optimize for readability

Prettier (`pnpm format`) handles the mechanical part: 4-space indent, no semicolons, single quotes. On top of that:

- Every `if` / `else` / loop gets braces and its own lines. Never `if (x) return y` on one line.
- Blank line between logical steps inside a function, after guard clauses, and before `return`.
- Prefer several small named functions over one dense one; name the condition (`const inRange = …`) instead of inlining it.
- No nested ternaries. A single ternary is fine for a simple value pick.
- Group each file into sections with `// MARK: - Section` headers.
- Descriptive names over abbreviations (`surface`, `component`, `index` — not `s`, `c`, `i`).
