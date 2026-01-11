/**
 * Assertion utilities powered by Chai
 *
 * Exposes expect, should, and assert APIs via RPC.
 * Uses Chai under the hood for battle-tested assertions.
 */

import * as chai from 'chai'
import { RpcTarget } from 'cloudflare:workers'

// Initialize chai's should
chai.should()

/**
 * Type for constructor functions that can be used with instanceof assertions.
 * Matches any class or function that can construct instances.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = unknown> = new (...args: any[]) => T

/**
 * Type for error-like values that can be used with throw assertions.
 * Chai's throw() accepts:
 * - Error constructor (e.g., TypeError, RangeError)
 * - Error instance (e.g., new Error('message'))
 * - String for message matching
 * - RegExp for pattern matching
 */
type ThrowableMatch = string | RegExp | Error | Constructor<Error>

/**
 * Internal type for Chai assertion chain.
 *
 * @remarks
 * **Why we use Chai.Assertion here:**
 *
 * Chai's fluent API uses a chainable pattern where each flag (.not, .deep, .nested, etc.)
 * returns a different TypeScript interface:
 * - Chai.Assertion: Base type from expect()
 * - Chai.Deep: Returned after .deep (has subset of properties)
 * - Chai.Nested, Chai.Own, etc.: Other flag-specific types
 *
 * These types form a complex hierarchy where not all methods exist on all types.
 * For example, Chai.Deep has .equal() but not .ok, while Chai.KeyFilter has
 * .keys() but not .equal().
 *
 * Our wrapper class stores the current assertion state and calls methods on it.
 * At runtime, all these methods exist because Chai's actual implementation always
 * has them - the type restrictions are for API guidance, not runtime behavior.
 *
 * We use Chai.Assertion (the most complete type) because:
 * 1. It has all the methods we need to call
 * 2. The assignment from flag types to Chai.Assertion is unsound in strict TS,
 *    but at runtime these objects have all the methods we need
 * 3. We wrap the result in our own Assertion class, so the internal type
 *    doesn't leak to consumers
 *
 * The type assertions in the flag getters (.deep, .nested, etc.) are intentional
 * and documented. They bridge Chai's complex type hierarchy to our simpler wrapper.
 */
type ChaiAssertionChain = Chai.Assertion

/**
 * Wrapper around Chai's expect that extends RpcTarget
 * This allows the assertion chain to work over RPC with promise pipelining
 */
export class Assertion extends RpcTarget {
  /**
   * Internal Chai assertion chain.
   * @see ChaiAssertionChain for explanation of the type choice.
   */
  private assertion: ChaiAssertionChain

  constructor(value: unknown, message?: string) {
    super()
    this.assertion = chai.expect(value, message)
  }

  // Chainable language chains
  get to() { return this }
  get be() { return this }
  get been() { return this }
  get is() { return this }
  get that() { return this }
  get which() { return this }
  get and() { return this }
  get has() { return this }
  get have() { return this }
  get with() { return this }
  get at() { return this }
  get of() { return this }
  get same() { return this }
  get but() { return this }
  get does() { return this }
  get still() { return this }
  get also() { return this }

  /**
   * Negation flag - inverts the assertion.
   * @remarks Type cast needed: Chai's .not returns Chai.Assertion, which matches our type.
   */
  get not(): Assertion {
    this.assertion = this.assertion.not
    return this
  }

  /**
   * Deep flag - enables deep equality comparisons.
   * @remarks Type cast needed: Chai's .deep returns Chai.Deep, but at runtime
   * it has all the methods we need. We cast to maintain our wrapper's type.
   */
  get deep(): Assertion {
    this.assertion = this.assertion.deep as ChaiAssertionChain
    return this
  }

  /**
   * Nested flag - enables nested property access with dot notation.
   * @remarks Type cast needed: Chai's .nested returns Chai.Nested, cast to our chain type.
   */
  get nested(): Assertion {
    this.assertion = this.assertion.nested as ChaiAssertionChain
    return this
  }

  /**
   * Own flag - only checks own properties, not inherited.
   * @remarks Type cast needed: Chai's .own returns Chai.Own, cast to our chain type.
   */
  get own(): Assertion {
    this.assertion = this.assertion.own as ChaiAssertionChain
    return this
  }

  /**
   * Ordered flag - requires members to be in order.
   * @remarks Type cast needed: Chai's .ordered returns Chai.Ordered, cast to our chain type.
   */
  get ordered(): Assertion {
    this.assertion = this.assertion.ordered as ChaiAssertionChain
    return this
  }

  /**
   * Any flag - requires at least one key match.
   * @remarks Type cast needed: Chai's .any returns Chai.KeyFilter, cast to our chain type.
   */
  get any(): Assertion {
    this.assertion = this.assertion.any as ChaiAssertionChain
    return this
  }

  /**
   * All flag - requires all keys to match.
   * @remarks Type cast needed: Chai's .all returns Chai.KeyFilter, cast to our chain type.
   */
  get all(): Assertion {
    this.assertion = this.assertion.all as ChaiAssertionChain
    return this
  }

  /**
   * Length chain - for asserting on length property.
   * @remarks Type cast needed: Chai's .length returns Chai.Length which is quite different
   * from Chai.Assertion (it's also callable). We cast through unknown because Length
   * doesn't directly overlap with Assertion in TypeScript's structural type system,
   * but at runtime the object has all methods we need.
   */
  get length(): Assertion {
    this.assertion = this.assertion.length as unknown as ChaiAssertionChain
    return this
  }

  // Type assertions
  get ok() { this.assertion.ok; return this }
  get true() { this.assertion.true; return this }
  get false() { this.assertion.false; return this }
  get null() { this.assertion.null; return this }
  get undefined() { this.assertion.undefined; return this }
  get NaN() { this.assertion.NaN; return this }
  get exist() { this.assertion.exist; return this }
  get empty() { this.assertion.empty; return this }
  get arguments() { this.assertion.arguments; return this }

  // Value assertions
  equal(value: unknown, message?: string) {
    this.assertion.equal(value, message)
    return this
  }

  equals(value: unknown, message?: string) {
    return this.equal(value, message)
  }

  eq(value: unknown, message?: string) {
    return this.equal(value, message)
  }

  eql(value: unknown, message?: string) {
    this.assertion.eql(value, message)
    return this
  }

  eqls(value: unknown, message?: string) {
    return this.eql(value, message)
  }

  above(value: number, message?: string) {
    this.assertion.above(value, message)
    return this
  }

  gt(value: number, message?: string) {
    return this.above(value, message)
  }

  greaterThan(value: number, message?: string) {
    return this.above(value, message)
  }

  least(value: number, message?: string) {
    this.assertion.least(value, message)
    return this
  }

  gte(value: number, message?: string) {
    return this.least(value, message)
  }

  greaterThanOrEqual(value: number, message?: string) {
    return this.least(value, message)
  }

  below(value: number, message?: string) {
    this.assertion.below(value, message)
    return this
  }

  lt(value: number, message?: string) {
    return this.below(value, message)
  }

  lessThan(value: number, message?: string) {
    return this.below(value, message)
  }

  most(value: number, message?: string) {
    this.assertion.most(value, message)
    return this
  }

  lte(value: number, message?: string) {
    return this.most(value, message)
  }

  lessThanOrEqual(value: number, message?: string) {
    return this.most(value, message)
  }

  within(start: number, finish: number, message?: string) {
    this.assertion.within(start, finish, message)
    return this
  }

  instanceof(constructor: Constructor, message?: string) {
    this.assertion.instanceof(constructor, message)
    return this
  }

  instanceOf(constructor: Constructor, message?: string) {
    return this.instanceof(constructor, message)
  }

  property(name: string, value?: unknown, message?: string) {
    if (arguments.length > 1) {
      this.assertion.property(name, value, message)
    } else {
      this.assertion.property(name)
    }
    return this
  }

  ownProperty(name: string, message?: string) {
    this.assertion.ownProperty(name, message)
    return this
  }

  haveOwnProperty(name: string, message?: string) {
    return this.ownProperty(name, message)
  }

  ownPropertyDescriptor(name: string, descriptor?: PropertyDescriptor, message?: string) {
    if (descriptor !== undefined) {
      this.assertion.ownPropertyDescriptor(name, descriptor, message)
    } else {
      this.assertion.ownPropertyDescriptor(name, message)
    }
    return this
  }

  lengthOf(n: number, message?: string) {
    this.assertion.lengthOf(n, message)
    return this
  }

  match(re: RegExp, message?: string) {
    this.assertion.match(re, message)
    return this
  }

  matches(re: RegExp, message?: string) {
    return this.match(re, message)
  }

  string(str: string, message?: string) {
    this.assertion.string(str, message)
    return this
  }

  keys(...keys: string[]) {
    this.assertion.keys(...keys)
    return this
  }

  key(...keys: string[]) {
    return this.keys(...keys)
  }

  /**
   * Asserts that the function throws an error.
   *
   * @param errorLike - Error constructor, instance, string, or RegExp to match
   * @param errMsgMatcher - String or RegExp to match error message (when errorLike is constructor/instance)
   * @param message - Custom assertion message
   *
   * @remarks
   * Chai's throw() has two overloads that TypeScript can't resolve with our union type.
   * We use runtime type checking to call the appropriate overload, then use a type
   * assertion to satisfy TypeScript. This is safe because Chai accepts all these
   * combinations at runtime.
   */
  throw(errorLike?: ThrowableMatch, errMsgMatcher?: string | RegExp, message?: string) {
    if (errorLike === undefined) {
      this.assertion.throw()
    } else if (typeof errorLike === 'string' || errorLike instanceof RegExp) {
      // First overload: (expected?: string | RegExp, message?: string)
      this.assertion.throw(errorLike, errMsgMatcher as string | undefined)
    } else {
      // Second overload: (constructor: Error | Function, expected?: string | RegExp, message?: string)
      this.assertion.throw(errorLike as Error | Function, errMsgMatcher, message)
    }
    return this
  }

  throws(errorLike?: ThrowableMatch, errMsgMatcher?: string | RegExp, message?: string) {
    return this.throw(errorLike, errMsgMatcher, message)
  }

  Throw(errorLike?: ThrowableMatch, errMsgMatcher?: string | RegExp, message?: string) {
    return this.throw(errorLike, errMsgMatcher, message)
  }

  respondTo(method: string, message?: string) {
    this.assertion.respondTo(method, message)
    return this
  }

  respondsTo(method: string, message?: string) {
    return this.respondTo(method, message)
  }

  satisfy(matcher: (val: unknown) => boolean, message?: string) {
    this.assertion.satisfy(matcher, message)
    return this
  }

  satisfies(matcher: (val: unknown) => boolean, message?: string) {
    return this.satisfy(matcher, message)
  }

  closeTo(expected: number, delta: number, message?: string) {
    this.assertion.closeTo(expected, delta, message)
    return this
  }

  approximately(expected: number, delta: number, message?: string) {
    return this.closeTo(expected, delta, message)
  }

  members(set: unknown[], message?: string) {
    this.assertion.members(set, message)
    return this
  }

  oneOf(list: unknown[], message?: string) {
    this.assertion.oneOf(list, message)
    return this
  }

  include(value: unknown, message?: string) {
    this.assertion.include(value, message)
    return this
  }

  includes(value: unknown, message?: string) {
    return this.include(value, message)
  }

  contain(value: unknown, message?: string) {
    return this.include(value, message)
  }

  contains(value: unknown, message?: string) {
    return this.include(value, message)
  }

  a(type: string, message?: string) {
    this.assertion.a(type, message)
    return this
  }

  an(type: string, message?: string) {
    return this.a(type, message)
  }

  // Vitest-compatible aliases
  toBe(value: unknown) {
    this.assertion.equal(value)
    return this
  }

  toEqual(value: unknown) {
    this.assertion.deep.equal(value)
    return this
  }

  toStrictEqual(value: unknown) {
    this.assertion.deep.equal(value)
    return this
  }

  toBeTruthy() {
    this.assertion.ok
    return this
  }

  toBeFalsy() {
    this.assertion.not.ok
    return this
  }

  toBeNull() {
    this.assertion.null
    return this
  }

  toBeUndefined() {
    this.assertion.undefined
    return this
  }

  toBeDefined() {
    this.assertion.not.undefined
    return this
  }

  toBeNaN() {
    this.assertion.NaN
    return this
  }

  toContain(value: unknown) {
    this.assertion.include(value)
    return this
  }

  toHaveLength(length: number) {
    this.assertion.lengthOf(length)
    return this
  }

  toHaveProperty(path: string, value?: unknown) {
    if (arguments.length > 1) {
      this.assertion.nested.property(path, value)
    } else {
      this.assertion.nested.property(path)
    }
    return this
  }

  toMatch(pattern: RegExp | string) {
    if (typeof pattern === 'string') {
      this.assertion.include(pattern)
    } else {
      this.assertion.match(pattern)
    }
    return this
  }

  toMatchObject(obj: object) {
    this.assertion.deep.include(obj)
    return this
  }

  /**
   * Vitest-compatible: Asserts that the function throws.
   * @remarks Uses same runtime type checking as throw() to handle Chai's overloads.
   */
  toThrow(expected?: ThrowableMatch) {
    if (expected === undefined) {
      this.assertion.throw()
    } else if (typeof expected === 'string' || expected instanceof RegExp) {
      this.assertion.throw(expected)
    } else {
      // Error instance or constructor
      this.assertion.throw(expected as Error | Function)
    }
    return this
  }

  toBeGreaterThan(n: number) {
    this.assertion.above(n)
    return this
  }

  toBeLessThan(n: number) {
    this.assertion.below(n)
    return this
  }

  toBeGreaterThanOrEqual(n: number) {
    this.assertion.least(n)
    return this
  }

  toBeLessThanOrEqual(n: number) {
    this.assertion.most(n)
    return this
  }

  toBeCloseTo(n: number, digits = 2) {
    const delta = Math.pow(10, -digits) / 2
    this.assertion.closeTo(n, delta)
    return this
  }

  toBeInstanceOf(cls: Constructor) {
    this.assertion.instanceof(cls)
    return this
  }

  toBeTypeOf(type: string) {
    this.assertion.a(type)
    return this
  }
}

/**
 * Assert API - TDD style assertions
 */
export const assert = chai.assert

/**
 * Create an expect assertion
 */
export function expect(value: unknown, message?: string): Assertion {
  return new Assertion(value, message)
}

/**
 * Create a should-style assertion
 * Since we can't modify Object.prototype over RPC, this takes a value
 */
export function should(value: unknown): Assertion {
  return new Assertion(value)
}
