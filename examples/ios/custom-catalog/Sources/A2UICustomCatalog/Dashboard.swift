// A third app-supplied component, and the agent surface that names it.
//
// `Chart` is one A2UI type over six chart shapes. The agent hands it an array of `{
// label, value }` and a variant; which marks that becomes, how selection is reported
// and what the readout says are the component's own business, and the same source
// draws it as SVG here, SwiftUI Charts on iOS and Compose on Android.
//
// The three charts on this surface are one component three times over. Nothing about
// them is described in A2UI beyond the data, a variant and a title.

import Foundation

enum Dashboard {

    /// BindJS component name → source.
    static let sources: [String: String] = ["A2UIChart": chart]

    /// A2UI type → BindJS component name, merged over the basic catalog. Everything else
    /// on this surface is still the bundled component.
    static let catalog: [String: String] = ["Chart": "A2UIChart"]

    // MARK: - The agent's messages

    /// One surface: a heading, a total, and three charts over three lists in the data
    /// model.
    ///
    /// `formatCurrency` is an A2UI standard function, so the total is formatted by the
    /// engine before the component sees it — the chart formats its own axis and readout,
    /// because those are drawn inside a component the engine cannot reach into. The
    /// surface names no catalog id, so it renders through the one the host was given.
    static let messages = """
    [
      { "version": "v1.0",
        "createSurface": {
          "surfaceId": "dashboard",
          "components": [
            { "id": "root", "component": "Card", "child": "body" },

            { "id": "body", "component": "Column", "align": "stretch",
              "children": ["header", "total", "rule-1", "revenue", "rule-2", "sessions", "rule-3", "sources"] },

            { "id": "header", "component": "Column", "align": "start", "children": ["title", "subtitle"] },
            { "id": "title", "component": "Text", "variant": "h2", "text": { "path": "/title" } },
            { "id": "subtitle", "component": "Text", "variant": "caption", "text": { "path": "/subtitle" } },

            { "id": "total", "component": "Row", "justify": "spaceBetween", "align": "center",
              "children": ["total-label", "total-value"] },
            { "id": "total-label", "component": "Text", "variant": "caption", "text": "Total revenue" },
            { "id": "total-value", "component": "Text", "variant": "h3",
              "text": { "call": "formatCurrency",
                        "args": { "value": { "path": "/total" }, "currency": "USD" },
                        "returnType": "string" } },

            { "id": "rule-1", "component": "Divider" },
            { "id": "rule-2", "component": "Divider" },
            { "id": "rule-3", "component": "Divider" },

            { "id": "revenue", "component": "Chart", "variant": "bar", "title": "Revenue by quarter",
              "data": { "path": "/quarters" }, "valueFormat": "currency", "currency": "USD", "height": 200 },

            { "id": "sessions", "component": "Chart", "variant": "line", "title": "Sessions this week",
              "data": { "path": "/sessions" }, "height": 180 },

            { "id": "sources", "component": "Chart", "variant": "donut", "title": "Traffic sources",
              "data": { "path": "/sources" }, "height": 220 }
          ],
          "dataModel": {
            "title": "FY26 Performance",
            "subtitle": "Revenue is tracking 18% ahead of plan",
            "total": 708550,

            "quarters": [
              { "label": "Q1", "value": 128400 },
              { "label": "Q2", "value": 186200 },
              { "label": "Q3", "value": 152900 },
              { "label": "Q4", "value": 241050 }
            ],

            "sessions": [
              { "label": "Mon", "value": 1240 },
              { "label": "Tue", "value": 1810 },
              { "label": "Wed", "value": 1495 },
              { "label": "Thu", "value": 2380 },
              { "label": "Fri", "value": 2110 },
              { "label": "Sat", "value": 940 },
              { "label": "Sun", "value": 720 }
            ],

            "sources": [
              { "label": "Direct", "value": 45 },
              { "label": "Search", "value": 30 },
              { "label": "Social", "value": 15 },
              { "label": "Referral", "value": 10 }
            ]
          }
        } }
    ]
    """

    // MARK: - The component

    private static let chart = """
    // A2UI custom catalog → BindJS: `A2UIChart`, drawing the A2UI type `Chart`
    //
    // One A2UI type over six chart shapes. The agent hands it `data` — an array of
    // `{ label, value }` — and a variant; everything below is presentation this component
    // owns and the agent never describes.
    //
    // The two chart families are their own inline components rather than plain builder
    // functions, so each OWNS ITS SELECTION STATE instead of having it hoisted into the
    // parent. The entry point itself is prop normalisation, the title and the empty
    // state, and holds no hooks at all.
    //
    // Worth knowing: `defineComponent` names a component from the source it is declared
    // in, so BOTH inline components are named `A2UIChart`, and hook storage is keyed by
    // component name and child index. The two therefore share a storage slot — only one
    // renders at a time and both land at the same index — so switching variant across
    // that boundary (bar → donut) carries `selected` over. That is harmless by
    // construction: a stale x label finds no slice and a stale slice id finds no label,
    // so both read as nothing selected. It is why neither may assume its selection is
    // well-formed.
    //
    // Colour comes from `.foregroundStyle({ by })` rather than a hardcoded palette, so
    // each renderer picks up its own per-series colours.

    const CARTESIAN_MARKS = {
        bar: BarMark,
        line: LineMark,
        area: AreaMark,
        point: PointMark,
    }

    // Declared once and shared: all three components read the same array of points, and
    // an inspector should describe it the same way in each.
    const DATA_PROPERTY = {
        type: 'array',
        valueType: {
            type: 'group',
            properties: {
                label: { type: 'string', defaultValue: '' },
                value: { type: 'number', defaultValue: 0 },
            },
        },
        defaultValue: [],
        description: 'One point per entry — { label, value }',
    }

    // ─── Cartesian variants ──────────────────────────────────────────────────
    //
    // bar, line, area and point. Owns its own x-selection.

    const CartesianChart = defineComponent({
        metadata: {
            title: 'CartesianChart',
            description: 'Bar, line, area and point variants over an array of points, with x-axis selection.',
        },

        properties: {
            data: DATA_PROPERTY,
            variant: { type: 'enum', options: ['bar', 'line', 'area', 'point'], defaultValue: 'bar' },
            height: { type: 'number', defaultValue: 220 },
            valueFormat: { type: 'enum', options: ['number', 'currency', 'percent'], defaultValue: 'number' },
            currency: { type: 'string', defaultValue: 'USD' },
            interactive: { type: 'boolean', defaultValue: true },
        },

        body: (props) => {
            // Hooks first and unconditionally — every render has to reach the same ones in
            // the same order.
            const [selected, setSelected] = useState(null)

            const points = pointsFrom(props.data)
            const variant = props.variant ?? 'bar'
            const height = props.height ?? 220
            const interactive = props.interactive !== false

            const Mark = CARTESIAN_MARKS[variant] ?? BarMark

            // Line and area join their points into a path; bar and point do not.
            const connected = variant === 'line' || variant === 'area'

            // `foregroundStyle({ by })` assigns a SERIES, not just a colour. One series
            // per label is exactly right for bars and points — seven bars, seven colours.
            // It is fatal for a line or an area: each point becomes a single-point series
            // with no neighbour to join, and the chart draws nothing at all. Connected
            // variants therefore take one flat colour and stay a single series.
            //
            // Dimming the unselected marks with `.opacity()` is what you would reach for
            // next, and no renderer honours it — every backend logs "unsupported chart
            // mark modifier" and draws them at full strength. The selection is shown by
            // the scrub marks and the readout instead.
            const marks = points.map((point) => {
                const mark = Mark({ x: { value: point.label }, y: { value: point.value } })

                if (connected) {
                    return mark.foregroundStyle(Color('accent'))
                }

                return mark.foregroundStyle({ by: point.label })
            })

            const scrub = scrubMarks(points, selected, interactive, props)
            const plot = Chart({}, marks.concat(scrub)).frame({ height })

            // The renderer's own selection: drag across the plot on a native host, click
            // on the web, and the nearest x value comes back either way.
            const chart = interactive
                ? plot.chartXSelection({ value: selected, onChange: (value) => setSelected(value) })
                : plot

            return VStack({ spacing: 8, alignment: 'leading' }, [
                chart,
                readout(pointAt(points, selected), interactive, 'Tap the chart for detail', props),
            ])
        },
    })

    // ─── Pie and donut ───────────────────────────────────────────────────────
    //
    // Selection here reports a slice id, not an axis value, so this cannot share the
    // cartesian path. Named `SliceChart` because `PieChart` is a builtin.

    const SliceChart = defineComponent({
        metadata: {
            title: 'SliceChart',
            description: 'Pie and donut variants over an array of points, with slice selection.',
        },

        properties: {
            data: DATA_PROPERTY,
            variant: { type: 'enum', options: ['pie', 'donut'], defaultValue: 'pie' },
            height: { type: 'number', defaultValue: 220 },
            valueFormat: { type: 'enum', options: ['number', 'currency', 'percent'], defaultValue: 'number' },
            currency: { type: 'string', defaultValue: 'USD' },
            interactive: { type: 'boolean', defaultValue: true },
        },

        body: (props) => {
            const [selected, setSelected] = useState(null)

            const points = pointsFrom(props.data)
            const variant = props.variant ?? 'pie'
            const height = props.height ?? 220
            const interactive = props.interactive !== false

            // No `.opacity()` on a slice either — see the note in `CartesianChart`.
            const slices = points.map((point, index) =>
                PieSliceMark({ id: sliceId(index), value: point.value, label: point.label })
                    .foregroundStyle({ by: point.label })
            )

            // A donut is a pie with the middle punched out; 0.55 reads well at the sizes
            // these surfaces render at.
            const plot = PieChart({ innerRadius: variant === 'donut' ? 0.55 : 0 }, slices).frame({ height })

            const chart = interactive
                ? plot.chartSelection({ value: selected, onChange: (value) => setSelected(value) })
                : plot

            // A slice has no axis to name it, so the caption is the only readout.
            return VStack({ spacing: 8, alignment: 'leading' }, [
                chart,
                readout(points[sliceIndex(selected)], interactive, 'Tap a slice for detail', props),
            ])
        },
    })

    // ─── The A2UI type ───────────────────────────────────────────────────────

    exports.default = defineComponent({
        metadata: {
            title: 'A2UIChart',
            description: 'Bar, line, area, point, pie and donut over one array of points.',
        },

        properties: {
            data: DATA_PROPERTY,
            variant: {
                type: 'enum',
                options: ['bar', 'line', 'area', 'point', 'pie', 'donut'],
                defaultValue: 'bar',
            },
            title: { type: 'string', defaultValue: '' },
            height: { type: 'number', defaultValue: 220 },
            valueFormat: { type: 'enum', options: ['number', 'currency', 'percent'], defaultValue: 'number' },
            currency: { type: 'string', defaultValue: 'USD' },
            interactive: {
                type: 'boolean',
                defaultValue: true,
                description: 'Tap-to-select with a readout; false for a static chart',
            },
        },

        body: (props) => {
            // `properties.defaultValue` is inspector metadata and is not applied at
            // runtime, so every read carries its own fallback.
            const points = pointsFrom(props.data)
            const variant = props.variant ?? 'bar'
            const title = props.title ?? ''

            const titleText = title ? Text({ markdown: title }).font('headline') : Empty()

            if (points.length === 0) {
                return VStack({ spacing: 8, alignment: 'leading' }, [
                    titleText,
                    Text({ markdown: 'No data' }).font('caption').foregroundStyle(Color('secondary')),
                ])
            }

            // Named rather than forwarded wholesale, so what crosses the component
            // boundary is exactly this and a prop added above cannot leak through.
            const shared = {
                data: props.data,
                height: props.height ?? 220,
                valueFormat: props.valueFormat ?? 'number',
                currency: props.currency ?? 'USD',
                interactive: props.interactive !== false,
            }

            const chart = isSlice(variant)
                ? SliceChart({ ...shared, variant: variant })
                : CartesianChart({ ...shared, variant: variant })

            return VStack({ spacing: 12, alignment: 'leading' }, [titleText, chart])
                .frame({ maxWidth: Infinity, alignment: 'leading' })
        },
    })

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /// Read the array of points, dropping anything unusable so one bad entry cannot take
    /// the whole chart down.
    function pointsFrom(data) {
        const rows = Array.isArray(data) ? data : []
        const points = []

        rows.forEach((row, index) => {
            const value = Number(row === null || row === undefined ? NaN : row.value)

            if (!isNaN(value)) {
                points.push({ label: labelOf(row, index), value: value })
            }
        })

        return points
    }

    /// A point with no label of its own is named by its position, so it still has an
    /// axis entry to sit at.
    function labelOf(row, index) {
        if (row.label === null || row.label === undefined || row.label === '') {
            return String(index + 1)
        }

        return String(row.label)
    }

    function isSlice(variant) {
        return variant === 'pie' || variant === 'donut'
    }

    /// The scrub indicator, drawn INSIDE the plot rather than only reported beneath it: a
    /// rule down the selected x, and an emphasised dot on the datum carrying its value as
    /// an annotation. Appended after the series marks so they paint over them.
    function scrubMarks(points, selected, interactive, props) {
        if (!interactive) {
            return []
        }

        const point = pointAt(points, selected)

        if (!point) {
            return []
        }

        return [
            RuleMark({ x: { value: point.label } })
                .foregroundStyle(Color('secondary'))
                .lineStyle({ dash: [4, 3] }),

            // `symbolSize` is an AREA — the renderer takes its square root for the radius
            // — so 64 is an 8pt dot against the ~3.5pt default.
            PointMark({ x: { value: point.label }, y: { value: point.value } })
                .foregroundStyle(Color('accent'))
                .symbolSize(64)
                .annotation({ text: formatValue(point.value, props), position: 'top' }),
        ]
    }

    /// The caption under a chart. `point` is undefined whenever nothing is selected —
    /// including when a selection carried over from the other chart family and matched
    /// nothing here.
    function readout(point, interactive, hint, props) {
        if (point) {
            return Text({ markdown: point.label + ' · ' + formatValue(point.value, props) })
                .font('caption')
                .fontWeight('semibold')
        }

        if (!interactive) {
            return Empty()
        }

        // Deliberately "tap", not "drag": a native host tracks a drag, the web renderer
        // binds selection to a click. Tap is the one verb that is honest in both.
        return Text({ markdown: hint }).font('caption').foregroundStyle(Color('secondary'))
    }

    function pointAt(points, selected) {
        return points.filter((point) => point.label === selected)[0]
    }

    function sliceId(index) {
        return 'slice-' + String(index)
    }

    /// `slice-2` → 2, and -1 for anything that is not a slice id.
    function sliceIndex(selected) {
        if (typeof selected !== 'string' || selected.indexOf('slice-') !== 0) {
            return -1
        }

        const index = Number(selected.slice(6))

        return isNaN(index) ? -1 : index
    }

    function formatValue(value, props) {
        const style = props.valueFormat ?? 'number'

        try {
            if (style === 'currency') {
                return new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: props.currency ?? 'USD',
                    currencyDisplay: 'narrowSymbol',
                    maximumFractionDigits: 0,
                }).format(value)
            }

            if (style === 'percent') {
                const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 })

                return percent.format(value / 100)
            }

            return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)
        } catch (error) {
            return String(value)
        }
    }
    """
}
