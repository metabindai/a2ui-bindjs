import { describe, expect, it, vi } from 'vitest'

import { createStandardRegistry } from '../src/functions/registry'
import type { FunctionContext } from '../src/functions/types'
import { getAt, resolvePath } from '../src/store/jsonPointer'
import type { JsonValue } from '../src/protocol/types'

const registry = createStandardRegistry()

const dataModel = {
    start: '2026-02-02T15:17:05Z',
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
        call: (name, args) => registry.call(name, args, contextFor(overrides)),
        ...overrides,
    }
}

function call(name: string, args: Record<string, JsonValue | undefined>, overrides?: Partial<FunctionContext>): JsonValue {
    return registry.call(name, args, contextFor(overrides))
}

function validate(name: string, args: Record<string, JsonValue | undefined>): boolean {
    return call(name, args) as boolean
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

    // The spec's `formatString` allows renderer function calls inside a placeholder, with
    // named arguments and nested placeholders. These are the shapes the official examples use.
    it.each([
        ["${formatDate(value: ${/start}, format: 'E, MMM d')} • ${formatDate(value: ${/start}, format: 'h:mm a')}", 'Mon, Feb 2 • 3:17 PM'],
        ["Hello! Today is ${formatDate(value: ${/start}, format: 'EEEE, MMMM d')}.", 'Hello! Today is Monday, February 2.'],
        ["${formatCurrency(value: ${/price}, currency: 'USD')}/year", '$1,234.50/year'],
        ["(${formatNumber(value: ${/count})} ${pluralize(value: ${/count}, one: 'review', other: 'reviews')})", '(3 reviews)'],
        ['${/count}% of ${formatNumber(value: ${/price})} goal', '3% of 1,234.5 goal'],
        ["${pluralize(value: 1, one: 'item', other: 'items')}", 'item'],
    ])('interpolates a function call: %j', (template, expected) => {
        expect(call('formatString', { value: template }, { timeZone: 'UTC' })).toBe(expected)
    })

    it('leaves an unclosed placeholder as text, and reports an unknown call', () => {
        expect(call('formatString', { value: 'x ${/name' })).toBe('x ${/name')

        // Through the engine this becomes a RESOLVE_FAILED diagnostic, not a blank.
        expect(() => call('formatString', { value: 'a ${nope(value: 1)} b' })).toThrow(/Unknown function 'nope'/)
    })

    it("supports the spec's \\${ escape for a literal ${", () => {
        expect(call('formatString', { value: 'Use \\${/path} here' })).toBe('Use ${/path} here')
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
        expect(call('formatNumber', { value: 1234.5678, decimals: 1 })).toBe('1,234.6')
        expect(call('formatNumber', { value: 1234.5, decimals: 0 })).toBe('1,235')
        expect(call('formatNumber', { value: 1234567, grouping: false })).toBe('1234567')
        expect(call('formatCurrency', { value: 1234.5, currency: 'USD', decimals: 0 })).toBe('$1,235')
        expect(call('formatCurrency', { value: 1234.5, currency: 'USD', grouping: false })).toBe('$1234.50')
        expect(call('formatNumber', { value: '7' })).toBe('7')
        expect(call('formatNumber', { value: 'abc' })).toBe('abc')
    })

    it('formats currency', () => {
        expect(call('formatCurrency', { value: 1234.5, currency: 'USD' })).toBe('$1,234.50')
        expect(call('formatCurrency', { value: 10, currency: 'EUR' })).toBe('€10.00')
        expect(call('formatCurrency', { value: 10 })).toBe('$10.00')
    })

    it('formats dates without a pattern, as a medium date', () => {
        expect(call('formatDate', { value: '2026-02-02T15:17:00Z', timeZone: 'UTC' })).toBe('Feb 2, 2026')
        expect(call('formatDate', { value: '2026-02-02T15:17:00Z', dateStyle: 'short', timeZone: 'UTC' })).toBe('2/2/26')
        expect(call('formatDate', { value: 'not a date' })).toBe('not a date')
    })

    // The spec's `format` is a TR35 pattern. These are the ten the official examples use,
    // plus the tokens its reference lists, on a Monday afternoon in February.
    it.each([
        ['E', 'Mon'],
        ['EEEE', 'Monday'],
        ['d', '2'],
        ['dd', '02'],
        ['E, MMM d', 'Mon, Feb 2'],
        ['MMM d, yyyy', 'Feb 2, 2026'],
        ['MMMM d, yyyy', 'February 2, 2026'],
        ['h:mm a', '3:17 PM'],
        ['HH:mm', '15:17'],
        ['hh:mm:ss', '03:17:05'],
        ['MM/dd/yy', '02/02/26'],
        ["EEEE, MMM d 'at' h:mm a", 'Monday, Feb 2 at 3:17 PM'],
        ["EEEE, MMMM d, yyyy 'at' h:mm a", 'Monday, February 2, 2026 at 3:17 PM'],
        ["h 'o''clock'", "3 o'clock"],
    ])('formats a date with the pattern %j', (format, expected) => {
        expect(call('formatDate', { value: '2026-02-02T15:17:05Z', format, timeZone: 'UTC' })).toBe(expected)
    })

    it('formats a pattern in the locale it is asked for', () => {
        expect(call('formatDate', { value: '2026-02-02T15:17:00Z', format: 'EEEE d MMMM', timeZone: 'UTC' }, { locale: 'fr-FR' })).toBe(
            'lundi 2 février'
        )
    })

    it('formats a pattern in the context time zone', () => {
        expect(call('formatDate', { value: '2026-02-02T23:30:00Z', format: 'E h:mm a' }, { timeZone: 'Australia/Sydney' })).toBe(
            'Tue 10:30 AM'
        )
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
        expect(validate('required', { value: 'x' })).toBe(true)
        expect(validate('required', { value: 0 })).toBe(true)
        expect(validate('required', { value: '' })).toBe(false)
        expect(validate('required', { value: '   ' })).toBe(false)
        expect(validate('required', { value: null })).toBe(false)
        expect(validate('required', { value: [] })).toBe(false)
    })

    // The spec declares these as boolean, and only a boolean composes: the login example
    // gates its button on `and([email(...), length(...)])`.
    it('returns booleans that the logic functions can combine', () => {
        const gate = (email: string, password: string) =>
            call('and', {
                values: [call('email', { value: email }), call('length', { value: password, min: 8 })],
            })

        expect(gate('ada@example.com', 'correct horse')).toBe(true)
        expect(gate('nope', 'correct horse')).toBe(false)
        expect(gate('ada@example.com', 'short')).toBe(false)
        expect(call('not', { value: call('required', { value: '' }) })).toBe(true)
    })

    it('regex', () => {
        expect(validate('regex', { value: 'abc123', pattern: '^[a-z]+\\d+$' })).toBe(true)
        expect(validate('regex', { value: 'ABC', pattern: '^[a-z]+$' })).toBe(false)
        expect(validate('regex', { value: 'ABC', pattern: '^[a-z]+$', flags: 'i' })).toBe(true)
        expect(validate('regex', { value: 'x' })).toBe(false)
        expect(validate('regex', { value: 'x', pattern: '([' })).toBe(false)
    })

    it('length', () => {
        expect(validate('length', { value: 'abc', min: 2, max: 4 })).toBe(true)
        expect(validate('length', { value: 'a', min: 2 })).toBe(false)
        expect(validate('length', { value: 'abcde', max: 4 })).toBe(false)
        expect(validate('length', { value: ['a', 'b'], min: 2 })).toBe(true)
        expect(validate('length', { value: 5, min: 1 })).toBe(false)
    })

    it('numeric', () => {
        expect(validate('numeric', { value: 5 })).toBe(true)
        expect(validate('numeric', { value: '5' })).toBe(true)
        expect(validate('numeric', { value: 'five' })).toBe(false)
        expect(validate('numeric', { value: 5.5, integer: true })).toBe(false)
        expect(validate('numeric', { value: 1, min: 2 })).toBe(false)
        expect(validate('numeric', { value: 9, max: 5 })).toBe(false)
    })

    it('email', () => {
        expect(validate('email', { value: 'a@b.co' })).toBe(true)
        expect(validate('email', { value: 'a@b' })).toBe(false)
        expect(validate('email', { value: '' })).toBe(false)
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
