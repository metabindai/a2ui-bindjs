// A2UI Basic Catalog → BindJS: `Icon`
//
// A2UI props: name (required) — one of 59 platform-neutral names, `{ svgPath }` carrying
// inline path data, or a binding resolving to either.
//
// The names are A2UI's own vocabulary and belong to no platform, so they have to be
// translated. `Image({ systemName })` resolves against SF Symbols on Apple platforms, and
// bindjs-android maps those same SF names onto Material icons — its `SYSTEM_ICONS` table
// is built for exactly the symbols below. Passing an A2UI name straight through sends
// `shoppingCart` to a symbol set that calls it `cart`, which does not throw: it draws
// nothing while `.frame(size)` goes on reserving the space.

/** A2UI icon name → SF Symbol. The keys are the spec's enum, and `icons.test.ts` says so. */
const SYMBOLS = {
    accountCircle: "person.crop.circle",
    add: "plus",
    arrowBack: "arrow.left",
    arrowForward: "arrow.right",
    attachFile: "paperclip",
    calendarToday: "calendar",
    call: "phone",
    camera: "camera",
    check: "checkmark",
    close: "xmark",
    delete: "trash",
    download: "arrow.down.circle",
    edit: "pencil",
    event: "calendar.badge.clock",
    error: "exclamationmark.circle",
    fastForward: "forward",
    favorite: "heart.fill",
    favoriteOff: "heart",
    folder: "folder",
    help: "questionmark.circle",
    home: "house",
    info: "info.circle",
    locationOn: "location",
    lock: "lock",
    lockOpen: "lock.open",
    mail: "envelope",
    menu: "line.3.horizontal",
    moreVert: "ellipsis",
    moreHoriz: "ellipsis",
    notificationsOff: "bell.slash",
    notifications: "bell",
    pause: "pause",
    payment: "creditcard",
    person: "person",
    phone: "phone",
    photo: "photo",
    play: "play",
    print: "printer",
    refresh: "arrow.clockwise",
    rewind: "backward",
    search: "magnifyingglass",
    send: "paperplane",
    settings: "gearshape",
    share: "square.and.arrow.up",
    shoppingCart: "cart",
    skipNext: "forward.end",
    skipPrevious: "backward.end",
    star: "star.fill",
    starHalf: "star.leadinghalf.filled",
    starOff: "star",
    stop: "stop",
    upload: "arrow.up.circle",
    visibility: "eye",
    visibilityOff: "eye.slash",
    volumeDown: "speaker.wave.1",
    volumeMute: "speaker",
    volumeOff: "speaker.slash",
    volumeUp: "speaker.wave.3",
    warning: "exclamationmark.triangle",
}

/**
 * Drawn when the name is not one of the 59.
 *
 * A visible placeholder rather than nothing, because an agent naming an icon we do not
 * have is a normal event and a gap in the layout reads as a rendering bug.
 */
const FALLBACK_SYMBOL = "questionmark.circle"

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface — bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? '' : String(value))

export default defineComponent({
    metadata: {
        title: "A2UIIcon",
        description: "A2UI Icon primitive — named platform symbols or inline SVG path data.",
        category: "A2UI",
    },

    properties: {
        // Also accepts `{ svgPath }` and, for the shape this component used to take, a
        // bare path or document string. The inspector has no union type to say that in.
        name: { type: "string", required: true, defaultValue: "star" },
        size: { type: "number", defaultValue: 24 },
    },

    body: (props) => {
        const size = props.size ?? 24
        const document = svgDocument(props.name)

        if (document) {
            return Image({ svg: document })
                .resizable()
                .aspectRatio({ contentMode: "fit" })
                .frame({ width: size, height: size })
        }

        const name = asText(props.name)

        if (!name) {
            return Empty()
        }

        return Image({ systemName: SYMBOLS[name] ?? FALLBACK_SYMBOL })
            .resizable()
            .aspectRatio({ contentMode: "fit" })
            .frame({ width: size, height: size })
    },

    previews: [
        Self({ name: "favorite" }).previewName("Named"),
        Self({ name: "shoppingCart", size: 32 }).previewName("Named 32pt"),
        Self({ name: { svgPath: "M12 2L2 22h20L12 2z" } }).previewName("Path data"),
    ],
});

/**
 * The SVG to draw, or `""` when the prop names an icon instead.
 *
 * Two shapes reach here. `{ svgPath }` is what v1.0 specifies; a bare string holding path
 * data or a whole document is what this component accepted before, and is kept because no
 * icon name can be mistaken for either — the 59 are all lowercase-initial words.
 */
function svgDocument(value) {
    const isWrapper = value !== null && typeof value === "object"
    const raw = isWrapper ? asText(value.svgPath) : asText(value)

    if (raw.indexOf("<svg") === 0) {
        return raw
    }

    if (isWrapper || raw.charAt(0) === "M") {
        return raw ? wrapSvgPath(raw) : ""
    }

    return ""
}

/**
 * A2UI ships bare Material path data, whose coordinates assume a 24×24 canvas the path
 * itself does not carry. Without the viewBox the glyph draws at whatever size the
 * renderer guesses.
 */
function wrapSvgPath(path) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="' + path + '"/></svg>'
}
