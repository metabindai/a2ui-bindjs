// A second app-supplied component, and the agent surface that names it.
//
// `FlightCard` is one A2UI type standing in for a whole row of chrome — logo, route,
// times, status dot, price and a book button. The agent writes it the way it writes
// `Text`, binds each property to a field of the row it is templated over, and never
// learns that tapping it flies a paper plane across the card.
//
// That animation runs on BindJS `useState` and timers, entirely inside the component. The
// agent never learns about it, and the host does not have to declare it: a tap dispatches
// the A2UI action and the plane is the component's own business.

import Foundation

enum Flights {

    /// BindJS component name → source.
    static let sources: [String: String] = ["FlightCard": flightCard]

    /// A2UI type → BindJS component name, merged over the basic catalog. `Column`,
    /// `List` and `Text` on this surface are still the bundled ones.
    static let catalog: [String: String] = ["FlightCard": "FlightCard"]

    // MARK: - The agent's messages

    /// One surface: a heading, a subheading, and a `Column` templated over `/flights`.
    ///
    /// The template's paths are relative to the row, and its action context is resolved
    /// per row — so the third card's tap arrives carrying `AA 184`. The surface names no
    /// catalog id, so it renders through the one the host was given.
    static let messages = """
    [
      { "version": "v1.0",
        "createSurface": {
          "surfaceId": "flights",
          "components": [
            { "id": "root", "component": "Column", "align": "stretch",
              "children": ["heading", "subheading", "flight-list"] },

            { "id": "heading", "component": "Text", "variant": "h2", "text": { "path": "/heading" } },
            { "id": "subheading", "component": "Text", "variant": "caption", "text": { "path": "/subheading" } },

            { "id": "flight-list", "component": "Column", "align": "stretch",
              "children": { "path": "/flights", "componentId": "flight-template" } },

            { "id": "flight-template", "component": "FlightCard",
              "airline": { "path": "airline" },
              "airlineLogo": { "path": "airlineLogo" },
              "flightNumber": { "path": "flightNumber" },
              "origin": { "path": "origin" },
              "destination": { "path": "destination" },
              "date": { "path": "date" },
              "departureTime": { "path": "departureTime" },
              "arrivalTime": { "path": "arrivalTime" },
              "duration": { "path": "duration" },
              "status": { "path": "status" },
              "price": { "path": "price" },
              "action": {
                "event": {
                  "name": "book_flight",
                  "context": {
                    "flightNumber": { "path": "flightNumber" },
                    "origin": { "path": "origin" },
                    "destination": { "path": "destination" },
                    "price": { "path": "price" }
                  }
                }
              } }
          ],
          "dataModel": {
            "heading": "San Francisco → New York",
            "subheading": "Tue, 18 Mar · 3 results · one way",
            "flights": [
              { "id": "ua-1201",
                "airline": "United Airlines",
                "airlineLogo": "https://www.google.com/s2/favicons?domain=united.com&sz=128",
                "flightNumber": "UA 1201",
                "origin": "SFO", "destination": "JFK", "date": "Tue, Mar 18",
                "departureTime": "08:15", "arrivalTime": "16:40", "duration": "5h 25m",
                "status": "On Time", "price": "$289" },

              { "id": "dl-2204",
                "airline": "Delta Air Lines",
                "airlineLogo": "https://www.google.com/s2/favicons?domain=delta.com&sz=128",
                "flightNumber": "DL 2204",
                "origin": "SFO", "destination": "JFK", "date": "Tue, Mar 18",
                "departureTime": "10:45", "arrivalTime": "19:30", "duration": "5h 45m",
                "status": "Delayed", "price": "$312" },

              { "id": "aa-0184",
                "airline": "American Airlines",
                "airlineLogo": "https://www.google.com/s2/favicons?domain=aa.com&sz=128",
                "flightNumber": "AA 184",
                "origin": "SFO", "destination": "JFK", "date": "Tue, Mar 18",
                "departureTime": "14:20", "arrivalTime": "22:55", "duration": "5h 35m",
                "status": "Boarding", "price": "$264" }
            ]
          }
        } }
    ]
    """

    /// One card, not templated, for the headless checks.
    ///
    /// Template rows are built lazily inside the `ForEach` callback, so they are not in
    /// the tree `render` returns. This one is, which is what makes its contents checkable
    /// without a screen.
    static let singleCard = """
    [
      { "version": "v1.0",
        "createSurface": {
          "surfaceId": "one",
          "components": [
            { "id": "root", "component": "Column", "children": ["card"] },
            { "id": "card", "component": "FlightCard",
              "airline": "United Airlines", "airlineLogo": "https://www.google.com/s2/favicons?domain=united.com&sz=128",
              "flightNumber": "UA 1201", "origin": "SFO", "destination": "JFK", "date": "Tue, Mar 18",
              "departureTime": "08:15", "arrivalTime": "16:40", "duration": "5h 25m",
              "status": "Delayed", "price": "$289",
              "action": { "event": { "name": "book_flight", "context": { "flightNumber": "UA 1201" } } } }
          ],
          "dataModel": {}
        } }
    ]
    """

    // MARK: - The component

    /// Props arrive under their A2UI names. `action` is the engine's: it carries the
    /// event name and the context it resolved for this row, so the component only has to
    /// call it.
    static let flightCard = """
    // A2UI custom catalog → BindJS: `FlightCard`
    //
    // Colours are the ones BindJS knows by name, plus hex for the status dot. A name it
    // does not know produces no colour at all rather than an error, so the status dot
    // would silently stop reflecting the status.

    const STATUS_COLORS = {
        'on time': '#22c55e',
        'on-time': '#22c55e',
        scheduled: '#22c55e',
        boarding: '#3b82f6',
        delayed: '#f59e0b',
        cancelled: '#ef4444',
        canceled: '#ef4444',
        landed: '#6b7280',
    }

    const DEFAULT_STATUS_COLOR = '#22c55e'

    // Phases of the tap animation. The plane crosses the card while the times it is
    // covering fade out, then everything returns to `idle`.
    const IDLE = 'idle'
    const TAKEOFF = 'takeoff'
    const CRUISE = 'cruise'
    const LANDED = 'landed'

    const PLANE = '<svg width="40" height="35" viewBox="0 0 40 35" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M39.2295 17.2988C39.2295 17.9518 38.9528 18.5661 38.3994 19.1416C37.8571 19.7061 37.1211 20.1654 36.1914 20.5195C35.2617 20.8626 34.2214 21.0342 33.0703 21.0342H26.0479C25.5719 21.0342 25.2178 21.0895 24.9854 21.2002C24.7529 21.3109 24.4928 21.5156 24.2051 21.8145L12.75 34C12.3737 34.3984 11.9421 34.5977 11.4551 34.5977H8.99805C8.78776 34.5977 8.62728 34.5091 8.5166 34.332C8.40592 34.166 8.41146 33.9668 8.5332 33.7344L14.46 21.0674L5.82715 20.1211L2.73926 25.417C2.50684 25.8154 2.125 26.0146 1.59375 26.0146H0.813477C0.581055 26.0146 0.38737 25.9427 0.232422 25.7988C0.077474 25.6549 0 25.4668 0 25.2344V9.36328C0 9.11979 0.077474 8.92611 0.232422 8.78223C0.38737 8.63835 0.581055 8.56641 0.813477 8.56641H1.59375C2.125 8.56641 2.50684 8.76562 2.73926 9.16406L5.82715 14.4766L14.46 13.5137L8.5332 0.84668C8.41146 0.614258 8.40592 0.415039 8.5166 0.249023C8.62728 0.0830078 8.78776 0 8.99805 0H11.4551C11.9421 0 12.3737 0.199219 12.75 0.597656L24.2051 12.75C24.4928 13.0599 24.7529 13.2702 24.9854 13.3809C25.2178 13.4915 25.5719 13.5469 26.0479 13.5469H33.0703C34.2214 13.5469 35.2617 13.724 36.1914 14.0781C37.1211 14.4212 37.8571 14.8805 38.3994 15.4561C38.9528 16.0205 39.2295 16.6348 39.2295 17.2988Z" fill="#006FFF"/></svg>'

    exports.default = defineComponent({
        metadata: {
            title: 'FlightCard',
            description: 'One flight — airline, route, times, status and a book action.',
        },

        properties: {
            airline: { type: 'string', defaultValue: '' },
            airlineLogo: { type: 'string', defaultValue: '' },
            flightNumber: { type: 'string', defaultValue: '' },
            origin: { type: 'string', defaultValue: '' },
            destination: { type: 'string', defaultValue: '' },
            date: { type: 'string', defaultValue: '' },
            departureTime: { type: 'string', defaultValue: '' },
            arrivalTime: { type: 'string', defaultValue: '' },
            duration: { type: 'string', defaultValue: '' },
            status: { type: 'string', defaultValue: '' },
            statusColor: { type: 'string', defaultValue: '', description: 'Overrides the status → colour table' },
            price: { type: 'string', defaultValue: '' },
            actionLabel: { type: 'string', defaultValue: 'Select' },
            doneLabel: { type: 'string', defaultValue: 'Selected' },
        },

        body: (props) => {
            // Hooks first and unconditionally — every render has to reach the same ones
            // in the same order.
            const [booked, setBooked] = useState(false)
            const [phase, setPhase] = useState(IDLE)

            // `properties.defaultValue` is inspector metadata and is not applied at
            // runtime, so every read carries its own fallback.
            const action = typeof props.action === 'function' ? props.action : () => {}
            const flying = phase !== IDLE

            const book = () => {
                if (flying) {
                    return
                }

                flyPlane()
                action()
            }

            const flyPlane = () => {
                withAnimation(() => {
                    setBooked(true)
                    setPhase(TAKEOFF)
                })

                setTimeout(() => {
                    withAnimation(() => {
                        setPhase(CRUISE)
                    })

                    setTimeout(() => {
                        withAnimation(() => {
                            setPhase(LANDED)
                        })

                        setTimeout(() => {
                            withAnimation(() => {
                                setPhase(IDLE)
                            })
                        }, 800)
                    }, 1200)
                }, 250)
            }

            const logo = props.airlineLogo
                ? Image({ url: props.airlineLogo, contentMode: 'fill' })
                      .resizable()
                      .frame({ width: 28, height: 28 })
                      .clipShape(Circle())
                : Empty()

            const header = HStack({ spacing: 8 }, [
                logo,
                Text({ markdown: text(props.airline) }).font('subheadline').fontWeight('semibold'),
                Spacer(),
                Text({ markdown: text(props.price) }).font('title3').fontWeight('bold'),
            ])

            const meta = HStack([caption(props.flightNumber), Spacer(), caption(props.date)])

            const times = HStack([
                Text({ markdown: text(props.departureTime) }).font('title3').fontWeight('bold'),
                Spacer(),
                Text({ markdown: text(props.duration) }).font('caption2').foregroundStyle(Color('secondary')),
                Spacer(),
                Text({ markdown: text(props.arrivalTime) }).font('title3').fontWeight('bold'),
            ])

            const route = HStack([
                Text({ markdown: text(props.origin) }).font('subheadline').fontWeight('semibold'),
                Spacer(),
                Text({ markdown: '→' }).font('subheadline').foregroundStyle(Color('secondary')),
                Spacer(),
                Text({ markdown: text(props.destination) }).font('subheadline').fontWeight('semibold'),
            ])

            const statusRow = HStack({ spacing: 6 }, [
                Circle().fill(Color(statusColorFor(props.status, props.statusColor))).frame({ width: 8, height: 8 }),
                caption(props.status),
                Spacer(),
            ])

            const label = booked ? text(props.doneLabel, 'Selected') : text(props.actionLabel, 'Select')

            const button = Button({
                action: book,
                label: Text({ markdown: label })
                    .font('subheadline')
                    .fontWeight('semibold')
                    .foregroundStyle(Color(booked ? 'secondary' : 'white'))
                    .frame({ maxWidth: Infinity })
                    .padding({ vertical: 12 })
                    .background(Color(booked ? 'quaternary' : 'accent'))
                    .cornerRadius(10),
            }).disabled(booked)

            // The plane needs the card's width to know how far to travel, and only the
            // layout has that — hence GeometryReader rather than a guessed distance.
            const plane = GeometryReader((geometry) => {
                return Image({ svg: PLANE })
                    .frame({ maxWidth: Infinity })
                    .offset({ x: planeOffset(phase, geometry.size.width) })
                    .opacity(phase === CRUISE ? 1 : 0)
            })

            const itinerary = VStack({}, [times, route])
                .opacity(flying ? 0 : 1)
                .overlay(plane)

            return VStack({ spacing: 12, alignment: 'leading' }, [header, meta, Divider(), itinerary, Divider(), statusRow, button])
                .padding(16)
                .frame({ maxWidth: Infinity, alignment: 'leading' })
                .background(Color('background'))
                .cornerRadius(16)
                .shadow({ y: 8, radius: 12, color: Color('black').opacity(0.14) })
        },
    })

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /// A bound value arrives as whatever the data model holds, and the text builders
    /// throw on anything but a string.
    function text(value, fallback) {
        if (value === null || value === undefined || value === '') {
            return fallback === undefined ? '' : fallback
        }

        return String(value)
    }

    /// An explicit `statusColor` wins, then the table, then green.
    function statusColorFor(status, statusColor) {
        if (statusColor) {
            return statusColor
        }

        const key = String(status === null || status === undefined ? '' : status).trim().toLowerCase()

        return STATUS_COLORS[key] || DEFAULT_STATUS_COLOR
    }

    function caption(value) {
        return Text({ markdown: text(value) }).font('caption').foregroundStyle(Color('secondary'))
    }

    /// Off to the left before it takes off, centred while it cruises, off to the right
    /// once it has landed. It is only visible in the middle of that.
    function planeOffset(phase, width) {
        if (phase === CRUISE) {
            return 0
        }

        if (phase === LANDED) {
            return width / 2
        }

        return -(width / 2)
    }
    """
}
