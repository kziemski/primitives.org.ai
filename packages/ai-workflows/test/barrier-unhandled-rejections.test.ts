/**
 * Tests for unhandled promise rejections in barrier operations
 *
 * TDD RED Phase: These tests expose unhandled promise rejections that occur when:
 * 1. waitForAll completes successfully but timeout/abort promises are left dangling
 * 2. waitForAny resolves early leaving pending promises that later reject unhandled
 * 3. Barrier abort handlers aren't cleaned up properly
 *
 * These tests verify that NO unhandled rejections occur in any scenario.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  waitForAll,
  waitForAny,
  createBarrier,
  withConcurrencyLimit,
} from '../src/barrier.js'

describe('Barrier Unhandled Promise Rejections', () => {
  // Map to track unhandled rejections by promise
  let unhandledMap: Map<Promise<unknown>, unknown>
  let originalUnhandledHandler: NodeJS.UnhandledRejectionListener | undefined
  let originalHandledHandler: NodeJS.RejectionHandledListener | undefined

  // Helper to get truly unhandled rejections (those not later handled)
  const getUnhandledRejections = () => [...unhandledMap.values()]

  beforeEach(() => {
    vi.useFakeTimers()
    unhandledMap = new Map()

    // Capture original handlers
    originalUnhandledHandler = process.listeners('unhandledRejection')[0] as
      | NodeJS.UnhandledRejectionListener
      | undefined
    originalHandledHandler = process.listeners('rejectionHandled')[0] as
      | NodeJS.RejectionHandledListener
      | undefined

    // Remove existing listeners temporarily
    process.removeAllListeners('unhandledRejection')
    process.removeAllListeners('rejectionHandled')

    // Track unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      unhandledMap.set(promise, reason)
    })

    // Remove from tracking when handled
    process.on('rejectionHandled', (promise) => {
      unhandledMap.delete(promise)
    })
  })

  afterEach(() => {
    vi.useRealTimers()

    // Restore original handlers
    process.removeAllListeners('unhandledRejection')
    process.removeAllListeners('rejectionHandled')
    if (originalUnhandledHandler) {
      process.on('unhandledRejection', originalUnhandledHandler)
    }
    if (originalHandledHandler) {
      process.on('rejectionHandled', originalHandledHandler)
    }
  })

  // Alias for backwards compatibility in tests
  const unhandledRejections = {
    get length() {
      return getUnhandledRejections().length
    },
  }

  describe('waitForAll timeout cleanup', () => {
    it('should not leave dangling timeout rejection when promises resolve before timeout', async () => {
      // This test exposes a bug: the timeout promise is never cleaned up
      // when the main promises resolve first, leaving an unhandled rejection

      const fastPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('fast'), 100)
      })

      const promise = waitForAll([fastPromise], { timeout: 5000 })

      // Let the fast promise resolve
      await vi.advanceTimersByTimeAsync(200)
      const result = await promise

      expect(result).toEqual(['fast'])

      // Now advance past the timeout - the timeout promise should have been cleaned up
      // If not, we'll get an unhandled rejection
      await vi.advanceTimersByTimeAsync(6000)

      // Give microtasks time to process
      await vi.runAllTimersAsync()
      await Promise.resolve()

      expect(unhandledRejections).toHaveLength(0)
    })

    it('should not leave dangling abort rejection when promises resolve before abort', async () => {
      const controller = new AbortController()

      const fastPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('completed'), 100)
      })

      const promise = waitForAll([fastPromise], { signal: controller.signal })

      // Let the promise complete normally
      await vi.advanceTimersByTimeAsync(200)
      const result = await promise

      expect(result).toEqual(['completed'])

      // Now abort - this shouldn't cause an unhandled rejection
      controller.abort()

      await Promise.resolve()

      expect(unhandledRejections).toHaveLength(0)
    })

    it('should not leave dangling timeout when one promise rejects', async () => {
      // When a promise rejects, the timeout should be cleaned up
      const failingPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Task failed')), 100)
      })

      const promise = waitForAll([failingPromise], { timeout: 5000 })

      await vi.advanceTimersByTimeAsync(200)

      await expect(promise).rejects.toThrow('Task failed')

      // Advance past timeout - should not trigger unhandled rejection
      await vi.advanceTimersByTimeAsync(6000)
      await Promise.resolve()

      expect(unhandledRejections).toHaveLength(0)
    })
  })

  describe('waitForAny unhandled pending rejections', () => {
    it('should not have unhandled rejections from pending promises that fail after resolution', async () => {
      // This is the critical bug: when waitForAny resolves early,
      // any remaining promises that reject are completely unhandled

      const fast = new Promise<string>((resolve) => {
        setTimeout(() => resolve('fast'), 100)
      })

      const slowFailing = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Slow task failed')), 500)
      })

      const promise = waitForAny(1, [fast, slowFailing])

      // Let the fast one complete
      await vi.advanceTimersByTimeAsync(200)
      const result = await promise

      expect(result.completed).toContain('fast')

      // Now let the slow one fail - this rejection should be handled
      await vi.advanceTimersByTimeAsync(400)
      await Promise.resolve()

      // BUG: The slowFailing promise rejection is never caught
      expect(unhandledRejections).toHaveLength(0)
    })

    it('should handle multiple pending rejections after early resolution', async () => {
      const fast = new Promise<string>((resolve) => {
        setTimeout(() => resolve('winner'), 50)
      })

      const failing1 = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Failure 1')), 200)
      })

      const failing2 = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Failure 2')), 300)
      })

      const promise = waitForAny(1, [fast, failing1, failing2])

      await vi.advanceTimersByTimeAsync(100)
      const result = await promise

      expect(result.completed).toContain('winner')

      // Let all failing promises reject
      await vi.advanceTimersByTimeAsync(400)
      await Promise.resolve()

      // All rejections should be handled, not left dangling
      expect(unhandledRejections).toHaveLength(0)
    })

    it('should not have unhandled timeout rejection when resolved before timeout', async () => {
      const fast = new Promise<string>((resolve) => {
        setTimeout(() => resolve('quick'), 100)
      })

      const slow = new Promise<string>((resolve) => {
        setTimeout(() => resolve('slow'), 2000)
      })

      const promise = waitForAny(1, [fast, slow], { timeout: 5000 })

      await vi.advanceTimersByTimeAsync(200)
      const result = await promise

      expect(result.completed).toContain('quick')

      // Advance past timeout
      await vi.advanceTimersByTimeAsync(6000)
      await Promise.resolve()

      expect(unhandledRejections).toHaveLength(0)
    })
  })

  describe('Barrier abort handler cleanup', () => {
    it('should remove abort listener when barrier completes normally', async () => {
      const controller = new AbortController()
      const barrier = createBarrier<string>(2, { signal: controller.signal })

      const waitPromise = barrier.wait()

      barrier.arrive('first')
      barrier.arrive('second')

      const results = await waitPromise

      expect(results).toEqual(['first', 'second'])

      // Aborting after completion should not cause issues
      controller.abort()

      await Promise.resolve()

      expect(unhandledRejections).toHaveLength(0)
    })

    it('should cleanup abort listener when barrier times out', async () => {
      const controller = new AbortController()
      const barrier = createBarrier<string>(3, {
        signal: controller.signal,
        timeout: 1000,
      })

      barrier.arrive('first')

      const promise = barrier.wait()
      // Pre-attach catch handler to prevent unhandled rejection warning with fake timers
      // This is necessary because fake timers can cause the rejection to fire
      // before the test's assertion handler is ready
      promise.catch(() => {})

      await vi.advanceTimersByTimeAsync(1500)

      await expect(promise).rejects.toThrow()

      // Aborting after timeout should not cause double rejection
      controller.abort()

      await Promise.resolve()

      expect(unhandledRejections).toHaveLength(0)
    })
  })

  describe('withConcurrencyLimit error handling', () => {
    it('should not leave unhandled rejections when failing fast', async () => {
      // When collectErrors is false and a task fails,
      // any other pending tasks that reject should still be handled

      const tasks = [
        () =>
          new Promise<number>((_, reject) => {
            setTimeout(() => reject(new Error('First failure')), 100)
          }),
        () =>
          new Promise<number>((_, reject) => {
            setTimeout(() => reject(new Error('Second failure')), 200)
          }),
        () =>
          new Promise<number>((resolve) => {
            setTimeout(() => resolve(3), 50)
          }),
      ]

      const promise = withConcurrencyLimit(tasks, 3)

      await vi.advanceTimersByTimeAsync(150)

      await expect(promise).rejects.toThrow('First failure')

      // Let remaining tasks complete/fail
      await vi.advanceTimersByTimeAsync(200)
      await Promise.resolve()

      expect(unhandledRejections).toHaveLength(0)
    })
  })

  describe('Race condition scenarios', () => {
    it('should handle simultaneous completion and timeout', async () => {
      // Edge case: what happens when the promise resolves at exactly the timeout?
      const promise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('just in time'), 1000)
      })

      const waitPromise = waitForAll([promise], { timeout: 1000 })

      // Both should fire at 1000ms
      await vi.advanceTimersByTimeAsync(1000)

      // Should not have unhandled rejections regardless of which wins
      await Promise.resolve()

      // One of these should work without unhandled rejections
      try {
        await waitPromise
      } catch {
        // Timeout might win, that's ok
      }

      // Give any dangling promises time to reject
      await vi.advanceTimersByTimeAsync(1000)
      await Promise.resolve()

      expect(unhandledRejections).toHaveLength(0)
    })

    it('should handle abort signal fired after successful completion', async () => {
      const controller = new AbortController()

      const fastPromise = Promise.resolve('immediate')

      const result = await waitForAll([fastPromise], { signal: controller.signal })

      expect(result).toEqual(['immediate'])

      // Fire abort after already completed
      controller.abort()

      await Promise.resolve()

      expect(unhandledRejections).toHaveLength(0)
    })
  })
})
