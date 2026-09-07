/**
 * Validation functions: `required`, `regex`, `length`, `numeric`, `email`.
 *
 * Each returns a boolean, as the spec declares. A `checks` rule carries its own
 * `message`, and the logic functions (`and`, `or`, `not`) coerce their operands, so a
 * boolean is the only return type that composes — the login example gates its button on
 * `and([email(...), length(...)])`, which an object result made unconditionally true.
 */
import type { JsonValue } from '../../protocol/types.js'
import { toDisplayString, toLength, toNumber } from '../coerce.js'
import type { FunctionInput } from '../types.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isEmpty(value: JsonValue | undefined): boolean {
    if (value === null || value === undefined) {
        return true
    }

    if (typeof value === 'string') {
        return value.trim() === ''
    }

    if (Array.isArray(value)) {
        return value.length === 0
    }

    return false
}

// ---------------------------------------------------------------------------
// MARK: - Functions
// ---------------------------------------------------------------------------

const required: FunctionInput = {
    name: 'required',
    returnType: 'boolean',
    description: 'False when the value is null, undefined, blank, or an empty array.',

    invoke(args) {
        return !isEmpty(args.value)
    },
}

const regex: FunctionInput = {
    name: 'regex',
    returnType: 'boolean',
    description: 'True when the value matches the given pattern.',

    invoke(args) {
        const pattern = args.pattern

        if (typeof pattern !== 'string') {
            return false
        }

        const flags = typeof args.flags === 'string' ? args.flags : undefined

        try {
            return new RegExp(pattern, flags).test(toDisplayString(args.value))
        } catch {
            return false
        }
    },
}

const length: FunctionInput = {
    name: 'length',
    returnType: 'boolean',
    description: 'True when the length of a string or array is within min / max.',

    invoke(args) {
        const size = toLength(args.value)

        if (size === undefined) {
            return false
        }

        const min = toNumber(args.min)
        const max = toNumber(args.max)

        if (min !== undefined && size < min) {
            return false
        }

        if (max !== undefined && size > max) {
            return false
        }

        return true
    },
}

const numeric: FunctionInput = {
    name: 'numeric',
    returnType: 'boolean',
    description: 'True when the value is a number, optionally an integer within min / max.',

    invoke(args) {
        const value = toNumber(args.value)

        if (value === undefined) {
            return false
        }

        if (args.integer === true && !Number.isInteger(value)) {
            return false
        }

        const min = toNumber(args.min)
        const max = toNumber(args.max)

        if (min !== undefined && value < min) {
            return false
        }

        if (max !== undefined && value > max) {
            return false
        }

        return true
    },
}

const email: FunctionInput = {
    name: 'email',
    returnType: 'boolean',
    description: 'True when the value looks like an email address.',

    invoke(args) {
        return EMAIL_PATTERN.test(toDisplayString(args.value))
    },
}

export const VALIDATION_FUNCTIONS: FunctionInput[] = [required, regex, length, numeric, email]
