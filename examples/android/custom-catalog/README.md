# Your own component, in an agent's surface

The same story as `examples/web/custom-catalog` and
[`examples/ios/custom-catalog`](../../ios/custom-catalog/README.md), on Android: BindJS
components the app wrote, registered on the host, and named by the agent as if they had
always been in the catalog. The A2UI messages and the BindJS sources are byte-for-byte the
other examples'.

![The six screens on a Pixel: the offer card as shipped, the same card with Text and Button overridden, a five-star Rating, three FlightCards, a Chart in three variants, and the SortBoard](screenshots/custom-catalog.png)

Install it onto a device or emulator, or run the checks:

```bash
./gradlew -p ../../../android :custom-catalog:installDebug                # onto a device or emulator
./gradlew -p ../../../android :custom-catalog:connectedDebugAndroidTest   # the checks
```

Six screens behind an index, in two sections, split by what the *agent* named rather than
by what the app supplied. **Built-in catalog** is types the bundled catalog already has:
the offer card as it ships, and again with `Text` and `Button` replaced. **Custom
components** is types it does not have at all: a `Rating`, a `FlightCard`, a `Chart`, and a
`SortBoard`, all written by this app and named by the agent as if they had always been
there.

## Offer card and Overrides

The same messages on both, drawn by two hosts. One has the basic catalog; the other was
handed three BindJS sources and three catalog entries:

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

## Rating

A type the basic catalog has no entry for. The host that was given it draws five tappable
stars: a tap writes the number into the data model, and the caption bound to the same path
repaints from it. The host that was not reports `Rating` as unknown.

## Flight search

A `Column` templated over three rows of the data model, each drawn by `FlightCard`, one
A2UI type standing in for a whole row of chrome. The agent binds eleven properties and an
action whose context is resolved per row, so the third card's tap arrives carrying
`AA 184`; it never learns that a tap also flies a paper plane across the card.

The plane is BindJS `useState` and timers, entirely inside the component. Neither the agent
nor the host has to know: a tap dispatches the A2UI action, and the animation is the
component's own business.

`List` would be the other way to write those rows, and is worth avoiding here: it is a
`ScrollView`, and a surface that scrolls itself has to be told the host scrolls too, through
`LocalHostScrollsVertically`. A `Column` leaves the scrolling to the host and needs no
such arrangement.

## Sales dashboard

One A2UI type over three chart shapes. `Chart` takes `data` (an array of
`{ label, value }`), a variant, and a title, and the surface names it three times: a bar
chart over four quarters, a line over seven days, a donut over four sources. Which marks
that becomes, and how a selection is reported, is the component's; the agent describes only
the numbers.

The total above them goes the other way. `formatCurrency` is an A2UI standard function, so
the engine formats it before the surface is built. The chart formats its own readout
itself, because that is drawn inside a component the engine cannot reach into.

Two platform notes, both discovered rather than assumed:

- **`.opacity()` on a chart mark is ignored by every renderer.** Dimming the unselected
  marks is the obvious next move and no backend honours it: each logs "unsupported chart
  mark modifier" and draws them at full strength. The selection is shown with a rule, an
  enlarged point, and a caption instead.
- **Selection itself does not arrive on Android.** `chartXSelection` and `chartSelection`
  cross into the AST and the charts draw, but no drag or tap on the Compose chart calls
  back, so the readout stays on its hint. It works where the renderer delivers it; this is
  bindjs-android's to close, not this example's.

## Habitat sort

`SortBoard` is one A2UI type standing in for a whole interaction: nine animals dealt in a
shuffled deck, one face-up at a time, dragged onto one of three habitats. A drop is scored
against the answer key travelling on each card, and the deck ends on a score.

None of that reaches the data model, deliberately. Which card is face-up, where the finger
is, what the last verdict was: A2UI has nowhere to put any of it, and it should not, because
it is affordance state. The agent supplies the cards, the bins, and the key, and gets back
whatever action the surface declared.

The drop model is arithmetic rather than hit-testing. The card is centered over the board,
so its finishing x is `boardWidth / 2 + translation.x`, and which column that lands in is
the bin; `boardWidth` is a prop because only the agent knows how wide the surface is drawn.
A release that was not pulled `DROP_DEPTH` down does not count, which is what makes a stray
movement snap back instead of sorting.

## What a surface says back

Nothing is shown inline. A floating pill counts what the screen's surfaces dispatched and
what they could not draw, and a `ModalBottomSheet` shows it, so the chrome never moves the
surface around. Activity is collected per host *and* surface, because two screens share the
branded host and would otherwise report each other's actions.

`Brand.kt`, `Flights.kt`, `Dashboard.kt`, and `Habitat.kt` hold the sources and the
messages, `Agent.kt` the first two surfaces, `Demo.kt` the five hosts, and
`CustomCatalogTest.kt` proves all of it without a screen. It is an instrumented test, so it
needs a device or emulator; CI builds the app but cannot run it.

## Five hosts, one sandbox

Each `A2UIHost` gets its own isolate, and `JavaScriptSandbox` allows one sandbox process
per app, so bindjs-android shares it across runtimes. Five hosts is fine; two hosts on one
runtime is not, because the second would evaluate the renderer bundle over the first.
