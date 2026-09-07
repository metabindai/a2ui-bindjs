import { describe, expect, it, vi } from 'vitest'

import { A2UIProtocolError } from '../src/protocol/parse'
import { createStandardRegistry } from '../src/functions/registry'
import { resolveActionContext, resolveProps, resolveValue, type ResolveContext } from '../src/functions/resolve'
import type { A2UIComponent } from '../src/protocol/types'

const dataModel = {
    name: 'Ada',
    count: 2,
    contact: { email: 'ada@example.com' },
    employees: [
        { name: 'Grace', salary: 100 },
        { name: 'Linus', salary: 200 },
    ],
}

function contextFor(overrides: Partial<ResolveContext> = {}): ResolveContext {
    return { dataModel, registry: createStandardRegistry(), locale: 'en-US', ...overrides }
}

describe('resolveValue', () => {
    it('passes literals through', () => {
        const context = contextFor()

        expect(resolveValue('hello', context)).toBe('hello')
        expect(resolveValue(42, context)).toBe(42)
        expect(resolveValue(true, context)).toBe(true)
        expect(resolveValue(null, context)).toBeNull()
    })

    it('reads path bindings', () => {
        const context = contextFor()

        expect(resolveValue({ path: '/name' }, context)).toBe('Ada')
        expect(resolveValue({ path: '/contact/email' }, context)).toBe('ada@example.com')
        expect(resolveValue({ path: '/missing' }, context)).toBeUndefined()
    })

    it('reads relative bindings against the scope', () => {
        const context = contextFor({ scope: '/employees/1' })

        expect(resolveValue({ path: 'name' }, context)).toBe('Linus')
        expect(resolveValue({ path: '/name' }, context)).toBe('Ada')
    })

    it('invokes function calls', () => {
        const context = contextFor()

        expect(resolveValue({ call: 'formatString', args: { value: 'Hi ${/name}' } }, context)).toBe('Hi Ada')
        expect(resolveValue({ call: '@index' }, contextFor({ index: 7 }))).toBe(7)
    })

    it('resolves args before invoking, including nested calls', () => {
        const context = contextFor()

        const nested = {
            call: 'formatString',
            args: { value: { call: 'formatString', args: { value: 'Hi ${/name}' } } },
        }

        expect(resolveValue(nested, context)).toBe('Hi Ada')
        expect(resolveValue({ call: 'formatNumber', args: { value: { path: '/count' } } }, context)).toBe('2')
    })

    it('recurses into arrays and objects', () => {
        const context = contextFor()

        expect(resolveValue([{ path: '/name' }, 'x'], context)).toEqual(['Ada', 'x'])
        expect(resolveValue({ a: { path: '/name' }, b: { c: { path: '/count' } } }, context)).toEqual({ a: 'Ada', b: { c: 2 } })
    })

    it('throws on an unknown function by default', () => {
        expect(() => resolveValue({ call: 'nope' }, contextFor())).toThrow(A2UIProtocolError)
    })

    it('reports to onError instead of throwing when provided', () => {
        const onError = vi.fn()
        const value = resolveValue({ call: 'nope' }, contextFor({ onError }))

        expect(value).toBeUndefined()
        expect(onError).toHaveBeenCalledOnce()
        expect(onError.mock.calls[0][0]).toBeInstanceOf(A2UIProtocolError)
    })

    it('fails a call when no registry is configured', () => {
        expect(() => resolveValue({ call: 'formatString', args: {} }, { dataModel })).toThrow(/no function registry/)
    })

    it('enforces the caller boundary through the resolver', () => {
        const context = contextFor({ caller: 'agent' })

        expect(() => resolveValue({ call: 'openUrl', args: { url: 'x' } }, context)).toThrow(/rendererOnly/)
    })
})

describe('resolveProps', () => {
    const component: A2UIComponent = {
        id: 'email_field',
        component: 'TextField',
        catalogId: 'cat',
        child: 'label',
        children: ['a'],
        action: { event: { name: 'submit' } },
        label: 'Email',
        value: { path: '/contact/email' },
        variant: 'shortText',
        accessibility: { label: { path: '/name' } },
    }

    it('resolves catalog props and skips structural keys', () => {
        expect(resolveProps(component, contextFor())).toEqual({
            label: 'Email',
            value: 'ada@example.com',
            variant: 'shortText',
            accessibility: { label: 'Ada' },
        })
    })

    it('omits props whose binding resolves to nothing', () => {
        const missing: A2UIComponent = { id: 'x', component: 'Text', text: { path: '/nope' } }

        expect(resolveProps(missing, contextFor())).toEqual({})
    })

    it('resolves per-scope for template rows', () => {
        const row: A2UIComponent = { id: 'r', component: 'Text', text: { path: 'name' } }

        expect(resolveProps(row, contextFor({ scope: '/employees/0' }))).toEqual({ text: 'Grace' })
        expect(resolveProps(row, contextFor({ scope: '/employees/1' }))).toEqual({ text: 'Linus' })
    })
})

describe('resolveActionContext', () => {
    it('resolves the payload sent back to the agent', () => {
        const resolved = resolveActionContext({ itemId: '123', email: { path: '/contact/email' } }, contextFor())

        expect(resolved).toEqual({ itemId: '123', email: 'ada@example.com' })
    })

    it('returns undefined when there is no context', () => {
        expect(resolveActionContext(undefined, contextFor())).toBeUndefined()
    })
})
