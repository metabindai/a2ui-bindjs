/**
 * RFC 6901 JSON Pointer helpers over plain JSON data.
 * All mutating helpers return new objects along the touched path (structural sharing).
 */
import type { JsonValue } from '../protocol/types.js'

// ---------------------------------------------------------------------------
// MARK: - Pointer parsing
// ---------------------------------------------------------------------------

export function isAbsolutePath(path: string): boolean {
    return path.startsWith('/')
}

export function parsePointer(path: string): string[] {
    if (path === '' || path === '/') {
        return []
    }

    const body = path.startsWith('/') ? path.slice(1) : path

    return body.split('/').map(unescapeToken)
}

export function joinPointer(tokens: string[]): string {
    if (tokens.length === 0) {
        return '/'
    }

    return '/' + tokens.map(escapeToken).join('/')
}

/** Resolves a (possibly relative) pointer against a scope pointer. Absolute paths ignore the scope. */
export function resolvePath(path: string, scope = '/'): string {
    if (isAbsolutePath(path)) {
        return joinPointer(parsePointer(path))
    }

    if (path === '') {
        return joinPointer(parsePointer(scope))
    }

    return joinPointer([...parsePointer(scope), ...parsePointer(path)])
}

export function escapeToken(token: string): string {
    return token.replace(/~/g, '~0').replace(/\//g, '~1')
}

export function unescapeToken(token: string): string {
    return token.replace(/~1/g, '/').replace(/~0/g, '~')
}

// ---------------------------------------------------------------------------
// MARK: - Reading
// ---------------------------------------------------------------------------

export function getAt(data: JsonValue | undefined, path: string): JsonValue | undefined {
    let current: JsonValue | undefined = data

    for (const token of parsePointer(path)) {
        if (current === null || current === undefined) {
            return undefined
        }

        if (Array.isArray(current)) {
            const index = Number(token)

            if (!Number.isInteger(index)) {
                return undefined
            }

            current = current[index]
            continue
        }

        if (typeof current === 'object') {
            current = (current as Record<string, JsonValue>)[token]
            continue
        }

        return undefined
    }

    return current
}

// ---------------------------------------------------------------------------
// MARK: - Writing
// ---------------------------------------------------------------------------

/**
 * Upsert `value` at `path`, creating intermediate objects (or arrays for numeric tokens) as needed.
 * `path` of `/` replaces the whole document.
 */
export function setAt(data: JsonValue | undefined, path: string, value: JsonValue): JsonValue {
    const tokens = parsePointer(path)

    if (tokens.length === 0) {
        return value
    }

    return setTokens(data, tokens, value)
}

function setTokens(node: JsonValue | undefined, tokens: string[], value: JsonValue): JsonValue {
    const [head, ...rest] = tokens
    const isIndexToken = /^\d+$/.test(head) || head === '-'
    const shouldBeArray = Array.isArray(node) || (node == null && isIndexToken)

    if (shouldBeArray) {
        const array: JsonValue[] = Array.isArray(node) ? [...node] : []
        const index = head === '-' ? array.length : Number(head)

        array[index] = rest.length > 0 ? setTokens(array[index], rest, value) : value

        return array
    }

    const isObject = node !== null && typeof node === 'object' && !Array.isArray(node)
    const object: Record<string, JsonValue> = isObject ? { ...(node as Record<string, JsonValue>) } : {}

    object[head] = rest.length > 0 ? setTokens(object[head], rest, value) : value

    return object
}

/** Deletes the key / element at `path`. Deleting `/` yields an empty object. Missing paths are a no-op. */
export function deleteAt(data: JsonValue | undefined, path: string): JsonValue {
    const tokens = parsePointer(path)

    if (tokens.length === 0) {
        return {}
    }

    return deleteTokens(data, tokens) ?? {}
}

function deleteTokens(node: JsonValue | undefined, tokens: string[]): JsonValue | undefined {
    if (node === null || node === undefined || typeof node !== 'object') {
        return node
    }

    const [head, ...rest] = tokens

    if (Array.isArray(node)) {
        const index = Number(head)
        const inRange = Number.isInteger(index) && index >= 0 && index < node.length

        if (!inRange) {
            return node
        }

        const array = [...node]

        if (rest.length > 0) {
            array[index] = deleteTokens(array[index], rest) as JsonValue
        } else {
            array.splice(index, 1)
        }

        return array
    }

    if (!(head in node)) {
        return node
    }

    const object = { ...(node as Record<string, JsonValue>) }

    if (rest.length > 0) {
        object[head] = deleteTokens(object[head], rest) as JsonValue
    } else {
        delete object[head]
    }

    return object
}
