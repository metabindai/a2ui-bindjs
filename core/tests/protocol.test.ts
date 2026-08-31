import { describe, expect, it } from 'vitest'
import { A2UIProtocolError, isIdentifier, messageType, parseMessage } from '../src/protocol/parse'
import { isChildTemplate, isFunctionCall, isPathBinding } from '../src/protocol/types'
import { fixture } from './helpers'

describe('parseMessage', () => {
    it('parses every fixture message', () => {
        for (const m of [...fixture('profile-card'), ...fixture('employee-list')]) {
            expect(() => parseMessage(m)).not.toThrow()
        }
    })

    it('accepts JSON strings', () => {
        const m = parseMessage('{"version":"v1.0","deleteSurface":{"surfaceId":"s"}}')
        expect(messageType(m)).toBe('deleteSurface')
    })

    it('accepts messages without a version field', () => {
        expect(messageType(parseMessage({ deleteSurface: { surfaceId: 's' } }))).toBe('deleteSurface')
    })

    it.each([
        ['not json', 'x{', 'Invalid JSON'],
        ['no type key', { version: 'v1.0' }, 'no recognised type key'],
        ['two type keys', { createSurface: { surfaceId: 'a' }, deleteSurface: { surfaceId: 'a' } }, 'multiple type keys'],
        ['v0.9 message', { beginRendering: { surfaceId: 'a', root: 'root' } }, 'v0.9'],
        ['missing surfaceId', { updateComponents: { components: [] } }, 'surfaceId is required'],
        ['missing value', { updateDataModel: { surfaceId: 'a', path: '/x' } }, 'value is required'],
        ['components not array', { updateComponents: { surfaceId: 'a', components: {} } }, 'must be an array'],
        ['component without id', { updateComponents: { surfaceId: 'a', components: [{ component: 'Text' }] } }, 'id is required'],
        ['component bad type', { updateComponents: { surfaceId: 'a', components: [{ id: 'x', component: '1Bad' }] } }, 'identifier'],
        ['reserved Surface', { updateComponents: { surfaceId: 'a', components: [{ id: 'x', component: 'Surface' }] } }, 'reserved'],
        [
            'duplicate ids',
            {
                updateComponents: {
                    surfaceId: 'a',
                    components: [
                        { id: 'x', component: 'Text' },
                        { id: 'x', component: 'Text' },
                    ],
                },
            },
            'Duplicate',
        ],
        [
            'bad children',
            { updateComponents: { surfaceId: 'a', components: [{ id: 'x', component: 'Row', children: 'y' }] } },
            'children must be',
        ],
        ['bad callFunction', { callRendererFunction: { functionCallId: 'f', callFunction: {} } }, 'callFunction.call'],
    ])('rejects %s', (_label, input, fragment) => {
        expect(() => parseMessage(input as never)).toThrow(A2UIProtocolError)
        expect(() => parseMessage(input as never)).toThrow(fragment)
    })

    it('reports a JSON-pointer path to the offending field', () => {
        try {
            parseMessage({ updateComponents: { surfaceId: 's', components: [{ id: 'ok', component: 'Text' }, { id: 'bad' }] } })
            expect.fail('should throw')
        } catch (e) {
            const err = e as A2UIProtocolError
            expect(err.code).toBe('VALIDATION_FAILED')
            expect(err.path).toBe('/updateComponents/components/1/component')
            expect(err.surfaceId).toBe('s')
        }
    })
})

describe('type guards', () => {
    it('distinguishes dynamic value forms', () => {
        expect(isPathBinding({ path: '/a' })).toBe(true)
        expect(isPathBinding('literal')).toBe(false)
        expect(isFunctionCall({ call: 'formatString', args: {} })).toBe(true)
        expect(isPathBinding({ call: 'x', path: '/a' })).toBe(false)
        expect(isChildTemplate({ path: '/items', componentId: 't' })).toBe(true)
        expect(isChildTemplate(['a', 'b'])).toBe(false)
    })

    it('checks identifiers', () => {
        expect(isIdentifier('Text')).toBe(true)
        expect(isIdentifier('user_name')).toBe(true)
        expect(isIdentifier('_private')).toBe(true)
        expect(isIdentifier('1abc')).toBe(false)
        expect(isIdentifier('has space')).toBe(false)
        expect(isIdentifier('@index')).toBe(false)
    })
})
