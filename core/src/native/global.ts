/**
 * Entry point for the native bundle.
 *
 * Installs a single `a2ui` global for the host to call. Everything else about the bundle
 * is the same code the web renderer uses.
 */
import { A2UINativeBridge } from './bridge.js'

const bridge = new A2UINativeBridge()

// A plain global rather than a module export: JavaScriptCore evaluates this as a script,
// with no module loader to import through.
;(globalThis as unknown as Record<string, unknown>).a2ui = bridge

export { bridge }
