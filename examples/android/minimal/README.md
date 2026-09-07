# A2UI on Android

A Compose app whose only screen is written by an agent.

`Agent.kt` holds the A2UI — the same JSON the browser and iOS examples receive, message
for message. There is no Compose anywhere in this module describing the product card: it
names components, binds them to a data model, and the catalog decides what that looks like
on this platform.

```sh
./gradlew -p ../../../android :minimal:installDebug     # onto a device or emulator
```

or, from the repository root:

```sh
pnpm dev:android
```

The Gradle build lives in `android/`, not here — one wrapper for the platform. Open
`android/` in Android Studio and this module comes with it.

## Layout

```
android/packages/a2ui-bindjs-android   what would ship — A2UIHost, A2UISurfaceView, the renderer
src/main/kotlin/…/minimal              the app: chrome, the agent's messages, the reply
```

The app is the thin part. `Agent.kt` holds the A2UI and decides what an action means,
`MainActivity.kt` is the chrome around one `A2UISurfaceView`.

## How it fits together

```
JsRuntime                          one isolate, one BindJSRuntime
  ├── res/raw/script.js            shipped by bindjs-android
  ├── res/raw/a2ui_native.js       shipped by the A2UI package — attaches to that runtime
  │     host.apply(messages)       agent messages in
  │     host.ast("main")        ►  AST
  └── renderExternal            ►  BindJSView ► Compose
```

**One runtime, shared.** `a2ui_native.js` does not create its own. A `handlerId` in the
AST only resolves back to a closure inside the instance that stored it, so a renderer
carrying a second runtime would draw a correct-looking tree and then do nothing when
tapped.

**Redraws come from the store.** A control writing back into the data model does not touch
BindJS hook state — the model owns the value — so the runtime never marks itself dirty.
The bundle is told at attach time to route store changes into `needsRerender`, and
`A2UIHost` publishes that as `revision`. Without it the store updates and the screen never
changes.

**The first render takes a moment.** The JavaScript engine is a separate process that has
to start and then evaluate ~120 KB of renderer. That is what `placeholder` is for, and it
is the most visible difference from the iOS example, where the same work is synchronous
and in-process.

## What to try

Tap **Add to cart**. The action leaves with its context resolved against the data model,
`Agent.reply` answers with an `updateDataModel`, and one bound `Text` repaints — the app
never learns which part of the screen changed. Change the size chip first and the action
carries the new value, because the chips write into the model rather than into any state
this app owns.

## Known native differences

`Slider` has no native BindJS view on Android — same gap as iOS — so `A2UISlider` renders
on the web only. The demo surface avoids it. An AST node bindjs-android does not know
decodes to `EmptyComponent` and logs `Nothing to render`, so a gap like that is blank
space rather than a crash.
