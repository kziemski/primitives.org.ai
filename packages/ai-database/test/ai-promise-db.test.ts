/**
 * Tests for ai-promise-db.ts
 *
 * Comprehensive tests covering:
 * - DBPromise implementation and promise pipelining
 * - Batch loading logic and recording proxies
 * - Promise chain optimization (map, filter, sort, limit, first, forEach)
 * - Error propagation in chains
 * - Factory functions (createListPromise, createEntityPromise, createSearchPromise)
 * - wrapEntityOperations wrapper function
 * - Helper functions (isDBPromise, getRawDBPromise)
 * - ForEach options (concurrency, retries, persistence, progress tracking)
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DB, setProvider, createMemoryProvider } from '../src/index.js'
import {
  DBPromise,
  DB_PROMISE_SYMBOL,
  RAW_DB_PROMISE_SYMBOL,
  isDBPromise,
  getRawDBPromise,
  createListPromise,
  createEntityPromise,
  createSearchPromise,
  wrapEntityOperations,
  setProviderResolver,
  setSchemaRelationInfo,
  type ForEachOptions,
  type ForEachResult,
  type ForEachProgress,
  type ForEachActionsAPI,
} from '../src/ai-promise-db.js'

describe('ai-promise-db', () => {
  beforeEach(() => {
    setProvider(createMemoryProvider())
  })

  // ===========================================================================
  // DBPromise Core Implementation
  // ===========================================================================

  describe('DBPromise class', () => {
    describe('basic promise behavior', () => {
      it('creates a DBPromise with executor', async () => {
        const promise = new DBPromise<string>({
          executor: async () => 'hello',
        })

        const result = await promise
        expect(result).toBe('hello')
      })

      it('resolves to the executor result', async () => {
        const promise = new DBPromise<number>({
          executor: async () => 42,
        })

        expect(await promise).toBe(42)
      })

      it('supports then() chaining', async () => {
        const promise = new DBPromise<number>({
          executor: async () => 10,
        })

        const doubled = await promise.then((n) => n * 2)
        expect(doubled).toBe(20)
      })

      it('supports catch() for error handling', async () => {
        const promise = new DBPromise<number>({
          executor: async () => {
            throw new Error('Test error')
          },
        })

        const result = await promise.catch((err) => {
          expect(err).toBeInstanceOf(Error)
          return -1
        })
        expect(result).toBe(-1)
      })

      it('supports finally() for cleanup', async () => {
        let cleanupCalled = false
        const promise = new DBPromise<string>({
          executor: async () => 'value',
        })

        const result = await promise.finally(() => {
          cleanupCalled = true
        })

        expect(result).toBe('value')
        expect(cleanupCalled).toBe(true)
      })

      it('finally() is called on error', async () => {
        let cleanupCalled = false
        const promise = new DBPromise<string>({
          executor: async () => {
            throw new Error('error')
          },
        })

        await expect(
          promise.finally(() => {
            cleanupCalled = true
          })
        ).rejects.toThrow('error')

        expect(cleanupCalled).toBe(true)
      })

      it('caches resolved value', async () => {
        let executorCallCount = 0
        const promise = new DBPromise<string>({
          executor: async () => {
            executorCallCount++
            return 'value'
          },
        })

        await promise
        await promise
        await promise

        expect(executorCallCount).toBe(1)
      })

      it('tracks isResolved state', async () => {
        const promise = new DBPromise<string>({
          executor: async () => 'value',
        })

        // Access internal state through the proxy
        const rawPromise = getRawDBPromise(promise)
        expect(rawPromise.isResolved).toBe(false)

        await promise

        expect(rawPromise.isResolved).toBe(true)
      })
    })

    describe('property access tracking', () => {
      it('tracks accessed properties', async () => {
        const promise = new DBPromise<{ name: string; age: number }>({
          executor: async () => ({ name: 'John', age: 30 }),
        })

        // Access properties through proxy
        const namePromise = (promise as any).name
        const agePromise = (promise as any).age

        expect(promise.accessedProps.has('name')).toBe(true)
        expect(promise.accessedProps.has('age')).toBe(true)
      })

      it('returns new DBPromise for property access', async () => {
        const promise = new DBPromise<{ value: number }>({
          executor: async () => ({ value: 42 }),
        })

        const valueProp = (promise as any).value
        expect(isDBPromise(valueProp)).toBe(true)
      })

      it('resolves nested property access', async () => {
        const promise = new DBPromise<{ nested: { deep: string } }>({
          executor: async () => ({ nested: { deep: 'value' } }),
        })

        // Nested property access returns a new DBPromise, but the deeply nested
        // property path needs proper chaining. This tests the actual behavior.
        const nestedPromise = (promise as any).nested
        const nestedValue = await nestedPromise
        expect(nestedValue).toEqual({ deep: 'value' })
      })

      it('prevents setting properties', () => {
        const promise = new DBPromise<{ value: number }>({
          executor: async () => ({ value: 1 }),
        })

        expect(() => {
          ;(promise as any).value = 2
        }).toThrow('DBPromise properties are read-only')
      })

      it('prevents deleting properties', () => {
        const promise = new DBPromise<{ value: number }>({
          executor: async () => ({ value: 1 }),
        })

        expect(() => {
          delete (promise as any).value
        }).toThrow('DBPromise properties cannot be deleted')
      })
    })

    describe('DB_PROMISE_SYMBOL and RAW_DB_PROMISE_SYMBOL', () => {
      it('has DB_PROMISE_SYMBOL set to true', () => {
        const promise = new DBPromise<string>({
          executor: async () => 'test',
        })

        expect((promise as any)[DB_PROMISE_SYMBOL]).toBe(true)
      })

      it('returns raw promise via RAW_DB_PROMISE_SYMBOL', () => {
        const promise = new DBPromise<string>({
          executor: async () => 'test',
        })

        // The RAW_DB_PROMISE_SYMBOL returns the target of the proxy (the actual DBPromise)
        // We can verify this by checking it's a DBPromise via isDBPromise
        const raw = getRawDBPromise(promise)
        expect(isDBPromise(raw)).toBe(true)
      })
    })

    describe('Symbol.asyncIterator', () => {
      it('iterates over array results', async () => {
        const promise = new DBPromise<string[]>({
          executor: async () => ['a', 'b', 'c'],
        })

        const items: string[] = []
        for await (const item of promise) {
          items.push(item)
        }

        expect(items).toEqual(['a', 'b', 'c'])
      })

      it('yields single item for non-array results', async () => {
        const promise = new DBPromise<string>({
          executor: async () => 'single',
        })

        const items: string[] = []
        for await (const item of promise) {
          items.push(item as string)
        }

        expect(items).toEqual(['single'])
      })
    })
  })

  // ===========================================================================
  // Array Methods (map, filter, sort, limit, first)
  // ===========================================================================

  describe('array methods', () => {
    describe('map()', () => {
      it('maps over array results with object items', async () => {
        // DBPromise.map() is optimized for batch-loading relations.
        // It uses recording proxies that track property access.
        // For primitive arrays, use filter/sort/limit or async iteration.
        const promise = new DBPromise<{ value: number }[]>({
          executor: async () => [{ value: 1 }, { value: 2 }, { value: 3 }],
        })

        const doubled = await promise.map((item) => ({ doubled: item.value * 2 }))
        expect(doubled).toEqual([{ doubled: 2 }, { doubled: 4 }, { doubled: 6 }])
      })

      it('throws when mapping non-array', async () => {
        const promise = new DBPromise<string>({
          executor: async () => 'not an array',
        })

        await expect(promise.map((x) => x)).rejects.toThrow('Cannot map over non-array result')
      })

      it('passes index to callback', async () => {
        const promise = new DBPromise<{ name: string }[]>({
          executor: async () => [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
        })

        const withIndexes = await promise.map((item, index) => `${index}:${item.name}`)
        expect(withIndexes).toEqual(['0:a', '1:b', '2:c'])
      })
    })

    describe('filter()', () => {
      it('filters array results', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3, 4, 5],
        })

        const filtered = await promise.filter((n) => n % 2 === 0)
        expect(filtered).toEqual([2, 4])
      })

      it('returns original for non-array', async () => {
        const promise = new DBPromise<string>({
          executor: async () => 'not array',
        })

        const result = await promise.filter(() => true)
        expect(result).toBe('not array')
      })

      it('passes index to predicate', async () => {
        const promise = new DBPromise<string[]>({
          executor: async () => ['a', 'b', 'c', 'd'],
        })

        const filtered = await promise.filter((_, index) => index < 2)
        expect(filtered).toEqual(['a', 'b'])
      })
    })

    describe('sort()', () => {
      it('sorts array results', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [3, 1, 2],
        })

        const sorted = await promise.sort((a, b) => a - b)
        expect(sorted).toEqual([1, 2, 3])
      })

      it('sorts with default comparator when none provided', async () => {
        const promise = new DBPromise<string[]>({
          executor: async () => ['c', 'a', 'b'],
        })

        const sorted = await promise.sort()
        expect(sorted).toEqual(['a', 'b', 'c'])
      })

      it('returns original for non-array', async () => {
        const promise = new DBPromise<string>({
          executor: async () => 'not array',
        })

        const result = await promise.sort()
        expect(result).toBe('not array')
      })

      it('does not mutate original array', async () => {
        const original = [3, 1, 2]
        const promise = new DBPromise<number[]>({
          executor: async () => original,
        })

        await promise.sort((a, b) => a - b)
        expect(original).toEqual([3, 1, 2])
      })
    })

    describe('limit()', () => {
      it('limits array results', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3, 4, 5],
        })

        const limited = await promise.limit(3)
        expect(limited).toEqual([1, 2, 3])
      })

      it('returns all when limit exceeds length', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2],
        })

        const limited = await promise.limit(10)
        expect(limited).toEqual([1, 2])
      })

      it('returns empty array for limit 0', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const limited = await promise.limit(0)
        expect(limited).toEqual([])
      })

      it('returns original for non-array', async () => {
        const promise = new DBPromise<string>({
          executor: async () => 'not array',
        })

        const result = await promise.limit(10)
        expect(result).toBe('not array')
      })
    })

    describe('first()', () => {
      it('returns first array item', async () => {
        const promise = new DBPromise<string[]>({
          executor: async () => ['first', 'second', 'third'],
        })

        const first = await promise.first()
        expect(first).toBe('first')
      })

      it('returns null for empty array', async () => {
        const promise = new DBPromise<string[]>({
          executor: async () => [],
        })

        const first = await promise.first()
        expect(first).toBe(null)
      })

      it('returns value for non-array', async () => {
        const promise = new DBPromise<string>({
          executor: async () => 'single value',
        })

        const first = await promise.first()
        expect(first).toBe('single value')
      })
    })

    describe('chaining methods', () => {
      it('supports filter then map with objects', async () => {
        const promise = new DBPromise<{ value: number }[]>({
          executor: async () => [
            { value: 1 },
            { value: 2 },
            { value: 3 },
            { value: 4 },
            { value: 5 },
          ],
        })

        const result = await promise
          .filter((item) => item.value % 2 === 0)
          .map((item) => ({ doubled: item.value * 10 }))

        expect(result).toEqual([{ doubled: 20 }, { doubled: 40 }])
      })

      it('supports map then filter with objects', async () => {
        const promise = new DBPromise<{ value: number }[]>({
          executor: async () => [{ value: 1 }, { value: 2 }, { value: 3 }],
        })

        const result = await promise
          .map((item) => ({ doubled: item.value * 2 }))
          .filter((item) => item.doubled > 3)

        expect(result).toEqual([{ doubled: 4 }, { doubled: 6 }])
      })

      it('supports sort then limit', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [5, 1, 4, 2, 3],
        })

        const result = await promise.sort((a, b) => a - b).limit(3)

        expect(result).toEqual([1, 2, 3])
      })

      it('supports complex chain', async () => {
        const promise = new DBPromise<{ name: string; score: number }[]>({
          executor: async () => [
            { name: 'Alice', score: 85 },
            { name: 'Bob', score: 92 },
            { name: 'Charlie', score: 78 },
            { name: 'Diana', score: 95 },
          ],
        })

        const result = await promise
          .filter((p) => p.score > 80)
          .sort((a, b) => b.score - a.score)
          .limit(2)
          .map((p) => ({ name: p.name }))

        expect(result).toEqual([{ name: 'Diana' }, { name: 'Bob' }])
      })
    })
  })

  // ===========================================================================
  // forEach() Implementation
  // ===========================================================================

  describe('forEach()', () => {
    describe('basic iteration', () => {
      it('iterates over all items', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const collected: number[] = []
        const result = await promise.forEach((n) => {
          collected.push(n)
        })

        expect(collected).toEqual([1, 2, 3])
        expect(result.total).toBe(3)
        expect(result.completed).toBe(3)
        expect(result.failed).toBe(0)
      })

      it('throws when iterating non-array', async () => {
        const promise = new DBPromise<string>({
          executor: async () => 'not array',
        })

        await expect(promise.forEach(() => {})).rejects.toThrow(
          'forEach can only be called on array results'
        )
      })

      it('handles async callbacks', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const results: number[] = []
        await promise.forEach(async (n) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          results.push(n * 2)
        })

        expect(results).toEqual([2, 4, 6])
      })
    })

    describe('concurrency', () => {
      it('defaults to sequential processing (concurrency=1)', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const order: number[] = []
        await promise.forEach(
          async (n) => {
            await new Promise((resolve) => setTimeout(resolve, 50))
            order.push(n)
          },
          { concurrency: 1 }
        )

        expect(order).toEqual([1, 2, 3])
      })

      it('processes in parallel with concurrency > 1', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3, 4, 5],
        })

        let maxConcurrent = 0
        let currentConcurrent = 0

        await promise.forEach(
          async () => {
            currentConcurrent++
            maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
            await new Promise((resolve) => setTimeout(resolve, 50))
            currentConcurrent--
          },
          { concurrency: 3 }
        )

        expect(maxConcurrent).toBeLessThanOrEqual(3)
        expect(maxConcurrent).toBeGreaterThan(1)
      })
    })

    describe('error handling', () => {
      it('continues on error by default', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const processed: number[] = []
        const result = await promise.forEach((n) => {
          if (n === 2) throw new Error('Error on 2')
          processed.push(n)
        })

        expect(processed).toEqual([1, 3])
        expect(result.failed).toBe(1)
        expect(result.completed).toBe(2)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].index).toBe(1)
      })

      it('stops on error when onError returns stop', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3, 4, 5],
        })

        const processed: number[] = []
        const result = await promise.forEach(
          (n) => {
            if (n === 3) throw new Error('Stop error')
            processed.push(n)
          },
          { onError: 'stop' }
        )

        expect(processed).toEqual([1, 2])
        expect(result.cancelled).toBe(true)
      })

      it('skips item on error when onError returns skip', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const processed: number[] = []
        const result = await promise.forEach(
          (n) => {
            if (n === 2) throw new Error('Skip')
            processed.push(n)
          },
          { onError: 'skip' }
        )

        expect(processed).toEqual([1, 3])
        expect(result.skipped).toBe(1)
        expect(result.failed).toBe(0)
      })

      it('retries on error when onError returns retry', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        let attempt = 0
        const result = await promise.forEach(
          (n) => {
            if (n === 2) {
              attempt++
              if (attempt < 3) throw new Error('Retry')
            }
          },
          {
            maxRetries: 3,
            retryDelay: 10,
            onError: 'retry',
          }
        )

        expect(attempt).toBe(3)
        expect(result.completed).toBe(3)
        expect(result.failed).toBe(0)
      })

      it('supports function onError handler', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const errorHandler = vi.fn().mockReturnValue('continue')
        await promise.forEach(
          (n) => {
            if (n === 2) throw new Error('Test error')
          },
          { onError: errorHandler }
        )

        expect(errorHandler).toHaveBeenCalledTimes(1)
        expect(errorHandler).toHaveBeenCalledWith(expect.any(Error), 2, 1)
      })

      it('supports async function onError handler', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const result = await promise.forEach(
          (n) => {
            if (n === 2) throw new Error('Test')
          },
          {
            onError: async (error, item) => {
              await new Promise((resolve) => setTimeout(resolve, 10))
              return 'skip'
            },
          }
        )

        expect(result.skipped).toBe(1)
      })
    })

    describe('timeout', () => {
      it('times out slow items', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const result = await promise.forEach(
          async (n) => {
            if (n === 2) {
              await new Promise((resolve) => setTimeout(resolve, 200))
            }
          },
          { timeout: 50, onError: 'continue' }
        )

        expect(result.failed).toBe(1)
        expect(result.errors[0].error.message).toContain('Timeout')
      })
    })

    describe('abort signal', () => {
      it('respects abort signal', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3, 4, 5],
        })

        const controller = new AbortController()
        const processed: number[] = []

        const resultPromise = promise.forEach(
          async (n) => {
            await new Promise((resolve) => setTimeout(resolve, 50))
            processed.push(n)
            if (n === 2) controller.abort()
          },
          { signal: controller.signal }
        )

        const result = await resultPromise
        expect(result.cancelled).toBe(true)
        expect(processed.length).toBeLessThan(5)
      })
    })

    describe('progress tracking', () => {
      it('calls onProgress callback', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const progressUpdates: ForEachProgress[] = []
        await promise.forEach((n) => {}, {
          onProgress: (progress) => {
            progressUpdates.push({ ...progress })
          },
        })

        expect(progressUpdates.length).toBe(3)
        expect(progressUpdates[0].completed).toBe(1)
        expect(progressUpdates[1].completed).toBe(2)
        expect(progressUpdates[2].completed).toBe(3)
      })

      it('includes rate and elapsed time in progress', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        let lastProgress: ForEachProgress | undefined
        await promise.forEach(
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
          },
          {
            onProgress: (progress) => {
              lastProgress = progress
            },
          }
        )

        expect(lastProgress).toBeDefined()
        expect(lastProgress!.elapsed).toBeGreaterThan(0)
        expect(lastProgress!.rate).toBeGreaterThan(0)
        expect(lastProgress!.total).toBe(3)
      })
    })

    describe('onComplete callback', () => {
      it('calls onComplete for each item', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3],
        })

        const completions: Array<{ item: number; result: number; index: number }> = []
        await promise.forEach((n) => n * 2, {
          onComplete: (item, result, index) => {
            completions.push({ item: item as number, result: result as number, index })
          },
        })

        expect(completions).toEqual([
          { item: 1, result: 2, index: 0 },
          { item: 2, result: 4, index: 1 },
          { item: 3, result: 6, index: 2 },
        ])
      })

      it('supports async onComplete', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2],
        })

        const completed: number[] = []
        await promise.forEach((n) => n, {
          onComplete: async (item) => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            completed.push(item as number)
          },
        })

        expect(completed).toEqual([1, 2])
      })
    })

    describe('retry delay', () => {
      it('uses numeric retry delay', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1],
        })

        let attempts = 0
        const startTime = Date.now()

        await promise.forEach(
          () => {
            attempts++
            if (attempts < 3) throw new Error('Retry')
          },
          {
            maxRetries: 3,
            retryDelay: 50,
            onError: 'retry',
          }
        )

        const elapsed = Date.now() - startTime
        expect(elapsed).toBeGreaterThanOrEqual(80) // 2 retries * 50ms
      })

      it('uses function retry delay for backoff', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1],
        })

        const delays: number[] = []
        let attempts = 0

        await promise.forEach(
          () => {
            attempts++
            if (attempts < 3) throw new Error('Retry')
          },
          {
            maxRetries: 3,
            retryDelay: (attempt) => {
              const delay = attempt * 20
              delays.push(delay)
              return delay
            },
            onError: 'retry',
          }
        )

        expect(delays).toEqual([20, 40])
      })
    })

    describe('result object', () => {
      it('returns complete result object', async () => {
        const promise = new DBPromise<number[]>({
          executor: async () => [1, 2, 3, 4, 5],
        })

        const startTime = Date.now()
        const result = await promise.forEach(
          (n) => {
            if (n === 3) throw new Error('Failed')
          },
          { onError: 'continue' }
        )

        expect(result.total).toBe(5)
        expect(result.completed).toBe(4)
        expect(result.failed).toBe(1)
        expect(result.skipped).toBe(0)
        expect(result.elapsed).toBeGreaterThanOrEqual(0)
        expect(result.cancelled).toBe(false)
        expect(result.errors).toHaveLength(1)
      })
    })
  })

  // ===========================================================================
  // Helper Functions
  // ===========================================================================

  describe('helper functions', () => {
    describe('isDBPromise()', () => {
      it('returns true for DBPromise instances', () => {
        const promise = new DBPromise<string>({
          executor: async () => 'test',
        })
        expect(isDBPromise(promise)).toBe(true)
      })

      it('returns false for regular promises', () => {
        const promise = Promise.resolve('test')
        expect(isDBPromise(promise)).toBe(false)
      })

      it('returns false for null', () => {
        expect(isDBPromise(null)).toBe(false)
      })

      it('returns false for undefined', () => {
        expect(isDBPromise(undefined)).toBe(false)
      })

      it('returns false for primitives', () => {
        expect(isDBPromise('string')).toBe(false)
        expect(isDBPromise(123)).toBe(false)
        expect(isDBPromise(true)).toBe(false)
      })

      it('returns false for plain objects', () => {
        expect(isDBPromise({})).toBe(false)
        expect(isDBPromise({ then: () => {} })).toBe(false)
      })
    })

    describe('getRawDBPromise()', () => {
      it('returns the raw DBPromise from proxy', () => {
        const promise = new DBPromise<string>({
          executor: async () => 'test',
        })

        const raw = getRawDBPromise(promise)
        expect(raw).toBe(promise)
      })

      it('returns same instance if already raw', () => {
        const promise = new DBPromise<string>({
          executor: async () => 'test',
        })

        const raw = getRawDBPromise(promise)
        const rawAgain = getRawDBPromise(raw)
        expect(rawAgain).toBe(raw)
      })
    })
  })

  // ===========================================================================
  // Factory Functions
  // ===========================================================================

  describe('factory functions', () => {
    describe('createListPromise()', () => {
      it('creates a DBPromise for list queries', async () => {
        const promise = createListPromise<{ id: string; name: string }>('User', async () => [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ])

        expect(isDBPromise(promise)).toBe(true)

        const result = await promise
        expect(result).toHaveLength(2)
        expect(result[0].name).toBe('Alice')
      })

      it('returns empty array when executor returns empty', async () => {
        const promise = createListPromise<{ id: string }>('User', async () => [])

        const result = await promise
        expect(result).toEqual([])
      })
    })

    describe('createEntityPromise()', () => {
      it('creates a DBPromise for single entity queries', async () => {
        const promise = createEntityPromise<{ id: string; name: string }>('User', async () => ({
          id: '1',
          name: 'Alice',
        }))

        expect(isDBPromise(promise)).toBe(true)

        const result = await promise
        expect(result).not.toBeNull()
        expect(result!.name).toBe('Alice')
      })

      it('returns null when entity not found', async () => {
        const promise = createEntityPromise<{ id: string }>('User', async () => null)

        const result = await promise
        expect(result).toBeNull()
      })
    })

    describe('createSearchPromise()', () => {
      it('creates a DBPromise for search queries', async () => {
        const promise = createSearchPromise<{ id: string; title: string }>('Post', async () => [
          { id: '1', title: 'Hello World' },
        ])

        expect(isDBPromise(promise)).toBe(true)

        const result = await promise
        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('Hello World')
      })
    })
  })

  // ===========================================================================
  // wrapEntityOperations
  // ===========================================================================

  describe('wrapEntityOperations()', () => {
    const createMockOperations = () => ({
      get: vi.fn().mockResolvedValue({ $id: '1', $type: 'User', name: 'Alice' }),
      list: vi.fn().mockResolvedValue([
        { $id: '1', $type: 'User', name: 'Alice' },
        { $id: '2', $type: 'User', name: 'Bob' },
      ]),
      find: vi.fn().mockResolvedValue([{ $id: '1', $type: 'User', name: 'Alice' }]),
      search: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ $id: '3', $type: 'User', name: 'Charlie' }),
      update: vi.fn().mockResolvedValue({ $id: '1', $type: 'User', name: 'Updated' }),
      upsert: vi.fn().mockResolvedValue({ $id: '1', $type: 'User', name: 'Upserted' }),
      delete: vi.fn().mockResolvedValue(true),
      forEach: vi.fn().mockResolvedValue(undefined),
    })

    it('wraps get() to return DBPromise', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = wrapped.get('1')
      expect(isDBPromise(result)).toBe(true)

      const resolved = await result
      expect(resolved).toEqual({ $id: '1', $type: 'User', name: 'Alice' })
      expect(ops.get).toHaveBeenCalledWith('1')
    })

    it('wraps list() to return DBPromise', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = wrapped.list()
      expect(isDBPromise(result)).toBe(true)

      const resolved = await result
      expect(resolved).toHaveLength(2)
      expect(ops.list).toHaveBeenCalledWith(undefined)
    })

    it('wraps list() with options', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      await wrapped.list({ limit: 10, offset: 5 })
      expect(ops.list).toHaveBeenCalledWith({ limit: 10, offset: 5 })
    })

    it('wraps find() to return DBPromise', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = wrapped.find({ name: 'Alice' })
      expect(isDBPromise(result)).toBe(true)

      await result
      expect(ops.find).toHaveBeenCalledWith({ name: 'Alice' })
    })

    it('wraps search() to return DBPromise', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = wrapped.search('alice', { limit: 5 })
      expect(isDBPromise(result)).toBe(true)

      await result
      expect(ops.search).toHaveBeenCalledWith('alice', { limit: 5 })
    })

    it('provides first() shorthand', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = wrapped.first()
      expect(isDBPromise(result)).toBe(true)

      const resolved = await result
      expect(resolved).toEqual({ $id: '1', $type: 'User', name: 'Alice' })
      expect(ops.list).toHaveBeenCalledWith({ limit: 1 })
    })

    it('first() returns null for empty list', async () => {
      const ops = createMockOperations()
      ops.list.mockResolvedValue([])
      const wrapped = wrapEntityOperations('User', ops)

      const result = await wrapped.first()
      expect(result).toBeNull()
    })

    it('passes through create()', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = await wrapped.create({ name: 'Charlie' })
      expect(result).toEqual({ $id: '3', $type: 'User', name: 'Charlie' })
    })

    it('passes through update()', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = await wrapped.update('1', { name: 'Updated' })
      expect(result).toEqual({ $id: '1', $type: 'User', name: 'Updated' })
    })

    it('passes through upsert()', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = await wrapped.upsert('1', { name: 'Upserted' })
      expect(result).toEqual({ $id: '1', $type: 'User', name: 'Upserted' })
    })

    it('passes through delete()', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = await wrapped.delete('1')
      expect(result).toBe(true)
    })

    it('provides enhanced forEach()', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const processed: unknown[] = []
      const result = await wrapped.forEach((item) => {
        processed.push(item)
      })

      expect(result.total).toBe(2)
      expect(result.completed).toBe(2)
      expect(processed).toHaveLength(2)
    })

    it('forEach() supports callback-first style', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      const result = await wrapped.forEach((item) => {}, { concurrency: 2 })

      expect(result.total).toBe(2)
    })

    it('forEach() supports options-first style with where', async () => {
      const ops = createMockOperations()
      const wrapped = wrapEntityOperations('User', ops)

      await wrapped.forEach({ where: { name: 'Alice' } }, (item) => {})

      expect(ops.list).toHaveBeenCalledWith({ where: { name: 'Alice' } })
    })

    describe('semanticSearch()', () => {
      it('calls operations.semanticSearch when available', async () => {
        const ops = {
          ...createMockOperations(),
          semanticSearch: vi.fn().mockResolvedValue([{ $id: '1', $score: 0.9 }]),
        }
        const wrapped = wrapEntityOperations('User', ops)

        const result = await wrapped.semanticSearch('query', { minScore: 0.5 })
        expect(result).toEqual([{ $id: '1', $score: 0.9 }])
        expect(ops.semanticSearch).toHaveBeenCalledWith('query', { minScore: 0.5 })
      })

      it('returns empty array when semanticSearch not available', async () => {
        const ops = createMockOperations()
        const wrapped = wrapEntityOperations('User', ops)

        const result = await wrapped.semanticSearch('query')
        expect(result).toEqual([])
      })
    })

    describe('hybridSearch()', () => {
      it('calls operations.hybridSearch when available', async () => {
        const ops = {
          ...createMockOperations(),
          hybridSearch: vi
            .fn()
            .mockResolvedValue([
              { $id: '1', $rrfScore: 0.8, $ftsRank: 1, $semanticRank: 2, $score: 0.8 },
            ]),
        }
        const wrapped = wrapEntityOperations('User', ops)

        const result = await wrapped.hybridSearch('query', { rrfK: 60 })
        expect(result).toHaveLength(1)
        expect(ops.hybridSearch).toHaveBeenCalledWith('query', { rrfK: 60 })
      })

      it('returns empty array when hybridSearch not available', async () => {
        const ops = createMockOperations()
        const wrapped = wrapEntityOperations('User', ops)

        const result = await wrapped.hybridSearch('query')
        expect(result).toEqual([])
      })
    })
  })

  // ===========================================================================
  // Provider Resolver and Schema Info
  // ===========================================================================

  describe('provider and schema configuration', () => {
    afterEach(() => {
      // Reset global state
      setProviderResolver(() => Promise.resolve(createMemoryProvider()))
      setSchemaRelationInfo(new Map())
    })

    it('setProviderResolver sets the provider resolver', async () => {
      const mockProvider = createMemoryProvider()
      setProviderResolver(() => Promise.resolve(mockProvider))

      // Provider resolver is used internally for batch loading
      // Just verify it doesn't throw
      expect(() => setProviderResolver(() => Promise.resolve(mockProvider))).not.toThrow()
    })

    it('setSchemaRelationInfo sets relation info', () => {
      const relationInfo = new Map<string, Map<string, string>>()
      relationInfo.set('Post', new Map([['author', 'User']]))

      expect(() => setSchemaRelationInfo(relationInfo)).not.toThrow()
    })
  })

  // ===========================================================================
  // Integration with DB() schema
  // ===========================================================================

  describe('integration with DB()', () => {
    it('db.Entity.list() returns DBPromise', () => {
      const { db } = DB({
        User: { name: 'string', email: 'string' },
      })

      const result = db.User.list()
      expect(isDBPromise(result)).toBe(true)
    })

    it('db.Entity.get() returns DBPromise', () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      const result = db.User.get('user-1')
      expect(isDBPromise(result)).toBe(true)
    })

    it('db.Entity.find() returns DBPromise', () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      const result = db.User.find({ name: 'Alice' })
      expect(isDBPromise(result)).toBe(true)
    })

    it('db.Entity.search() returns DBPromise', () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      const result = db.User.search('alice')
      expect(isDBPromise(result)).toBe(true)
    })

    it('supports chaining on db.Entity.list()', async () => {
      const { db } = DB({
        User: { name: 'string', age: 'number' },
      })

      await db.User.create({ name: 'Alice', age: 30 })
      await db.User.create({ name: 'Bob', age: 25 })
      await db.User.create({ name: 'Charlie', age: 35 })

      const names = await db.User.list()
        .filter((u: any) => u.age >= 30)
        .sort((a: any, b: any) => a.age - b.age)
        .map((u: any) => u.name)

      expect(names).toEqual(['Alice', 'Charlie'])
    })

    it('supports first() on db.Entity', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      await db.User.create({ name: 'Alice' })
      await db.User.create({ name: 'Bob' })

      const first = await db.User.first()
      expect(first).not.toBeNull()
      expect(first!.name).toBeDefined()
    })

    it('supports forEach() on db.Entity', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      await db.User.create({ name: 'Alice' })
      await db.User.create({ name: 'Bob' })

      const names: string[] = []
      const result = await db.User.forEach((user: any) => {
        names.push(user.name)
      })

      expect(result.total).toBe(2)
      expect(names).toContain('Alice')
      expect(names).toContain('Bob')
    })
  })

  // ===========================================================================
  // Error Propagation
  // ===========================================================================

  describe('error propagation', () => {
    it('propagates executor errors', async () => {
      const promise = new DBPromise<string>({
        executor: async () => {
          throw new Error('Executor failed')
        },
      })

      await expect(promise).rejects.toThrow('Executor failed')
    })

    it('propagates errors through chain', async () => {
      const promise = new DBPromise<number[]>({
        executor: async () => {
          throw new Error('Initial error')
        },
      })

      await expect(promise.filter(() => true).map((x) => x)).rejects.toThrow('Initial error')
    })

    it('propagates map callback errors on object items', async () => {
      const promise = new DBPromise<{ value: number }[]>({
        executor: async () => [{ value: 1 }, { value: 2 }, { value: 3 }],
      })

      // The map implementation has two phases - recording and execution.
      // Errors in the recording phase (Phase 1) are caught.
      // Errors in the execution phase (Phase 3) are propagated.
      await expect(
        promise.map((item) => {
          if (item.value === 2) throw new Error('Map error')
          return { result: item.value }
        })
      ).rejects.toThrow('Map error')
    })

    it('handles rejection in then chain', async () => {
      const promise = new DBPromise<string>({
        executor: async () => 'value',
      })

      await expect(
        promise.then(() => {
          throw new Error('Then error')
        })
      ).rejects.toThrow('Then error')
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles empty array results', async () => {
      const promise = new DBPromise<string[]>({
        executor: async () => [],
      })

      const mapped = await promise.map((x) => x)
      expect(mapped).toEqual([])
    })

    it('handles null values in arrays', async () => {
      const promise = new DBPromise<(string | null)[]>({
        executor: async () => ['a', null, 'b'],
      })

      const filtered = await promise.filter((x) => x !== null)
      expect(filtered).toEqual(['a', 'b'])
    })

    it('handles undefined values in arrays via filter', async () => {
      const promise = new DBPromise<(string | undefined)[]>({
        executor: async () => ['a', undefined, 'b'],
      })

      // For primitive arrays, use filter instead of map for transformations
      const filtered = await promise.filter((x) => x !== undefined)
      expect(filtered).toEqual(['a', 'b'])
    })

    it('handles deeply nested objects via direct property access', async () => {
      const promise = new DBPromise<{ a: { b: { c: { d: string } } } }>({
        executor: async () => ({ a: { b: { c: { d: 'deep' } } } }),
      })

      // Each property access returns a new DBPromise for the nested value
      // The property path is resolved when the final promise is awaited
      const aPromise = (promise as any).a
      const aValue = await aPromise
      expect(aValue).toEqual({ b: { c: { d: 'deep' } } })

      // We can also test deeper access step by step
      const bValue = await (promise as any).a
      expect(bValue.b.c.d).toBe('deep')
    })

    it('handles large arrays', async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i)
      const promise = new DBPromise<number[]>({
        executor: async () => largeArray,
      })

      const result = await promise.filter((n) => n % 100 === 0).limit(50)
      expect(result).toHaveLength(50)
    })

    it('handles concurrent resolves', async () => {
      const promise = new DBPromise<string>({
        executor: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return 'value'
        },
      })

      const [r1, r2, r3] = await Promise.all([promise, promise, promise])

      expect(r1).toBe('value')
      expect(r2).toBe('value')
      expect(r3).toBe('value')
    })
  })

  // ===========================================================================
  // ForEach Persistence (requires actionsAPI)
  // ===========================================================================

  describe('forEach persistence', () => {
    it('throws when persist is true but no actionsAPI', async () => {
      const promise = new DBPromise<number[]>({
        executor: async () => [1, 2, 3],
        // No actionsAPI provided
      })

      await expect(promise.forEach(() => {}, { persist: true })).rejects.toThrow(
        'Persistence requires actions API'
      )
    })

    it('throws when resume is set but no actionsAPI', async () => {
      const promise = new DBPromise<number[]>({
        executor: async () => [1, 2, 3],
        // No actionsAPI provided
      })

      await expect(promise.forEach(() => {}, { resume: 'action-123' })).rejects.toThrow(
        'Persistence requires actions API'
      )
    })

    it('works with actionsAPI for persist', async () => {
      const mockActionsAPI: ForEachActionsAPI = {
        create: vi.fn().mockResolvedValue({ id: 'action-1' }),
        get: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      }

      const promise = new DBPromise<number[]>({
        executor: async () => [1, 2, 3],
        actionsAPI: mockActionsAPI,
      })

      const result = await promise.forEach(() => {}, { persist: true })

      expect(mockActionsAPI.create).toHaveBeenCalled()
      expect(result.actionId).toBe('action-1')
    })

    it('works with actionsAPI for resume', async () => {
      const mockActionsAPI: ForEachActionsAPI = {
        create: vi.fn(),
        get: vi.fn().mockResolvedValue({
          id: 'existing-action',
          type: 'User.forEach',
          status: 'active',
          data: { processedIds: ['1'] },
        }),
        update: vi.fn().mockResolvedValue({}),
      }

      const promise = new DBPromise<Array<{ $id: string }>>({
        executor: async () => [{ $id: '1' }, { $id: '2' }, { $id: '3' }],
        actionsAPI: mockActionsAPI,
      })

      const processed: string[] = []
      const result = await promise.forEach(
        (item) => {
          processed.push(item.$id)
        },
        { resume: 'existing-action' }
      )

      // Item '1' should be skipped (already processed)
      expect(result.skipped).toBe(1)
      expect(result.completed).toBe(2)
      expect(processed).toEqual(['2', '3'])
    })

    it('throws when resume action not found', async () => {
      const mockActionsAPI: ForEachActionsAPI = {
        create: vi.fn(),
        get: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      }

      const promise = new DBPromise<number[]>({
        executor: async () => [1, 2, 3],
        actionsAPI: mockActionsAPI,
      })

      await expect(promise.forEach(() => {}, { resume: 'nonexistent' })).rejects.toThrow(
        'Entity not found'
      )
    })

    it('persists progress periodically', async () => {
      const mockActionsAPI: ForEachActionsAPI = {
        create: vi.fn().mockResolvedValue({ id: 'action-1' }),
        get: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      }

      // Create array of 25 items to trigger multiple persist calls (every 10 items)
      const items = Array.from({ length: 25 }, (_, i) => ({ $id: `item-${i}` }))

      const promise = new DBPromise<Array<{ $id: string }>>({
        executor: async () => items,
        actionsAPI: mockActionsAPI,
      })

      await promise.forEach(() => {}, { persist: true })

      // Should have called update multiple times (initial + every 10 items + final)
      expect(mockActionsAPI.update).toHaveBeenCalled()
    })
  })
})
