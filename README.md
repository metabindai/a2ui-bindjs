# a2ui-bindjs

[![CI](https://github.com/metabindai/a2ui-bindjs/actions/workflows/ci.yml/badge.svg)](https://github.com/metabindai/a2ui-bindjs/actions/workflows/ci.yml)

An [A2UI](https://a2ui.org) (Agent-to-UI) renderer built on [BindJS](https://docs.metabind.ai/bindjs/introduction).

Agents emit A2UI messages (`createSurface`, `updateComponents`, `updateDataModel`,
`deleteSurface`); this repo maintains the resulting surfaces and renders them — as a web
page through React, or natively through SwiftUI. The same messages drive both, because the
protocol names components and binds them to data, and each platform's catalog decides what
that looks like.

## Why BindJS

[BindJS](https://docs.metabind.ai/bindjs/introduction) is a declarative cross-platform UI
framework: one component definition rendering as React, SwiftUI and Jetpack Compose. A
component is written in JavaScript against a SwiftUI-shaped API; the runtime executes it and
emits a JSON AST, and each platform's renderer turns that AST into real native views — not a
web view. The same `defineComponent` source becomes a `UISegmentedControl` on iOS and a
`<select>` on the web.

That maps onto A2UI unusually well, because both halves of the problem are the same shape.
A2UI names a component and binds it to data; it says nothing about how the thing looks.
BindJS takes a component definition and produces the native equivalent. So the catalog — the
layer that decides what `Text`, `Card` and `ChoicePicker` actually are — can be written
**once** instead of once per rendering technology:

- **One catalog, every platform.** `core/src/catalog/basic` is 18 components of BindJS
  source. They draw the web examples and the SwiftUI app in this repo from the same files.
  Other A2UI renderers implement the basic catalog again for each target: the official
  Swift, Lit and React renderers each carry their own
  (`swift/swiftui/Sources/BasicCatalog`, `renderers/lit/src/v0_9/catalogs`,
  `renderers/react/src/v0_9/catalog`).
- **Native, not a web view.** An A2UI surface on iOS is SwiftUI: real gestures, real
  animation, real typography.
- **The engine travels with it.** The interpreter is TypeScript, bundled to a single
  dependency-free file, so a native host embeds ~25 KB gzipped and gets the whole protocol —
  parsing, the data model, the function library, diffing — rather than reimplementing it.
- **Catalogs can arrive at runtime.** Components are source, so a host can fetch a restyled
  catalog and register it without shipping an app update. `examples/web/metabind` pulls one
  from a Metabind project; `examples/web/custom-catalog` overrides two components inline.

## Installing

**React on the web.** The BindJS runtime and renderer are peer dependencies, so they are
installed alongside rather than bundled:

```sh
npm i @metabindai/a2ui-bindjs-react \
      @metabindai/bindjs-react @metabindai/bindjs-runtime \
      react react-dom styled-components
```

**Anywhere else in JavaScript** — an agent, a server, a host with its own renderer — take
core on its own. It has one peer dependency and no runtime dependencies:

```sh
npm i @metabindai/a2ui-bindjs @metabindai/bindjs-runtime
```

**iOS and macOS**, through SwiftPM:

```swift
.package(url: "https://github.com/metabindai/a2ui-bindjs.git", from: "0.1.0")
```

then depend on the `A2UI` product. It brings the renderer with it as a resource, so no
JavaScript toolchain is involved in building an app.

**Another native platform.** `dist-bundle/a2ui-native.js` inside the core package is the
whole engine as one dependency-free file, for any host that can embed a JavaScript context.
`ios/` is the worked example of driving it.

## Layout

The top level splits by platform. `vendor/spec/` is the protocol itself.

| Path                  | Package                         | Role                                                                       |
| --------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| `vendor/spec/`        | —                               | Verbatim A2UI v1.0 schemas and examples. Never edited; the build reads it. |
| `vendor/conformance/` | —                               | The official A2UI conformance suite, vendored. `pnpm test` runs it.        |
| `core/`               | `@metabindai/a2ui-bindjs`       | Protocol, store, function library, rendering engine, catalog. No React.    |
| `react/`              | `@metabindai/a2ui-bindjs-react` | `<A2UIRenderer />` and hooks, on the BindJS web renderer. Depends on core. |
| `ios/`                | `a2ui-bindjs-apple` (Swift)     | `A2UIHost` and `A2UISurfaceView`. Embeds core's renderer bundle.           |
| `android/`            | —                               | Coming soon.                                                               |
| `examples/`           | private                         | Grouped by platform: `web/` and `ios/`.                                    |

Core is published and React consumes it as a package, so a host that renders natively — or
on a platform React never reaches — takes core alone.

## Examples

| Path                          | What it shows                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `examples/web/minimal`        | The smallest thing that renders a surface — about 40 lines, action round-trip included |
| `examples/web/custom-catalog` | Two components overridden — `sources` plus one catalog entry, no runtime needed        |
| `examples/web/metabind`       | Catalog components fetched from a Metabind project rather than bundled                 |
| `examples/web/mcp`            | A2UI over MCP: tools that answer with a UI instead of prose                            |
| `examples/web/playground`     | Monaco message-stream editor, scrubbable timeline, and the 43 official spec examples   |
| `examples/ios/minimal`        | The same protocol drawn in SwiftUI, sharing one BindJS runtime with the host           |

```sh
pnpm install
pnpm build                  # every package and example
pnpm test

pnpm dev:minimal            # :5182 — start here
pnpm dev:custom-catalog     # :5183
pnpm dev:metabind           # :5184
pnpm dev:mcp                # :5185 + MCP server on :8787
pnpm dev:playground         # :5181  (also `pnpm dev`)

pnpm build:bundle           # single-file builds for the native hosts
pnpm run:ios                # sync the JS and run the Swift example
```

Each `dev:*` script rebuilds the libraries first, because the examples read `dist/` rather
than source.

## Rendering a surface

```tsx
import { useA2UIStore, A2UIRenderer } from '@metabindai/a2ui-bindjs-react'

const { store } = useA2UIStore(messages)

<A2UIRenderer store={store} onAction={sendToAgent} />
```

The store is yours to own — it holds every surface on the connection, so the transport
applies messages to it and several renderers can read from it. Everything else (the BindJS
runtime, the basic catalog, which surface to draw) has a default.

On iOS the shape is the same:

```swift
import A2UI

let host = A2UIHost()
host.onAction = { action in … }
host.apply(messagesFromTheAgent)

A2UISurfaceView(host: host)
```

`ios/README.md` covers what a native host has to get right.

## License

Apache License 2.0.
