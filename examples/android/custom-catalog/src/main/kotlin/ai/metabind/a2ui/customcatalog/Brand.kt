// The app's own components, as BindJS source.
//
// The runtime evaluates these strings, so a component is authorable in code, in a file, or
// fetched from a server — which is what makes a presentation swappable at runtime. They
// are the web and iOS examples' sources, unchanged: BindJS draws them as Compose here, as
// SwiftUI there, and as DOM in the browser.
//
// Props arrive under their A2UI names (`text`, `variant`, `value`), plus the two things
// only the engine can supply: an `action` callback, and a `set<Prop>` writer for any prop
// bound to the data model.

package ai.metabind.a2ui.customcatalog

object Brand {

    /**
     * BindJS component name → source. Only what the basic catalog lacks or is being
     * overridden. Lazy: the sources are declared below, and an object initialises top to bottom.
     */
    val sources: Map<String, String> by lazy {
        mapOf(
            "BrandText" to brandText,
            "BrandButton" to brandButton,
            "Rating" to rating,
        )
    }

    /** A2UI type → BindJS component name. Merged over the basic catalog by `useCatalog`. */
    val catalog: Map<String, String> = mapOf(
        "Text" to "BrandText",
        "Button" to "BrandButton",
        "Rating" to "Rating",
    )

    // MARK: - Overrides

    private val brandText = """
    exports.default = defineComponent({
        body: (props) => {
            if (props.variant === 'h2') {
                return Text({ markdown: String(props.text) })
                    .font('title2')
                    .fontWeight('bold')
                    .foregroundStyle(Color('#5b21b6'))
            }

            return Text({ markdown: String(props.text) }).font('subheadline')
        },
        properties: {},
    })
    """.trimIndent()

    private val brandButton = """
    exports.default = defineComponent({
        body: (props, children) => {
            const label = HStack({ spacing: 6 }, children ?? [])
                .padding({ horizontal: 22, vertical: 12 })
                .background(Color('#5b21b6'))
                .foregroundStyle(Color('white'))
                .cornerRadius(999)

            return Button(label, props.action ?? (() => {}))
        },
        properties: {},
    })
    """.trimIndent()

    // MARK: - An addition

    /**
     * A component the basic catalog does not have. `value` is bound to the data model, so
     * the engine injects `setValue` and nothing here holds state — tapping a star writes
     * the number back, and the caption bound to the same path repaints from it.
     */
    private val rating = """
    exports.default = defineComponent({
        metadata: { title: 'Rating', description: 'A star rating bound to a number in the data model.' },
        properties: {
            value: { type: 'number', defaultValue: 0 },
            max: { type: 'number', defaultValue: 5 },
            label: { type: 'string', defaultValue: '' },
        },
        body: (props) => {
            const max = typeof props.max === 'number' && props.max > 0 ? Math.floor(props.max) : 5
            const value = typeof props.value === 'number' ? props.value : 0
            const setValue = typeof props.setValue === 'function' ? props.setValue : () => {}

            const stars = []

            for (let index = 0; index < max; index += 1) {
                const filled = index < value
                const star = Text(filled ? '★' : '☆').font('title2').foregroundStyle(Color(filled ? 'yellow' : 'quaternary'))

                stars.push(Button(star, () => setValue(index + 1)))
            }

            const row = HStack({ spacing: 2 }, stars)

            if (!props.label) {
                return row
            }

            return VStack({ spacing: 4, alignment: 'leading' }, [
                Text(String(props.label)).font('caption').foregroundStyle(Color('secondary')),
                row,
            ])
        },
    })
    """.trimIndent()
}
