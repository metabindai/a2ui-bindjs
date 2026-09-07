import { describe, expect, it } from 'vitest'
import { deleteAt, getAt, parsePointer, resolvePath, setAt } from '../src/store/jsonPointer'

const doc = { user: { name: 'Ada', tags: ['a', 'b'] }, 'a/b': 1, 'm~n': 2 }

describe('json pointer', () => {
    it('parses and unescapes tokens', () => {
        expect(parsePointer('/')).toEqual([])
        expect(parsePointer('')).toEqual([])
        expect(parsePointer('/user/name')).toEqual(['user', 'name'])
        expect(parsePointer('/a~1b')).toEqual(['a/b'])
        expect(parsePointer('/m~0n')).toEqual(['m~n'])
        expect(parsePointer('name')).toEqual(['name'])
    })

    it('gets values', () => {
        expect(getAt(doc, '/user/name')).toBe('Ada')
        expect(getAt(doc, '/user/tags/1')).toBe('b')
        expect(getAt(doc, '/a~1b')).toBe(1)
        expect(getAt(doc, '/m~0n')).toBe(2)
        expect(getAt(doc, '/')).toBe(doc)
        expect(getAt(doc, '/nope/deeper')).toBeUndefined()
        expect(getAt(doc, '/user/name/x')).toBeUndefined()
    })

    it('sets with structural sharing and intermediate creation', () => {
        const next = setAt(doc, '/user/email', 'a@b.c') as typeof doc & { user: { email: string } }
        expect(next.user.email).toBe('a@b.c')
        expect(next.user.name).toBe('Ada')
        expect(next).not.toBe(doc)
        expect(getAt(doc, '/user/email')).toBeUndefined()

        expect(setAt({}, '/a/b/c', 1)).toEqual({ a: { b: { c: 1 } } })
        expect(setAt({}, '/list/0', 'x')).toEqual({ list: ['x'] })
        expect(setAt({ list: ['x'] }, '/list/-', 'y')).toEqual({ list: ['x', 'y'] })
        expect(setAt(doc, '/', { fresh: true })).toEqual({ fresh: true })
    })

    it('deletes keys and array elements', () => {
        expect(deleteAt(doc, '/user/name')).toEqual({ user: { tags: ['a', 'b'] }, 'a/b': 1, 'm~n': 2 })
        expect(deleteAt(doc, '/user/tags/0')).toMatchObject({ user: { tags: ['b'] } })
        expect(deleteAt(doc, '/missing')).toBe(doc)
        expect(deleteAt(doc, '/')).toEqual({})
    })

    it('resolves relative paths against a scope', () => {
        expect(resolvePath('/abs', '/items/1')).toBe('/abs')
        expect(resolvePath('name', '/items/1')).toBe('/items/1/name')
        expect(resolvePath('', '/items/1')).toBe('/items/1')
        expect(resolvePath('name')).toBe('/name')
        expect(resolvePath('/')).toBe('/')
    })
})
