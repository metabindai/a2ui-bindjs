# Android

What ships for Android, and the Gradle build for it. No example apps live here — those
are in `examples/android/`, though their build is wired up from this one so the platform
has a single wrapper.

| Path                           | What it is                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `packages/a2ui-bindjs-android` | The library: `A2UIHost`, `A2UISurfaceView`, and the renderer bundle as `res/raw/a2ui_native.js`. |
| `settings.gradle.kts`          | The Android build. Rooted here, not at the repository root — see below.                        |

```kotlin
val host = A2UIHost(context)                  // or A2UIHost(context, myRuntime)
host.apply(messagesFromTheAgent)              // JSON, one message or an array

host.actions.collect { action -> … }          // the agent's half of the conversation

A2UISurfaceView(host = host)                  // in a composable
```

`setValue`, `reset`, `surfaceIds`, `diagnostics`, `takeErrors` and `useCatalog` round it
out; nothing else needs to be public.

## Your own components

```kotlin
host.useCatalog(
    sources = mapOf("Rating" to ratingSource, "BrandButton" to buttonSource),  // BindJS name → source
    catalog = mapOf("Rating" to "Rating", "Button" to "BrandButton"),            // A2UI type → BindJS name
)
```

Call it before the first surface arrives. `catalog` is merged over the basic catalog, so
name only what you are adding or replacing — the rest still comes from the bundle. The
sources are the same strings the web and Apple renderers take, so one component covers
all three; `examples/android/custom-catalog` shares its sources with the iOS and web
examples verbatim.

## Why the build is rooted here

The opposite of `Package.swift`, which has to sit at the repository root because that is
how SwiftPM resolves a package by URL. Gradle has no such rule, and a settings file at
the root would make every contributor's IDE offer to import an Android build to work on
the TypeScript.

The examples under `examples/android/` are included from here rather than carrying their
own builds, so the Android side has one wrapper and one `./gradlew`: `minimal`, one
agent-authored screen; `catalog`, every basic-catalog component and every official example
surface; `custom-catalog`, a component of the app's own named by the agent.

## The two things a host has to get right

They are the same two as on Apple platforms, for the same reasons.

**One runtime.** A `handlerId` in the AST only resolves back to a closure inside the
instance that stored it, and hook state is keyed by component path within that instance.
So `A2UIHost` attaches to a `JsRuntime` rather than making one where it can. An app that
already renders BindJS components should pass its runtime in; then hand-written
components and agent-authored surfaces share an isolate, and interaction works in both.

**Redraws come from the store.** A control writing back into the data model does not
touch BindJS hook state — the model owns the value, which is the point — so the runtime
never marks itself dirty. `A2UIHost` has the bundle route store changes into
`runtime.needsRerender()` at attach time, which is the signal bindjs already coalesces and
posts to the main thread, and publishes the result as `revision`. Get it wrong and the
store updates correctly while the screen keeps showing the tree it drew first.

## How it differs from the Apple package

The engine underneath is not the same shape, and three things follow from it.

`bindjs-apple` embeds JavaScriptCore in-process with real interop: Swift closures cross
into JavaScript, and an AST comes back as a `JSValue`. `bindjs-android` runs
`androidx.javascriptengine`, an **out-of-process sandbox** with no interop binding at all
— Kotlin sends a script and gets a string back.

- **Everything suspends.** `A2UISurfaceView` cannot build its tree in its own body the way
  the SwiftUI view does; it holds the surface in state and re-fetches when `revision`
  moves. Budget for the first render: starting the sandbox process and evaluating the
  bundle takes a beat, which is what `placeholder` is for.
- **Actions are pulled, not pushed.** On Apple a tap happens inside JavaScriptCore with no
  Swift frame beneath it, so the bridge has to call back. Here every way into the runtime
  is host-initiated — a tap arrives as `A2UIHost.dispatch` — so by the time it returns,
  anything the surface dispatched is already queued and drained.
- **The bundle is `res/raw/a2ui_native.js`**, underscored: `res/raw` names may only hold
  lowercase letters, digits and underscores, and a hyphen there is a build error.

## Regenerating the renderer

```sh
pnpm sync:native:android
```

The bundle is generated from `core/` and committed, so the library builds without a
JavaScript toolchain — and CI re-runs the sync and fails if the committed copy has
drifted. It does **not** carry a BindJS runtime: the host already ships one as
`res/raw/script.js`, and there must only be one.

## Building

```sh
./gradlew :a2ui:assembleDebug              # the library
./gradlew :minimal:installDebug            # the example, onto a device or emulator
./gradlew :a2ui:connectedDebugAndroidTest  # the bridge, headless, on a device
```

`bindjs-android` resolves from `mavenLocal()` first and then GitHub Packages, which
requires `gpr.user` / `gpr.key` (or `GITHUB_ACTOR` / `GITHUB_TOKEN`) even to read.
To work against a local checkout of it, clone it beside this repository and uncomment the
`includeBuild` at the bottom of `settings.gradle.kts`.

The version pinned in `gradle/libs.versions.toml` must be one carrying
`JsRuntime.evaluate` and `JsRuntime.renderExternal`; nothing older can host a renderer
that is not itself a BindJS component.

## Testing

`src/androidTest/…/A2UIBridgeTest.kt` is the Android counterpart of the iOS example's
`--check`: messages in, an AST out, a tap resolved through the host's own runtime, the
redraw signal, and an unknown component reported rather than thrown. It also asserts `Intl`
is really there, since `formatCurrency` and the date functions are built on it and a V8
without ICU would return something plausible and wrong.

`SpecExamplesTest.kt` renders all 43 official spec examples — the same ones
`core/tests/conformance.test.ts` runs in Node — the rest of the way: through the sandbox,
across the bridge as JSON, and into a decoded tree. That is where a surface which renders
perfectly well in Node can still arrive as nothing, because a value has no JSON
representation or a prop is missing from the Kotlin model. They are copied out of
`vendor/spec/` into the test APK by a Gradle task, never committed twice.

Both have to be instrumented tests — `JavaScriptSandbox` is served by the system WebView,
so there is no Robolectric shadow of it that would mean anything.

**Neither runs in CI at the moment.** The emulator step never finished booting on the
hosted runner and is commented out in `.github/workflows/ci.yml`, so CI proves the Android
side compiles and nothing more. Run `pnpm check:android` against a device or emulator
before changing anything the bridge touches.
