// A2UI Basic Catalog → BindJS: `Icon`
//
// A2UI props: name (required).
//
// `name` is one of three things: a platform-neutral name from the spec's list
// (`shoppingCart`, `arrowBack` …), an object `{ svgPath }` carrying path data on a 24×24
// canvas, or a data binding that resolves to either. The engine resolves the binding, so
// only the first two arrive here.
//
// Neutral names are mapped onto SF Symbols — the table is the one the official SwiftUI
// catalog uses — because neither backend knows `shoppingCart`: natively the symbol lookup
// fails and draws nothing, and the web backend fetches symbol geometry by SF name. A name
// that is not in the table passes through unchanged, so a real symbol name still works.
//
// Path data is wrapped in an `<svg>` document, which both backends render inline.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

/** The spec's neutral names, as SF Symbols. Snake_case spellings are normalised first. */
const SYMBOLS = {
    accountCircle: "person.crop.circle",
    add: "plus",
    arrowBack: "arrow.backward",
    arrowForward: "arrow.forward",
    arrowUpward: "arrow.up",
    arrowUp: "arrow.up",
    arrowDownward: "arrow.down",
    arrowDown: "arrow.down",
    attachFile: "paperclip",
    calendarToday: "calendar",
    call: "phone",
    camera: "camera",
    check: "checkmark",
    close: "xmark",
    delete: "trash",
    directionsRun: "figure.run",
    download: "arrow.down.to.line",
    edit: "pencil",
    event: "calendar.badge.clock",
    error: "exclamationmark.circle",
    fastForward: "forward.fill",
    favorite: "heart.fill",
    favoriteOff: "heart",
    folder: "folder",
    help: "questionmark.circle",
    home: "house",
    info: "info.circle",
    locationOn: "mappin.and.ellipse",
    lock: "lock",
    lockOpen: "lock.open",
    mail: "envelope",
    menu: "line.3.horizontal",
    moreVert: "ellipsis",
    moreHoriz: "ellipsis",
    notifications: "bell",
    notificationsOff: "bell.slash",
    pause: "pause.fill",
    payment: "creditcard",
    person: "person",
    phone: "phone",
    photo: "photo",
    play: "play.fill",
    print: "printer",
    priorityHigh: "exclamationmark.triangle",
    refresh: "arrow.clockwise",
    rewind: "backward.fill",
    search: "magnifyingglass",
    send: "paperplane",
    settings: "gearshape",
    share: "square.and.arrow.up",
    shoppingCart: "cart",
    skipNext: "forward.end.fill",
    skipPrevious: "backward.end.fill",
    star: "star.fill",
    starHalf: "star.leadinghalf.filled",
    starOff: "star",
    stop: "stop.fill",
    trendingUp: "chart.line.uptrend.xyaxis",
    trendingDown: "chart.line.downtrend.xyaxis",
    upload: "arrow.up.to.line",
    visibility: "eye",
    visibilityOff: "eye.slash",
    volumeDown: "speaker.wave.1",
    volumeMute: "speaker.slash",
    volumeOff: "speaker.slash",
    volumeUp: "speaker.wave.3",
    warning: "exclamationmark.triangle",
}

const FALLBACK_SYMBOL = "questionmark.circle"

/** `arrow_back` → `arrowBack`, so agents writing Material's spelling still land. */
const camelCase = (name) => name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

const symbolFor = (name) => {
    const trimmed = name.trim()

    if (!trimmed) {
        return FALLBACK_SYMBOL
    }

    return SYMBOLS[camelCase(trimmed)] ?? trimmed
}

/** Path data starts with a move-to; a whole document starts with its tag. */
const isPathData = (text) => /^[Mm]\s*[-\d.]/.test(text)

const svgDocument = (path) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${path}"/></svg>`

/** Whichever form `name` arrived in, reduced to `{ svg }` or `{ systemName }`. */
const sourceOf = (name) => {
    if (name && typeof name === "object") {
        const path = asText(name.svgPath).trim()

        return path ? { svg: svgDocument(path) } : { systemName: FALLBACK_SYMBOL }
    }

    const text = asText(name).trim()

    if (text.indexOf("<svg") === 0) {
        return { svg: text }
    }

    if (isPathData(text)) {
        return { svg: svgDocument(text) }
    }

    return { systemName: symbolFor(text) }
}

export default defineComponent({
    metadata: {
        title: "A2UIIcon",
        description: "A2UI Icon primitive — platform-neutral names mapped to symbols, or inline SVG path data.",
        category: "A2UI",
    },

    properties: {
        name: { type: "string", required: true, defaultValue: "star" },
        size: { type: "number", defaultValue: 24 },
    },

    body: (props) => {
        const size = typeof props.size === "number" && props.size > 0 ? props.size : 24
        const source = sourceOf(props.name)

        if (source.svg) {
            return Image({ svg: source.svg }).resizable().aspectRatio({ contentMode: "fit" }).frame({ width: size, height: size })
        }

        return Image({ systemName: source.systemName })
            .resizable()
            .aspectRatio({ contentMode: "fit" })
            .frame({ width: size, height: size })
    },

    previews: [
        Self({ name: "shoppingCart" }).previewName("Neutral name"),
        Self({ name: "star.fill" }).previewName("Symbol name"),
        Self({ name: { svgPath: "M12 2L2 22h20L12 2z" } }).previewName("SVG path"),
    ],
});
