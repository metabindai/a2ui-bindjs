# Android

What ships for Android, and the Gradle build for it. No example apps live here; those
are in `examples/android/`, though their build is wired up from this one so the platform
has a single wrapper.

| Path                           | What it is                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| [`packages/a2ui-bindjs-android`](packages/a2ui-bindjs-android/README.md) | The library: `A2UIHost`, `A2UISurfaceView`, and the renderer bundle as `res/raw/a2ui_native.js`. |
| `settings.gradle.kts`          | The Android build. Rooted here, not at the repository root; see [Why the build is rooted here](#why-the-build-is-rooted-here). |

The whole public surface fits in a few lines:

```kotlin
val host = A2UIHost(context)                  // or A2UIHost(context, myRuntime)
host.apply(messagesFromTheAgent)              // JSON, one message or an array

host.actions.collect { action ->              // the agent's half of the conversation
    // send it to the agent
}

A2UISurfaceView(host = host)                  // in a composable
```

`setValue`, `reset`, `surfaceIds`, `diagnostics`, `takeErrors`, and `useCatalog` round it
out; nothing else needs to be public.

## Consuming the artifact

The library is published to GitHub Packages as `ai.metabind:a2ui-bindjs-android`. It
depends on `ai.metabind:bindjs-android`, which is served from a second GitHub Packages
repository, and GitHub Packages requires a token even to read. Declare both repositories,
with credentials, in your `settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()

        maven {
            url = uri("https://maven.pkg.github.com/metabindai/a2ui-bindjs")
            credentials {
                username = providers.gradleProperty("gpr.user").orNull ?: System.getenv("GITHUB_ACTOR")
                password = providers.gradleProperty("gpr.key").orNull ?: System.getenv("GITHUB_TOKEN")
            }
        }

        maven {
            url = uri("https://maven.pkg.github.com/metabindai/bindjs-android-binary")
            credentials {
                username = providers.gradleProperty("gpr.user").orNull ?: System.getenv("GITHUB_ACTOR")
                password = providers.gradleProperty("gpr.key").orNull ?: System.getenv("GITHUB_TOKEN")
            }
        }
    }
}
```

Put `gpr.user` and `gpr.key` (a GitHub token that can read packages) in
`~/.gradle/gradle.properties`, or export `GITHUB_ACTOR` and `GITHUB_TOKEN`, which is what
CI does.

Then add the dependency to your module:

```kotlin
dependencies {
    implementation("ai.metabind:a2ui-bindjs-android:0.1.0")
}
```

`bindjs-android` and `kotlinx-coroutines-core` come along as `api` dependencies, because
`JsRuntime` and the host's flows are part of this library's own signatures. Compose is
yours to declare: the example modules use `androidx.compose.ui:ui`,
`androidx.compose.foundation:foundation`, and `androidx.activity:activity-compose`.

The AAR is built with `minSdk` 26, a compile SDK of 36 with minor API level 1, and Java 21.
The minor API level travels in the AAR metadata, so a module compiled against plain 36 is
rejected at build time; match all three the way the example modules do:

```kotlin
android {
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        minSdk = 26
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
}
```

The block form of `compileSdk` is Android Gradle plugin 9 syntax; this repository builds
with AGP 9.3.1 and Kotlin 2.3.10. Both the `release` and `debug` build types are published,
so a debug build of your app resolves the debug variant.

## Your own components

Register your own BindJS components before the first surface arrives:

```kotlin
host.useCatalog(
    sources = mapOf("Rating" to ratingSource, "BrandButton" to buttonSource),  // BindJS name → source
    catalog = mapOf("Rating" to "Rating", "Button" to "BrandButton"),            // A2UI type → BindJS name
)
```

`catalog` is merged over the basic catalog, so name only what you are adding or replacing;
the rest still comes from the bundle. The sources are the same strings the web and Apple
renderers take, so one component covers all three.
[`examples/android/custom-catalog`](../examples/android/custom-catalog/README.md) shares its
sources with the iOS and web examples verbatim.

## Why the build is rooted here

The opposite of `Package.swift`, which has to sit at the repository root because that is
how SwiftPM resolves a package by URL. Gradle has no such rule, and a settings file at
the root would make every contributor's IDE offer to import an Android build to work on
the TypeScript.

The examples under `examples/android/` are included from here rather than carrying their
own builds, so the Android side has one wrapper and one `./gradlew`:
[`minimal`](../examples/android/minimal/README.md), one agent-authored screen;
[`catalog`](../examples/android/catalog/README.md), every basic-catalog component and every
official example surface; [`custom-catalog`](../examples/android/custom-catalog/README.md),
a component of the app's own named by the agent.

## The two things a host has to get right

They are the same two as on Apple platforms, for the same reasons: one runtime shared with
the app, and redraws that come from the store, both explained in
[the package README](packages/a2ui-bindjs-android/README.md#the-two-things-a-host-has-to-get-right).

## How it differs from the Apple package

The engine underneath is not the same shape, and three things follow from it.

`bindjs-apple` embeds JavaScriptCore in-process with real interop: Swift closures cross
into JavaScript, and an AST comes back as a `JSValue`. `bindjs-android` runs
`androidx.javascriptengine`, an **out-of-process sandbox** with no interop binding at all:
Kotlin sends a script and gets a string back.

- **Everything suspends.** `A2UISurfaceView` cannot build its tree in its own body the way
  the SwiftUI view does; it holds the surface in state and re-fetches when `revision`
  moves. Budget for the first render: starting the sandbox process and evaluating the
  bundle takes a beat, which is what `placeholder` is for.
- **Actions are pulled, not pushed.** On Apple a tap happens inside JavaScriptCore with no
  Swift frame beneath it, so the bridge has to call back. Here every way into the runtime
  is host-initiated (a tap arrives as `A2UIHost.dispatch`), so by the time it returns,
  anything the surface dispatched is already queued and drained.
- **The bundle is `res/raw/a2ui_native.js`**, underscored: `res/raw` names may only hold
  lowercase letters, digits, and underscores, and a hyphen there is a build error.

## Regenerating the renderer

After changing anything under `core/`, rebuild the bundle:

```bash
pnpm sync:native:android
```

The bundle is generated from `core/` and committed, so the library builds without a
JavaScript toolchain, and CI re-runs the sync and fails if the committed copy has
drifted. It does **not** carry a BindJS runtime: the host already ships one as
`res/raw/script.js`, and there must only be one.

## Building

Run these from `android/`:

```bash
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

`packages/a2ui-bindjs-android/src/androidTest/…/A2UIBridgeTest.kt` is the Android
counterpart of the iOS example's `--check`: messages in, an AST out, a tap resolved through
the host's own runtime, the redraw signal, and an unknown component reported rather than
thrown. It also asserts `Intl` is really there, since `formatCurrency` and the date
functions are built on it and a V8 without ICU would return something plausible and wrong.

`SpecExamplesTest.kt` renders all 43 official spec examples (the same ones
`core/tests/conformance.test.ts` runs in Node) the rest of the way: through the sandbox,
across the bridge as JSON, and into a decoded tree. That is where a surface which renders
perfectly well in Node can still arrive as nothing, because a value has no JSON
representation or a prop is missing from the Kotlin model. They are copied out of
`vendor/spec/` into the test APK by a Gradle task, never committed twice.

Both have to be instrumented tests: `JavaScriptSandbox` is served by the system WebView,
so there is no Robolectric shadow of it that would mean anything.

> [!WARNING]
> Neither runs in CI at the moment. The emulator step never finished booting on the
> hosted runner and is commented out in `.github/workflows/ci.yml`, so CI proves the
> Android side compiles and nothing more. Run `pnpm check:android` against a device or
> emulator before changing anything the bridge touches.
