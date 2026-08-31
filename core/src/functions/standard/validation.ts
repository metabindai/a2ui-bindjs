/**
 * Validation functions: `required`, `regex`, `length`, `numeric`, `email`.
 * Each returns a `ValidationResult` rather than a display string.
 */
import type { JsonValue } from '../../protocol/types.js'
import { toDisplayString, toLength, toNumber } from '../coerce.js'
import type { FunctionInput, ValidationResult } from '../types.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function pass(): ValidationResult {
    return { valid: true }
}

/** Uses the caller-supplied `message` when present, so catalogs can localise failures. */
function fail(args: Record<string, JsonValue | undefined>, fallback: string): ValidationResult {
    const message = typeof args.message === 'string' ? args.message : fallback

    return { valid: false, message }
}

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
    returnType: 'validationResult',
    description: 'Fails when the value is null, undefined, blank, or an empty array.',

    invoke(args) {
        if (isEmpty(args.value)) {
            return fail(args, 'This field is required.')
        }

        return pass()
    },
}

const regex: FunctionInput = {
    name: 'regex',
    returnType: 'validationResult',
    description: 'Fails when the value does not match the given pattern.',

    invoke(args) {
        const pattern = args.pattern

        if (typeof pattern !== 'string') {
            return fail(args, 'regex requires a string `pattern` argument.')
        }

        const flags = typeof args.flags === 'string' ? args.flags : undefined
        const text = toDisplayString(args.value)

        try {
            if (new RegExp(pattern, flags).test(text)) {
                return pass()
            }
        } catch (error) {
            return fail(args, `Invalid pattern: ${(error as Error).message}`)
        }

        return fail(args, 'This value is not in the expected format.')
    },
}

const length: FunctionInput = {
    name: 'length',
    returnType: 'validationResult',
    description: 'Checks the length of a string or array against min / max.',

    invoke(args) {
        const size = toLength(args.value)

        if (size === undefined) {
            return fail(args, 'This value has no length.')
        }

        const min = toNumber(args.min)
        const max = toNumber(args.max)

        if (min !== undefined && size < min) {
            return fail(args, `Must be at least ${min} characters.`)
        }

        if (max !== undefined && size > max) {
            return fail(args, `Must be at most ${max} characters.`)
        }

        return pass()
    },
}

const numeric: FunctionInput = {
    name: 'numeric',
    returnType: 'validationResult',
    description: 'Checks that the value is a number, optionally an integer within min / max.',

    invoke(args) {
        const value = toNumber(args.value)

        if (value === undefined) {
            return fail(args, 'Must be a number.')
        }

        if (args.integer === true && !Number.isInteger(value)) {
            return fail(args, 'Must be a whole number.')
        }

        const min = toNumber(args.min)
        const max = toNumber(args.max)

        if (min !== undefined && value < min) {
            return fail(args, `Must be at least ${min}.`)
        }

        if (max !== undefined && value > max) {
            return fail(args, `Must be at most ${max}.`)
        }

        return pass()
    },
}

const email: FunctionInput = {
    name: 'email',
    returnType: 'validationResult',
    description: 'Checks that the value looks like an email address.',

    invoke(args) {
        if (EMAIL_PATTERN.test(toDisplayString(args.value))) {
            return pass()
        }

        return fail(args, 'Enter a valid email address.')
    },
}

export const VALIDATION_FUNCTIONS: FunctionInput[] = [required, regex, length, numeric, email]
