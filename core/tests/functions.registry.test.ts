import { describe, expect, it, vi } from 'vitest'

import { A2UIProtocolError } from '../src/protocol/parse'
import { FunctionRegistry, createStandardRegistry } from '../src/functions/registry'
import type { FunctionContext } from '../src/functions/types'

const context: FunctionContext = { getValue: () => undefined, scope: '/' }

describe('FunctionRegistry', () => {
    it('preloads the standard function set', () => {
        const registry = createStandardRegistry()

        for (const name of ['formatString', 'formatNumber', 'formatCurrency', 'formatDate', 'pluralize']) {
            expect(registry.has(name)).toBe(true)
        }

        for (const name of ['required', 'regex', 'length', 'numeric', 'email']) {
            expect(registry.has(name)).toBe(true)
        }

        for (const name of ['and', 'or', 'not', 'openUrl', '@index']) {
            expect(registry.has(name)).toBe(true)
        }
    })

    it('defaults allowedCallers to rendererOrAgent', () => {
        const registry = new FunctionRegistry([{ name: 'custom', invoke: () => 1 }])

        expect(registry.get('custom')?.allowedCallers).toBe('rendererOrAgent')
    })

    it('registers, overrides and unregisters', () => {
        const registry = new FunctionRegistry([{ name: 'greet', invoke: () => 'hi' }])
        expect(registry.call('greet', {}, context)).toBe('hi')

        registry.register({ name: 'greet', invoke: () => 'hello' })
        expect(registry.call('greet', {}, context)).toBe('hello')

        registry.unregister('greet')
        expect(registry.has('greet')).toBe(false)
    })

    it('rejects invalid function names', () => {
        const registry = new FunctionRegistry()

        expect(() => registry.register({ name: '1bad', invoke: () => null })).toThrow(A2UIProtocolError)
        expect(() => registry.register({ name: 'has space', invoke: () => null })).toThrow(/not a valid function name/)
        expect(() => registry.register({ name: '@index', invoke: () => null })).not.toThrow()
    })

    it('throws INVALID_FUNCTION_CALL for unknown functions', () => {
        const registry = createStandardRegistry()

        try {
            registry.call('nope', {}, context)
            expect.fail('should throw')
        } catch (error) {
            expect((error as A2UIProtocolError).code).toBe('INVALID_FUNCTION_CALL')
            expect((error as Error).message).toMatch(/Unknown function/)
        }
    })

    it('enforces the caller boundary in both directions', () => {
        const registry = new FunctionRegistry([
            { name: 'rendererThing', allowedCallers: 'rendererOnly', invoke: () => 'r' },
            { name: 'agentThing', allowedCallers: 'agentOnly', invoke: () => 'a' },
            { name: 'either', allowedCallers: 'rendererOrAgent', invoke: () => 'e' },
        ])

        expect(registry.call('rendererThing', {}, context, 'renderer')).toBe('r')
        expect(() => registry.call('rendererThing', {}, context, 'agent')).toThrow(/rendererOnly/)

        expect(registry.call('agentThing', {}, context, 'agent')).toBe('a')
        expect(() => registry.call('agentThing', {}, context, 'renderer')).toThrow(/agentOnly/)

        expect(registry.call('either', {}, context, 'renderer')).toBe('e')
        expect(registry.call('either', {}, context, 'agent')).toBe('e')
    })

    it('clones without aliasing', () => {
        const registry = createStandardRegistry()
        const copy = registry.clone()

        copy.register({ name: 'formatString', invoke: () => 'overridden' })

        expect(copy.call('formatString', { value: 'x' }, context)).toBe('overridden')
        expect(registry.call('formatString', { value: 'x' }, context)).toBe('x')
    })

    it('passes args and context through to the implementation', () => {
        const invoke = vi.fn(() => 'ok')
        const registry = new FunctionRegistry([{ name: 'spy', invoke }])

        registry.call('spy', { a: 1 }, context)

        expect(invoke).toHaveBeenCalledWith({ a: 1 }, context)
    })
})
