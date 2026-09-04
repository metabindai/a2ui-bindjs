# `a2ui-bindjs-apple`

A2UI surfaces, rendered natively through BindJS. Two public types:

```swift
import A2UI

let host = A2UIHost()                      // or A2UIHost(context: myExistingContext)
host.onAction = { action in … }            // the agent's half of the conversation
host.apply(messagesFromTheAgent)           // JSON, one message or an array

A2UISurfaceView(host: host)                // in a SwiftUI body
```

That is the whole surface area. `setValue`, `reset`, `surfaceIds`, `diagnostics` and
`useCatalog` round it out; nothing else needs to be public.

## Your own components

```swift
host.useCatalog(
    sources: ["Rating": ratingSource, "BrandButton": buttonSource],   // BindJS name → source
    catalog: ["Rating": "Rating", "Button": "BrandButton"]            // A2UI type → BindJS name
)
```

Call it before the first surface arrives. `catalog` is merged over the basic catalog, so
name only what you are adding or replacing — the rest still comes from the bundle. The
sources are the same strings the web renderer takes as `sources`, so one component
restyles both; `examples/ios/custom-catalog` and `examples/web/custom-catalog` share
theirs verbatim.

## Where the manifest is

At the repository root. SwiftPM resolves a package by the manifest at the root of the repo,
so `Package.swift` there declares this library and points its target at `Sources/A2UI`:

```swift
.package(url: "https://github.com/metabindai/a2ui-bindjs.git", from: "0.1.0")
```

It depends on `bindjs-apple` by version. The two `BindJSContext` members it stands on —
`javaScriptContext` and `view(id:buildingAST:)` — shipped in 1.2.0.

## The two things a host has to get right

**One runtime.** A `handlerId` in the AST only resolves back to a closure inside the
instance that stored it, and hook state is keyed by component path within that instance. So
`A2UIHost` attaches to the runtime a `BindJSContext` already owns rather than making one. An
app that already renders BindJS components should pass its context in; then hand-written
components and agent-authored surfaces share a runtime, and interaction works in both.

**Redraws come from the store.** A control writing back into the data model does not touch
BindJS hook state — the A2UI data model owns the value, which is the point — so the runtime
never marks itself dirty and `BindJSContext` publishes nothing. `A2UIHost` subscribes to the
store and publishes on that instead. This is what `useA2UIStore` does on the web with
`useSyncExternalStore`. Get it wrong and the store updates correctly while the screen keeps
showing the tree it drew first.

## The seam in `bindjs-apple`

Two members on `BindJSContext` are all this library needs from the host runtime:

| Member | Why |
| --- | --- |
| `javaScriptContext` | Loads `a2ui-native.js` into the context the runtime already lives in, holds the renderer as a `JSValue`, and hands JavaScript the closures it calls back through. |
| `view(id:buildingAST:)` | Decodes an AST built elsewhere, through the same path as `viewForName`, with the runtime's `willRender` on the way in. |

**Why not inject a `JSContext` instead.** The obvious alternative is for `BindJSContext`
to accept a context from outside, so the renderer owns it. `BindJSContext.init` installs an
exception handler, timers, `console`, the `runtime` global and the callbacks hung off it,
and it assumes it is alone in there. Accepting a foreign context means two instances can
land in one `JSContext` and silently overwrite each other's `runtime` — the single-runtime
failure above, moved somewhere much harder to see. And it would not remove the second
member: decoding an AST runs through `toDirective`, `makeComponent`,
`resolveForEachChildren` and `ComponentView`, none of which are reachable from JavaScript.
Exposing the context is the same capability with none of that: the host adds to a
namespace the runtime still owns.

One thing to know when reaching in: `BindJSRuntimeWrapper.js` declares `const runtime`,
which lives in the global lexical environment rather than on `globalThis`. Evaluated source
sees it; `objectForKeyedSubscript` does not, and comes back `undefined`. So `A2UIHost`
reaches it with `javaScriptContext.evaluateScript("runtime")`. That value is the
`BindJSRuntime` itself, not the facade `BindJSContext` holds under the same name — the
facade has `setComponents` and `callComponent`, while a renderer registering a catalog
needs `registerComponent`.

**Why `view` takes a closure.** The AST has to be built *between* `willRender` and the
decode. `willRender` resets the component-path counters that hook state is keyed by, so a
tree built before it — or two trees built between one reset and one decode — binds this
pass's hooks to the last pass's paths. Handing `view` the builder is what makes that
ordering unstateable-wrong rather than a rule in a doc comment.

## Resources

`Sources/A2UI/Resources/a2ui-native.js` is the renderer, built from the npm package by
`pnpm sync:native` and committed. It is versioned in
lockstep with that package: it must agree with the runtime about AST shape, so the two are
not independently upgradable.

## Not implemented yet

`callRendererFunction` and `agentFunctionResponse` cross the bridge but have no host-facing
API — an agent that calls back into the renderer has nowhere to land.
