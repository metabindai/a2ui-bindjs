# Your own component, in an agent's surface

The same story as `examples/web/custom-catalog`, natively: a BindJS component the app
wrote, registered on the host, and named by the agent as if it had always been in the
catalog. The A2UI messages are byte-for-byte the web example's.

```sh
open A2UICustomCatalog.xcodeproj    # iOS — pick a simulator and run
swift run                           # macOS — same sources, a window
swift run A2UICustomCatalog --check # the bridge, headless
```

Two hosts draw the same surfaces. One has the basic catalog; the other was handed three
BindJS sources and three catalog entries:

```swift
host.useCatalog(
    sources: ["BrandText": brandText, "BrandButton": brandButton, "Rating": rating],
    catalog: ["Text": "BrandText", "Button": "BrandButton", "Rating": "Rating"]
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

`Brand.swift` holds the sources, `Agent.swift` the messages, and `Checks.swift` proves
all of the above without a window.

## Writing one

Props arrive under their A2UI names, plus the two things only the engine can supply: an
`action` callback on nodes with an A2UI action, and `set<Prop>` for every prop bound to a
data-model path (`value` → `setValue`). Stick to components and modifiers BindJS has on
both platforms and the same source restyles the web app too.
