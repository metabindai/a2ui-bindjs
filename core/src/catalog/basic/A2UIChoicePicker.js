// A2UI Basic Catalog → BindJS: `ChoicePicker`
//
// A2UI props: label, options (array of { label, value }), value, variant, displayStyle,
// filterable, checks.
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
// `filterable` adds a search field above the options. The filter text is renderer state —
// A2UI has nowhere in the data model to put it — which is why this component is listed
// in `STATEFUL_TYPES`: its output changes without any A2UI input changing.

/**
 * A2UI's DynamicString resolves to whatever the data model holds, so a binding can arrive
 * as a number or a boolean. Builders that expect a string throw on those, and the throw
 * takes out the whole surface - bindjs-react's ErrorBoundary renders an empty div.
 */
const asText = (value) => (value === null || value === undefined ? '' : String(value))

/**
 * A rule's `condition` arrives one of two ways: a boolean, when it was a binding or a logic
 * function, or a `{ valid, message }` result from a validation function such as
 * `required` or `email`. Either spelling of failure counts, and the rule's own message
 * wins over the function's.
 */
const isFailure = (condition) =>
    condition === false || (condition !== null && typeof condition === 'object' && condition.valid === false)

const failedChecks = (checks) =>
    (Array.isArray(checks) ? checks : [])
        .filter((rule) => rule && typeof rule === 'object' && isFailure(rule.condition))
        .map((rule) => ({ message: rule.message ?? (rule.condition && rule.condition.message) ?? 'Invalid' }))

/** More than this in a segmented control and the labels stop being readable. */
const SEGMENTED_LIMIT = 5

const optionValue = (option) => (option && typeof option === 'object' ? option.value : option)
const optionLabel = (option) => asText(option && typeof option === 'object' ? (option.label ?? option.value) : option)

const matchesFilter = (option, filter) => optionLabel(option).toLowerCase().indexOf(filter.toLowerCase()) >= 0

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
        filterable: { type: 'boolean', defaultValue: false },
    },

    body: (props) => {
        // Called unconditionally: hook state is keyed by call order within the component.
        const [filter, setFilter] = useState('')

        const allOptions = Array.isArray(props.options) ? props.options : []
        const filterable = props.filterable === true
        const options = filterable && filter ? allOptions.filter((option) => matchesFilter(option, filter)) : allOptions
        const selected = Array.isArray(props.value) ? props.value : props.value === undefined ? [] : [props.value]
        const setValue = typeof props.setValue === 'function' ? props.setValue : () => {}
        const failed = failedChecks(props.checks)

        const multiple = props.variant === 'multipleSelection'

        // Only the multiple-selection branches reach this; single selection is a Picker,
        // which reports the new value rather than a change to the old one.
        const toggle = (value) => {
            const isOn = selected.indexOf(value) >= 0

            return setValue(isOn ? selected.filter((entry) => entry !== value) : selected.concat([value]))
        }

        // Built as arrays so the props-form of a layout gets a literal `Component[]`,
        // which `metabind validate` checks for statically.
        const caption = props.label
            ? [Text(asText(props.label)).font('caption').foregroundStyle(Color(failed.length > 0 ? 'red' : 'secondary'))]
            : []

        const search = filterable
            ? [
                  TextField({ placeholder: 'Search options', text: filter, setText: setFilter })
                      .padding(8)
                      .background(Color('quaternary'))
                      .cornerRadius(8),
              ]
            : []

        const error = failed.length > 0 ? [Text(asText(failed[0].message)).font('caption').foregroundStyle(Color('red'))] : []

        const wrap = (control) =>
            VStack({ spacing: 8, alignment: 'leading' }, [...caption, ...search, ...control, ...error]).frame({
                maxWidth: Infinity,
                alignment: 'leading',
            })

        // One choice: the platform's own control, which is the whole point of naming a
        // component rather than describing a layout.
        if (!multiple) {
            const items = options.map((option) => Text(optionLabel(option)).tag(asText(optionValue(option))))

            // The label is empty because the caption above already carries it — a segmented
            // control does not show one, but a menu would, and it would read twice.
            const picker = Picker('', [asText(selected[0]), (value) => setValue([value])], items).pickerStyle(
                options.length > SEGMENTED_LIMIT ? 'automatic' : 'segmented'
            )

            return wrap([picker])
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

            return wrap([HStack({ spacing: 8 }, chips)])
        }

        const rows = options.map((option) => {
            const value = optionValue(option)

            return Toggle({
                label: optionLabel(option),
                isOn: selected.indexOf(value) >= 0,
                setIsOn: () => toggle(value),
            })
        })

        return wrap(rows)
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

        Self({
            label: 'Country',
            variant: 'mutuallyExclusive',
            filterable: true,
            value: [],
            options: ['Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile', 'Denmark'].map((name) => ({
                label: name,
                value: name,
            })),
        }).previewName('Filterable'),

        Self({
            label: 'Size',
            variant: 'mutuallyExclusive',
            value: [],
            options: [
                { label: 'Small', value: 's' },
                { label: 'Large', value: 'l' },
            ],
            checks: [{ condition: false, message: 'Pick a size' }],
        }).previewName('Failing a check'),
    ],
})
