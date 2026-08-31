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

/** Matches a `${...}` placeholder. `$${` is an escape for a literal `${`. */
const PLACEHOLDER = /\$\$\{|\$\{([^}]*)\}/g

/**
 * Interpolates `${/pointer}` placeholders in `args.value` against the data model.
 * `${@index}` yields the current template index. Unknown pointers become an empty string.
 */
export function interpolate(template: string, context: FunctionContext): string {
    return template.replace(PLACEHOLDER, (match, expression?: string) => {
        if (expression === undefined) {
            return '${'
        }

        const token = expression.trim()

        if (token === '@index') {
            return context.index === undefined ? '' : String(context.index)
        }

        return toDisplayString(context.getValue(token))
    })
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

function dateOptions(args: Record<string, JsonValue | undefined>, context: FunctionContext): Intl.DateTimeFormatOptions {
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

    const timeZone = typeof args.timeZone === 'string' ? args.timeZone : context.timeZone

    if (timeZone !== undefined) {
        options.timeZone = timeZone
    }

    return options
}

const formatDate: FunctionInput = {
    name: 'formatDate',
    returnType: 'string',
    description: 'Formats an ISO date string or epoch milliseconds for the current locale.',

    invoke(args, context) {
        const raw = args.value

        if (typeof raw !== 'string' && typeof raw !== 'number') {
            return toDisplayString(raw)
        }

        const date = new Date(raw)

        if (Number.isNaN(date.getTime())) {
            return toDisplayString(raw)
        }

        return new Intl.DateTimeFormat(context.locale, dateOptions(args, context)).format(date)
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
