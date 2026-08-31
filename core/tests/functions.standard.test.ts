import { describe, expect, it, vi } from 'vitest'

import { createStandardRegistry } from '../src/functions/registry'
import type { FunctionContext, ValidationResult } from '../src/functions/types'
import { getAt, resolvePath } from '../src/store/jsonPointer'
import type { JsonValue } from '../src/protocol/types'

const registry = createStandardRegistry()

const dataModel = {
    name: 'Ada',
    count: 3,
    price: 1234.5,
    profile: { city: 'London' },
    tags: ['a', 'b'],
    employees: [{ name: 'Grace' }, { name: 'Linus' }],
}

function contextFor(overrides: Partial<FunctionContext> = {}): FunctionContext {
    return {
        getValue: (path: string) => getAt(dataModel as JsonValue, resolvePath(path, overrides.scope ?? '/')),
        scope: '/',
        locale: 'en-US',
        ...overrides,
    }
}

function call(name: string, args: Record<string, JsonValue | undefined>, overrides?: Partial<FunctionContext>): JsonValue {
    return registry.call(name, args, contextFor(overrides))
}

function validate(name: string, args: Record<string, JsonValue | undefined>): ValidationResult {
    return call(name, args) as ValidationResult
}

describe('formatString', () => {
    it('returns a template with no placeholders unchanged', () => {
        expect(call('formatString', { value: 'Hello' })).toBe('Hello')
    })

    it('interpolates absolute pointers', () => {
        expect(call('formatString', { value: 'Hello, ${/name}!' })).toBe('Hello, Ada!')
        expect(call('formatString', { value: '${/profile/city} — ${/name}' })).toBe('London — Ada')
    })

    it('interpolates relative pointers against the scope', () => {
        expect(call('formatString', { value: 'Hi ${name}' }, { scope: '/employees/1' })).toBe('Hi Linus')
    })

    it('interpolates @index inside a template', () => {
        expect(call('formatString', { value: 'Row ${@index}' }, { index: 2 })).toBe('Row 2')
        expect(call('formatString', { value: 'Row ${@index}' })).toBe('Row ')
    })

    it('renders missing paths as empty and objects as JSON', () => {
        expect(call('formatString', { value: 'x${/nope}y' })).toBe('xy')
        expect(call('formatString', { value: '${/profile}' })).toBe('{"city":"London"}')
        expect(call('formatString', { value: '${/count}' })).toBe('3')
    })

    it('supports $${ as an escape for a literal ${', () => {
        expect(call('formatString', { value: '$${/name}' })).toBe('${/name}')
    })

    it('stringifies a non-string template', () => {
        expect(call('formatString', { value: 42 })).toBe('42')
    })
})

describe('number and date formatting', () => {
    it('formats numbers', () => {
        expect(call('formatNumber', { value: 1234.5 })).toBe('1,234.5')
        expect(call('formatNumber', { value: 1234.5, minimumFractionDigits: 2 })).toBe('1,234.50')
        expect(call('formatNumber', { value: '7' })).toBe('7')
        expect(call('formatNumber', { value: 'abc' })).toBe('abc')
    })

    it('formats currency', () => {
        expect(call('formatCurrency', { value: 1234.5, currency: 'USD' })).toBe('$1,234.50')
        expect(call('formatCurrency', { value: 10, currency: 'EUR' })).toBe('€10.00')
        expect(call('formatCurrency', { value: 10 })).toBe('$10.00')
    })

    it('formats dates', () => {
        expect(call('formatDate', { value: '2026-02-02T15:17:00Z', timeZone: 'UTC' })).toBe('Feb 2, 2026')
        expect(call('formatDate', { value: '2026-02-02T15:17:00Z', dateStyle: 'short', timeZone: 'UTC' })).toBe('2/2/26')
        expect(call('formatDate', { value: 'not a date' })).toBe('not a date')
    })

    it('pluralizes', () => {
        expect(call('pluralize', { value: 1, one: 'item', other: 'items' })).toBe('item')
        expect(call('pluralize', { value: 3, one: 'item', other: 'items' })).toBe('items')
        expect(call('pluralize', { value: 0, one: 'item', other: 'items' })).toBe('items')
        expect(call('pluralize', { value: 0, zero: 'nothing', one: 'item', other: 'items' })).toBe('items')
    })
})

describe('validation functions', () => {
    it('required', () => {
        expect(validate('required', { value: 'x' }).valid).toBe(true)
        expect(validate('required', { value: 0 }).valid).toBe(true)
        expect(validate('required', { value: '' }).valid).toBe(false)
        expect(validate('required', { value: '   ' }).valid).toBe(false)
        expect(validate('required', { value: null }).valid).toBe(false)
        expect(validate('required', { value: [] }).valid).toBe(false)
    })

    it('uses a caller-supplied message', () => {
        expect(validate('required', { value: '', message: 'Naam is verplicht' }).message).toBe('Naam is verplicht')
        expect(validate('required', { value: '' }).message).toBe('This field is required.')
    })

    it('regex', () => {
        expect(validate('regex', { value: 'abc123', pattern: '^[a-z]+\\d+$' }).valid).toBe(true)
        expect(validate('regex', { value: 'ABC', pattern: '^[a-z]+$' }).valid).toBe(false)
        expect(validate('regex', { value: 'ABC', pattern: '^[a-z]+$', flags: 'i' }).valid).toBe(true)
        expect(validate('regex', { value: 'x' }).valid).toBe(false)
        expect(validate('regex', { value: 'x', pattern: '([' }).valid).toBe(false)
    })

    it('length', () => {
        expect(validate('length', { value: 'abc', min: 2, max: 4 }).valid).toBe(true)
        expect(validate('length', { value: 'a', min: 2 }).valid).toBe(false)
        expect(validate('length', { value: 'abcde', max: 4 }).valid).toBe(false)
        expect(validate('length', { value: ['a', 'b'], min: 2 }).valid).toBe(true)
        expect(validate('length', { value: 5, min: 1 }).valid).toBe(false)
    })

    it('numeric', () => {
        expect(validate('numeric', { value: 5 }).valid).toBe(true)
        expect(validate('numeric', { value: '5' }).valid).toBe(true)
        expect(validate('numeric', { value: 'five' }).valid).toBe(false)
        expect(validate('numeric', { value: 5.5, integer: true }).valid).toBe(false)
        expect(validate('numeric', { value: 1, min: 2 }).valid).toBe(false)
        expect(validate('numeric', { value: 9, max: 5 }).valid).toBe(false)
    })

    it('email', () => {
        expect(validate('email', { value: 'a@b.co' }).valid).toBe(true)
        expect(validate('email', { value: 'a@b' }).valid).toBe(false)
        expect(validate('email', { value: '' }).valid).toBe(false)
    })
})

describe('logic functions', () => {
    it('reads operands from values or from the args in key order', () => {
        expect(call('and', { values: [true, true] })).toBe(true)
        expect(call('and', { a: true, b: false })).toBe(false)
        expect(call('or', { values: [false, true] })).toBe(true)
        expect(call('or', { values: [false, false] })).toBe(false)
        expect(call('not', { value: false })).toBe(true)
        expect(call('not', { value: 'true' })).toBe(false)
    })

    it("treats the string 'false' and empty strings as false", () => {
        expect(call('and', { values: ['false'] })).toBe(false)
        expect(call('and', { values: [''] })).toBe(false)
        expect(call('and', { values: ['x'] })).toBe(true)
    })
})

describe('system functions', () => {
    it('@index returns the template index', () => {
        expect(call('@index', {}, { index: 4 })).toBe(4)
        expect(call('@index', {})).toBe(-1)
    })

    it('openUrl calls the host hook and is renderer-only', () => {
        const openUrl = vi.fn()

        expect(call('openUrl', { url: 'https://example.com' }, { openUrl })).toBeNull()
        expect(openUrl).toHaveBeenCalledWith('https://example.com', undefined)

        expect(() => registry.call('openUrl', { url: 'x' }, contextFor(), 'agent')).toThrow(/rendererOnly/)
    })

    it('openUrl is a no-op without a host hook', () => {
        expect(() => call('openUrl', { url: 'https://example.com' })).not.toThrow()
    })
})
