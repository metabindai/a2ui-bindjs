# `a2ui-bindjs-android`

A2UI surfaces, rendered natively through BindJS on Compose. Three public types:

```kotlin
import ai.metabind.a2ui.A2UIHost
import ai.metabind.a2ui.A2UISurfaceView

val host = A2UIHost(context)                  // or A2UIHost(context, myRuntime)

host.apply(messagesFromTheAgent)              // JSON, one message or an array
host.actions.collect { action -> … }          // the agent's half of the conversation

A2UISurfaceView(host = host)                  // in a composable
```

`setValue`, `reset`, `surfaceIds`, `diagnostics`, `takeActions` and `takeErrors` round it
out; `A2UIAction` and `A2UIDiagnostic` are what cross the boundary. Nothing else needs to
be public.

Every entry point is `suspend`, because the JavaScript engine on Android is a separate
process reached over IPC. `A2UISurfaceView` does the awaiting.

## The two things a host has to get right

**One runtime.** A `handlerId` in the AST only resolves back to a closure inside the
instance that stored it, and hook state is keyed by component path within that instance.
So `A2UIHost` attaches to a `JsRuntime` rather than making one where it can. An app that
already renders BindJS components should pass its own in; then hand-written components and
agent-authored surfaces share an isolate, and interaction works in both. A host that lets
`A2UIHost` make its own owns nothing — `close()` releases it, and is a no-op on a shared
one.

**Redraws come from the store.** A control writing back into the data model does not touch
BindJS hook state — the model owns the value, which is the point — so the runtime never
marks itself dirty and nothing publishes. At attach time the bundle is told to route store
changes and queued actions into `runtime.needsRerender()`, the signal bindjs already
coalesces and posts to the main thread; `A2UIHost` surfaces that as `revision`, which
`A2UISurfaceView` re-renders on. This is what `useA2UIStore` does on the web with
`useSyncExternalStore`. Get it wrong and the store updates correctly while the screen keeps
showing the tree it drew first.

`A2UIHost` claims the runtime's rerender listener, which is a single slot. A host that
needs its own should own the surface loop itself rather than sharing that slot.

## What it stands on

Two members of `JsRuntime`, both additive, both mirroring what `bindjs-apple` exposes for
the same reason:

| Member | Why |
| --- | --- |
| `evaluate(script)` | Loads the bundle into the isolate the runtime already lives in, and is how everything that is not a render crosses. |
| `renderExternal(script)` | `willRender` and the build under one lock hold, for a tree that does not come from a registered component. |

`renderExternal` is not a convenience. `willRender` resets the component-path counters hook
state is keyed by, so a tree built outside that lock hold binds this pass's hooks to the
last pass's paths, and taps quietly stop working.

## Resources

`src/main/res/raw/a2ui_native.js` is the renderer, built from `core/` by
`pnpm sync:native:android` and committed. It is versioned in lockstep with that package —
it must agree with the runtime about AST shape, so the two are not independently
upgradable. It does not carry a BindJS runtime: `bindjs-android` already ships one as
`res/raw/script.js`, and there must only be one.

## Not implemented yet

`callRendererFunction` and `agentFunctionResponse` cross the bridge but have no
host-facing API — an agent that calls back into the renderer has nowhere to land. Same gap
as the Apple package.

`Slider` has no native BindJS view on Android, so `A2UISlider` renders on the web only.
