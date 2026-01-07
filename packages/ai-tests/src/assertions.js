/**
 * Assertion utilities powered by Chai
 *
 * Exposes expect, should, and assert APIs via RPC.
 * Uses Chai under the hood for battle-tested assertions.
 */
import * as chai from 'chai';
import { RpcTarget } from 'cloudflare:workers';
// Initialize chai's should
chai.should();
/**
 * Wrapper around Chai's expect that extends RpcTarget
 * This allows the assertion chain to work over RPC with promise pipelining
 */
export class Assertion extends RpcTarget {
    // Using 'any' to avoid complex type gymnastics with Chai's chainable types
    // (Deep, Nested, etc. don't match Chai.Assertion directly)
    assertion;
    constructor(value, message) {
        super();
        this.assertion = chai.expect(value, message);
    }
    // Chainable language chains
    get to() { return this; }
    get be() { return this; }
    get been() { return this; }
    get is() { return this; }
    get that() { return this; }
    get which() { return this; }
    get and() { return this; }
    get has() { return this; }
    get have() { return this; }
    get with() { return this; }
    get at() { return this; }
    get of() { return this; }
    get same() { return this; }
    get but() { return this; }
    get does() { return this; }
    get still() { return this; }
    get also() { return this; }
    // Negation
    get not() {
        this.assertion = this.assertion.not;
        return this;
    }
    // Deep flag
    get deep() {
        this.assertion = this.assertion.deep;
        return this;
    }
    // Nested flag
    get nested() {
        this.assertion = this.assertion.nested;
        return this;
    }
    // Own flag
    get own() {
        this.assertion = this.assertion.own;
        return this;
    }
    // Ordered flag
    get ordered() {
        this.assertion = this.assertion.ordered;
        return this;
    }
    // Any flag
    get any() {
        this.assertion = this.assertion.any;
        return this;
    }
    // All flag
    get all() {
        this.assertion = this.assertion.all;
        return this;
    }
    // Length chain
    get length() {
        this.assertion = this.assertion.length;
        return this;
    }
    // Type assertions
    get ok() { this.assertion.ok; return this; }
    get true() { this.assertion.true; return this; }
    get false() { this.assertion.false; return this; }
    get null() { this.assertion.null; return this; }
    get undefined() { this.assertion.undefined; return this; }
    get NaN() { this.assertion.NaN; return this; }
    get exist() { this.assertion.exist; return this; }
    get empty() { this.assertion.empty; return this; }
    get arguments() { this.assertion.arguments; return this; }
    // Value assertions
    equal(value, message) {
        this.assertion.equal(value, message);
        return this;
    }
    equals(value, message) {
        return this.equal(value, message);
    }
    eq(value, message) {
        return this.equal(value, message);
    }
    eql(value, message) {
        this.assertion.eql(value, message);
        return this;
    }
    eqls(value, message) {
        return this.eql(value, message);
    }
    above(value, message) {
        this.assertion.above(value, message);
        return this;
    }
    gt(value, message) {
        return this.above(value, message);
    }
    greaterThan(value, message) {
        return this.above(value, message);
    }
    least(value, message) {
        this.assertion.least(value, message);
        return this;
    }
    gte(value, message) {
        return this.least(value, message);
    }
    greaterThanOrEqual(value, message) {
        return this.least(value, message);
    }
    below(value, message) {
        this.assertion.below(value, message);
        return this;
    }
    lt(value, message) {
        return this.below(value, message);
    }
    lessThan(value, message) {
        return this.below(value, message);
    }
    most(value, message) {
        this.assertion.most(value, message);
        return this;
    }
    lte(value, message) {
        return this.most(value, message);
    }
    lessThanOrEqual(value, message) {
        return this.most(value, message);
    }
    within(start, finish, message) {
        this.assertion.within(start, finish, message);
        return this;
    }
    instanceof(constructor, message) {
        this.assertion.instanceof(constructor, message);
        return this;
    }
    instanceOf(constructor, message) {
        return this.instanceof(constructor, message);
    }
    property(name, value, message) {
        if (arguments.length > 1) {
            this.assertion.property(name, value, message);
        }
        else {
            this.assertion.property(name);
        }
        return this;
    }
    ownProperty(name, message) {
        this.assertion.ownProperty(name, message);
        return this;
    }
    haveOwnProperty(name, message) {
        return this.ownProperty(name, message);
    }
    ownPropertyDescriptor(name, descriptor, message) {
        this.assertion.ownPropertyDescriptor(name, descriptor, message);
        return this;
    }
    lengthOf(n, message) {
        this.assertion.lengthOf(n, message);
        return this;
    }
    match(re, message) {
        this.assertion.match(re, message);
        return this;
    }
    matches(re, message) {
        return this.match(re, message);
    }
    string(str, message) {
        this.assertion.string(str, message);
        return this;
    }
    keys(...keys) {
        this.assertion.keys(...keys);
        return this;
    }
    key(...keys) {
        return this.keys(...keys);
    }
    throw(errorLike, errMsgMatcher, message) {
        this.assertion.throw(errorLike, errMsgMatcher, message);
        return this;
    }
    throws(errorLike, errMsgMatcher, message) {
        return this.throw(errorLike, errMsgMatcher, message);
    }
    Throw(errorLike, errMsgMatcher, message) {
        return this.throw(errorLike, errMsgMatcher, message);
    }
    respondTo(method, message) {
        this.assertion.respondTo(method, message);
        return this;
    }
    respondsTo(method, message) {
        return this.respondTo(method, message);
    }
    satisfy(matcher, message) {
        this.assertion.satisfy(matcher, message);
        return this;
    }
    satisfies(matcher, message) {
        return this.satisfy(matcher, message);
    }
    closeTo(expected, delta, message) {
        this.assertion.closeTo(expected, delta, message);
        return this;
    }
    approximately(expected, delta, message) {
        return this.closeTo(expected, delta, message);
    }
    members(set, message) {
        this.assertion.members(set, message);
        return this;
    }
    oneOf(list, message) {
        this.assertion.oneOf(list, message);
        return this;
    }
    include(value, message) {
        this.assertion.include(value, message);
        return this;
    }
    includes(value, message) {
        return this.include(value, message);
    }
    contain(value, message) {
        return this.include(value, message);
    }
    contains(value, message) {
        return this.include(value, message);
    }
    a(type, message) {
        this.assertion.a(type, message);
        return this;
    }
    an(type, message) {
        return this.a(type, message);
    }
    // Vitest-compatible aliases
    toBe(value) {
        this.assertion.equal(value);
        return this;
    }
    toEqual(value) {
        this.assertion.deep.equal(value);
        return this;
    }
    toStrictEqual(value) {
        this.assertion.deep.equal(value);
        return this;
    }
    toBeTruthy() {
        this.assertion.ok;
        return this;
    }
    toBeFalsy() {
        this.assertion.not.ok;
        return this;
    }
    toBeNull() {
        this.assertion.null;
        return this;
    }
    toBeUndefined() {
        this.assertion.undefined;
        return this;
    }
    toBeDefined() {
        this.assertion.not.undefined;
        return this;
    }
    toBeNaN() {
        this.assertion.NaN;
        return this;
    }
    toContain(value) {
        this.assertion.include(value);
        return this;
    }
    toHaveLength(length) {
        this.assertion.lengthOf(length);
        return this;
    }
    toHaveProperty(path, value) {
        if (arguments.length > 1) {
            this.assertion.nested.property(path, value);
        }
        else {
            this.assertion.nested.property(path);
        }
        return this;
    }
    toMatch(pattern) {
        if (typeof pattern === 'string') {
            this.assertion.include(pattern);
        }
        else {
            this.assertion.match(pattern);
        }
        return this;
    }
    toMatchObject(obj) {
        this.assertion.deep.include(obj);
        return this;
    }
    toThrow(expected) {
        if (expected) {
            this.assertion.throw(expected);
        }
        else {
            this.assertion.throw();
        }
        return this;
    }
    toBeGreaterThan(n) {
        this.assertion.above(n);
        return this;
    }
    toBeLessThan(n) {
        this.assertion.below(n);
        return this;
    }
    toBeGreaterThanOrEqual(n) {
        this.assertion.least(n);
        return this;
    }
    toBeLessThanOrEqual(n) {
        this.assertion.most(n);
        return this;
    }
    toBeCloseTo(n, digits = 2) {
        const delta = Math.pow(10, -digits) / 2;
        this.assertion.closeTo(n, delta);
        return this;
    }
    toBeInstanceOf(cls) {
        this.assertion.instanceof(cls);
        return this;
    }
    toBeTypeOf(type) {
        this.assertion.a(type);
        return this;
    }
}
/**
 * Assert API - TDD style assertions
 */
export const assert = chai.assert;
/**
 * Create an expect assertion
 */
export function expect(value, message) {
    return new Assertion(value, message);
}
/**
 * Create a should-style assertion
 * Since we can't modify Object.prototype over RPC, this takes a value
 */
export function should(value) {
    return new Assertion(value);
}
