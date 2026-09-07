/**
 * `Icon` names must be translated, and the table must cover the spec exactly.
 *
 * A2UI names icons in its own vocabulary; `Image({ systemName })` resolves against SF
 * Symbols, and bindjs-android maps those SF names onto Material icons. An untranslated
 * name is invisible to every other test we have — the AST is well formed, there are no
 * diagnostics, nothing is logged, and the glyph is simply absent while its frame keeps
 * reserving the space.
 *
 * The expectations come from `vendor/spec/`, so an icon added upstream fails here rather
 * than falling through to the placeholder unnoticed.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('../src/catalog/basic/A2UIIcon.js', import.meta.url)), 'utf8')

const catalog = JSON.parse(
    readFileSync(fileURLToPath(new URL('../../vendor/spec/v1_0/catalogs/basic/catalog.json', import.meta.url)), 'utf8')
)

// MARK: - The two vocabularies

/** The 59 names an agent may send, straight from the schema's `oneOf` string arm. */
function specIconNames(): string[] {
    const blocks = catalog.components.Icon.allOf as Array<{ properties?: Record<string, { oneOf?: Array<{ enum?: string[] }> }> }>

    for (const block of blocks) {
        const arms = block.properties?.name?.oneOf ?? []

        for (const arm of arms) {
            if (arm.enum) {
                return arm.enum
            }
        }
    }

    throw new Error('The spec catalog no longer declares Icon.name as an enum.')
}

/** The catalog's own table, read out of the source the way `colors.test.ts` reads colours. */
function symbolTable(): Map<string, string> {
    const block = /const SYMBOLS = \{([\s\S]*?)\n\}/.exec(source)

    if (!block) {
        throw new Error('A2UIIcon.js no longer declares a SYMBOLS table.')
    }

    const table = new Map<string, string>()

    for (const match of block[1].matchAll(/^\s*([A-Za-z]+):\s*"([^"]+)"/gm)) {
        table.set(match[1], match[2])
    }

    return table
}

// MARK: - Tests

describe('A2UIIcon', () => {
    it('translates every name the spec allows', () => {
        const table = symbolTable()
        const missing = specIconNames().filter((name) => !table.has(name))

        expect(missing).toEqual([])
    })

    it('carries no name the spec does not allow', () => {
        const allowed = new Set(specIconNames())
        const extra = [...symbolTable().keys()].filter((name) => !allowed.has(name))

        expect(extra).toEqual([])
    })

    it('maps onto SF Symbol names, not A2UI ones', () => {
        // A table can look full and still forward its input. Names that agree with their
        // symbol are fine — `camera`, `folder` and `photo` really are called that in both
        // vocabularies — but a camelCase one never can be: SF Symbols are lowercase words
        // joined by dots, so `shoppingCart` mapping to `shoppingCart` is a missing entry
        // wearing a present one's clothes.
        const compound = [...symbolTable()].filter(([name]) => /[A-Z]/.test(name))
        const forwarded = compound.filter(([name, symbol]) => name === symbol)

        expect(compound.length).toBeGreaterThan(10)
        expect(forwarded).toEqual([])
    })

    it('does not send an unknown name through as a symbol', () => {
        expect(source).toContain('FALLBACK_SYMBOL')
    })
})
