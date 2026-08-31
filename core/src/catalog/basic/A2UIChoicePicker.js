// A2UI Basic Catalog → BindJS: `ChoicePicker`
//
// A2UI props: label, options (array of { label, value }), value, variant, displayStyle,
// filterable.
//
// Two things here are easy to get wrong, and were:
//
//   - Selection mode comes from `variant` — "mutuallyExclusive" (the default) or
//     "multipleSelection". There is no boolean.
//   - `value` is a DynamicStringList: it is *always* an array, even when only one option
//     may be selected. Writing a bare value back would not round-trip.
//
// Single selection is a `Picker`, so each platform draws its own control: a segmented
// control on iOS, a `<select>` on the web. `displayStyle` is a hint, and the platform's
// native single-select control answers it better than either of the styles it names — so
// it only chooses between chips and checkbox rows for multiple selection.
//
// Beyond a handful of options a segmented control is unreadable, so the style drops to
// `automatic` (a menu natively, the same `<select>` on the web).
//
// `filterable` is not implemented yet, and is ignored rather than pretended.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? '' : String(value))

/** More than this in a segmented control and the labels stop being readable. */
const SEGMENTED_LIMIT = 5

const optionValue = (option) => (option && typeof option === 'object' ? option.value : option)
const optionLabel = (option) => asText(option && typeof option === 'object' ? (option.label ?? option.value) : option)

export default defineComponent({
    metadata: {
        title: 'A2UIChoicePicker',
        description: 'A2UI ChoicePicker primitive — chips or checkbox rows, single or multiple selection.',
        category: 'A2UI',
    },

    properties: {
        label: { type: 'string', defaultValue: '' },
        variant: { type: 'enum', options: ['mutuallyExclusive', 'multipleSelection'], defaultValue: 'mutuallyExclusive' },
        displayStyle: { type: 'enum', options: ['chips', 'checkbox'], defaultValue: 'checkbox' },
    },

    body: (props) => {
        const options = Array.isArray(props.options) ? props.options : []
        const selected = Array.isArray(props.value) ? props.value : props.value === undefined ? [] : [props.value]
        const setValue = typeof props.setValue === 'function' ? props.setValue : () => {}

        const multiple = props.variant === 'multipleSelection'

        // Only the multiple-selection branches reach this; single selection is a Picker,
        // which reports the new value rather than a change to the old one.
        const toggle = (value) => {
            const isOn = selected.indexOf(value) >= 0

            return setValue(isOn ? selected.filter((entry) => entry !== value) : selected.concat([value]))
        }

        const caption = props.label ? [Text(asText(props.label)).font('caption').foregroundStyle(Color('secondary'))] : []

        // One choice: the platform's own control, which is the whole point of naming a
        // component rather than describing a layout.
        if (!multiple) {
            const items = options.map((option) => Text(optionLabel(option)).tag(asText(optionValue(option))))

            // The label is empty because the caption above already carries it — a segmented
            // control does not show one, but a menu would, and it would read twice.
            const picker = Picker('', [asText(selected[0]), (value) => setValue([value])], items).pickerStyle(
                options.length > SEGMENTED_LIMIT ? 'automatic' : 'segmented'
            )

            return VStack({ spacing: 8, alignment: 'leading' }, [...caption, picker]).frame({
                maxWidth: Infinity,
                alignment: 'leading',
            })
        }

        if (props.displayStyle === 'chips') {
            const chips = options.map((option) => {
                const value = optionValue(option)
                const isOn = selected.indexOf(value) >= 0

                const chip = Text(optionLabel(option))
                    .font('subheadline')
                    .padding({ horizontal: 14, vertical: 8 })
                    .background(Color(isOn ? 'accent' : 'clear'))
                    .foregroundStyle(Color(isOn ? 'white' : 'primary'))
                    .cornerRadius(999)
                    .id(optionLabel(option + (isOn ? '1' : '0')))

                return Button(chip, () => toggle(value)).id(optionLabel(option + (isOn ? '1' : '0')))
            })

            // Array literal, not `.concat`: the props-form of a layout is strict about
            // receiving `Component[]`, and `metabind validate` checks for it statically.
            return VStack({ spacing: 8, alignment: 'leading' }, [...caption, HStack({ spacing: 8 }, chips)]).frame({
                maxWidth: Infinity,
                alignment: 'leading',
            })
        }

        const rows = options.map((option) => {
            const value = optionValue(option)

            return Toggle({
                label: optionLabel(option),
                isOn: selected.indexOf(value) >= 0,
                setIsOn: () => toggle(value),
            })
        })

        return VStack({ spacing: 8, alignment: 'leading' }, [...caption, ...rows]).frame({
            maxWidth: Infinity,
            alignment: 'leading',
        })
    },

    previews: [
        Self({
            label: 'Cooking style',
            variant: 'mutuallyExclusive',
            displayStyle: 'chips',
            value: ['Grilled'],
            options: [
                { label: 'Grilled', value: 'Grilled' },
                { label: 'Baked', value: 'Baked' },
            ],
        }).previewName('Segmented, single'),

        Self({
            label: 'Portion',
            variant: 'mutuallyExclusive',
            value: ['4'],
            options: ['1', '2', '3', '4', '6', '8', '12'].map((size) => ({ label: size, value: size })),
        }).previewName('Too many for segments'),

        Self({
            label: 'Toppings',
            variant: 'multipleSelection',
            displayStyle: 'checkbox',
            value: ['cheese'],
            options: [
                { label: 'Cheese', value: 'cheese' },
                { label: 'Basil', value: 'basil' },
            ],
        }).previewName('Checkboxes, multiple'),
    ],
})
