// A2UI Basic Catalog → BindJS: `Text`
//
// A2UI props: text (required), variant.
//
// Platform note carried over from the first implementation: only the object form
// `Text({ markdown })` is honoured by bindjs-apple's TextComponent (it maps to
// SwiftUI Text(LocalizedStringKey:)). `Markdown(text)` has no native builder and
// `Text(string)` renders nothing on iOS — so the object form is the only safe
// spelling for a component that must work on every backend.
//
// The v1.0 basic catalog only defines ("body" | "caption"), but agents routinely
// emit h1–h5. Unrecognised variants would silently collapse to body and flatten
// every heading, so all seven are mapped onto the platform type ramp.
//
// Block markdown is parsed here rather than left to the backend. The spec's own route to a
// heading is `# Heading` — `variant` has no heading value — and 19 of its 43 examples use
// it. The web backend draws blocks itself, but `Text(LocalizedStringKey:)` natively handles
// inline markdown only and shows the hashes. So a value with block syntax becomes a stack:
// headings on the same type ramp as the variants, list items with their markers, code on a
// quiet background, quotes behind a bar. A value with none stays one `Text`, unchanged.
// Only a marker at column zero counts; `" - Qty: "` is a fragment in a row, not a list.

const HEADING_STYLES = {
    h1: "title",
    h2: "title2",
    h3: "title3",
    h4: "headline",
    h5: "subheadline",
}

/** `#` through `######`; anything past five hashes reads as the smallest heading. */
const HEADING_LEVELS = ["h1", "h2", "h3", "h4", "h5", "h5"]

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? "" : String(value))

// MARK: - Block parsing

const HEADING = /^(#{1,6})\s+(.*)$/
const BULLET = /^[-*]\s+(.*)$/
const NUMBER = /^(\d+)\.\s+(.*)$/
const QUOTE = /^>\s?(.*)$/
const FENCE = /^```/

const startsBlock = (line) => HEADING.test(line) || BULLET.test(line) || NUMBER.test(line) || QUOTE.test(line) || FENCE.test(line)

/** True when any line opens a block, which is the only case that needs the stack. */
const hasBlocks = (text) => text.split("\n").some(startsBlock)

/** Consecutive lines matching `pattern`, mapped through it, from `start`. */
const runOf = (lines, start, pattern, pick) => {
    const items = []
    let index = start

    while (index < lines.length && pattern.test(lines[index])) {
        items.push(pick(pattern.exec(lines[index])))
        index += 1
    }

    return { items, next: index }
}

const parseBlocks = (text) => {
    const lines = text.split("\n")
    const blocks = []
    let index = 0

    while (index < lines.length) {
        const line = lines[index]

        if (line.trim() === "") {
            index += 1
        } else if (FENCE.test(line)) {
            const code = []
            index += 1

            while (index < lines.length && !FENCE.test(lines[index])) {
                code.push(lines[index])
                index += 1
            }

            blocks.push({ kind: "code", text: code.join("\n") })
            index += 1
        } else if (HEADING.test(line)) {
            const match = HEADING.exec(line)

            blocks.push({ kind: "heading", level: match[1].length, text: match[2].trim() })
            index += 1
        } else if (QUOTE.test(line)) {
            const run = runOf(lines, index, QUOTE, (match) => match[1])

            blocks.push({ kind: "quote", text: run.items.join("\n") })
            index = run.next
        } else if (BULLET.test(line)) {
            const run = runOf(lines, index, BULLET, (match) => match[1])

            blocks.push({ kind: "bullets", items: run.items })
            index = run.next
        } else if (NUMBER.test(line)) {
            const run = runOf(lines, index, NUMBER, (match) => `${match[1]}. ${match[2]}`)

            blocks.push({ kind: "bullets", items: run.items })
            index = run.next
        } else {
            const paragraph = []

            while (index < lines.length && lines[index].trim() !== "" && !startsBlock(lines[index])) {
                paragraph.push(lines[index])
                index += 1
            }

            blocks.push({ kind: "paragraph", text: paragraph.join("\n") })
        }
    }

    return blocks
}

// MARK: - Drawing

/** A heading on the type ramp — the same one the h1–h5 variants use. */
const heading = (text, variant) => {
    const style = HEADING_STYLES[variant]

    // Each branch builds its own Text: hanging two modifier stacks off one shared
    // instance renders nothing on the web backend.
    if (variant === "h5") {
        return Text({ markdown: text }).font(style).multilineTextAlignment("leading")
    }

    return Text({ markdown: text }).font(style).fontWeight("semibold").multilineTextAlignment("leading")
}

/**
 * Running text at the variant's size: body or caption.
 *
 * Body is the platform's body font — 17pt on iOS — which is what the official SwiftUI
 * catalog draws it at. It was `subheadline` (15pt) here, which left every body value in
 * every example two points smaller than the reference renderer.
 */
const paragraph = (text, variant) => {
    if (variant === "caption") {
        return Text({ markdown: text }).font("caption").foregroundStyle(Color("secondary")).multilineTextAlignment("leading")
    }

    return Text({ markdown: text }).font("body").multilineTextAlignment("leading")
}

const bullets = (items, variant) =>
    VStack(
        { spacing: 4, alignment: "leading" },
        items.map((item) => paragraph(/^\d+\. /.test(item) ? item : `• ${item}`, variant))
    )

const code = (text) =>
    Text({ markdown: text })
        .font("callout")
        .monospaced()
        .padding(8)
        .frame({ maxWidth: Infinity, alignment: "leading" })
        .background(Color("quaternary"))
        .cornerRadius(6)

const quote = (text, variant) =>
    HStack({ spacing: 8, alignment: "top" }, [
        Rectangle().foregroundStyle(Color("quaternary")).frame({ width: 3, maxHeight: Infinity }),
        paragraph(text, variant).foregroundStyle(Color("secondary")),
    ])

const draw = (block, variant) => {
    if (block.kind === "heading") {
        return heading(block.text, HEADING_LEVELS[block.level - 1])
    }

    if (block.kind === "bullets") {
        return bullets(block.items, variant)
    }

    if (block.kind === "code") {
        return code(block.text)
    }

    if (block.kind === "quote") {
        return quote(block.text, variant)
    }

    return paragraph(block.text, variant)
}

export default defineComponent({
    metadata: {
        title: "A2UIText",
        description: "A2UI Text primitive — headings, body or caption, with simple Markdown.",
        category: "A2UI",
    },

    properties: {
        text: { type: "string", required: true, defaultValue: "", inspector: { control: "multiline", markdown: true } },
        variant: { type: "enum", options: ["h1", "h2", "h3", "h4", "h5", "body", "caption"] },
    },

    body: (props) => {
        const text = asText(props.text)

        if (HEADING_STYLES[props.variant]) {
            return heading(text, props.variant)
        }

        if (!hasBlocks(text)) {
            return paragraph(text, props.variant)
        }

        const pieces = parseBlocks(text).map((block) => draw(block, props.variant))

        // One block — `### Location`, say — is just that block, so the parent's alignment
        // still reaches it. Several are stacked, and the stack sizes to its content for
        // the same reason: a full-width leading frame here would override a centred Column.
        if (pieces.length === 1) {
            return pieces[0]
        }

        return VStack({ spacing: 8, alignment: "leading" }, pieces)
    },

    previews: [
        Self({ text: "Heading one", variant: "h1" }).previewName("h1"),
        Self({ text: "Heading three", variant: "h3" }).previewName("h3"),
        Self({ text: "The quick brown fox jumps over the lazy dog." }).previewName("Body"),
        Self({ text: "Updated 5 minutes ago", variant: "caption" }).previewName("Caption"),
        Self({ text: "Supports **bold**, _italic_ and [links](https://a2ui.org)." }).previewName("Markdown"),
        Self({
            text: "# Heading 1\n\nThis is **bold** text and *italic* text.\n\n- List item 1\n- List item 2\n\n> A quote\n\n```\nlet x = 1\n```",
        }).previewName("Block markdown"),
    ],
});
