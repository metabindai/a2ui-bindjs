/**
 * Logic functions: `and`, `or`, `not`.
 *
 * Operands are read from `args.values` when it is an array, otherwise from the
 * args in key order — so both `{ values: [a, b] }` and `{ a: …, b: … }` work.
 * Args are resolved before invocation, so these do not short-circuit.
 */
import { toBoolean, toOperands } from '../coerce.js'
import type { FunctionInput } from '../types.js'

const and: FunctionInput = {
    name: 'and',
    returnType: 'boolean',
    description: 'True when every operand is truthy.',

    invoke(args) {
        return toOperands(args).every(toBoolean)
    },
}

const or: FunctionInput = {
    name: 'or',
    returnType: 'boolean',
    description: 'True when any operand is truthy.',

    invoke(args) {
        return toOperands(args).some(toBoolean)
    },
}

const not: FunctionInput = {
    name: 'not',
    returnType: 'boolean',
    description: 'Negates its single operand.',

    invoke(args) {
        const [operand] = toOperands(args)

        return !toBoolean(operand)
    },
}

export const LOGIC_FUNCTIONS: FunctionInput[] = [and, or, not]
