/**
 * Tests for caching layer for embeddings and generations
 *
 * TDD: RED Phase - These tests should fail initially
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  // Cache storage interface and implementations
  CacheStorage,
  MemoryCache,

  // Specialized caches
  EmbeddingCache,
  GenerationCache,

  // Cache wrapper
  withCache,

  // Utilities
  hashKey,
  createCacheKey,

  // Types
  CacheEntry,
  CacheOptions,
  CacheStats,
} from '../src/index.js'

describe('CacheStorage interface', () => {
  describe('MemoryCache', () => {
    let cache: MemoryCache<string>

    beforeEach(() => {
      cache = new MemoryCache<string>()
    })

    it('stores and retrieves values', async () => {
      await cache.set('key1', 'value1')
      const result = await cache.get('key1')
      expect(result).toBe('value1')
    })

    it('returns undefined for missing keys', async () => {
      const result = await cache.get('nonexistent')
      expect(result).toBeUndefined()
    })

    it('checks if key exists', async () => {
      await cache.set('key1', 'value1')
      expect(await cache.has('key1')).toBe(true)
      expect(await cache.has('nonexistent')).toBe(false)
    })

    it('deletes keys', async () => {
      await cache.set('key1', 'value1')
      await cache.delete('key1')
      expect(await cache.has('key1')).toBe(false)
    })

    it('clears all entries', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')
      await cache.clear()
      expect(await cache.has('key1')).toBe(false)
      expect(await cache.has('key2')).toBe(false)
    })

    it('returns cache size', async () => {
      expect(await cache.size()).toBe(0)
      await cache.set('key1', 'value1')
      expect(await cache.size()).toBe(1)
      await cache.set('key2', 'value2')
      expect(await cache.size()).toBe(2)
    })

    it('lists all keys', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')
      const keys = await cache.keys()
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
    })
  })

  describe('MemoryCache with TTL', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('expires entries after TTL', async () => {
      const cache = new MemoryCache<string>({ defaultTTL: 1000 }) // 1 second TTL

      await cache.set('key1', 'value1')
      expect(await cache.get('key1')).toBe('value1')

      // Advance time past TTL
      vi.advanceTimersByTime(1500)

      expect(await cache.get('key1')).toBeUndefined()
    })

    it('allows per-key TTL override', async () => {
      const cache = new MemoryCache<string>({ defaultTTL: 1000 })

      await cache.set('key1', 'value1', { ttl: 500 })
      await cache.set('key2', 'value2', { ttl: 2000 })

      vi.advanceTimersByTime(750)

      expect(await cache.get('key1')).toBeUndefined() // Expired
      expect(await cache.get('key2')).toBe('value2') // Still valid
    })

    it('supports sliding window TTL refresh on access', async () => {
      const cache = new MemoryCache<string>({ defaultTTL: 1000, slidingExpiration: true })

      await cache.set('key1', 'value1')

      // Access before expiry to refresh TTL
      vi.advanceTimersByTime(800)
      expect(await cache.get('key1')).toBe('value1') // Refreshes TTL

      // Another 800ms should still be valid because we refreshed
      vi.advanceTimersByTime(800)
      expect(await cache.get('key1')).toBe('value1')

      // Without access for full TTL, it should expire
      vi.advanceTimersByTime(1100)
      expect(await cache.get('key1')).toBeUndefined()
    })

    it('cleans up expired entries automatically', async () => {
      const cache = new MemoryCache<string>({
        defaultTTL: 1000,
        cleanupInterval: 500
      })

      await cache.set('key1', 'value1')
      expect(await cache.size()).toBe(1)

      vi.advanceTimersByTime(1500)

      // After cleanup, size should be 0
      expect(await cache.size()).toBe(0)

      cache.dispose() // Clean up timer
    })
  })

  describe('MemoryCache with LRU eviction', () => {
    it('evicts least recently used entries when max size reached', async () => {
      const cache = new MemoryCache<string>({ maxSize: 3 })

      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')
      await cache.set('key3', 'value3')

      // Access key1 to make it recently used
      await cache.get('key1')

      // Add key4, should evict key2 (least recently used)
      await cache.set('key4', 'value4')

      expect(await cache.size()).toBe(3)
      expect(await cache.has('key1')).toBe(true)
      expect(await cache.has('key2')).toBe(false) // Evicted
      expect(await cache.has('key3')).toBe(true)
      expect(await cache.has('key4')).toBe(true)
    })
  })
})

describe('Cache key generation', () => {
  describe('hashKey', () => {
    it('generates consistent hashes for same input', () => {
      const hash1 = hashKey('hello world')
      const hash2 = hashKey('hello world')
      expect(hash1).toBe(hash2)
    })

    it('generates different hashes for different inputs', () => {
      const hash1 = hashKey('hello')
      const hash2 = hashKey('world')
      expect(hash1).not.toBe(hash2)
    })

    it('handles objects by serializing them', () => {
      const hash1 = hashKey({ a: 1, b: 2 })
      const hash2 = hashKey({ a: 1, b: 2 })
      const hash3 = hashKey({ b: 2, a: 1 }) // Different key order

      expect(hash1).toBe(hash2)
      // Sorted keys should produce same hash
      expect(hash1).toBe(hash3)
    })

    it('handles arrays', () => {
      const hash1 = hashKey([1, 2, 3])
      const hash2 = hashKey([1, 2, 3])
      const hash3 = hashKey([3, 2, 1])

      expect(hash1).toBe(hash2)
      expect(hash1).not.toBe(hash3)
    })
  })

  describe('createCacheKey', () => {
    it('creates content-addressable keys for embeddings', () => {
      const key1 = createCacheKey('embedding', { content: 'hello world', model: 'text-embedding-3-small' })
      const key2 = createCacheKey('embedding', { content: 'hello world', model: 'text-embedding-3-small' })
      const key3 = createCacheKey('embedding', { content: 'different', model: 'text-embedding-3-small' })

      expect(key1).toBe(key2)
      expect(key1).not.toBe(key3)
      expect(key1).toContain('embedding:')
    })

    it('creates parameter-aware keys for generations', () => {
      const key1 = createCacheKey('generation', {
        prompt: 'Write a poem',
        model: 'sonnet',
        temperature: 0.7
      })
      const key2 = createCacheKey('generation', {
        prompt: 'Write a poem',
        model: 'sonnet',
        temperature: 0.7
      })
      const key3 = createCacheKey('generation', {
        prompt: 'Write a poem',
        model: 'sonnet',
        temperature: 0.9 // Different temperature
      })

      expect(key1).toBe(key2)
      expect(key1).not.toBe(key3)
      expect(key1).toContain('generation:')
    })

    it('includes schema version in structured output keys', () => {
      const key1 = createCacheKey('generation', {
        prompt: 'Extract data',
        model: 'sonnet',
        schemaVersion: 'v1'
      })
      const key2 = createCacheKey('generation', {
        prompt: 'Extract data',
        model: 'sonnet',
        schemaVersion: 'v2'
      })

      expect(key1).not.toBe(key2)
    })
  })
})

describe('EmbeddingCache', () => {
  let embeddingCache: EmbeddingCache

  beforeEach(() => {
    embeddingCache = new EmbeddingCache()
  })

  it('stores and retrieves embeddings by content hash', async () => {
    const embedding = [0.1, 0.2, 0.3, 0.4, 0.5]

    await embeddingCache.set('hello world', embedding, { model: 'text-embedding-3-small' })
    const result = await embeddingCache.get('hello world', { model: 'text-embedding-3-small' })

    expect(result).toEqual(embedding)
  })

  it('returns undefined for cache miss', async () => {
    const result = await embeddingCache.get('unknown text', { model: 'text-embedding-3-small' })
    expect(result).toBeUndefined()
  })

  it('differentiates by model', async () => {
    const embedding1 = [0.1, 0.2, 0.3]
    const embedding2 = [0.4, 0.5, 0.6]

    await embeddingCache.set('hello', embedding1, { model: 'model-a' })
    await embeddingCache.set('hello', embedding2, { model: 'model-b' })

    expect(await embeddingCache.get('hello', { model: 'model-a' })).toEqual(embedding1)
    expect(await embeddingCache.get('hello', { model: 'model-b' })).toEqual(embedding2)
  })

  it('caches batch embeddings', async () => {
    const texts = ['doc1', 'doc2', 'doc3']
    const embeddings = [
      [0.1, 0.2],
      [0.3, 0.4],
      [0.5, 0.6]
    ]

    await embeddingCache.setMany(texts, embeddings, { model: 'text-embedding-3-small' })

    expect(await embeddingCache.get('doc1', { model: 'text-embedding-3-small' })).toEqual([0.1, 0.2])
    expect(await embeddingCache.get('doc2', { model: 'text-embedding-3-small' })).toEqual([0.3, 0.4])
    expect(await embeddingCache.get('doc3', { model: 'text-embedding-3-small' })).toEqual([0.5, 0.6])
  })

  it('returns partial hits for batch lookups', async () => {
    // Pre-populate some embeddings
    await embeddingCache.set('doc1', [0.1, 0.2], { model: 'model-a' })
    await embeddingCache.set('doc3', [0.5, 0.6], { model: 'model-a' })

    const result = await embeddingCache.getMany(['doc1', 'doc2', 'doc3'], { model: 'model-a' })

    expect(result.hits).toEqual({
      'doc1': [0.1, 0.2],
      'doc3': [0.5, 0.6]
    })
    expect(result.misses).toEqual(['doc2'])
  })

  it('provides cache statistics', async () => {
    await embeddingCache.set('doc1', [0.1], { model: 'model-a' })

    await embeddingCache.get('doc1', { model: 'model-a' }) // Hit
    await embeddingCache.get('doc2', { model: 'model-a' }) // Miss

    const stats = embeddingCache.getStats()

    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBeCloseTo(0.5)
    expect(stats.size).toBe(1)
  })
})

describe('GenerationCache', () => {
  let generationCache: GenerationCache

  beforeEach(() => {
    generationCache = new GenerationCache()
  })

  it('caches generation results by prompt and parameters', async () => {
    const result = { text: 'Hello, world!' }

    await generationCache.set({
      prompt: 'Say hello',
      model: 'sonnet',
      temperature: 0.7
    }, result)

    const cached = await generationCache.get({
      prompt: 'Say hello',
      model: 'sonnet',
      temperature: 0.7
    })

    expect(cached).toEqual(result)
  })

  it('returns undefined for cache miss', async () => {
    const cached = await generationCache.get({
      prompt: 'Unknown prompt',
      model: 'sonnet'
    })

    expect(cached).toBeUndefined()
  })

  it('differentiates by temperature', async () => {
    const result1 = { text: 'Deterministic response' }
    const result2 = { text: 'Creative response' }

    await generationCache.set({
      prompt: 'Write something',
      model: 'sonnet',
      temperature: 0
    }, result1)

    await generationCache.set({
      prompt: 'Write something',
      model: 'sonnet',
      temperature: 1
    }, result2)

    expect(await generationCache.get({
      prompt: 'Write something',
      model: 'sonnet',
      temperature: 0
    })).toEqual(result1)

    expect(await generationCache.get({
      prompt: 'Write something',
      model: 'sonnet',
      temperature: 1
    })).toEqual(result2)
  })

  it('differentiates by model', async () => {
    await generationCache.set({
      prompt: 'Hello',
      model: 'sonnet'
    }, { text: 'Sonnet response' })

    await generationCache.set({
      prompt: 'Hello',
      model: 'opus'
    }, { text: 'Opus response' })

    expect(await generationCache.get({
      prompt: 'Hello',
      model: 'sonnet'
    })).toEqual({ text: 'Sonnet response' })

    expect(await generationCache.get({
      prompt: 'Hello',
      model: 'opus'
    })).toEqual({ text: 'Opus response' })
  })

  it('includes system prompt in cache key', async () => {
    await generationCache.set({
      prompt: 'Hello',
      model: 'sonnet',
      system: 'You are a pirate'
    }, { text: 'Ahoy!' })

    await generationCache.set({
      prompt: 'Hello',
      model: 'sonnet',
      system: 'You are a robot'
    }, { text: 'Beep boop' })

    expect(await generationCache.get({
      prompt: 'Hello',
      model: 'sonnet',
      system: 'You are a pirate'
    })).toEqual({ text: 'Ahoy!' })
  })

  it('supports schema versioning for structured outputs', async () => {
    await generationCache.set({
      prompt: 'Extract user',
      model: 'sonnet',
      schemaVersion: 'v1'
    }, { object: { name: 'John' } })

    await generationCache.set({
      prompt: 'Extract user',
      model: 'sonnet',
      schemaVersion: 'v2'
    }, { object: { name: 'John', age: 30 } })

    expect(await generationCache.get({
      prompt: 'Extract user',
      model: 'sonnet',
      schemaVersion: 'v1'
    })).toEqual({ object: { name: 'John' } })

    expect(await generationCache.get({
      prompt: 'Extract user',
      model: 'sonnet',
      schemaVersion: 'v2'
    })).toEqual({ object: { name: 'John', age: 30 } })
  })

  it('supports cache bypass option', async () => {
    await generationCache.set({
      prompt: 'Hello',
      model: 'sonnet'
    }, { text: 'Cached response' })

    // With bypass, should return undefined
    const bypassResult = await generationCache.get({
      prompt: 'Hello',
      model: 'sonnet'
    }, { bypass: true })

    expect(bypassResult).toBeUndefined()

    // Without bypass, should return cached
    const cachedResult = await generationCache.get({
      prompt: 'Hello',
      model: 'sonnet'
    })

    expect(cachedResult).toEqual({ text: 'Cached response' })
  })

  it('provides cache statistics', async () => {
    await generationCache.set({ prompt: 'test', model: 'sonnet' }, { text: 'result' })

    await generationCache.get({ prompt: 'test', model: 'sonnet' }) // Hit
    await generationCache.get({ prompt: 'other', model: 'sonnet' }) // Miss

    const stats = generationCache.getStats()

    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBeCloseTo(0.5)
  })
})

describe('withCache wrapper', () => {
  let cache: MemoryCache<string>

  beforeEach(() => {
    cache = new MemoryCache<string>()
  })

  it('wraps an async function with caching', async () => {
    let callCount = 0
    const expensiveOperation = async (input: string) => {
      callCount++
      return `Result for ${input}`
    }

    const cachedOperation = withCache(cache, expensiveOperation, {
      keyFn: (input) => input
    })

    // First call - should execute function
    const result1 = await cachedOperation('test')
    expect(result1).toBe('Result for test')
    expect(callCount).toBe(1)

    // Second call with same input - should use cache
    const result2 = await cachedOperation('test')
    expect(result2).toBe('Result for test')
    expect(callCount).toBe(1) // Still 1, didn't call again

    // Different input - should execute function
    const result3 = await cachedOperation('other')
    expect(result3).toBe('Result for other')
    expect(callCount).toBe(2)
  })

  it('supports custom key generation', async () => {
    const fn = async (a: number, b: number) => a + b

    const cachedFn = withCache(cache, fn, {
      keyFn: (a, b) => `sum:${a}:${b}`
    })

    await cachedFn(1, 2)
    await cachedFn(1, 2)

    expect(await cache.has('sum:1:2')).toBe(true)
  })

  it('respects TTL option', async () => {
    vi.useFakeTimers()

    let callCount = 0
    const fn = async () => {
      callCount++
      return 'result'
    }

    const ttlCache = new MemoryCache<string>({ defaultTTL: 1000 })
    const cachedFn = withCache(ttlCache, fn, { keyFn: () => 'key' })

    await cachedFn()
    expect(callCount).toBe(1)

    await cachedFn()
    expect(callCount).toBe(1) // Cached

    vi.advanceTimersByTime(1500)

    await cachedFn()
    expect(callCount).toBe(2) // Cache expired, called again

    vi.useRealTimers()
  })

  it('handles errors without caching them', async () => {
    let callCount = 0
    const failingFn = async () => {
      callCount++
      throw new Error('Failed')
    }

    const cachedFn = withCache(cache, failingFn, { keyFn: () => 'key' })

    await expect(cachedFn()).rejects.toThrow('Failed')
    expect(callCount).toBe(1)

    // Should retry since error wasn't cached
    await expect(cachedFn()).rejects.toThrow('Failed')
    expect(callCount).toBe(2)

    // Nothing should be in cache
    expect(await cache.has('key')).toBe(false)
  })

  it('supports bypass option', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      return `result-${callCount}`
    }

    const cachedFn = withCache(cache, fn, { keyFn: () => 'key' })

    const result1 = await cachedFn()
    expect(result1).toBe('result-1')

    // Force fresh result
    const result2 = await cachedFn.bypass()
    expect(result2).toBe('result-2')
    expect(callCount).toBe(2)

    // Cache should be updated with new result
    const result3 = await cachedFn()
    expect(result3).toBe('result-2')
    expect(callCount).toBe(2)
  })
})

describe('Cache entry metadata', () => {
  it('tracks creation time', async () => {
    const cache = new MemoryCache<string>()
    const before = Date.now()

    await cache.set('key', 'value')

    const entry = await cache.getEntry('key')
    expect(entry).toBeDefined()
    expect(entry!.createdAt).toBeGreaterThanOrEqual(before)
    expect(entry!.createdAt).toBeLessThanOrEqual(Date.now())
  })

  it('tracks access time', async () => {
    vi.useFakeTimers()

    const cache = new MemoryCache<string>()
    await cache.set('key', 'value')

    const entry1 = await cache.getEntry('key')
    const createdAt = entry1!.createdAt

    vi.advanceTimersByTime(1000)

    await cache.get('key')
    const entry2 = await cache.getEntry('key')

    expect(entry2!.lastAccessedAt).toBeGreaterThan(createdAt)

    vi.useRealTimers()
  })

  it('tracks access count', async () => {
    const cache = new MemoryCache<string>()
    await cache.set('key', 'value')

    await cache.get('key')
    await cache.get('key')
    await cache.get('key')

    const entry = await cache.getEntry('key')
    expect(entry!.accessCount).toBe(3)
  })
})

describe('Distributed cache interface', () => {
  // These tests verify the interface contracts for Redis-like backends

  it('CacheStorage interface is properly typed', () => {
    // This is a compile-time check
    const mockStorage: CacheStorage<string> = {
      get: async () => undefined,
      set: async () => {},
      has: async () => false,
      delete: async () => {},
      clear: async () => {},
      size: async () => 0,
      keys: async () => []
    }

    expect(mockStorage).toBeDefined()
  })

  it('MemoryCache implements CacheStorage', () => {
    const cache = new MemoryCache<string>()

    // Verify all methods exist
    expect(typeof cache.get).toBe('function')
    expect(typeof cache.set).toBe('function')
    expect(typeof cache.has).toBe('function')
    expect(typeof cache.delete).toBe('function')
    expect(typeof cache.clear).toBe('function')
    expect(typeof cache.size).toBe('function')
    expect(typeof cache.keys).toBe('function')
  })
})

describe('Cache serialization', () => {
  it('serializes cache entries for distributed storage', async () => {
    const cache = new MemoryCache<{ data: number[] }>()

    await cache.set('vectors', { data: [0.1, 0.2, 0.3] })

    const entry = await cache.getEntry('vectors')
    const serialized = JSON.stringify(entry)
    const deserialized = JSON.parse(serialized)

    expect(deserialized.value.data).toEqual([0.1, 0.2, 0.3])
  })
})
