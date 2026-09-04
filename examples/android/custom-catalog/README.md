# Your own component, in an agent's surface

The same story as `examples/web/custom-catalog` and `examples/ios/custom-catalog`, on
Android: a BindJS component the app wrote, registered on the host, and named by the agent
as if it had always been in the catalog. The A2UI messages and the BindJS sources are
byte-for-byte the other two examples'.

```sh
./gradlew -p ../../../android :custom-catalog:installDebug        # onto a device or emulator
./gradlew -p ../../../android :custom-catalog:connectedDebugAndroidTest   # the checks
```

Two hosts draw the same surfaces. One has the basic catalog; the other was handed three
BindJS sources and three catalog entries:

```kotlin
host.useCatalog(
    sources = mapOf("BrandText" to brandText, "BrandButton" to brandButton, "Rating" to rating),
    catalog = mapOf("Text" to "BrandText", "Button" to "BrandButton", "Rating" to "Rating"),
)
```

`sources` is BindJS component name → source. `catalog` is A2UI type → BindJS component
name, merged over the basic catalog, so only what changes is named: two overrides
(`Text`, `Button`) and one addition (`Rating`). Everything else still comes from the
bundled catalog.

## What the screen shows

- The offer card twice, once per host. Same messages, different `Text` and `Button`.
- A review card the basic-catalog host cannot draw — it reports `Rating` as unknown — and
  the other draws as five tappable stars. A tap writes the number into the data model,
  and the caption bound to the same path repaints from it.

`Brand.kt` holds the sources, `Agent.kt` the messages, and `CustomCatalogTest.kt` proves
all of the above without a screen. It is an instrumented test, so it needs a device or
emulator; CI builds the app but cannot run it.

## Two hosts, one sandbox

Each `A2UIHost` gets its own isolate, and `JavaScriptSandbox` allows one sandbox process
per app, so bindjs-android shares it across runtimes. Two hosts is fine; two hosts on one
runtime is not — the second would evaluate the renderer bundle over the first.
