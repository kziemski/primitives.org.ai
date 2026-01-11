/**
 * TDD RED Phase Tests: Type Safety for every.ts and workflow.ts
 * Issue: primitives.org.ai-rna (partial)
 *
 * These tests verify type safety for:
 * 1. pluralUnits mapping to ScheduleInterval.type
 * 2. Proxy callable return types
 *
 * Goal: Eliminate `as any` casts while maintaining type safety
 */
import { describe, it, expect, beforeEach, expectTypeOf } from 'vitest'
import type { ScheduleInterval, ScheduleHandler, EveryProxy } from '../src/types.js'
import {
  every,
  getScheduleHandlers,
  clearScheduleHandlers,
  registerScheduleHandler,
} from '../src/every.js'
import { Workflow } from '../src/workflow.js'

/**
 * Type-level tests for ScheduleInterval
 */
describe('Type Safety: ScheduleInterval types', () => {
  beforeEach(() => {
    clearScheduleHandlers()
  })

  describe('pluralUnits type inference', () => {
    /**
     * The plural unit keys (seconds, minutes, hours, days, weeks)
     * should map to valid ScheduleInterval type discriminants
     */

    it('every.seconds should create a ScheduleInterval with type "second"', () => {
      every.seconds(10)(() => {})

      const handlers = getScheduleHandlers()
      const interval = handlers[0]?.interval

      // Runtime check
      expect(interval).toBeDefined()
      expect(interval?.type).toBe('second')

      // Type check: interval.type should be assignable to ScheduleInterval['type']
      if (interval) {
        const typeCheck: ScheduleInterval['type'] = interval.type
        expect(typeCheck).toBe('second')
      }
    })

    it('every.minutes should create a ScheduleInterval with type "minute"', () => {
      every.minutes(30)(() => {})

      const handlers = getScheduleHandlers()
      const interval = handlers[0]?.interval

      expect(interval?.type).toBe('minute')

      if (interval) {
        const typeCheck: ScheduleInterval['type'] = interval.type
        expect(typeCheck).toBe('minute')
      }
    })

    it('every.hours should create a ScheduleInterval with type "hour"', () => {
      every.hours(4)(() => {})

      const handlers = getScheduleHandlers()
      const interval = handlers[0]?.interval

      expect(interval?.type).toBe('hour')

      if (interval) {
        const typeCheck: ScheduleInterval['type'] = interval.type
        expect(typeCheck).toBe('hour')
      }
    })

    it('every.days should create a ScheduleInterval with type "day"', () => {
      every.days(2)(() => {})

      const handlers = getScheduleHandlers()
      const interval = handlers[0]?.interval

      expect(interval?.type).toBe('day')

      if (interval) {
        const typeCheck: ScheduleInterval['type'] = interval.type
        expect(typeCheck).toBe('day')
      }
    })

    it('every.weeks should create a ScheduleInterval with type "week"', () => {
      every.weeks(1)(() => {})

      const handlers = getScheduleHandlers()
      const interval = handlers[0]?.interval

      expect(interval?.type).toBe('week')

      if (interval) {
        const typeCheck: ScheduleInterval['type'] = interval.type
        expect(typeCheck).toBe('week')
      }
    })
  })

  describe('registerScheduleHandler type safety', () => {
    /**
     * Direct registration should accept properly typed intervals
     */

    it('should accept valid time-based intervals', () => {
      const handler: ScheduleHandler = () => {}

      // These should all compile without errors
      registerScheduleHandler({ type: 'second', value: 10 }, handler)
      registerScheduleHandler({ type: 'minute', value: 30 }, handler)
      registerScheduleHandler({ type: 'hour', value: 4 }, handler)
      registerScheduleHandler({ type: 'day', value: 2 }, handler)
      registerScheduleHandler({ type: 'week', value: 1 }, handler)

      expect(getScheduleHandlers()).toHaveLength(5)
    })

    it('should accept valid cron intervals', () => {
      const handler: ScheduleHandler = () => {}

      registerScheduleHandler({ type: 'cron', expression: '0 9 * * 1' }, handler)

      const handlers = getScheduleHandlers()
      expect(handlers[0]?.interval.type).toBe('cron')
    })

    it('should accept valid natural language intervals', () => {
      const handler: ScheduleHandler = () => {}

      registerScheduleHandler({ type: 'natural', description: 'every Monday at 9am' }, handler)

      const handlers = getScheduleHandlers()
      expect(handlers[0]?.interval.type).toBe('natural')
    })
  })

  describe('EveryProxy type inference', () => {
    /**
     * The every proxy should have proper return types
     */

    it('every should be callable as a function', () => {
      // every('description', handler) should work
      every('custom schedule', () => {})

      const handlers = getScheduleHandlers()
      expect(handlers[0]?.interval.type).toBe('natural')
    })

    it('every.unit should return a handler registrar', () => {
      // every.hour(handler) should work
      const registrar = every.hour
      expect(typeof registrar).toBe('function')
    })

    it('every.pluralUnit should return a curried function', () => {
      // every.hours(4) should return (handler) => void
      const withValue = every.hours(4)
      expect(typeof withValue).toBe('function')

      withValue(() => {})
      expect(getScheduleHandlers()).toHaveLength(1)
    })

    it('every.Day.atTime should be callable', () => {
      // every.Monday.at9am(handler) should work
      every.Monday.at9am(() => {})

      const handlers = getScheduleHandlers()
      expect(handlers[0]?.interval.type).toBe('cron')
    })
  })
})

describe('Type Safety: Workflow every proxy', () => {
  describe('$.every type inference in workflows', () => {
    it('$.every.pluralUnit should create proper intervals', () => {
      const workflow = Workflow($ => {
        $.every.seconds(5)(() => {})
        $.every.minutes(15)(() => {})
        $.every.hours(2)(() => {})
      })

      const schedules = workflow.definition.schedules
      expect(schedules).toHaveLength(3)

      expect(schedules[0]?.interval.type).toBe('second')
      expect(schedules[1]?.interval.type).toBe('minute')
      expect(schedules[2]?.interval.type).toBe('hour')
    })

    it('$.every should be callable for natural language', () => {
      const workflow = Workflow($ => {
        $.every('hourly check', () => {})
      })

      const schedules = workflow.definition.schedules
      expect(schedules[0]?.interval.type).toBe('natural')
    })

    it('$.every.Day.atTime should work in workflows', () => {
      const workflow = Workflow($ => {
        $.every.Monday.at9am(() => {})
        $.every.Friday.at5pm(() => {})
      })

      const schedules = workflow.definition.schedules
      expect(schedules).toHaveLength(2)
      expect(schedules[0]?.interval.type).toBe('cron')
      expect(schedules[1]?.interval.type).toBe('cron')
    })
  })
})

/**
 * Type-level compile tests
 * These test that the types compile correctly
 */
describe('Compile-time type safety', () => {
  it('ScheduleInterval type discriminant should be a union of literal types', () => {
    // This is a compile-time check - if it compiles, it passes
    type IntervalType = ScheduleInterval['type']

    // Should be: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'cron' | 'natural'
    const validTypes: IntervalType[] = ['second', 'minute', 'hour', 'day', 'week', 'cron', 'natural']

    expect(validTypes).toHaveLength(7)
  })

  it('TimeUnitInterval types should have optional value and natural properties', () => {
    // Compile-time type check
    const secondInterval: ScheduleInterval = { type: 'second' }
    const minuteWithValue: ScheduleInterval = { type: 'minute', value: 30 }
    const hourWithNatural: ScheduleInterval = { type: 'hour', value: 4, natural: '4 hours' }

    expect(secondInterval.type).toBe('second')
    expect(minuteWithValue.type).toBe('minute')
    expect(hourWithNatural.type).toBe('hour')
  })

  it('CronInterval must have expression property', () => {
    const cronInterval: ScheduleInterval = { type: 'cron', expression: '0 * * * *' }

    expect(cronInterval.type).toBe('cron')
    if (cronInterval.type === 'cron') {
      expect(cronInterval.expression).toBe('0 * * * *')
    }
  })

  it('NaturalInterval must have description property', () => {
    const naturalInterval: ScheduleInterval = { type: 'natural', description: 'every hour' }

    expect(naturalInterval.type).toBe('natural')
    if (naturalInterval.type === 'natural') {
      expect(naturalInterval.description).toBe('every hour')
    }
  })
})

/**
 * Tests for the PluralUnitKey type helper
 * This validates that the type mapping is correct
 */
describe('PluralUnit to IntervalType mapping', () => {
  /**
   * The mapping should be:
   * - 'seconds' -> 'second'
   * - 'minutes' -> 'minute'
   * - 'hours' -> 'hour'
   * - 'days' -> 'day'
   * - 'weeks' -> 'week'
   */

  it('plural form should map to singular interval type', () => {
    // Test through runtime behavior
    clearScheduleHandlers()

    const mappings = [
      { plural: 'seconds', expected: 'second' },
      { plural: 'minutes', expected: 'minute' },
      { plural: 'hours', expected: 'hour' },
      { plural: 'days', expected: 'day' },
      { plural: 'weeks', expected: 'week' },
    ] as const

    for (const { plural, expected } of mappings) {
      clearScheduleHandlers()
      ;(every as any)[plural](1)(() => {})

      const handlers = getScheduleHandlers()
      expect(handlers[0]?.interval.type).toBe(expected)
    }
  })
})
