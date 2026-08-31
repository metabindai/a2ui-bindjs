/**
 * The official A2UI conformance suite, run against this renderer.
 *
 * A2UI ships a language-agnostic suite of YAML cases (`conformance/`) so implementations
 * can show behavioural parity rather than assert it. This harness follows the convention
 * the project documents — read the YAML, feed each payload to our implementation, assert
 * the outcome matches — modelled on the Python SDK's reference harness at
 * `agent_sdks/python/a2ui_agent/tests/conformance/test_conformance.py`.
 *
 * Two things are deliberately out of scope, and are reported as skips rather than quietly
 * omitted:
 *
 *   - **v0.8 payloads.** They use a different vocabulary (`beginRendering`,
 *     `surfaceUpdate`), which this renderer rejects by design. 0.9.1 and 1.0 are supported.
 *   - **Catalog and accessibility operations** (`prune`, `load`, `render`,
 *     `remove_strict_validation`, `verify_cuttable_keys`, `accessibility_check`). Those are
 *     agent-SDK concerns — pruning a catalog before prompting a model, running axe-core —
 *     not things a renderer does. The `agent/` and `extensions/` suites are omitted for the
 *     same reason.
 *
 * Cases this renderer does not yet satisfy are listed in `KNOWN_GAPS` and run with
 * `it.fails`, so they stay visible and counted rather than quietly excluded — and so that
 * closing a gap turns the suite red until the entry is removed.
 *
 * The summary printed at the end is the number to quote, and it counts gaps and skips out
 * loud.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

import { parseMessage } from '../src/protocol/parse'
import { validateMessages } from '../src/validation/validate'
import type { AgentMessage } from '../src/protocol/types'

// MARK: - The suite

const suiteDir = fileURLToPath(new URL('../../vendor/conformance/', import.meta.url))

/** Actions this renderer has an equivalent for. Everything else is an agent-SDK operation. */
const SUPPORTED_ACTIONS = new Set(['validate'])

/** Message vocabularies this renderer accepts. 0.8 is a different protocol, not a flag. */
const SUPPORTED_VERSIONS = new Set(['0.9', '1.0'])

/**
 * Cases that fail today, and why.
 *
 * All of them are the same missing piece: a validator that checks the component *graph*
 * rather than each message's shape. `parseMessage` answers "is this a well-formed message";
 * nothing yet answers "do these components refer to each other sensibly".
 *
 * The renderer degrades instead — an unresolvable child becomes a diagnostic and the rest
 * of the surface still draws, and the engine does catch cycles at render time. That is
 * defensible behaviour for a renderer, but it is not what the suite asks for, and a host
 * that wants to reject a bad payload up front (and answer the agent with `error`) has no
 * way to ask.
 */
const KNOWN_GAPS: Record<string, string> = {
    // Full message-schema validation. The parser checks a message's shape and the
    // validator checks the component graph; neither enforces every field rule the v0.9
    // schema states — `version` required and drawn from a known set, `surfaceId` typed,
    // `catalogId` required. Enforcing them would reject messages this renderer accepts
    // today by design, so it is a decision rather than an oversight.
    test_validator_0_9: 'message fields are not validated against the full schema',

    // Needs a JSON Schema validator to check component properties against the catalog
    // definition, and `core/` ships with no runtime dependencies — the bundle build fails
    // if one appears. A host that wants this can validate with its own before applying.
    test_custom_catalog_validation_failure_v09:
        'component properties are not checked against the catalog schema; core carries no JSON Schema validator',
}

interface ConformanceStep {
    payload?: unknown
    expect_error?: unknown
}

interface ConformanceCase extends ConformanceStep {
    name: string
    description?: string
    action: string
    catalog?: { version?: string | number }
    steps?: ConformanceStep[]
    validate?: ConformanceStep[]
}

function loadCases(file: string): ConformanceCase[] {
    return parseYaml(readFileSync(`${suiteDir}${file}`, 'utf8')) as ConformanceCase[]
}

/**
 * A case carries its payloads under `steps`, under `validate`, or inline — the reference
 * harness accepts all three, so this does too.
 */
function stepsOf(testCase: ConformanceCase): ConformanceStep[] {
    if (testCase.steps) {
        return testCase.steps
    }

    if (testCase.validate) {
        return testCase.validate
    }

    return [testCase]
}

// MARK: - Running a payload through this renderer

/**
 * Structural validation, which is what the suite's `validate` action means: does this
 * message list conform to the protocol?
 *
 * Deliberately not a render. A case may declare a catalog of its own (`Canvas`, `Chart`),
 * and may send an incremental update for a surface this process never saw — both are
 * valid payloads, and neither says anything about whether *our* catalog can draw them.
 * Rendering here would have failed those cases for the wrong reason.
 */
function validatePayload(messages: AgentMessage[]): void {
    for (const message of messages) {
        parseMessage(message)
    }

    const issues = validateMessages(messages)

    if (issues.length > 0) {
        throw new Error(issues.map((issue) => `${issue.code}: ${issue.message}`).join('; '))
    }
}

/** Whether the renderer rejected a payload, without caring how it said so. */
function rejects(messages: AgentMessage[]): boolean {
    try {
        validatePayload(messages)

        return false
    } catch {
        return true
    }
}

// MARK: - Reporting

type Outcome = 'passed' | 'gap' | 'skipped'

const results: { file: string; name: string; outcome: Outcome; reason?: string }[] = []

function record(file: string, name: string, outcome: Outcome, reason?: string): void {
    results.push({ file, name, outcome, reason })
}

function skipReason(testCase: ConformanceCase): string | null {
    const version = testCase.catalog?.version

    if (version !== undefined && !SUPPORTED_VERSIONS.has(String(version))) {
        return `v${version} vocabulary is out of scope`
    }

    if (!SUPPORTED_ACTIONS.has(testCase.action)) {
        return `'${testCase.action}' is an agent-SDK operation, not renderer behaviour`
    }

    return null
}

// MARK: - Cases

const FILES = ['core/validator.yaml', 'core/catalog.yaml', 'core/accessibility.yaml']

describe('A2UI conformance suite', () => {
    for (const file of FILES) {
        const cases = loadCases(file)

        describe(file, () => {
            it('has cases to run', () => {
                expect(cases.length).toBeGreaterThan(0)
            })

            for (const testCase of cases) {
                const gap = KNOWN_GAPS[testCase.name]

                // `it.fails` for a known gap: it has to keep failing, so implementing the
                // validator turns the suite red until the entry above is deleted.
                const run = gap ? it.fails : it

                run(gap ? `${testCase.name} — GAP: ${gap}` : testCase.name, (context) => {
                    const reason = skipReason(testCase)

                    if (reason) {
                        record(file, testCase.name, 'skipped', reason)

                        return context.skip()
                    }

                    if (gap) {
                        record(file, testCase.name, 'gap', gap)
                    }

                    for (const step of stepsOf(testCase)) {
                        const messages = (step.payload ?? []) as AgentMessage[]
                        const expected = step.expect_error ?? testCase.expect_error

                        // Asserted on outcome, not on error text: the suite's categories and
                        // paths are the Python SDK's vocabulary, and this renderer has its
                        // own. What has to agree is accept versus reject.
                        expect(rejects(messages), expected ? 'expected a rejection' : 'expected acceptance').toBe(Boolean(expected))
                    }

                    if (!gap) {
                        record(file, testCase.name, 'passed')
                    }
                })
            }
        })
    }
})

afterAll(() => {
    const passed = results.filter((result) => result.outcome === 'passed').length
    const gaps = results.filter((result) => result.outcome === 'gap')
    const skipped = results.filter((result) => result.outcome === 'skipped')

    const reasons = new Map<string, number>()

    for (const result of skipped) {
        const reason = result.reason ?? 'unknown'

        reasons.set(reason, (reasons.get(reason) ?? 0) + 1)
    }

    console.log(
        `\nA2UI conformance: ${passed} passed, ${gaps.length} known gaps, ${skipped.length} out of scope, ` + `of ${results.length} cases`
    )

    for (const [reason, count] of [...reasons].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(count).padStart(3)} out of scope — ${reason}`)
    }

    for (const gap of gaps) {
        console.log(`      known gap — ${gap.name}: ${gap.reason}`)
    }
})
