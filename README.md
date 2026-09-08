# a2ui-bindjs

[![CI](https://github.com/metabindai/a2ui-bindjs/actions/workflows/ci.yml/badge.svg)](https://github.com/metabindai/a2ui-bindjs/actions/workflows/ci.yml)

An [A2UI](https://a2ui.org) (Agent-to-UI) renderer built on
[BindJS](https://docs.metabind.ai/bindjs/introduction), with native rendering across web,
Apple, and Android platforms using React, SwiftUI, and Jetpack Compose.

## Why BindJS

[BindJS](https://docs.metabind.ai/bindjs/introduction) lets you write a component once in
JavaScript and render it with React, SwiftUI or Jetpack Compose. It uses an API modeled on
SwiftUI, with a runtime that turns component definitions into a JSON AST for each platform
to render as native views. The same `defineComponent` source can produce a
`UISegmentedControl` on iOS and a `<select>` on the web.

This fits well with A2UI. A2UI describes components and binds them to data, leaving their
appearance to a catalog. With BindJS, that catalog can be shared across all three platforms.

- **One shared catalog.** The 18 components in `core/src/catalog/basic` power the web
  examples, SwiftUI app and Compose app in this repo. Changes to those components apply
  across all three.
- **Native rendering.** On Apple and Android platforms, components render through SwiftUI
  and Jetpack Compose, with native gestures, animations and typography.
- **A shared protocol engine.** The TypeScript interpreter bundles into a single
  dependency-free file, about 34 KB gzipped. Native apps embed it to handle parsing, data,
  functions and diffing without implementing the protocol themselves.
- **Catalog updates at runtime.** Hosts can fetch and register updated component
  definitions without an app release. `examples/web/metabind` loads a catalog from a
  Metabind project, while `examples/web/custom-catalog` shows how to override individual
  components.

## Protocol support

| Version | Support | Notes                                                         |
| ------- | ------- | ------------------------------------------------------------- |
| v1.0    | Full    | Rendered and validated against the vendored schemas           |
| v0.9.1  | Full    | Same components and functions, so one catalog answers to both |

### Messages

| Message                 | Direction        | Support                                                          |
| ----------------------- | ---------------- | ---------------------------------------------------------------- |
| `createSurface`         | agent → renderer | Web, iOS, Android                                                |
| `updateComponents`      | agent → renderer | Web, iOS, Android                                                |
| `updateDataModel`       | agent → renderer | Web, iOS, Android                                                |
| `deleteSurface`         | agent → renderer | Web, iOS, Android                                                |
| `callRendererFunction`  | agent → renderer | Parsed and dispatched as a store event for hosts to subscribe to |
| `agentFunctionResponse` | agent → renderer | Parsed and dispatched as a store event for hosts to subscribe to |
| `action`                | renderer → agent | Web, iOS, Android                                                |
| `error`                 | renderer → agent | Web, iOS, Android — opt-in, per `validate`                       |

### Basic catalog

| Components                                                                                                                                                                | Support           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `AudioPlayer` `Button` `Card` `CheckBox` `ChoicePicker` `Column` `DateTimeInput` `Divider` `Icon` `Image` `List` `Modal` `Row` `Tabs` `Text` `TextField` `Video` `Slider` | Web, iOS, Android |

### Functions

| Functions                                                                                                                                        | Support           |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| `and` `or` `not` `length` `required` `numeric` `email` `regex` `pluralize` `formatString` `formatNumber` `formatCurrency` `formatDate` `openUrl` | Web, iOS, Android |

### Conformance

| Suite                                              | Result                         |
| -------------------------------------------------- | ------------------------------ |
| Official conformance suite (`vendor/conformance/`) | 20 passed, 0 known gaps        |
| 43 official spec examples, v1.0                    | Rendered and schema-validated  |
| 43 official spec examples, v0.9                    | Rendered                       |
| Both example sets again on iOS and Android         | Decoded into native view trees |

## Installing

**React**

```sh
npm i @metabindai/a2ui-bindjs-react \
      @metabindai/bindjs-react @metabindai/bindjs-runtime \
      react react-dom styled-components
```

**iOS and macOS**

```swift
.package(url: "https://github.com/metabindai/a2ui-bindjs.git", from: "0.1.0")
```

then depend on the `A2UI` product.

**Android**

```kotlin
implementation("ai.metabind:a2ui-bindjs-android:0.1.0")
```

then see `android/README.md` for the repository configuration, which needs a token because
GitHub Packages requires authentication even to read.

## Layout

The top level splits by platform. `vendor/spec/` is the protocol itself.

| Path                  | Package                           | Role                                                                       |
| --------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| `vendor/spec/`        | —                                 | Verbatim A2UI v1.0 schemas and examples. Never edited; the build reads it. |
| `vendor/conformance/` | —                                 | The official A2UI conformance suite, vendored. `pnpm test` runs it.        |
| `core/`               | `@metabindai/a2ui-bindjs`         | Protocol, store, function library, rendering engine, catalog. No React.    |
| `react/`              | `@metabindai/a2ui-bindjs-react`   | `<A2UIRenderer />` and hooks, on the BindJS web renderer. Depends on core. |
| `ios/`                | `a2ui-bindjs-apple` (Swift)       | `A2UIHost` and `A2UISurfaceView`. Embeds core's renderer bundle.           |
| `android/`            | `ai.metabind:a2ui-bindjs-android` | `A2UIHost` and `A2UISurfaceView` on Compose. Embeds the same bundle.       |
| `examples/`           | private                           | Grouped by platform: `web/`, `ios/` and `android/`.                        |

Core is published and React consumes it as a package, so a host that renders natively — or
on a platform React never reaches — takes core alone.

## Examples

| Path                              | What it shows                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `examples/web/minimal`            | The smallest thing that renders a surface — about 40 lines, action round-trip included  |
| `examples/web/custom-catalog`     | Two components overridden — `sources` plus one catalog entry, no runtime needed         |
| `examples/web/metabind`           | Catalog components fetched from a Metabind project rather than bundled                  |
| `examples/web/mcp`                | A2UI over MCP: tools that answer with a UI instead of prose                             |
| `examples/web/playground`         | Monaco message-stream editor, scrubbable timeline, and the 43 official spec examples    |
| `examples/ios/minimal`            | The same protocol drawn in SwiftUI, sharing one BindJS runtime with the host            |
| `examples/ios/catalog`            | Every basic-catalog component on its own screen, each a real A2UI surface               |
| `examples/ios/custom-catalog`     | A component the app registers and the agent names — the web example's source, unchanged |
| `examples/android/minimal`        | The same surface again, message for message, on Jetpack Compose                         |
| `examples/android/catalog`        | The catalog screens on Compose, decoded through the sandbox                             |
| `examples/android/custom-catalog` | `useCatalog` on Android, sharing that same `Rating` source                              |

```sh
pnpm install
pnpm build                  # every package and example
pnpm test

pnpm dev:minimal            # :5182 — start here
pnpm dev:custom-catalog     # :5183
pnpm dev:metabind           # :5184
pnpm dev:mcp                # :5185 + MCP server on :8787
pnpm dev:playground         # :5181  (also `pnpm dev`)

pnpm dev:ios                # the minimal example on an iOS simulator
pnpm dev:ios:catalog        # every catalog component, on a simulator
pnpm dev:ios:custom-catalog # a component the app registers and the agent names
pnpm dev:ios:mac            # the minimal example as a macOS window

pnpm dev:android            # the same three, starting an emulator if none is running
pnpm dev:android:catalog
pnpm dev:android:custom-catalog
```

## Rendering a surface

### React

```tsx
import { useA2UIStore, A2UIRenderer } from '@metabindai/a2ui-bindjs-react'

const { store } = useA2UIStore(messages)

<A2UIRenderer store={store} onAction={sendToAgent} />
```

### iOS

```swift
import A2UI

let host = A2UIHost()
host.onAction = { action in … }
host.apply(messagesFromTheAgent)

A2UISurfaceView(host: host)
```

### Android

```kotlin
import ai.metabind.a2ui.A2UIHost
import ai.metabind.a2ui.A2UISurfaceView

val host = A2UIHost(context)
host.apply(messagesFromTheAgent)

host.actions.collect { action -> … }

A2UISurfaceView(host = host)
```

## License

Apache License 2.0.

## Pending Android package migration

See [Android migration instructions](android/PACKAGE_MIGRATION.md). The new
BindJS pin depends on a package cutover that is not complete.
