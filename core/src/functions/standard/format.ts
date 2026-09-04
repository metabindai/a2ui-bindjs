/**
 * Formatting functions: `formatString`, `formatNumber`, `formatCurrency`,
 * `formatDate`, `pluralize`.
 */
import type { JsonValue } from '../../protocol/types.js'
import { toDisplayString, toNumber } from '../coerce.js'
import type { FunctionContext, FunctionInput } from '../types.js'

// ---------------------------------------------------------------------------
// MARK: - formatString
// ---------------------------------------------------------------------------

/**
 * Interpolates a template against the data model and the function registry.
 *
 * A placeholder is `${expression}`, where the expression is a JSON Pointer (`/absolute`
 * or `relative`, resolved against the scope), `@index`, or a renderer function call with
 * named arguments — `${formatDate(value: ${/start}, format: 'h:mm a')}`. Argument values
 * are nested placeholders, quoted strings, numbers, booleans or null. Braces are matched,
 * so a call's own `}` does not end the placeholder around it; that was the bug that
 * printed `, format: 'E, MMM d')` on screen.
 *
 * `\${` is the spec's escape for a literal `${`; `$${` is kept because this package
 * accepted it first. An unclosed placeholder is copied through as text.
 */
export function interpolate(template: string, context: FunctionContext): string {
    let output = ''
    let index = 0

    while (index < template.length) {
        if (template.startsWith('\\${', index) || template.startsWith('$${', index)) {
            output += '${'
            index += 3
        } else if (template.startsWith('${', index)) {
            const close = placeholderEnd(template, index + 2)

            if (close === -1) {
                output += template.slice(index)
                break
            }

            output += toDisplayString(evaluate(template.slice(index + 2, close).trim(), context))
            index = close + 1
        } else {
            output += template[index]
            index += 1
        }
    }

    return output
}

/** Index of the `}` closing a placeholder whose body starts at `start`, or -1. */
function placeholderEnd(template: string, start: number): number {
    let depth = 1
    let quote: string | undefined
    let index = start

    while (index < template.length) {
        const character = template[index]

        if (quote !== undefined) {
            if (character === quote) {
                quote = undefined
            }
        } else if (character === "'" || character === '"') {
            quote = character
        } else if (template.startsWith('${', index)) {
            depth += 1
            index += 1
        } else if (character === '}') {
            depth -= 1

            if (depth === 0) {
                return index
            }
        }

        index += 1
    }

    return -1
}

const CALL = /^([A-Za-z_][A-Za-z0-9_]*)\s*\(([\s\S]*)\)$/

/** A placeholder body: a pointer, `@index`, or `name(key: value, …)`. */
function evaluate(expression: string, context: FunctionContext): JsonValue | undefined {
    if (expression === '@index') {
        return context.index
    }

    const call = CALL.exec(expression)

    if (call === null) {
        return context.getValue(expression)
    }

    if (context.call === undefined) {
        return undefined
    }

    return context.call(call[1], parseArguments(call[2], context))
}

/** `key: value, key: value` at the top level — commas inside quotes or nesting do not split. */
function parseArguments(text: string, context: FunctionContext): Record<string, JsonValue | undefined> {
    const args: Record<string, JsonValue | undefined> = {}

    for (const pair of splitTopLevel(text)) {
        const colon = pair.indexOf(':')

        if (colon === -1) {
            continue
        }

        const key = pair.slice(0, colon).trim()
        const value = pair.slice(colon + 1).trim()

        if (key !== '') {
            args[key] = parseValue(value, context)
        }
    }

    return args
}

function splitTopLevel(text: string): string[] {
    const pieces: string[] = []
    let depth = 0
    let quote: string | undefined
    let current = ''

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index]

        if (quote !== undefined) {
            current += character

            if (character === quote) {
                quote = undefined
            }
        } else if (character === "'" || character === '"') {
            quote = character
            current += character
        } else if (character === '(' || character === '{') {
            depth += 1
            current += character
        } else if (character === ')' || character === '}') {
            depth -= 1
            current += character
        } else if (character === ',' && depth === 0) {
            pieces.push(current)
            current = ''
        } else {
            current += character
        }
    }

    if (current.trim() !== '') {
        pieces.push(current)
    }

    return pieces
}

/** An argument value. A nested placeholder keeps its JSON type, so dates and numbers survive. */
function parseValue(text: string, context: FunctionContext): JsonValue | undefined {
    if (text.startsWith('${') && text.endsWith('}')) {
        return evaluate(text.slice(2, -1).trim(), context)
    }

    const quoted = /^(['"])([\s\S]*)\1$/.exec(text)

    if (quoted !== null) {
        return quoted[2]
    }

    if (/^-?\d+(\.\d+)?$/.test(text)) {
        return Number(text)
    }

    if (text === 'true') {
        return true
    }

    if (text === 'false') {
        return false
    }

    if (text === 'null') {
        return null
    }

    return text
}

const formatString: FunctionInput = {
    name: 'formatString',
    returnType: 'string',
    description: 'Interpolates ${/pointer} placeholders into a template string.',

    invoke(args, context) {
        const template = args.value

        if (typeof template !== 'string') {
            return toDisplayString(template)
        }

        return interpolate(template, context)
    },
}

// ---------------------------------------------------------------------------
// MARK: - Number formatting
// ---------------------------------------------------------------------------

function numberOptions(args: Record<string, JsonValue | undefined>): Intl.NumberFormatOptions {
    const options: Intl.NumberFormatOptions = {}
    const minimumFractionDigits = toNumber(args.minimumFractionDigits)
    const maximumFractionDigits = toNumber(args.maximumFractionDigits)

    if (minimumFractionDigits !== undefined) {
        options.minimumFractionDigits = minimumFractionDigits
    }

    if (maximumFractionDigits !== undefined) {
        options.maximumFractionDigits = maximumFractionDigits
    }

    if (typeof args.style === 'string') {
        options.style = args.style as Intl.NumberFormatOptions['style']
    }

    return options
}

const formatNumber: FunctionInput = {
    name: 'formatNumber',
    returnType: 'string',
    description: 'Formats a number for the current locale.',

    invoke(args, context) {
        const value = toNumber(args.value)

        if (value === undefined) {
            return toDisplayString(args.value)
        }

        return new Intl.NumberFormat(context.locale, numberOptions(args)).format(value)
    },
}

const formatCurrency: FunctionInput = {
    name: 'formatCurrency',
    returnType: 'string',
    description: 'Formats a number as a currency amount.',

    invoke(args, context) {
        const value = toNumber(args.value)

        if (value === undefined) {
            return toDisplayString(args.value)
        }

        const currency = typeof args.currency === 'string' ? args.currency : 'USD'
        const options: Intl.NumberFormatOptions = { ...numberOptions(args), style: 'currency', currency }

        return new Intl.NumberFormat(context.locale, options).format(value)
    },
}

// ---------------------------------------------------------------------------
// MARK: - Date formatting
// ---------------------------------------------------------------------------

type DateStyle = 'full' | 'long' | 'medium' | 'short'

/**
 * The non-spec fallback, used only when `format` is absent: `dateStyle` / `timeStyle` in
 * `Intl` terms, defaulting to a medium date.
 */
function dateOptions(args: Record<string, JsonValue | undefined>, timeZone: string | undefined): Intl.DateTimeFormatOptions {
    const options: Intl.DateTimeFormatOptions = {}

    if (typeof args.dateStyle === 'string') {
        options.dateStyle = args.dateStyle as DateStyle
    }

    if (typeof args.timeStyle === 'string') {
        options.timeStyle = args.timeStyle as DateStyle
    }

    if (options.dateStyle === undefined && options.timeStyle === undefined) {
        options.dateStyle = 'medium'
    }

    if (timeZone !== undefined) {
        options.timeZone = timeZone
    }

    return options
}

/**
 * One TR35 field, as the `Intl` options that produce it and the part to read back.
 *
 * `Intl` has no pattern formatter, so each field is formatted on its own and picked out of
 * `formatToParts` — which is what keeps the locale's own names (`Tue`, `janv.`) while the
 * pattern decides the layout and punctuation.
 */
interface DateField {
    options: Intl.DateTimeFormatOptions
    part: Intl.DateTimeFormatPartTypes
}

const DATE_FIELDS: Record<string, DateField> = {
    yy: { options: { year: '2-digit' }, part: 'year' },
    yyyy: { options: { year: 'numeric' }, part: 'year' },
    M: { options: { month: 'numeric' }, part: 'month' },
    MM: { options: { month: '2-digit' }, part: 'month' },
    MMM: { options: { month: 'short' }, part: 'month' },
    MMMM: { options: { month: 'long' }, part: 'month' },
    d: { options: { day: 'numeric' }, part: 'day' },
    dd: { options: { day: '2-digit' }, part: 'day' },
    E: { options: { weekday: 'short' }, part: 'weekday' },
    EE: { options: { weekday: 'short' }, part: 'weekday' },
    EEE: { options: { weekday: 'short' }, part: 'weekday' },
    EEEE: { options: { weekday: 'long' }, part: 'weekday' },
    h: { options: { hour: 'numeric', hour12: true }, part: 'hour' },
    hh: { options: { hour: '2-digit', hour12: true }, part: 'hour' },
    H: { options: { hour: 'numeric', hourCycle: 'h23' }, part: 'hour' },
    HH: { options: { hour: '2-digit', hourCycle: 'h23' }, part: 'hour' },
    m: { options: { minute: 'numeric' }, part: 'minute' },
    mm: { options: { minute: '2-digit' }, part: 'minute' },
    s: { options: { second: 'numeric' }, part: 'second' },
    ss: { options: { second: '2-digit' }, part: 'second' },
    a: { options: { hour: 'numeric', hour12: true }, part: 'dayPeriod' },
}

/** Formats one field; the two-digit forms are padded here because `Intl` will not always. */
function dateField(token: string, date: Date, locale: string | undefined, timeZone: string | undefined): string {
    const field = DATE_FIELDS[token]

    if (field === undefined) {
        return token
    }

    const options: Intl.DateTimeFormatOptions = { ...field.options }

    if (timeZone !== undefined) {
        options.timeZone = timeZone
    }

    const parts = new Intl.DateTimeFormat(locale, options).formatToParts(date)
    const value = parts.find((part) => part.type === field.part)?.value ?? ''
    const padded = token.length === 2 && token !== 'yy' && /^\d$/.test(value)

    return padded ? `0${value}` : value
}

/**
 * Formats a date with a Unicode TR35 pattern, which is what the spec's `format` is.
 *
 * Runs of one letter are fields, text in single quotes is literal (`''` is one quote), and
 * everything else is copied through — so `EEEE, MMM d 'at' h:mm a` gives
 * `Friday, Jan 16 at 2:30 PM`.
 */
function formatDatePattern(pattern: string, date: Date, locale: string | undefined, timeZone: string | undefined): string {
    let output = ''
    let index = 0

    while (index < pattern.length) {
        const character = pattern[index]

        if (character === "'") {
            if (pattern[index + 1] === "'") {
                output += "'"
                index += 2
                continue
            }

            // Inside a quoted run, a doubled quote is one literal quote.
            index += 1

            while (index < pattern.length) {
                if (pattern[index] === "'" && pattern[index + 1] === "'") {
                    output += "'"
                    index += 2
                } else if (pattern[index] === "'") {
                    index += 1
                    break
                } else {
                    output += pattern[index]
                    index += 1
                }
            }
        } else if (/[A-Za-z]/.test(character)) {
            let end = index

            while (end < pattern.length && pattern[end] === character) {
                end += 1
            }

            output += dateField(pattern.slice(index, end), date, locale, timeZone)
            index = end
        } else {
            output += character
            index += 1
        }
    }

    return output
}

const formatDate: FunctionInput = {
    name: 'formatDate',
    returnType: 'string',
    description: 'Formats an ISO date string or epoch milliseconds with a TR35 pattern, for the current locale.',

    invoke(args, context) {
        const raw = args.value

        if (typeof raw !== 'string' && typeof raw !== 'number') {
            return toDisplayString(raw)
        }

        const date = new Date(raw)

        if (Number.isNaN(date.getTime())) {
            return toDisplayString(raw)
        }

        const timeZone = typeof args.timeZone === 'string' ? args.timeZone : context.timeZone

        if (typeof args.format === 'string' && args.format !== '') {
            return formatDatePattern(args.format, date, context.locale, timeZone)
        }

        return new Intl.DateTimeFormat(context.locale, dateOptions(args, timeZone)).format(date)
    },
}

// ---------------------------------------------------------------------------
// MARK: - pluralize
// ---------------------------------------------------------------------------

const pluralize: FunctionInput = {
    name: 'pluralize',
    returnType: 'string',
    description: 'Picks a plural form (zero/one/two/few/many/other) for a count.',

    invoke(args, context) {
        const count = toNumber(args.value ?? args.count) ?? 0
        const category = new Intl.PluralRules(context.locale).select(count)
        const chosen = args[category] ?? args.other

        return toDisplayString(chosen)
    },
}

export const FORMAT_FUNCTIONS: FunctionInput[] = [formatString, formatNumber, formatCurrency, formatDate, pluralize]
