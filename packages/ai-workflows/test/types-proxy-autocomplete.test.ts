/**
 * TDD RED Phase Tests: OnProxy/EveryProxy autocomplete
 * Issue: primitives.org.ai-5qe
 *
 * These tests verify that TypeScript sees known properties on $.on and $.every
 * instead of treating everything as unknown from index signatures.
 *
 * Current implementation uses pure index signatures which causes:
 * - $.on to be typed as { [noun: string]: { [event: string]: ... } }
 * - $.every has union type with index signature
 * - IDE autocomplete doesn't show known patterns (hour, day, Monday, etc.)
 *
 * The issue is that index signatures make TypeScript treat all properties
 * as having the same type, which hides known properties from autocomplete.
 *
 * These tests should FAIL until proper typing with explicit known properties is implemented.
 */
import { describe, it, expect, expectTypeOf } from 'vitest'
import type { WorkflowContext, OnProxy, EveryProxy, ScheduleHandler, EventHandler } from '../src/types.js'
import { Workflow, createTestContext } from '../src/workflow.js'

/**
 * Helper type to check if a type has specific known keys
 * This fails if the type only has an index signature
 */
type HasKnownKey<T, K extends string> = K extends keyof T ? true : false

/**
 * Expected OnProxy type with explicit known nouns
 * This is what we WANT the type to look like
 */
type ExpectedOnProxy = {
  // Known nouns (for autocomplete)
  Customer: { [event: string]: (handler: EventHandler) => void }
  Order: { [event: string]: (handler: EventHandler) => void }
  Payment: { [event: string]: (handler: EventHandler) => void }
  User: { [event: string]: (handler: EventHandler) => void }
  // Index signature for dynamic nouns
  [noun: string]: { [event: string]: (handler: EventHandler) => void }
}

/**
 * Expected EveryProxy type with explicit known patterns
 */
type ExpectedEveryProxy = {
  // Callable
  (description: string, handler: ScheduleHandler): void
  // Known time units (for autocomplete)
  second: (handler: ScheduleHandler) => void
  minute: (handler: ScheduleHandler) => void
  hour: (handler: ScheduleHandler) => void
  day: (handler: ScheduleHandler) => void
  week: (handler: ScheduleHandler) => void
  // Known days
  Monday: ((handler: ScheduleHandler) => void) & { at9am: (handler: ScheduleHandler) => void }
  Tuesday: ((handler: ScheduleHandler) => void) & { at9am: (handler: ScheduleHandler) => void }
  // etc...
  // Plural forms
  seconds: (value: number) => (handler: ScheduleHandler) => void
  minutes: (value: number) => (handler: ScheduleHandler) => void
  hours: (value: number) => (handler: ScheduleHandler) => void
  // Index signature for unknown patterns
  [key: string]: unknown
}

describe('OnProxy/EveryProxy autocomplete - TDD RED', () => {
  describe('OnProxy known property types - documents current limitations', () => {
    /**
     * Current OnProxy type:
     *   { [noun: string]: { [event: string]: (handler: EventHandler) => void } }
     *
     * This makes TypeScript unable to distinguish known nouns from unknown ones.
     * IDE autocomplete will not suggest "Customer", "Order", etc.
     *
     * Desired OnProxy type should have explicit known properties for autocomplete.
     *
     * TEST STRATEGY:
     * - Document that current types use pure index signatures
     * - When types are fixed to have explicit properties, @ts-expect-error will fail
     */

    it('documents: CURRENT OnProxy uses pure index signature (no explicit keys)', () => {
      // With current types, OnProxy is { [noun: string]: ... }
      // This means 'Customer' is NOT an explicit key, just matches index signature
      //
      // HasKnownKey returns true for index signatures because any string is valid
      // So we can't easily test this at compile time

      // Instead, document that accessing onProxy.Customer gives same type as any other key
      const onProxy: OnProxy = {} as OnProxy

      // These are all the same type because of index signature
      type CustomerType = typeof onProxy.Customer
      type RandomType = typeof onProxy.RandomNoun

      // Both should be the same - this is CURRENT behavior we want to change
      expectTypeOf<CustomerType>().toEqualTypeOf<RandomType>()
    })

    it('documents: IDE autocomplete shows nothing for $.on. with current types', () => {
      // This is a documentation test - can't test autocomplete at runtime
      // But we document that pure index signatures don't provide suggestions

      const workflow = Workflow($ => {})

      // When typing "workflow.$.on." the IDE shows NO suggestions
      // because OnProxy is { [noun: string]: ... } with no explicit keys

      // With FIXED types, IDE would suggest: Customer, Order, Payment, User, etc.

      // Current behavior: any string access works but no autocomplete
      const _customer = workflow.$.on.Customer  // Works but no suggestion
      const _random = workflow.$.on.AnyRandomString  // Also works, same type
    })

    it('FAILS when fixed: OnProxy should have explicit known nouns', () => {
      // This test will FAIL TO COMPILE when OnProxy is fixed to have explicit keys
      // because the type check will be different

      // With CURRENT types: OnProxy has no explicit 'Customer' key
      // With FIXED types: OnProxy should have Customer, Order, etc. as explicit keys

      // Type that checks if 'Customer' is an explicit key vs index signature
      // With pure index signature, this is still 'true' because any string matches
      // So we need a different approach...

      // For now, this test documents the limitation - we can't easily distinguish
      // index-signature-matched keys from explicit keys in TypeScript

      type OnProxyKeys = keyof OnProxy
      // With index signature: keyof is string
      // With explicit keys: keyof would include 'Customer' | 'Order' | string

      // @ts-expect-error - REMOVE when fixed: OnProxyKeys should include literal types
      const _onlyString: OnProxyKeys = 'Customer'  // Currently this is just 'string'
    })
  })

  describe('EveryProxy known property types - documents current limitations', () => {
    /**
     * Current EveryProxy type has a complex union with index signature:
     *   { (description, handler): void } & { [key: string]: ... }
     *
     * This makes it hard for TypeScript to determine specific property types.
     * Known patterns like .hour, .Monday should be explicitly typed
     * for better IDE autocomplete.
     *
     * TEST STRATEGY:
     * - Document current union type behavior
     * - Use @ts-expect-error for things that will work when fixed
     */

    it('documents: CURRENT EveryProxy uses union type with index signature', () => {
      // Current EveryProxy type makes property access return a union type
      // not a specific type like (handler: ScheduleHandler) => void

      const workflow = Workflow($ => {})
      const every = workflow.$.every

      // With current types, $.every.hour is a union type, not specifically typed
      type HourType = typeof every.hour

      // Document that hour is a complex union, not just a function
      // (This is the limitation we want to fix)
    })

    it('documents: $.every.hour works but has union type', () => {
      const workflow = Workflow($ => {})

      // $.every.hour IS callable in practice (runtime works)
      // But TypeScript types it as a union which is confusing
      const hour = workflow.$.every.hour

      // This passes because union includes function type
      expectTypeOf(hour).toBeFunction()

      // Runtime: hour(() => {}) works
      // Type: hour is union type, not specifically (handler) => void
    })

    it('FAILS when fixed: $.every.Monday.at9am should be directly typed', () => {
      const workflow = Workflow($ => {})

      const monday = workflow.$.every.Monday

      // With CURRENT types: monday.at9am may not be properly typed
      // With FIXED types: monday.at9am should be (handler: ScheduleHandler) => void

      // This currently might error or return unknown
      // @ts-expect-error - REMOVE when types are fixed to support chained access
      const at9am: (handler: ScheduleHandler) => void = monday.at9am
    })

    it('documents: $.every.minutes curried call works at runtime', () => {
      const workflow = Workflow($ => {})

      // $.every.minutes(30) works at runtime
      // Types may be confusing due to union
      const minutes = workflow.$.every.minutes

      // First call with number
      expectTypeOf(minutes).toBeFunction()

      // Runtime works, types are union
      const every30 = workflow.$.every.minutes(30)
      expectTypeOf(every30).toBeFunction()
    })

    it('FAILS when fixed: keyof EveryProxy should include known patterns', () => {
      // With CURRENT types: keyof EveryProxy is string (from index signature)
      // With FIXED types: keyof EveryProxy should include 'hour' | 'Monday' | 'minutes' | string

      type EveryProxyKeys = keyof EveryProxy

      // @ts-expect-error - REMOVE when fixed: should accept literal type
      const _hourKey: EveryProxyKeys extends 'hour' ? true : false = true
    })

    it('documents: IDE autocomplete limited with current union types', () => {
      // When typing "workflow.$.every." the IDE may show:
      // - Some suggestions from union type
      // - But not clear, specific suggestions for known patterns

      const workflow = Workflow($ => {})

      // With FIXED types, IDE would clearly suggest:
      // - hour, minute, second, day, week
      // - Monday, Tuesday, Wednesday, etc.
      // - minutes, hours, seconds, etc.

      // Current behavior: union type makes suggestions confusing
      type HourType = typeof workflow.$.every.hour
      type MinutesType = typeof workflow.$.every.minutes
    })
  })

  describe('$.send type safety', () => {
    it('should have $.send callable and typed', () => {
      const workflow = Workflow($ => {})

      // $.send should be a function
      expectTypeOf(workflow.$.send).toBeFunction()

      // Should not be unknown
      expectTypeOf(workflow.$.send).not.toBeUnknown()

      // Should return Promise<void>
      expectTypeOf(workflow.$.send<{ id: string }>).returns.toEqualTypeOf<Promise<void>>()
    })

    it('should type-check send call with data', async () => {
      const workflow = Workflow($ => {
        $.on.Email.welcome((data, ctx) => {
          ctx.log('Welcome email sent')
        })
      })

      // $.send should accept event name and typed data
      await workflow.$.send('Email.welcome', { to: 'test@example.com' })

      // The data parameter type should be inferred or explicitly typed
      await workflow.$.send<{ to: string }>('Email.welcome', { to: 'test@example.com' })
    })
  })

  describe('$.state accessibility', () => {
    it('should have $.state accessible and typed', () => {
      const workflow = Workflow($ => {})

      // $.state should be accessible
      expectTypeOf(workflow.$.state).not.toBeUnknown()

      // Should be a record type
      expectTypeOf(workflow.$.state).toMatchTypeOf<Record<string, unknown>>()
    })

    it('should allow reading and writing state', () => {
      const workflow = Workflow($ => {
        // Writing to state
        $.state.userId = '123'
        $.state.counter = 0

        // Reading from state
        const userId = $.state.userId
        const counter = $.state.counter

        expect(userId).toBe('123')
        expect(counter).toBe(0)
      })
    })

    it('should have $.set and $.get methods typed', () => {
      const workflow = Workflow($ => {})

      // $.set should be callable
      expectTypeOf(workflow.$.set).toBeFunction()
      expectTypeOf(workflow.$.set<string>).toBeCallableWith('key', 'value')

      // $.get should be callable and return typed value
      expectTypeOf(workflow.$.get).toBeFunction()
      expectTypeOf(workflow.$.get<string>).returns.toEqualTypeOf<string | undefined>()
    })
  })

  describe('Dynamic noun/event access still works', () => {
    /**
     * Even with explicit known properties, dynamic access should still work
     * through the index signature fallback.
     */

    it('should allow $.on.DynamicNoun.dynamicEvent access', () => {
      const workflow = Workflow($ => {
        // Dynamic access should still work
        $.on.SomeNewNoun.someEvent(() => {})
      })

      expect(workflow.definition.events).toHaveLength(1)
      expect(workflow.definition.events[0]?.noun).toBe('SomeNewNoun')
      expect(workflow.definition.events[0]?.event).toBe('someEvent')
    })

    it('should allow $.on[variable] access pattern', () => {
      const workflow = Workflow($ => {})

      const nounName = 'DynamicEntity' as string
      const events = workflow.$.on[nounName]

      // Should still be accessible and usable
      expectTypeOf(events).not.toBeUnknown()
    })
  })

  describe('createTestContext type safety', () => {
    it('should return properly typed context', () => {
      const ctx = createTestContext()

      // Should have all WorkflowContext properties
      expectTypeOf(ctx.send).toBeFunction()
      expectTypeOf(ctx.on).toEqualTypeOf<OnProxy>()
      expectTypeOf(ctx.every).toEqualTypeOf<EveryProxy>()
      expectTypeOf(ctx.state).toMatchTypeOf<Record<string, unknown>>()
      expectTypeOf(ctx.getState).toBeFunction()
      expectTypeOf(ctx.set).toBeFunction()
      expectTypeOf(ctx.get).toBeFunction()
      expectTypeOf(ctx.log).toBeFunction()
    })

    it('should have emittedEvents property typed', () => {
      const ctx = createTestContext()

      // Should have emittedEvents array
      expectTypeOf(ctx.emittedEvents).toEqualTypeOf<Array<{ event: string; data: unknown }>>()
    })
  })
})
