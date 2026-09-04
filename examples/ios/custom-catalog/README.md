# Your own components, in an agent's surface

Four screens behind an index, in two sections. **Built-in catalog** is the bundled
catalog, untouched. **Custom components** is the same package told about BindJS components
this app wrote — two that replace what the catalog already has, and two it does not have
at all.

```sh
open A2UICustomCatalog.xcodeproj    # iOS — pick a simulator and run
swift run                           # macOS — same sources, a window
swift run A2UICustomCatalog --check # the bridge, headless
```

## Offer card, and Overrides

The A2UI messages are byte-for-byte `examples/web/custom-catalog`'s, and both screens draw
the same one. *Offer card* renders it on a host with the basic catalog; *Overrides* renders
it on a host handed three BindJS sources and three catalog entries:

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

## Rating

A type the basic catalog has no entry for. The host that was given it draws five tappable
stars — a tap writes the number into the data model, and the caption bound to the same
path repaints from it. The host that was not reports `Rating` as unknown, which is what
the second panel shows.

## Flight search

A `Column` templated over three rows of the data model, each drawn by `FlightCard` — one
A2UI type standing in for a whole row of chrome. The agent binds eleven properties and an
action whose context is resolved per row, so the third card's tap arrives carrying
`AA 184`; it never learns that a tap also flies a paper plane across the card.

The plane is BindJS `useState` and timers, entirely inside the component. Neither the
agent nor the host has to know: a tap dispatches the A2UI action, and the animation is the
component's own business.

`List` would be the other way to write those rows, and is worth avoiding here: it is a
`ScrollView`, and a surface that scrolls itself clips its content when the host puts it
inside a scrolling screen. `Column` leaves the scrolling to the host.

## The files

`Brand.swift` holds the overrides and `Rating`, `Flights.swift` the flight card and the
surface that names it, `Agent.swift` the offer and review messages, `Demo.swift` the three
hosts, and `Checks.swift` proves all of it without a window. `ContentView.swift` is the
index and the chrome — no part of it describes an offer, a star or a flight.

The plane needs a run loop, so `--check` proves the card builds and the tap dispatches;
seeing it fly means running the app.

## Writing one

Props arrive under their A2UI names, plus the two things only the engine can supply: an
`action` callback on nodes with an A2UI action, and `set<Prop>` for every prop bound to a
data-model path (`value` → `setValue`). Stick to components and modifiers BindJS has on
both platforms and the same source restyles the web app too — and to the colour names it
knows, since an unknown one produces no colour rather than an error.
