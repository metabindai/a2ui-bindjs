# Android

Coming soon.

The Kotlin half of what `ios/` does: attach `core`'s renderer bundle to the JavaScript
runtime a `bindjs-android` host already owns, and decode the AST it returns into Compose.

Two things carry over from the Apple side, and both are structural rather than incidental:

**One runtime.** A `handlerId` in the AST only resolves back to a closure inside the
instance that stored it, and hook state is keyed by component path within that instance. A
renderer that brings its own runtime draws a correct-looking tree and then does nothing at
all when tapped.

**Redraws come from the store.** A control writing back into the data model does not touch
BindJS hook state — the A2UI data model owns the value — so the runtime never marks itself
dirty. The host has to subscribe to the store (`a2ui.onChange`) or the screen keeps showing
the tree it drew first.

`core/src/native/bridge.ts` is the surface to build against; it is engine-neutral, and the
bundle is downlevelled to ES2020 precisely because older Hermes lacks ES2022 private fields.
