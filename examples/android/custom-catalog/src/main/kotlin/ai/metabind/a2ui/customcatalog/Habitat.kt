// A fourth app-supplied component, and the agent surface that names it.
//
// `SortBoard` is one A2UI type standing in for a whole interaction — a shuffled
// deck, a drag that follows the finger, a drop resolved against the bin under it,
// and a score at the end. The agent describes only the cards, the bins and the
// answer key.
//
// None of that state reaches the data model, deliberately: which card is face-up and
// where the last one landed are affordance state, and A2UI has nowhere to put them.
// The drag runs on the renderer's own gesture — a pointer drag on the web, a touch
// drag natively.

package ai.metabind.a2ui.customcatalog

object Habitat {

    /** BindJS component name → source. */
    val sources: Map<String, String> by lazy { mapOf("A2UISortBoard" to sortBoard) }

    /**
     * A2UI type → BindJS component name, merged over the basic catalog. Everything else on
     * this surface is still the bundled component.
     */
    val catalog: Map<String, String> = mapOf("SortBoard" to "A2UISortBoard")

    // MARK: - The agent's messages

    /**
     * One surface: a heading and the board, over nine animals and three habitats.
     *
     * `answer` travels on each card rather than in a separate key, so it survives the component's
     * shuffle. The surface names no catalog id, so it renders through the one the host was
     * given.
     */
    val messages = """
    [
      { "version": "v1.0",
        "createSurface": {
          "surfaceId": "habitat",
          "components": [
            { "id": "root", "component": "Card", "child": "body" },

            { "id": "body", "component": "Column", "align": "start", "children": ["header", "board"] },

            { "id": "header", "component": "Column", "align": "start", "children": ["title", "subtitle"] },
            { "id": "title", "component": "Text", "variant": "h2", "text": { "path": "/title" } },
            { "id": "subtitle", "component": "Text", "variant": "caption", "text": { "path": "/subtitle" } },

            { "id": "board", "component": "SortBoard",
              "data": { "path": "/items" },
              "bins": ["Ocean", "Savanna", "Arctic"],
              "cardSize": 180,
              "boardWidth": 360 }
          ],
          "dataModel": {
            "title": "Sort the animals into their habitats",
            "subtitle": "Drag each card onto the habitat it belongs to",

            "items": [
              { "label": "Dolphin", "answer": 0,
                "imageUrl": "https://cdn.metabind.ai/IgJH0BzIn4LlfnCbcDc7/P2lEZGKCoNG4SlBt7KHd/assets/m9dLWwSw4XEDfWnihZ9r/animal-dolphin.png" },
              { "label": "Octopus", "answer": 0,
                "imageUrl": "https://cdn.metabind.ai/IgJH0BzIn4LlfnCbcDc7/P2lEZGKCoNG4SlBt7KHd/assets/gxHRsS4lT7PW2siFp4Ge/animal-octopus.png" },
              { "label": "Sea turtle", "answer": 0,
                "imageUrl": "https://cdn.metabind.ai/IgJH0BzIn4LlfnCbcDc7/P2lEZGKCoNG4SlBt7KHd/assets/gx5fcABjO548oi908TQu/animal-sea-turtle.png" },

              { "label": "Lion", "answer": 1,
                "imageUrl": "https://cdn.metabind.ai/IgJH0BzIn4LlfnCbcDc7/P2lEZGKCoNG4SlBt7KHd/assets/mJ2uIFg44nwxk7wzKt25/animal-lion.png" },
              { "label": "Elephant", "answer": 1,
                "imageUrl": "https://cdn.metabind.ai/IgJH0BzIn4LlfnCbcDc7/P2lEZGKCoNG4SlBt7KHd/assets/LHzVPBKarr2R10zfwWK7/animal-elephant.png" },
              { "label": "Giraffe", "answer": 1,
                "imageUrl": "https://cdn.metabind.ai/IgJH0BzIn4LlfnCbcDc7/P2lEZGKCoNG4SlBt7KHd/assets/8TPRpjfIj1esuClL2omL/animal-giraffe.png" },

              { "label": "Polar bear", "answer": 2,
                "imageUrl": "https://cdn.metabind.ai/IgJH0BzIn4LlfnCbcDc7/P2lEZGKCoNG4SlBt7KHd/assets/ewSAQGpLvhG2pF0PHJIK/animal-polar-bear.png" },
              { "label": "Arctic fox", "answer": 2,
                "imageUrl": "https://cdn.metabind.ai/IgJH0BzIn4LlfnCbcDc7/P2lEZGKCoNG4SlBt7KHd/assets/QsSK3RfWnLw3OobqBZ09/animal-arctic-fox.png" },
              { "label": "Walrus", "answer": 2,
                "imageUrl": "https://cdn.metabind.ai/IgJH0BzIn4LlfnCbcDc7/P2lEZGKCoNG4SlBt7KHd/assets/l1glctmV0pC7KW6gyAIn/animal-walrus.png" }
            ]
          }
        } }
    ]
    """.trimIndent()

    // MARK: - The component

    private val sortBoard = """
    // A2UI custom catalog → BindJS: `A2UISortBoard`, drawing the A2UI type `SortBoard`
    //
    // Deal a deck of items and drag each onto one of several bins. The agent describes
    // the deck — `data`, an array of `{ label, imageUrl, answer }` — and names the bins;
    // the shuffle, the drag, the scoring and every pixel of it are this component's.
    //
    // Nothing is written back into the data model, deliberately: which card is face-up
    // and where the last one landed are affordance state, not something A2UI has anywhere
    // to put. What the agent gets back is the surface's action, if it declared one.
    //
    // The drop model is arithmetic, not hit-testing: the card sits centred over the
    // board, so its finishing x is `boardWidth / 2 + translation.x`, and which column
    // that lands in is the bin. `boardWidth` is a prop because only the agent knows how
    // wide the surface is being drawn.

    const DROP_DEPTH = 110 // Points dragged down before a release counts as a drop
    const PROMPT = 'Drag the card onto a bin'

    exports.default = defineComponent({
        metadata: {
            title: 'A2UISortBoard',
            description: 'A deck of cards dragged one at a time into named bins, scored against a key.',
        },

        properties: {
            data: {
                type: 'array',
                valueType: {
                    type: 'group',
                    properties: {
                        label: { type: 'string', defaultValue: '' },
                        imageUrl: { type: 'string', defaultValue: '' },
                        answer: { type: 'number', defaultValue: 0 },
                    },
                },
                defaultValue: [],
                description: 'One card per entry — { label, imageUrl, answer }; omit answer for a free sort',
            },
            bins: {
                type: 'array',
                valueType: { type: 'string' },
                defaultValue: [],
                description: 'Bin names — the drop targets, left to right',
            },
            title: { type: 'string', defaultValue: '' },
            cardSize: { type: 'number', defaultValue: 180 },
            boardWidth: {
                type: 'number',
                defaultValue: 360,
                description: 'Width the bins are laid out across — drop targeting is derived from it',
            },
        },

        body: (props) => {
            // Hooks first and unconditionally — every render has to reach the same ones in
            // the same order.
            const [placed, setPlaced] = useState([])
            const [drag, setDrag] = useState(null)
            const [feedback, setFeedback] = useState(null)

            const items = itemsFrom(props.data)

            // Called in `useState`'s initial slot, so the shuffle happens on mount and
            // every later recomputation is thrown away.
            const [order] = useState(shuffledOrder(items.length))

            const deck = dealt(items, order)
            const bins = binsFrom(props.bins)
            const cardSize = props.cardSize ?? 180
            const boardWidth = props.boardWidth ?? 360
            const title = props.title ?? ''

            const titleText = title
                ? Text({ markdown: title })
                      .font('headline')
                      .frame({ maxWidth: Infinity, alignment: 'leading' })
                : Empty()

            if (deck.length === 0 || bins.length === 0) {
                return VStack({ spacing: 8, alignment: 'leading' }, [
                    titleText,
                    Text({ markdown: 'Nothing to sort' }).font('caption').foregroundStyle(Color('secondary')),
                ])
            }

            // `placed` starts empty and grows, so the first unplaced index is the card
            // currently face-up. Deriving it means there is no second piece of state that
            // could disagree with the assignments.
            const current = placed.length

            // Which bin the CURRENT drag would drop into — drives the highlight, so the
            // target is visible before the finger lifts.
            const hovered = drag ? binAt(drag, bins.length, boardWidth) : -1

            const place = (bin) => {
                setPlaced(placed.concat([bin]))

                // Feedback only exists when the agent supplied an answer key. The answer
                // travels WITH the card, so it survives the shuffle.
                const answer = deck[current].answer

                setFeedback(isNaN(answer) ? null : { correct: answer === bin, bin: bin })
            }

            const onDrag = (state) => {
                if (state.phase === 'began' || state.phase === 'changed') {
                    // No `withAnimation` on the threshold crossing: the implicit
                    // transaction also catches the offset, so the art rubber-bands away
                    // from the finger just as you line up a bin.
                    setDrag({ x: state.translation.x, y: state.translation.y })

                    return
                }

                if (state.phase === 'ended') {
                    const bin = binAt(state.translation, bins.length, boardWidth)

                    if (bin >= 0) {
                        place(bin)
                    }
                }

                // `ended` without a target and `cancelled` both just snap back.
                setDrag(null)
            }

            return VStack({ spacing: 14, alignment: 'leading' }, [
                titleText,
                faceUp(deck, current, cardSize, drag, onDrag, placed),
                binRow(bins, placed, hovered, boardWidth),
                status(deck, placed, feedback, bins),
            ])
                .frame({ maxWidth: Infinity, alignment: 'leading' })
        },
    })

    // ─── The deck ────────────────────────────────────────────────────────────

    /// The answer is carried ON the card rather than looked up by index later, so it
    /// follows the card through the shuffle.
    function itemsFrom(data) {
        const rows = Array.isArray(data) ? data : []

        return rows.map((row, index) => ({
            label: labelOf(row, index),
            imageUrl: textOf(row === null || row === undefined ? '' : row.imageUrl),
            answer: Number(row === null || row === undefined ? NaN : row.answer),
        }))
    }

    function labelOf(row, index) {
        const label = row === null || row === undefined ? undefined : row.label

        if (label === null || label === undefined || label === '') {
            return 'Item ' + String(index + 1)
        }

        return String(label)
    }

    function textOf(value) {
        if (value === null || value === undefined) {
            return ''
        }

        return String(value)
    }

    function binsFrom(bins) {
        const names = Array.isArray(bins) ? bins : []

        return names
            .filter((name) => name !== null && name !== undefined && String(name) !== '')
            .map((name) => String(name))
    }

    /// Fisher-Yates over the index positions.
    function shuffledOrder(count) {
        const order = []

        for (let index = 0; index < count; index++) {
            order.push(index)
        }

        for (let index = count - 1; index > 0; index--) {
            const swap = Math.floor(Math.random() * (index + 1))
            const held = order[index]

            order[index] = order[swap]
            order[swap] = held
        }

        return order
    }

    /// Deal the cards in shuffled order. If the data changed length since mount the
    /// stored order no longer describes it, so fall back to the given order rather than
    /// dropping or duplicating cards.
    function dealt(items, order) {
        if (!Array.isArray(order) || order.length !== items.length) {
            return items
        }

        return order.map((index) => items[index])
    }

    // ─── The drop model ──────────────────────────────────────────────────────

    /// Which bin a release lands in, or -1 when the drag was not pulled far enough down
    /// to read as a drop — which is what makes a small stray movement snap back instead
    /// of sorting.
    function binAt(translation, binCount, boardWidth) {
        if (!translation || translation.y < DROP_DEPTH) {
            return -1
        }

        const columnWidth = boardWidth / binCount
        const x = boardWidth / 2 + translation.x
        const index = Math.floor(x / columnWidth)

        // Clamped rather than rejected: a finger that overshoots the edge clearly meant
        // the outermost bin.
        return Math.min(Math.max(index, 0), binCount - 1)
    }

    // ─── Drawing ─────────────────────────────────────────────────────────────

    /// The face-up card, offset to follow the finger.
    function faceUp(deck, current, cardSize, drag, onDrag, placed) {
        if (current >= deck.length) {
            return score(deck, placed, cardSize)
        }

        const item = deck[current]

        const content = item.imageUrl
            ? Image({ url: item.imageUrl, contentMode: 'fit' })
                  .resizable()
                  .frame({ width: cardSize, height: cardSize })
            : Text({ markdown: item.label })
                  .font('title')
                  .frame({ width: cardSize, height: cardSize })

        // `.id()` is load-bearing, not decoration. Every card renders at the same place in
        // the tree, so a renderer sees one long-lived image whose `url` merely changed —
        // and keeps showing the first card for the whole deck. Keying identity to the item
        // makes each card a NEW view, which is what forces the image to load.
        const art = content.cornerRadius(16).id('card-' + String(current) + '-' + item.imageUrl)

        // ONLY the art travels with the finger. The label stays put, so the card reads as
        // "this one is being moved" rather than the whole tile sliding off its own
        // caption — and the name is still legible mid-drag.
        const moving = art.offset({ x: drag ? drag.x : 0, y: drag ? drag.y : 0 }).opacity(drag ? 0.9 : 1)

        // The gesture sits on the OUTER stack, whose frame never moves. Putting it on the
        // art would drag the hit area around with the offset and make the gesture fight
        // the finger near the edges.
        return VStack({ spacing: 4, alignment: 'center' }, [
            moving,
            Text({ markdown: item.label })
                .font('subheadline')
                .fontWeight('semibold')
                .frame({ maxWidth: Infinity, alignment: 'center' }),
        ])
            .frame({ maxWidth: Infinity, alignment: 'center' })
            .onDragGesture({ minimumDistance: 4 }, onDrag)
    }

    function binRow(bins, placed, hovered, boardWidth) {
        const columns = bins.map((name, index) => {
            const count = placed.filter((bin) => bin === index).length
            const isTarget = index === hovered

            return VStack({ spacing: 2, alignment: 'center' }, [
                Text({ markdown: name }).font('subheadline').fontWeight(isTarget ? 'bold' : 'regular'),
                Text({ markdown: String(count) }).font('caption').foregroundStyle(Color('secondary')),
            ])
                .frame({ maxWidth: Infinity })
                .frame({ height: 64, alignment: 'center' })
                // The highlight is the only cue that says where the card will land before
                // you let go.
                .background(Color(isTarget ? 'accent' : 'secondary').opacity(isTarget ? 0.3 : 0.12))
                .cornerRadius(10)
        })

        return HStack({ spacing: 8 }, columns).frame({ maxWidth: boardWidth })
    }

    /// Where the deck is up to: the verdict on the last drop, or the count remaining.
    function status(deck, placed, feedback, bins) {
        if (placed.length >= deck.length) {
            return Empty()
        }

        if (feedback) {
            // The pill hugs its content, so the centring frame goes on a wrapper — putting
            // it on the pill itself would stretch the fill across the row.
            return VStack({ alignment: 'center' }, [verdictPill(feedback, bins)])
                .frame({ maxWidth: Infinity, alignment: 'center' })
        }

        return Text({ markdown: PROMPT + ' · ' + String(placed.length + 1) + ' of ' + String(deck.length) })
            .font('caption')
            .foregroundStyle(Color('secondary'))
            .frame({ maxWidth: Infinity, alignment: 'center' })
    }

    /// A filled pill rather than coloured caption text. At caption size a green tick and a
    /// red cross are easy to miss between drags; a solid fill carries the verdict
    /// peripherally, before the word is read.
    ///
    /// The glyphs are text, not SF Symbols: the same pill has to draw on the web and on
    /// Compose, and neither has a symbol set to look one up in.
    function verdictPill(feedback, bins) {
        return HStack({ spacing: 6 }, [
            Text({ markdown: feedback.correct ? '✓' : '✕' })
                .font('caption')
                .fontWeight('bold')
                .foregroundStyle(Color('white')),
            Text({ markdown: bins[feedback.bin] })
                .font('caption')
                .fontWeight('semibold')
                .foregroundStyle(Color('white')),
        ])
            .padding('horizontal', 12)
            .padding('vertical', 7)
            .background(Color(feedback.correct ? 'green' : 'red'))
            .clipShape(Capsule())
    }

    /// End of deck. With an answer key this is a score; without one there is no such thing
    /// as a wrong drop, so it stays a tally of where things went.
    ///
    /// Either way it occupies the SAME height the card art did, so finishing the deck does
    /// not yank the bins out from under the eye.
    function score(deck, placed, cardSize) {
        const scored = deck.filter((item) => !isNaN(item.answer)).length

        if (scored === 0) {
            return finished([
                Text({ markdown: 'All sorted' }).font('headline'),
                Text({ markdown: String(deck.length) + ' items placed' })
                    .font('caption')
                    .foregroundStyle(Color('secondary')),
            ], cardSize)
        }

        // Only cards that HAD an answer count toward the score, so a partial key does not
        // silently mark unanswerable ones wrong.
        let correct = 0

        deck.forEach((item, index) => {
            if (!isNaN(item.answer) && placed[index] === item.answer) {
                correct += 1
            }
        })

        return finished([
            Text({ markdown: String(correct) + ' / ' + String(scored) })
                .font('largeTitle')
                .fontWeight('bold'),
            Text({ markdown: verdict(correct, scored) }).font('headline'),
        ], cardSize)
    }

    function finished(rows, cardSize) {
        return VStack({ spacing: 6, alignment: 'center' }, rows)
            .frame({ maxWidth: Infinity })
            .frame({ height: cardSize, alignment: 'center' })
    }

    function verdict(correct, total) {
        if (correct === total) {
            return 'Perfect'
        }

        // Integer thirds rather than percentages — with nine cards a percentage reads like
        // false precision.
        if (correct * 3 >= total * 2) {
            return 'Nearly there'
        }

        // Strictly greater, not >=: with three bins, exactly a third is what guessing
        // scores, and chance does not deserve praise.
        if (correct * 3 > total) {
            return 'Not bad'
        }

        return 'Room to improve'
    }
    """.trimIndent()
}
