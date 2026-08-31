/**
 * @vitest-environment jsdom
 *
 * End-to-end: A2UI messages → store → engine → catalog → BindJS AST → React DOM.
 */
import { BindJSRuntime } from '@metabindai/bindjs-runtime'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { A2UIRenderer } from '../src/A2UIRenderer'
import { registerCatalog, SurfaceStore, type RegistrarRuntime, type AgentMessage, type BindJSRuntimeLike } from '@metabindai/a2ui-bindjs'

afterEach(cleanup)

function mount(messages: AgentMessage[], onAction?: (message: unknown) => void) {
    const runtime = new BindJSRuntime()
    const catalog = registerCatalog(runtime as unknown as RegistrarRuntime)
    const store = new SurfaceStore()

    for (const message of messages) {
        store.apply(message)
    }

    const surfaceId = store.surfaceIds[0]

    const view = render(
        <A2UIRenderer
            runtime={runtime as unknown as BindJSRuntimeLike}
            store={store}
            surfaceId={surfaceId}
            catalog={catalog}
            locale="en-US"
            onAction={onAction as never}
        />
    )

    return { view, store, surfaceId }
}

describe('<A2UIRenderer /> setup', () => {
    function storeWith(messages: AgentMessage[]): SurfaceStore {
        const store = new SurfaceStore()
        store.applyAll(messages)

        return store
    }

    // The minimal host: no runtime to construct, no catalog to register, no surface to name.
    it('renders from a store alone', async () => {
        const store = storeWith([
            {
                createSurface: {
                    surfaceId: 'only',
                    components: [{ id: 'root', component: 'Text', text: { path: '/greeting' } }],
                    dataModel: { greeting: 'Hello from defaults' },
                },
            },
        ])

        render(<A2UIRenderer store={store} />)

        expect(await screen.findByText('Hello from defaults')).toBeDefined()
    })

    it('renders the named surface when several exist', async () => {
        const store = storeWith([
            { createSurface: { surfaceId: 'first', components: [{ id: 'root', component: 'Text', text: 'FIRST' }] } },
            { createSurface: { surfaceId: 'second', components: [{ id: 'root', component: 'Text', text: 'SECOND' }] } },
        ])

        render(<A2UIRenderer store={store} surfaceId="second" />)

        expect(await screen.findByText('SECOND')).toBeDefined()
        expect(screen.queryByText('FIRST')).toBeNull()
    })

    it('follows the first surface as surfaces come and go', async () => {
        const store = storeWith([
            { createSurface: { surfaceId: 'first', components: [{ id: 'root', component: 'Text', text: 'FIRST' }] } },
            { createSurface: { surfaceId: 'second', components: [{ id: 'root', component: 'Text', text: 'SECOND' }] } },
        ])

        render(<A2UIRenderer store={store} />)
        expect(await screen.findByText('FIRST')).toBeDefined()

        store.apply({ deleteSurface: { surfaceId: 'first' } })

        expect(await screen.findByText('SECOND')).toBeDefined()
    })

    it('fills the catalog into a runtime the host brought', async () => {
        const store = storeWith([
            { createSurface: { surfaceId: 'only', components: [{ id: 'root', component: 'Text', text: 'From a bare runtime' }] } },
        ])

        // Deliberately bare: no registerCatalog call.
        const bare = new BindJSRuntime()

        render(<A2UIRenderer store={store} runtime={bare as unknown as BindJSRuntimeLike} />)

        expect(await screen.findByText('From a bare runtime')).toBeDefined()
    })

    it('never replaces a component the host registered itself', async () => {
        const store = storeWith([
            { createSurface: { surfaceId: 'only', components: [{ id: 'root', component: 'Text', text: 'payload' }] } },
        ])

        const custom = new BindJSRuntime()
        custom.registerComponent(
            'A2UIText',
            `exports.default = defineComponent({ body: (props) => Text('MINE: ' + props.text), properties: {} })`
        )

        render(<A2UIRenderer store={store} runtime={custom as unknown as BindJSRuntimeLike} />)

        expect(await screen.findByText('MINE: payload')).toBeDefined()
    })

    // Left to the renderer's own default this follows the viewer's system preference,
    // which would flip an embedded surface to dark inside a light host.
    it('renders light even when the system prefers dark', async () => {
        const original = window.matchMedia

        window.matchMedia = ((query: string) => ({
            matches: query.includes('dark'),
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        })) as unknown as typeof window.matchMedia

        try {
            const store = storeWith([
                { createSurface: { surfaceId: 'only', components: [{ id: 'root', component: 'Text', text: 'hello' }] } },
            ])

            const { container } = render(<A2UIRenderer store={store} />)
            await screen.findByText('hello')

            expect(container.querySelector('.rendererContainer')?.getAttribute('data-color-scheme')).toBe('light')
        } finally {
            window.matchMedia = original
        }
    })

    it('lets the host ask for dark', async () => {
        const store = storeWith([{ createSurface: { surfaceId: 'only', components: [{ id: 'root', component: 'Text', text: 'hello' }] } }])

        const { container } = render(<A2UIRenderer store={store} environment={{ colorScheme: 'dark' }} />)
        await screen.findByText('hello')

        expect(container.querySelector('.rendererContainer')?.getAttribute('data-color-scheme')).toBe('dark')
    })

    describe('host style reset', () => {
        const RESET_ID = 'a2ui-host-style-reset'

        function storeForReset() {
            return storeWith([{ createSurface: { surfaceId: 'only', components: [{ id: 'root', component: 'Text', text: 'hello' }] } }])
        }

        afterEach(() => {
            document.getElementById(RESET_ID)?.remove()
        })

        it("wraps the surface in a class it owns rather than bindjs-react's", async () => {
            const { container } = render(<A2UIRenderer store={storeForReset()} />)
            await screen.findByText('hello')

            const wrapper = container.querySelector('.a2ui-surface')
            expect(wrapper).not.toBeNull()

            // The reset must not be scoped to a class another package could rename.
            expect(document.getElementById(RESET_ID)?.textContent).toContain('.a2ui-surface')
            expect(document.getElementById(RESET_ID)?.textContent).not.toContain('.rendererContainer')
        })

        it('neutralises the browser margins the renderer would otherwise inherit', async () => {
            render(<A2UIRenderer store={storeForReset()} />)
            await screen.findByText('hello')

            const css = document.getElementById(RESET_ID)?.textContent ?? ''
            expect(css).toContain('margin: 0')
            expect(css).toMatch(/p, h1/)
        })

        it('adds the stylesheet once however many surfaces are mounted', async () => {
            const store = storeForReset()

            render(
                <>
                    <A2UIRenderer store={store} />
                    <A2UIRenderer store={store} />
                </>
            )
            await screen.findAllByText('hello')

            expect(document.querySelectorAll(`#${RESET_ID}`)).toHaveLength(1)
        })

        it('can be turned off by a host that wants to style the HTML itself', async () => {
            render(<A2UIRenderer store={storeForReset()} resetHostStyles={false} />)
            await screen.findByText('hello')

            expect(document.getElementById(RESET_ID)).toBeNull()
        })
    })

    // An invalid colour name does not throw — it just produces nothing, so a control
    // silently stops reflecting its own state. Checking the painted result is the only
    // way to catch it; the AST and diagnostics both look fine.
    it('moves a single selection through the platform picker', async () => {
        const store = storeWith([
            {
                createSurface: {
                    surfaceId: 'only',
                    components: [
                        {
                            id: 'root',
                            component: 'ChoicePicker',
                            variant: 'mutuallyExclusive',
                            value: { path: '/pick' },
                            options: [
                                { label: 'One', value: 'one' },
                                { label: 'Two', value: 'two' },
                            ],
                        },
                    ],
                    dataModel: { pick: ['one'] },
                },
            },
        ])

        render(<A2UIRenderer store={store} />)

        // Single selection is a Picker, so each platform draws its own control — a
        // segmented control natively, a <select> here.
        const picker = (await screen.findByRole('combobox')) as HTMLSelectElement
        expect(picker.value).toBe('one')

        await act(async () => {
            fireEvent.change(picker, { target: { value: 'two' } })
        })

        // The selection has to move, not merely arrive — and the model owns it.
        expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('two')
        expect(store.getSurface('only')?.dataModel).toMatchObject({ pick: ['two'] })
    })

    it('toggles chips when several options may be selected', async () => {
        const store = storeWith([
            {
                createSurface: {
                    surfaceId: 'only',
                    components: [
                        {
                            id: 'root',
                            component: 'ChoicePicker',
                            variant: 'multipleSelection',
                            displayStyle: 'chips',
                            value: { path: '/pick' },
                            options: [
                                { label: 'One', value: 'one' },
                                { label: 'Two', value: 'two' },
                            ],
                        },
                    ],
                    dataModel: { pick: ['one'] },
                },
            },
        ])

        render(<A2UIRenderer store={store} />)

        const background = (label: string) => {
            let node: HTMLElement | null = screen.getByText(label)

            for (let depth = 0; depth < 5 && node; depth++) {
                if (node.style.backgroundColor) {
                    return node.style.backgroundColor
                }

                node = node.parentElement
            }

            return 'none'
        }

        await screen.findByText('One')

        const selected = background('One')
        expect(selected).not.toBe('none')
        expect(background('Two')).not.toBe(selected)

        await act(async () => {
            screen.getByText('Two').click()
        })

        // Both are on now: this variant adds rather than replaces.
        expect(background('Two')).toBe(selected)
        expect(background('One')).toBe(selected)
        expect(store.getSurface('only')?.dataModel).toMatchObject({ pick: ['one', 'two'] })
    })

    it('reports a broken surface to the agent when asked to validate', async () => {
        const store = storeWith([
            {
                createSurface: {
                    surfaceId: 'only',
                    components: [{ id: 'root', component: 'Card', child: 'missing' }],
                    dataModel: {},
                },
            },
        ])

        const errors: unknown[] = []

        render(<A2UIRenderer store={store} validate onError={(error) => errors.push(error)} />)

        await waitFor(() => expect(errors.length).toBeGreaterThan(0))

        expect(errors[0]).toMatchObject({
            code: 'VALIDATION_FAILED',
            surfaceId: 'only',
            path: '/components/0/child',
        })
    })

    it('says nothing about structure unless validation is turned on', async () => {
        const store = storeWith([
            {
                createSurface: {
                    surfaceId: 'only',
                    components: [{ id: 'root', component: 'Card', child: 'missing' }],
                    dataModel: {},
                },
            },
        ])

        const errors: unknown[] = []

        render(<A2UIRenderer store={store} onError={(error) => errors.push(error)} />)

        // The surface still draws what it can; that is the renderer's default posture.
        await new Promise((resolve) => setTimeout(resolve, 20))

        expect(errors).toEqual([])
    })

    it('renders nothing, without throwing, when the store is empty', () => {
        const { container } = render(<A2UIRenderer store={new SurfaceStore()} />)

        expect(container.textContent).toBe('')
    })
})

describe('<A2UIRenderer />', () => {
    // Formatting functions follow the host locale unless one is given, so these tests
    // pin `locale` — exactly as an embedding app should.
    it('paints text from the data model', async () => {
        mount([
            {
                createSurface: {
                    surfaceId: 'main',
                    components: [
                        { id: 'root', component: 'Column', children: ['title', 'sub'] },
                        { id: 'title', component: 'Text', variant: 'h2', text: { path: '/product/name' } },
                        {
                            id: 'sub',
                            component: 'Text',
                            variant: 'caption',
                            text: { call: 'formatCurrency', args: { value: { path: '/product/price' }, currency: 'USD' } },
                        },
                    ],
                    dataModel: { product: { name: 'Trail Runner X2', price: 129 } },
                },
            },
        ])

        expect(await screen.findByText('Trail Runner X2')).toBeDefined()
        expect(await screen.findByText('$129.00')).toBeDefined()
    })

    it('paints every row of a template list', async () => {
        mount([
            {
                createSurface: {
                    surfaceId: 'main',
                    components: [
                        { id: 'root', component: 'List', children: { path: '/employees', componentId: 'row' } },
                        { id: 'row', component: 'Text', text: { path: 'name' } },
                    ],
                    dataModel: { employees: [{ name: 'Ada' }, { name: 'Grace' }, { name: 'Linus' }] },
                },
            },
        ])

        expect(await screen.findByText('Ada')).toBeDefined()
        expect(await screen.findByText('Grace')).toBeDefined()
        expect(await screen.findByText('Linus')).toBeDefined()
    })

    it('repaints when the data model changes', async () => {
        const { store } = mount([
            {
                createSurface: {
                    surfaceId: 'main',
                    components: [{ id: 'root', component: 'Text', text: { path: '/name' } }],
                    dataModel: { name: 'Before' },
                },
            },
        ])

        expect(await screen.findByText('Before')).toBeDefined()

        store.apply({ updateDataModel: { surfaceId: 'main', path: '/name', value: 'After' } })

        expect(await screen.findByText('After')).toBeDefined()
    })

    it('dispatches an action when a button is clicked', async () => {
        const onAction = vi.fn()

        mount(
            [
                {
                    createSurface: {
                        surfaceId: 'main',
                        components: [
                            {
                                id: 'root',
                                component: 'Button',
                                variant: 'primary',
                                child: 'label',
                                action: { event: { name: 'add_to_cart' } },
                            },
                            { id: 'label', component: 'Text', text: 'Add to cart' },
                        ],
                    },
                },
            ],
            onAction
        )

        const label = await screen.findByText('Add to cart')
        const button = label.closest('button') ?? label

        ;(button as HTMLElement).click()

        expect(onAction).toHaveBeenCalledOnce()
        expect(onAction.mock.calls[0][0]).toMatchObject({ name: 'add_to_cart', surfaceId: 'main' })
    })
})
