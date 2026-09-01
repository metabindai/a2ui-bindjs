# Vendored `bindjs-apple`

A copy of `bindjs-apple`, checked in so this example can be shared before the small API it
needs is released. Delete it and switch `Package.swift` to a version dependency once that
lands upstream.

## What diverges

Two members on `BindJSContext`, both additive — `bindjs-apple.patch` is the whole of it:

| Member | Why |
| --- | --- |
| `javaScriptContext` | Loads `a2ui-native.js` into the context the runtime already lives in, holds the renderer as a `JSValue`, and hands JavaScript the closures it calls back through. |
| `view(id:buildingAST:)` | Decodes an AST built elsewhere, through the same path as `viewForName`, with the runtime's `willRender` on the way in. |

Nothing else is touched, and nothing existing changes behaviour. `Examples/`, `Tests/`
and `Scripts/` are stripped; the rest is verbatim.

## Why not just bundle a runtime with the renderer

Because there can only be one `BindJSRuntime`. `BindJSRuntimeWrapper.js` holds a single
instance and resolves `handlerId`s against it, and hook state is keyed by component path
within it. A renderer carrying its own runtime would draw a correct-looking tree and then
do nothing at all when tapped — which is a bad way to find out.

So `a2ui-native.js` attaches to the host's instance instead, and the two members above are
the seam that makes that possible.

## Why not inject a `JSContext` instead

The obvious alternative is for `BindJSContext` to accept a context from outside, so the
renderer owns it. It buys less than it looks like it does.

`BindJSContext.init` installs an exception handler, timers, `console`, the `runtime`
global, and the callbacks hung off it, and it assumes it is alone in there. Accepting a
foreign context means two instances can land in one `JSContext` and silently overwrite
each other's `runtime` — the same failure the single-runtime rule above exists to prevent,
moved somewhere much harder to see. And it would not remove the patch: decoding an AST
runs through `toDirective`, `makeComponent`, `resolveForEachChildren` and `ComponentView`,
none of which are reachable from JavaScript. `view(id:buildingAST:)` would still be needed,
verbatim.

Exposing the context is the same capability with none of that: the host adds to a
namespace the runtime still owns.

One thing it is *not* quite the same as, and the reason `A2UIHost` looks the way it does:
`BindJSRuntimeWrapper.js` declares `const runtime`, which lives in the global lexical
environment rather than on `globalThis`. Evaluated source sees it; `objectForKeyedSubscript`
does not, and comes back `undefined`. So a host reaches it with
`javaScriptContext.evaluateScript("runtime")`. That value is the `BindJSRuntime` itself,
not the facade `BindJSContext` holds under the same name — the facade has `setComponents`
and `callComponent`, while a renderer registering a catalog needs `registerComponent`.

## Why `view` takes a closure

The AST has to be built *between* `willRender` and the decode. `willRender` resets the
component-path counters that hook state is keyed by, so a tree built before it — or two
trees built between one reset and one decode — binds this pass's hooks to the last pass's
paths. Handing `view` the builder is what makes that ordering unstateable-wrong rather
than a rule in a doc comment. `viewForName` has the same shape internally.
