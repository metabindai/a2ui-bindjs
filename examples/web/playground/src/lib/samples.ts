// Sample message streams. Each is a JSON array of A2UI v1.0 envelopes, applied in order.

export interface Sample {
    name: string
    source: string

    /** Shown alongside the picker. */
    description?: string

    /** Groups the picker: hand-written probes vs. the official corpus. */
    group: 'Playground' | 'A2UI spec examples'
}

const profileCard = [
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'user_profile_card',
            catalogId: 'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json',
            sendDataModel: true,
            components: [
                { id: 'root', component: 'Column', children: ['user_name', 'email_field', 'submit_button'] },
                { id: 'user_name', component: 'Text', text: { path: '/name' } },
                { id: 'email_field', component: 'TextField', label: 'Email', value: { path: '/contact/email' }, variant: 'shortText' },
                {
                    id: 'submit_button',
                    component: 'Button',
                    child: 'submit_label',
                    action: { event: { name: 'submit_form', context: { itemId: '123', email: { path: '/contact/email' } } } },
                },
                { id: 'submit_label', component: 'Text', text: 'Save' },
            ],
            dataModel: { name: 'John Doe', contact: { email: 'john@example.com' } },
        },
    },
    { version: 'v1.0', updateDataModel: { surfaceId: 'user_profile_card', path: '/name', value: 'Jane Doe' } },
    {
        version: 'v1.0',
        updateComponents: {
            surfaceId: 'user_profile_card',
            components: [{ id: 'user_name', component: 'Text', text: { call: 'formatString', args: { value: 'Hello, ${/name}' } } }],
        },
    },
    { version: 'v1.0', updateDataModel: { surfaceId: 'user_profile_card', path: '/contact', value: null } },
]

const employeeList = [
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'employees',
            components: [
                { id: 'root', component: 'List', children: { path: '/employees', componentId: 'employee_card_template' } },
                { id: 'employee_card_template', component: 'Column', children: ['name_text', 'company_text'] },
                { id: 'name_text', component: 'Text', text: { path: 'name' } },
                { id: 'company_text', component: 'Text', text: { path: '/company' } },
            ],
            dataModel: { company: 'Acme', employees: [{ name: 'Ada' }, { name: 'Grace' }] },
        },
    },
    { version: 'v1.0', updateDataModel: { surfaceId: 'employees', path: '/employees/-', value: { name: 'Linus' } } },
    { version: 'v1.0', updateDataModel: { surfaceId: 'employees', path: '/employees/0', value: null } },
]

const withErrors = [
    { version: 'v1.0', createSurface: { surfaceId: 'demo', components: [{ id: 'root', component: 'Text', text: 'ok' }] } },
    { version: 'v1.0', updateComponents: { surfaceId: 'demo', components: [{ id: 'oops' }] } },
    { version: 'v0.9', beginRendering: { surfaceId: 'demo', root: 'root' } },
    { version: 'v1.0', updateDataModel: { surfaceId: 'missing', path: '/x', value: 1 } },
    { version: 'v1.0', updateDataModel: { surfaceId: 'demo', path: '/x', value: 1 } },
    { version: 'v1.0', deleteSurface: { surfaceId: 'demo' } },
]

const functions = [
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'functions_demo',
            components: [
                { id: 'root', component: 'Column', children: ['greeting', 'total', 'due', 'stock', 'email_check', 'can_submit'] },
                { id: 'greeting', component: 'Text', text: { call: 'formatString', args: { value: 'Hi ${/user/name}, you have ${/cart/count} ${/label} left' } } },
                { id: 'total', component: 'Text', text: { call: 'formatCurrency', args: { value: { path: '/cart/total' }, currency: 'GBP' } } },
                { id: 'due', component: 'Text', text: { call: 'formatDate', args: { value: { path: '/dueAt' }, dateStyle: 'full', timeZone: 'UTC' } } },
                { id: 'stock', component: 'Text', text: { call: 'pluralize', args: { value: { path: '/cart/count' }, one: 'item', other: 'items' } } },
                { id: 'email_check', component: 'Text', text: { call: 'email', args: { value: { path: '/user/email' } } } },
                {
                    id: 'can_submit',
                    component: 'Button',
                    disabled: { call: 'not', args: { value: { call: 'and', args: { values: [{ path: '/agreed' }, { path: '/user/name' }] } } } },
                },
            ],
            dataModel: {
                user: { name: 'Ada', email: 'ada@example' },
                cart: { count: 3, total: 42.5 },
                label: 'items',
                dueAt: '2026-02-02T15:17:00Z',
                agreed: true,
            },
        },
    },
    { version: 'v1.0', updateDataModel: { surfaceId: 'functions_demo', path: '/cart/count', value: 1 } },
    { version: 'v1.0', updateDataModel: { surfaceId: 'functions_demo', path: '/user/email', value: 'ada@example.com' } },
    { version: 'v1.0', updateDataModel: { surfaceId: 'functions_demo', path: '/agreed', value: false } },
    {
        version: 'v1.0',
        updateComponents: {
            surfaceId: 'functions_demo',
            components: [{ id: 'greeting', component: 'Text', text: { call: 'noSuchFunction', args: {} } }],
        },
    },
]

// Two surfaces at once: one store, one renderer each. An agent can drive a main view and
// a sidebar independently, and deleting one leaves the other alone.
const twoSurfaces = [
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'main',
            components: [
                { id: 'root', component: 'Card', child: 'col' },
                { id: 'col', component: 'Column', children: ['title', 'body'] },
                { id: 'title', component: 'Text', variant: 'h2', text: { path: '/article/title' } },
                { id: 'body', component: 'Text', text: { path: '/article/body' } },
            ],
            dataModel: { article: { title: 'Trip to Lisbon', body: 'Three days, mostly walking.' } },
        },
    },
    {
        version: 'v1.0',
        createSurface: {
            surfaceId: 'sidebar',
            components: [
                { id: 'root', component: 'Column', children: ['heading', 'count'] },
                { id: 'heading', component: 'Text', variant: 'caption', text: 'Related' },
                { id: 'count', component: 'Text', text: { call: 'formatString', args: { value: '${/related} nearby places' } } },
            ],
            dataModel: { related: 4 },
        },
    },
    { version: 'v1.0', updateDataModel: { surfaceId: 'sidebar', path: '/related', value: 9 } },
    { version: 'v1.0', deleteSurface: { surfaceId: 'sidebar' } },
]

function stringify(messages: unknown[]): string {
    return JSON.stringify(messages, null, 4)
}

/**
 * The 43 example surfaces the A2UI project ships, read straight from the vendored
 * spec (`vendor/spec/v1_0/catalogs/basic/examples`). They are the same corpus the
 * conformance suite renders, so anything that misbehaves here is a real bug rather than a
 * quirk of a hand-written fixture.
 */
interface SpecExample {
    name?: string
    description?: string
    messages?: unknown[]
}

const specModules = import.meta.glob<SpecExample>(
    '../../../../../vendor/spec/v1_0/catalogs/basic/examples/*.json',
    { eager: true, import: 'default' }
)

const specSamples: Sample[] = Object.entries(specModules)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, example]) => {
        const file = path.split('/').pop() ?? path

        return {
            name: example.name ?? file.replace(/\.json$/, ''),
            description: example.description,
            source: stringify(example.messages ?? []),
            group: 'A2UI spec examples' as const,
        }
    })

const playgroundSamples: Sample[] = [
    { name: 'Profile card', source: stringify(profileCard), group: 'Playground' },
    { name: 'Employee list (template)', source: stringify(employeeList), group: 'Playground' },
    { name: 'Functions', source: stringify(functions), group: 'Playground' },
    { name: 'Two surfaces', source: stringify(twoSurfaces), group: 'Playground' },
    { name: 'With errors', source: stringify(withErrors), group: 'Playground' },
]

export const SAMPLES: Sample[] = [...playgroundSamples, ...specSamples]

/** Sample names by group, in picker order. */
export const SAMPLE_GROUPS: Array<{ group: Sample['group']; samples: Sample[] }> = [
    { group: 'Playground', samples: playgroundSamples },
    { group: 'A2UI spec examples', samples: specSamples },
]
