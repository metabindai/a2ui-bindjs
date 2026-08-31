# Vendored `bindjs-apple`

A copy of `bindjs-apple`, checked in so this example can be shared before the small API it
needs is released. Delete it and switch `Package.swift` to a version dependency once that
lands upstream.

## What diverges

Four methods on `BindJSContext`, all additive — `bindjs-apple.patch` is the whole of it:

| Method | Why |
| --- | --- |
| `evaluate(_:)` | Loads `a2ui-native.js` into the context the runtime already lives in. |
| `setGlobal(_:forName:)` | Lets JavaScript call back into Swift when an action is queued. |
| `willRender()` | Resets component-path counters before an external interpreter builds a tree. |
| `viewForAST(_:id:)` | Decodes an AST built elsewhere, through the same path as `viewForName`. |

Nothing else is touched, and nothing existing changes behaviour. `Examples/`, `Tests/`
and `Scripts/` are stripped; the rest is verbatim.

## Why not just bundle a runtime with the renderer

Because there can only be one `BindJSRuntime`. `BindJSRuntimeWrapper.js` holds a single
instance and resolves `handlerId`s against it, and hook state is keyed by component path
within it. A renderer carrying its own runtime would draw a correct-looking tree and then
do nothing at all when tapped — which is a bad way to find out.

So `a2ui-native.js` attaches to the host's instance instead, and the four methods above
are the seam that makes that possible.
