# BindJS for Apple

Native SwiftUI rendering engine for BindJS bundles on iOS, macOS, visionOS, watchOS, and tvOS.

BindJS lets server-authored components ship as a single compiled JavaScript bundle that describes a SwiftUI-shaped tree (VStack, Button, Image, AsyncImage, Charts, Model3D, and dozens more). This package runs that JS inside a sandboxed JSContext and renders the result as real native SwiftUI — no WebView, no HTML, no layout approximations.

It's used by [metabind-apple](https://github.com/metabindai/metabind-apple), the Metabind Apple SDK, to render Interactive Tool results, but works standalone against any BindJS bundle.

> [!TIP]
> BindJS powers [Metabind](https://metabind.ai) — the hosted platform for MCP Apps. Turn your app's UI and APIs into a governed agent that runs in your own app and across Claude, ChatGPT, and every MCP host. **[🚀 Start free at metabind.ai](https://metabind.ai)** · **[📖 Read the docs](https://docs.metabind.ai)**

## Documentation

The full BindJS reference lives on [docs.metabind.ai](https://docs.metabind.ai/bindjs/introduction):

- [Introduction](https://docs.metabind.ai/bindjs/introduction) — the runtime, AST, renderers, and modifier pipeline
- [Authoring](https://docs.metabind.ai/bindjs/authoring/components) — how the components this engine renders are written
- [Component catalog](https://docs.metabind.ai/bindjs/components/layout-stacks) and [modifier catalog](https://docs.metabind.ai/bindjs/modifiers/layout-frame-and-padding) — every component and modifier, entry by entry
- [iOS extensions](https://docs.metabind.ai/bindjs/components/ios-layout) — `NavigationStack`, `ToolbarItem`, `ContentUnavailableView`, and other components this engine adds beyond the shared catalog

## The BindJS repositories

| Repo | What it is |
|---|---|
| [`bindjs-runtime`](https://github.com/metabindai/bindjs-runtime) | The core runtime and React renderer: `@metabindai/bindjs-runtime` + `@metabindai/bindjs-react` |
| `bindjs-apple` — this repository | The SwiftUI rendering engine for iOS, macOS, visionOS, tvOS, and watchOS |
| [`bindjs-android`](https://github.com/metabindai/bindjs-android) | The Jetpack Compose rendering engine for Android |

One BindJS definition renders natively on all three surfaces. All three repos are Apache 2.0.

## Requirements

- Swift 5.11+
- iOS 17 / macOS 14 / visionOS 1 / tvOS 17 / watchOS 10

## Features

- **SwiftUI-shaped component tree** — VStack, Button, Image, AsyncImage, Model3D, and dozens more, rendered as real native SwiftUI
- **Modifier pipeline** — layout, appearance, typography, gestures, and animation modifiers applied SwiftUI-style
- **Swift Charts** — native `Chart` support for Tier 1 Cartesian charts (`BarMark`, `LineMark`, `AreaMark`, `PointMark`, y-value `RuleMark`) with axes, scales, legends, stacking, and chart accessibility; these APIs are why the package floors include tvOS 17 and watchOS 10
- **Sandboxed JS execution** — component code runs in a JSContext; the JS side only produces declarative directives
- **MCP host bridge** — the native side of BindJS's `useMCPHost()` contract, so components can call tools and talk back to the embedding app

## Key dependencies

- **JavaScriptCore** — JS execution (system framework)
- **SVGView** — SVG rendering
- **GLTFKit2** — 3D model rendering for `Model3D`

## Install

```swift
.package(url: "https://github.com/metabindai/bindjs-apple.git", from: "1.1.0"),
```

```swift
.target(name: "YourApp", dependencies: [
    .product(name: "BindJS", package: "bindjs-apple"),
])
```

## Quick start

```swift
import SwiftUI
import BindJS

struct ComponentView: View {
    let content: ResolvedContent   // compiled BindJS bundle
    let args: [String: Any]

    var body: some View {
        BindJSView(content: content, arguments: args)
    }
}
```

`BindJSView` evaluates the bundle, walks the component tree, and builds a native SwiftUI view graph. State, layout, animations, and gestures all run in SwiftUI — the JS side only produces declarative directives.

## The MCP host bridge (useMCPHost)

The `useMCPHost()` hook is core BindJS, defined in the shared runtime ([`bindjs-runtime`](https://github.com/metabindai/bindjs-runtime)); this engine ships the native side of the contract, the `MCPHostBridge` protocol. A BindJS component calls host capabilities at runtime:

```js
const host = useMCPHost()
if (host) {
    const { products } = await host.toolCall('search_products', { query })
    await host.sendMessage('Tell me more about this one')
    await host.updateModelContext({ selected: products[0] })
    const response = await host.elicit(
        { type: 'object', properties: { email: { type: 'string' } } },
        { title: 'Sign up' }
    )
}
```

To serve these calls, conform to `MCPHostBridge` and attach via `BindJSConfiguration`:

```swift
final class MyHost: MCPHostBridge {
    func toolCall(name: String, arguments: [String: Any]) async throws -> Any? {
        try await myServer.call(name, arguments)
    }
    func sendMessage(_ message: String) async throws { … }
    func updateModelContext(_ content: [String: Any]) async throws { … }
    func elicit(schema: [String: Any], metadata: [String: Any]?) async throws -> ElicitationResponse { … }
    func openLink(_ url: URL) async throws { … }
    func log(level: String, message: String, data: [String: Any]?) { … }
}

BindJSView(content: content, arguments: args)
    .bindJS(BindJSConfiguration(mcpHost: MyHost()))
```

The protocol mirrors the TS [`MCPHost` interface](https://github.com/modelcontextprotocol/ext-apps) used by web hosts (Claude Desktop, ChatGPT, VS Code, etc.), plus `elicit` — a native-only extension for request-input flows. Methods that don't apply on native (`sendRequest`, `sendNotification`, `sizeChanged`) have graceful no-op defaults, so components written against the web contract run unchanged.

For the full Metabind integration (conversation loop, tool rendering, agent proxy), see [metabind-apple](https://github.com/metabindai/metabind-apple).

## Logging

JS exceptions and `console.log` / `console.warn` / `console.error` calls from components are routed through `os.Logger`:

| Subsystem | Category | Contents |
|---|---|---|
| `BindJS` | `Runtime` | JS exceptions (with stack), component `console.log` output |

Tail with `log show --predicate 'subsystem == "BindJS"' --info --debug --last 5m`.

## License

Apache License 2.0. See [`LICENSE`](LICENSE).
