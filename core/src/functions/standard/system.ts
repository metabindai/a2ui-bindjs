/**
 * System functions: `@index` (reserved `@` namespace) and the side-effecting `openUrl`.
 */
import type { FunctionInput } from '../types.js'

const index: FunctionInput = {
    name: '@index',
    returnType: 'number',
    description: 'Zero-based index of the current template element.',

    invoke(_args, context) {
        return context.index ?? -1
    },
}

const openUrl: FunctionInput = {
    name: 'openUrl',
    allowedCallers: 'rendererOnly',
    returnType: 'null',
    description: 'Opens a URL on the renderer. Requires a host `openUrl` hook.',

    invoke(args, context) {
        if (typeof args.url !== 'string') {
            return null
        }

        const target = typeof args.target === 'string' ? args.target : undefined

        context.openUrl?.(args.url, target)

        return null
    },
}

export const SYSTEM_FUNCTIONS: FunctionInput[] = [index, openUrl]
