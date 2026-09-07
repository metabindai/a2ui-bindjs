/**
 * Colour names in the catalog must be ones BindJS knows.
 *
 * An unknown name does not throw — it silently produces no colour, so a control renders
 * without its background and, worse, appears not to respond when its state changes. That
 * is invisible to every other test we have: the AST is well formed, there are no
 * diagnostics, and nothing is logged.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/** From bindjs-react's `NamedColor` union in `ui/Styles/ColorStyle.ts`. */
const NAMED_COLORS = new Set([
    'clear',
    'red',
    'orange',
    'yellow',
    'green',
    'mint',
    'teal',
    'cyan',
    'blue',
    'indigo',
    'purple',
    'pink',
    'brown',
    'black',
    'white',
    'gray',
    'primary',
    'secondary',
    'tertiary',
    'quaternary',
    'accent',
    'background',
])

const catalogDir = fileURLToPath(new URL('../src/catalog/basic/', import.meta.url))

const sources = readdirSync(catalogDir)
    .filter((file) => file.endsWith('.js'))
    .map((file) => [file, readFileSync(`${catalogDir}${file}`, 'utf8')] as const)

/** Every string literal handed to `Color(...)`, including both arms of a ternary. */
function colorNames(source: string): string[] {
    const names: string[] = []

    for (const match of source.matchAll(/Color\(\s*["']([^"']+)["']/g)) {
        names.push(match[1])
    }

    for (const match of source.matchAll(/Color\(\s*[^)]*?\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']/g)) {
        names.push(match[1], match[2])
    }

    return names
}

describe('catalog colours', () => {
    it('finds colours to check', () => {
        expect(sources.flatMap(([, source]) => colorNames(source)).length).toBeGreaterThan(10)
    })

    it.each(sources)('%s uses only names BindJS knows', (_file, source) => {
        const unknown = colorNames(source).filter((name) => !name.startsWith('#') && !NAMED_COLORS.has(name))

        expect(unknown).toEqual([])
    })
})
