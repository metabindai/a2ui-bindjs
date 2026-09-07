/**
 * FunctionRegistry — name → implementation, plus the spec's caller boundary.
 *
 * Catalogs declare each function as `rendererOnly`, `agentOnly`, or `rendererOrAgent`;
 * calling across that boundary is an `INVALID_FUNCTION_CALL` error.
 */
import { A2UIProtocolError, isIdentifier } from '../protocol/parse.js'
import type { JsonValue } from '../protocol/types.js'
import { STANDARD_FUNCTIONS } from './standard/index.js'
import type { A2UIFunction, Caller, FunctionContext, FunctionInput } from './types.js'

export class FunctionRegistry {
    #functions = new Map<string, A2UIFunction>()

    constructor(functions: FunctionInput[] = []) {
        for (const fn of functions) {
            this.register(fn)
        }
    }

    // MARK: Registration

    /** Registers (or replaces) a function. Defaults `allowedCallers` to `rendererOrAgent`. */
    register(fn: FunctionInput): void {
        if (!isFunctionName(fn.name)) {
            throw new A2UIProtocolError(`'${fn.name}' is not a valid function name`, { code: 'INVALID_FUNCTION_CALL' })
        }

        this.#functions.set(fn.name, { allowedCallers: 'rendererOrAgent', ...fn })
    }

    unregister(name: string): void {
        this.#functions.delete(name)
    }

    // MARK: Reading

    get names(): string[] {
        return [...this.#functions.keys()]
    }

    has(name: string): boolean {
        return this.#functions.has(name)
    }

    get(name: string): A2UIFunction | undefined {
        return this.#functions.get(name)
    }

    /** Returns a copy with the same functions, for per-surface overrides. */
    clone(): FunctionRegistry {
        const copy = new FunctionRegistry()

        for (const fn of this.#functions.values()) {
            copy.register(fn)
        }

        return copy
    }

    // MARK: Invocation

    /** Looks up and invokes a function, enforcing the caller boundary. */
    call(name: string, args: Record<string, JsonValue | undefined>, context: FunctionContext, caller: Caller = 'renderer'): JsonValue {
        const fn = this.#functions.get(name)

        if (!fn) {
            throw new A2UIProtocolError(`Unknown function '${name}'`, { code: 'INVALID_FUNCTION_CALL' })
        }

        this.assertCallable(fn, caller)

        return fn.invoke(args, context)
    }

    /** Throws unless `caller` is permitted to invoke `fn`. */
    assertCallable(fn: A2UIFunction, caller: Caller): void {
        const permitted = fn.allowedCallers === 'rendererOrAgent' || fn.allowedCallers === `${caller}Only`

        if (permitted) {
            return
        }

        throw new A2UIProtocolError(`Function '${fn.name}' is ${fn.allowedCallers} and cannot be called by the ${caller}.`, {
            code: 'INVALID_FUNCTION_CALL',
        })
    }
}

/** A registry preloaded with the A2UI v1.0 standard functions. */
export function createStandardRegistry(extra: FunctionInput[] = []): FunctionRegistry {
    return new FunctionRegistry([...STANDARD_FUNCTIONS, ...extra])
}

/** Function names follow the component identifier rules, plus the reserved `@` system namespace. */
function isFunctionName(name: string): boolean {
    if (name.startsWith('@')) {
        return isIdentifier(name.slice(1))
    }

    return isIdentifier(name)
}
