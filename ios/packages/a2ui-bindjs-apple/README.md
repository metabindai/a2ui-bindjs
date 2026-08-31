# `a2ui-bindjs-apple`

A2UI surfaces, rendered natively through BindJS. Two public types:

```swift
import A2UI

let host = A2UIHost()                      // or A2UIHost(context: myExistingContext)
host.onAction = { action in … }            // the agent's half of the conversation
host.apply(messagesFromTheAgent)           // JSON, one message or an array

A2UISurfaceView(host: host)                // in a SwiftUI body
```

That is the whole surface area. `setValue`, `reset`, `surfaceIds` and `diagnostics` round
it out; nothing else needs to be public.

## Where the manifest is

At the repository root. SwiftPM resolves a package by the manifest at the root of the repo,
so `Package.swift` there declares this library and points its target at `Sources/A2UI`:

```swift
.package(url: "https://github.com/metabindai/a2ui-bindjs.git", from: "0.1.0")
```

It depends on the vendored `bindjs-apple` by path, because the four `BindJSContext` methods
it stands on are not upstream yet — see `../../vendor/README.md`. That becomes a versioned
dependency once they are released.

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

## Resources

`Sources/A2UI/Resources/a2ui-native.js` is the renderer, built from the npm package by
`pnpm sync:native` and committed. It is versioned in
lockstep with that package: it must agree with the runtime about AST shape, so the two are
not independently upgradable.

## Not implemented yet

`callRendererFunction` and `agentFunctionResponse` cross the bridge but have no host-facing
API — an agent that calls back into the renderer has nowhere to land.
