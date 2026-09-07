/**
 * Argument coercion shared by the standard functions.
 * A2UI args arrive as plain JSON, so every function needs the same forgiving reads.
 */
import type { JsonValue } from '../protocol/types.js'

/**
 * Renders a value for display / interpolation.
 * `null` and `undefined` become an empty string; objects and arrays become compact JSON.
 */
export function toDisplayString(value: JsonValue | undefined): string {
    if (value === null || value === undefined) {
        return ''
    }

    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
    }

    return JSON.stringify(value)
}

/** Numbers pass through; numeric strings are parsed. Anything else is `undefined`. */
export function toNumber(value: JsonValue | undefined): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value)

        if (Number.isFinite(parsed)) {
            return parsed
        }
    }

    return undefined
}

/** JavaScript truthiness, except that the strings `'false'` and `''` are false. */
export function toBoolean(value: JsonValue | undefined): boolean {
    if (typeof value === 'string') {
        return value !== '' && value.toLowerCase() !== 'false'
    }

    return Boolean(value)
}

/** Reads the operand list of a logic function: either `args.values` or the args in key order. */
export function toOperands(args: Record<string, JsonValue | undefined>): Array<JsonValue | undefined> {
    if (Array.isArray(args.values)) {
        return args.values
    }

    if ('value' in args) {
        return [args.value]
    }

    return Object.values(args)
}

/** The length of a string or array, for `length` / `required`. */
export function toLength(value: JsonValue | undefined): number | undefined {
    if (typeof value === 'string' || Array.isArray(value)) {
        return value.length
    }

    return undefined
}
