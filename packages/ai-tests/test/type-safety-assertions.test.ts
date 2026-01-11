/**
 * Type safety tests for assertions.ts
 *
 * These tests verify proper TypeScript type inference and type safety
 * for the assertion functions, particularly around the areas that
 * previously used `as any` casts.
 */
import { describe, it, expectTypeOf, expect as vitestExpect } from 'vitest'
import { expect, Assertion } from '../src/assertions.js'

describe('Type Safety: Assertion', () => {
  describe('instanceof type handling', () => {
    it('accepts constructor functions', () => {
      // Should accept class constructors
      class MyClass {}
      const assertion = expect(new MyClass()).instanceof(MyClass)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts built-in constructors', () => {
      // Should accept Error constructor
      const assertion = expect(new Error()).instanceof(Error)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts ErrorConstructor types', () => {
      // Should work with various error types
      const assertion1 = expect(new TypeError()).instanceof(TypeError)
      const assertion2 = expect(new RangeError()).instanceof(RangeError)
      expectTypeOf(assertion1).toEqualTypeOf<Assertion>()
      expectTypeOf(assertion2).toEqualTypeOf<Assertion>()
    })
  })

  describe('instanceOf type handling (alias)', () => {
    it('accepts constructor functions', () => {
      class MyClass {}
      const assertion = expect(new MyClass()).instanceOf(MyClass)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })
  })

  describe('toBeInstanceOf type handling', () => {
    it('accepts constructor functions', () => {
      class MyClass {}
      const assertion = expect(new MyClass()).toBeInstanceOf(MyClass)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts built-in constructors', () => {
      const assertion = expect(new Error()).toBeInstanceOf(Error)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })
  })

  describe('throw type handling', () => {
    it('accepts no arguments', () => {
      const assertion = expect(() => { throw new Error() }).throw()
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts string error message', () => {
      const assertion = expect(() => { throw new Error('test') }).throw('test')
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts RegExp pattern', () => {
      const assertion = expect(() => { throw new Error('test') }).throw(/test/)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts Error instance', () => {
      const err = new Error('test')
      const assertion = expect(() => { throw err }).throw(err)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts Error constructor', () => {
      const assertion = expect(() => { throw new TypeError() }).throw(TypeError)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts Error constructor with message pattern', () => {
      const assertion = expect(() => { throw new Error('test') }).throw(Error, /test/)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })
  })

  describe('throws type handling (alias)', () => {
    it('accepts Error constructor', () => {
      const assertion = expect(() => { throw new TypeError() }).throws(TypeError)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })
  })

  describe('Throw type handling (alias)', () => {
    it('accepts Error constructor', () => {
      const assertion = expect(() => { throw new TypeError() }).Throw(TypeError)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })
  })

  describe('toThrow type handling', () => {
    it('accepts no arguments', () => {
      const assertion = expect(() => { throw new Error() }).toThrow()
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts string error message', () => {
      const assertion = expect(() => { throw new Error('test') }).toThrow('test')
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts RegExp pattern', () => {
      const assertion = expect(() => { throw new Error('test') }).toThrow(/test/)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('accepts Error instance', () => {
      const err = new Error('test')
      const assertion = expect(() => { throw err }).toThrow(err)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })
  })

  describe('Assertion class internal type safety', () => {
    it('returns correct Assertion type from expect', () => {
      const assertion = expect(42)
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('chains return Assertion type', () => {
      const assertion = expect(42).to.be.a('number')
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('negation returns Assertion type', () => {
      const assertion = expect(42).not
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })

    it('deep flag returns Assertion type', () => {
      const assertion = expect({ a: 1 }).deep
      expectTypeOf(assertion).toEqualTypeOf<Assertion>()
    })
  })
})

describe('Runtime Type Safety', () => {
  describe('instanceof runtime behavior', () => {
    it('works with custom classes at runtime', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }
      vitestExpect(() => expect(new CustomError('test')).instanceof(CustomError)).not.toThrow()
    })

    it('works with inheritance chains', () => {
      vitestExpect(() => expect(new TypeError()).instanceof(Error)).not.toThrow()
    })
  })

  describe('throw runtime behavior with typed constructors', () => {
    it('works with Error constructor', () => {
      vitestExpect(() =>
        expect(() => { throw new Error('test') }).throw(Error)
      ).not.toThrow()
    })

    it('works with specific error types', () => {
      vitestExpect(() =>
        expect(() => { throw new TypeError('test') }).throw(TypeError)
      ).not.toThrow()
    })

    it('works with Error constructor and message', () => {
      vitestExpect(() =>
        expect(() => { throw new Error('test message') }).throw(Error, /test/)
      ).not.toThrow()
    })
  })

  describe('toBeInstanceOf runtime behavior', () => {
    it('works with built-in types', () => {
      vitestExpect(() => expect([]).toBeInstanceOf(Array)).not.toThrow()
      vitestExpect(() => expect(new Map()).toBeInstanceOf(Map)).not.toThrow()
      vitestExpect(() => expect(new Set()).toBeInstanceOf(Set)).not.toThrow()
    })
  })

  describe('toThrow runtime behavior', () => {
    it('works with Error type', () => {
      vitestExpect(() =>
        expect(() => { throw new Error('test') }).toThrow(Error)
      ).not.toThrow()
    })
  })
})
