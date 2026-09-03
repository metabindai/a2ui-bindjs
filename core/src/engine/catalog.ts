/**
 * The default catalog: A2UI v1.0 basic component types → the BindJS components that
 * render them, plus each type's child slots.
 *
 * Both the component list and the slots are generated from the vendored spec
 * (`vendor/spec/v1_0/catalogs/basic/catalog.json`), so they cannot drift from it. Names follow
 * `A2UI<Type>`.
 *
 * A host can pass any map it likes — that is the whole extension point. Spread this one
 * and override an entry to restyle a single component type.
 */
import { BASIC_CATALOG_COMPONENTS, BASIC_CATALOG_SLOTS } from './basicCatalog.generated.js'
import type { Catalog } from './types.js'

export { BASIC_CATALOG_COMPONENTS, BASIC_CATALOG_FUNCTIONS, BASIC_CATALOG_SLOTS } from './basicCatalog.generated.js'

export const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json'

/** The v0.9 basic catalog, still declared by agents and samples written against it. */
export const BASIC_CATALOG_ID_V0_9 = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json'

/**
 * The flat v0.9 spelling.
 *
 * Both forms are in use: the v0.9 schema declares the nested path, while the A2UI
 * project's own `a2ui-over-mcp-recipe` sample declares this one — its recipe card uses
 * the nested id and its form uses this, in the same sample. Refusing one of them would
 * reject half of the reference material.
 */
export const BASIC_CATALOG_ID_V0_9_FLAT = 'https://a2ui.org/specification/v0_9/basic_catalog.json'

/**
 * Every id the bundled catalog answers to.
 *
 * v0.9 and v1.0 declare the *same* components and functions — v1.0 only adds `weight`
 * (plus `Slider.steps`, `TextField.placeholder`, `Video.posterUrl`), and drops
 * `TextField.validationRegexp`. A v0.9 surface is therefore a subset of what this catalog
 * renders, so refusing it would be pedantry rather than safety.
 */
export const BASIC_CATALOG_IDS: readonly string[] = [BASIC_CATALOG_ID, BASIC_CATALOG_ID_V0_9, BASIC_CATALOG_ID_V0_9_FLAT]

/**
 * Component types whose BindJS implementation holds its own state.
 *
 * The v1.0 basic catalog gives `Tabs` no property for the selected tab, `Modal` none for
 * open state, and `ChoicePicker` none for the text typed into its `filterable` search
 * field, so all three are renderer state by definition — which also means their output
 * can change with no A2UI input changing, and they must not be memoised.
 */
const STATEFUL_TYPES = new Set(['ChoicePicker', 'Modal', 'Tabs'])

export const BASIC_CATALOG: Catalog = Object.fromEntries(
    BASIC_CATALOG_COMPONENTS.map((type) => [
        type,
        {
            component: `A2UI${type}`,
            slots: BASIC_CATALOG_SLOTS[type] ?? [],
            stateful: STATEFUL_TYPES.has(type),
        },
    ])
)
