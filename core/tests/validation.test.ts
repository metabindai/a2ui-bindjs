/**
 * The structural validator.
 *
 * The first test is the one that matters most: every official example has to come back
 * clean. A validator that rejects real surfaces is worse than no validator, and each rule
 * below is a chance to do exactly that.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { validateMessages, type SchemaValidator } from '../src/validation/validate'
import type { AgentMessage } from '../src/protocol/types'

const examplesDir = fileURLToPath(new URL('../../vendor/spec/v1_0/catalogs/basic/examples/', import.meta.url))

function surfaceOf(components: unknown[], dataModel: unknown = {}): AgentMessage[] {
    return [{ createSurface: { surfaceId: 's', components, dataModel } }] as unknown as AgentMessage[]
}

function codesFor(messages: AgentMessage[], schema?: SchemaValidator): string[] {
    return validateMessages(messages, { schema }).map((issue) => issue.code)
}

describe('validateMessages', () => {
    describe('the official examples', () => {
        const files = readdirSync(examplesDir).filter((file) => file.endsWith('.json'))

        it('has examples to check', () => {
            expect(files.length).toBeGreaterThanOrEqual(40)
        })

        it.each(files)('%s reports nothing', (file) => {
            const parsed = JSON.parse(readFileSync(`${examplesDir}${file}`, 'utf8')) as { messages: AgentMessage[] }

            expect(validateMessages(parsed.messages)).toEqual([])
        })
    })

    describe('references', () => {
        it('accepts a surface whose children all resolve', () => {
            const messages = surfaceOf([
                { id: 'root', component: 'Column', children: ['a'] },
                { id: 'a', component: 'Text', text: 'hello' },
            ])

            expect(validateMessages(messages)).toEqual([])
        })

        it('reports a child that does not exist', () => {
            const messages = surfaceOf([{ id: 'root', component: 'Card', child: 'nope' }])

            expect(codesFor(messages)).toContain('DANGLING_REFERENCE')
        })

        it('reports a component that contains itself', () => {
            const messages = surfaceOf([{ id: 'root', component: 'Card', child: 'root' }])

            expect(codesFor(messages)).toContain('SELF_REFERENCE')
        })

        it('reports a cycle between two components', () => {
            const messages = surfaceOf([
                { id: 'root', component: 'Card', child: 'a' },
                { id: 'a', component: 'Card', child: 'root' },
            ])

            expect(codesFor(messages)).toContain('CYCLE')
        })

        it('follows a child template, so the component it repeats counts as referenced', () => {
            const messages = surfaceOf([
                { id: 'root', component: 'List', children: { componentId: 'row', path: '/items' } },
                { id: 'row', component: 'Text', text: 'x' },
            ])

            expect(validateMessages(messages)).toEqual([])
        })

        it('reports a template naming a component that does not exist', () => {
            const messages = surfaceOf([{ id: 'root', component: 'List', children: { componentId: 'row', path: '/items' } }])

            expect(codesFor(messages)).toContain('DANGLING_REFERENCE')
        })
    })

    describe('completeness', () => {
        it('reports a created surface with no root', () => {
            const messages = surfaceOf([{ id: 'a', component: 'Text', text: 'hi' }])

            expect(codesFor(messages)).toContain('MISSING_ROOT')
        })

        it('reports a component nothing reaches', () => {
            const messages = surfaceOf([
                { id: 'root', component: 'Text', text: 'root' },
                { id: 'orphan', component: 'Text', text: 'orphan' },
            ])

            expect(codesFor(messages)).toContain('UNREACHABLE')
        })

        /**
         * An update-only batch cannot be judged whole: the root arrived earlier, in a batch
         * this validator never saw. Reporting it would make every incremental update noisy.
         */
        it('does not ask an update-only batch for a root', () => {
            const messages = [
                {
                    updateComponents: {
                        surfaceId: 's',
                        components: [
                            { id: 'a', component: 'Card', child: 'b' },
                            { id: 'b', component: 'Text', text: 'x' },
                        ],
                    },
                },
            ] as unknown as AgentMessage[]

            expect(validateMessages(messages)).toEqual([])
        })

        /**
         * A stream that shows a placeholder and then replaces it — `31_incremental-dashboard`
         * in the official examples does exactly this — leaves the placeholder unreferenced
         * at the end. It was reachable when it mattered, so it is superseded, not orphaned.
         */
        it('does not call a replaced placeholder an orphan', () => {
            const messages = [
                {
                    createSurface: {
                        surfaceId: 's',
                        components: [
                            { id: 'root', component: 'Column', children: ['loading'] },
                            { id: 'loading', component: 'Text', text: 'Loading…' },
                        ],
                        dataModel: {},
                    },
                },
                {
                    updateComponents: {
                        surfaceId: 's',
                        components: [
                            { id: 'root', component: 'Column', children: ['content'] },
                            { id: 'content', component: 'Text', text: 'Here it is' },
                        ],
                    },
                },
            ] as unknown as AgentMessage[]

            expect(validateMessages(messages)).toEqual([])
        })

        it('still reports a cycle in an update-only batch', () => {
            const messages = [
                {
                    updateComponents: {
                        surfaceId: 's',
                        components: [
                            { id: 'a', component: 'Card', child: 'b' },
                            { id: 'b', component: 'Card', child: 'a' },
                        ],
                    },
                },
            ] as unknown as AgentMessage[]

            expect(codesFor(messages)).toContain('CYCLE')
        })
    })

    describe('paths and calls', () => {
        it('accepts a well-formed pointer, including escapes', () => {
            const messages = surfaceOf([{ id: 'root', component: 'Text', text: { path: '/a~0b/c~1d' } }])

            expect(validateMessages(messages)).toEqual([])
        })

        it('reports a pointer with a bad escape', () => {
            const messages = surfaceOf([{ id: 'root', component: 'Text', text: { path: '/invalid/escape/~2' } }])

            expect(codesFor(messages)).toContain('INVALID_PATH')
        })

        it('reports function calls nested past the limit', () => {
            let call: unknown = { call: 'f', args: {} }

            for (let depth = 0; depth < 6; depth += 1) {
                call = { call: `f${depth}`, args: call }
            }

            const messages = surfaceOf([{ id: 'root', component: 'Text', text: call }])

            expect(codesFor(messages)).toContain('FUNCTION_DEPTH_EXCEEDED')
        })
    })

    describe('schema validation', () => {
        /** Stands in for ajv: objects to any message whose surfaceId is not a string. */
        const engine = (message: AgentMessage) => {
            const created = (message as Record<string, { surfaceId?: unknown }>).createSurface

            if (created && typeof created.surfaceId !== 'string') {
                return [{ path: '/createSurface/surfaceId', message: 'must be a string' }]
            }

            return []
        }

        const messages = [
            { createSurface: { surfaceId: 123, components: [{ id: 'root', component: 'Text', text: 'hi' }], dataModel: {} } },
        ] as unknown as AgentMessage[]

        it('reports what the engine objects to, pointed into the run of messages', () => {
            const issues = validateMessages(messages, { schema: engine })

            expect(issues[0]).toMatchObject({
                code: 'SCHEMA_FAILED',
                path: '/messages/0/createSurface/surfaceId',
            })
        })

        /**
         * Core carries no JSON Schema engine, so without one it checks structure only. A
         * surfaceId of the wrong type is a schema question, not a graph question.
         */
        it('says nothing about schema when no engine is supplied', () => {
            expect(validateMessages(messages)).toEqual([])
        })

        it('still reports structural problems alongside schema ones', () => {
            // v1.0 requires `version` on every message; the graph is broken as well.
            const requiresVersion = (message: AgentMessage) =>
                'version' in (message as object) ? [] : [{ path: '/version', message: 'is required' }]

            const broken = [
                { createSurface: { surfaceId: 's', components: [{ id: 'root', component: 'Card', child: 'gone' }], dataModel: {} } },
            ] as unknown as AgentMessage[]

            expect(codesFor(broken, requiresVersion)).toEqual(['SCHEMA_FAILED', 'DANGLING_REFERENCE'])
        })

        /**
         * A message whose surfaceId is not a string cannot be attributed to a surface, so
         * there is no graph to check — the schema engine is the only thing that can speak.
         */
        it('leaves an unattributable message to the schema engine alone', () => {
            expect(codesFor(messages, engine)).toEqual(['SCHEMA_FAILED'])
        })
    })

    describe('depth', () => {
        function chain(length: number): unknown[] {
            const components: unknown[] = [{ id: 'root', component: 'Card', child: 'c0' }]

            for (let index = 0; index < length; index += 1) {
                components.push({ id: `c${index}`, component: 'Card', child: `c${index + 1}` })
            }

            components.push({ id: `c${length}`, component: 'Text', text: 'end' })

            return components
        }

        it('accepts a graph deeper than anything real', () => {
            expect(validateMessages(surfaceOf(chain(40)))).toEqual([])
        })

        it('reports a graph past the limit', () => {
            expect(codesFor(surfaceOf(chain(60)))).toContain('DEPTH_EXCEEDED')
        })

        it('reports a data model nested past the limit', () => {
            let value: Record<string, unknown> = {}

            for (let depth = 0; depth < 60; depth += 1) {
                value = { next: value }
            }

            expect(codesFor(surfaceOf([{ id: 'root', component: 'Text', text: 'x' }], value))).toContain('DEPTH_EXCEEDED')
        })
    })
})
