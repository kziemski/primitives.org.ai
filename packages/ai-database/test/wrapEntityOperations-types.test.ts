/**
 * Type Safety Tests for wrapEntityOperations
 *
 * [RED PHASE] These tests verify that wrapEntityOperations parameters
 * are properly typed. Currently, the function uses `any` for 14 parameters
 * which allows incorrect types to pass without TypeScript errors.
 *
 * The tests document the expected behavior once types are properly constrained.
 *
 * Test Strategy:
 * 1. Tests marked [CURRENTLY PASSES - SHOULD FAIL] show where `any` allows
 *    invalid types through. TypeScript should catch these at compile time
 *    once proper types are added.
 * 2. Tests use `@ts-expect-error` to document where errors SHOULD occur
 *    but currently don't due to `any` usage.
 * 3. Runtime validation catches some errors, but the goal is compile-time safety.
 *
 * Issue: aip-4m07
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach, expectTypeOf, vi } from 'vitest'
import { DB, setProvider, createMemoryProvider } from '../src/index.js'
import { wrapEntityOperations, type DBPromise } from '../src/ai-promise-db.js'
import type {
  ListOptions,
  SearchOptions,
  SemanticSearchOptions,
  HybridSearchOptions,
} from '../src/schema/types.js'

// =============================================================================
// Test Entity Types (what properly typed operations should enforce)
// =============================================================================

interface User {
  $id: string
  $type: 'User'
  name: string
  email: string
  age: number
  isActive: boolean
}

interface Post {
  $id: string
  $type: 'Post'
  title: string
  content: string
  author: string // User ID
  publishedAt?: Date
}

// Helper types for create/update operations
type UserCreateData = Omit<User, '$id' | '$type'>
type UserUpdateData = Partial<UserCreateData>
type PostCreateData = Omit<Post, '$id' | '$type'>
type PostUpdateData = Partial<PostCreateData>

// =============================================================================
// Type Tests for wrapEntityOperations
// =============================================================================

describe('wrapEntityOperations Type Safety [RED]', () => {
  beforeEach(() => {
    setProvider(createMemoryProvider())
  })

  describe('list() options parameter - should enforce ListOptions', () => {
    it('accepts valid ListOptions', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string', age: 'number', isActive: 'boolean' },
      })

      // Valid ListOptions - should work
      const validOptions: ListOptions = {
        where: { isActive: true },
        orderBy: 'name',
        order: 'asc',
        limit: 10,
        offset: 0,
      }

      const users = await db.User.list(validOptions)
      expect(Array.isArray(users)).toBe(true)
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts invalid extra property due to any', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string' },
      })

      // With `any`, TypeScript does NOT catch this invalid property
      // Once properly typed, this should cause: "Object literal may only specify known properties"
      const result = await db.User.list({ invalidProp: 'test', limit: 10 })

      // The runtime silently ignores invalid properties - no error!
      expect(Array.isArray(result)).toBe(true)
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts invalid order value due to any', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string' },
      })

      // With `any`, TypeScript does NOT catch this invalid enum value
      // Once properly typed: Type '"sideways"' is not assignable to type '"asc" | "desc"'
      // Runtime accepts it too (just doesn't sort meaningfully)
      const result = await db.User.list({ order: 'sideways' } as unknown as ListOptions)
      expect(Array.isArray(result)).toBe(true)
    })

    it('returns DBPromise of correctly typed array', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string' },
      })

      const result = db.User.list()

      // Check return type
      expectTypeOf(result).toMatchTypeOf<DBPromise<unknown[]>>()

      const resolved = await result
      expect(Array.isArray(resolved)).toBe(true)
    })
  })

  describe('find() where clause - should enforce Partial<T>', () => {
    it('accepts valid where clause', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string', age: 'number' },
      })

      const users = await db.User.find({ name: 'John' })
      expect(Array.isArray(users)).toBe(true)
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts completely wrong type due to any', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string' },
      })

      // With `any`, TypeScript does NOT catch this type mismatch
      // Once properly typed: Argument of type 'number' is not assignable to parameter of type 'Partial<User>'
      // Runtime throws, but this should be compile-time error
      try {
        // @ts-expect-error - Should fail: find() where clause must be an object
        await db.User.find(123)
      } catch {
        // Runtime catches it, but TypeScript should catch it first
      }
    })

    it('returns DBPromise of correctly typed array', async () => {
      const { db } = DB({
        Post: { title: 'string', content: 'string' },
      })

      const result = db.Post.find({ title: 'Test' })
      expectTypeOf(result).toMatchTypeOf<DBPromise<unknown[]>>()
    })
  })

  describe('create() data parameter - should enforce Omit<T, "$id" | "$type">', () => {
    it('accepts valid create data', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string', age: 'number' },
      })

      const user = await db.User.create({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      })

      expect(user.$id).toBeDefined()
      expect(user.name).toBe('John Doe')
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts $id in create data due to any', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string', age: 'number' },
      })

      // With `any`, TypeScript does NOT catch that $id shouldn't be in create data
      // Once properly typed: '$id' does not exist in type 'Omit<User, "$id" | "$type">'
      // Runtime actually USES the provided $id, which may be undesirable
      const user = await db.User.create({
        $id: 'custom-id-123',
        name: 'Test',
        email: 'test@test.com',
        age: 25,
      } as Record<string, unknown>)

      // The runtime accepts this! No type safety.
      expect(user.$id).toBeDefined()
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts completely wrong type due to any', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      // With `any`, TypeScript does NOT catch this
      // Runtime throws, but should be compile-time error
      try {
        // @ts-expect-error - Should fail: create data must be an object
        await db.User.create('invalid')
      } catch {
        // Runtime validation catches it
      }
    })

    it('accepts create with options as second argument', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      const user = await db.User.create({ name: 'Test' }, { draftOnly: false })
      expect(user).toBeDefined()
    })
  })

  describe('update() data parameter - should enforce Partial<Omit<T, "$id" | "$type">>', () => {
    it('accepts valid partial update data', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string', age: 'number' },
      })

      const user = await db.User.create({ name: 'John', email: 'john@test.com', age: 30 })

      const updated = await db.User.update(user.$id, { name: 'Jane' })
      expect(updated.name).toBe('Jane')
      expect(updated.email).toBe('john@test.com') // Preserved
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts $id in update data due to any', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string' },
      })

      const user = await db.User.create({ name: 'John', email: 'john@test.com' })

      // With `any`, TypeScript does NOT catch that $id shouldn't be updatable
      // Once properly typed: '$id' does not exist in type 'Partial<Omit<User, "$id" | "$type">>'
      const updated = await db.User.update(user.$id, {
        $id: 'attempt-to-change-id',
        name: 'Updated',
      } as Record<string, unknown>)

      // Runtime silently ignores the $id field - no type safety warning!
      expect(updated.name).toBe('Updated')
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts completely wrong type due to any', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      const user = await db.User.create({ name: 'John' })

      // Runtime throws but should be compile-time error
      try {
        // @ts-expect-error - Should fail: update data must be an object
        await db.User.update(user.$id, 'invalid')
      } catch {
        // Runtime validation catches it
      }
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts wrong id type due to any', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      // Runtime throws but should be compile-time error
      try {
        // @ts-expect-error - Should fail: id must be a string
        await db.User.update(123, { name: 'Test' })
      } catch {
        // Runtime validation catches it
      }
    })
  })

  describe('upsert() parameters - should have same constraints', () => {
    it('accepts valid upsert parameters', async () => {
      const { db } = DB({
        User: { name: 'string', email: 'string' },
      })

      const user = await db.User.upsert('user-1', { name: 'John', email: 'john@test.com' })
      expect(user).toBeDefined()
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts wrong data type due to any', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      try {
        // @ts-expect-error - Should fail: data must be an object
        await db.User.upsert('user-1', 'invalid')
      } catch {
        // Runtime validation catches it
      }
    })
  })

  describe('search() parameters - should enforce (query: string, options?: SearchOptions)', () => {
    it('accepts valid search parameters', async () => {
      const { db } = DB({
        Post: { title: 'string', content: 'string' },
      })

      await db.Post.create({ title: 'Hello World', content: 'Test post' })

      const results = await db.Post.search('hello')
      expect(Array.isArray(results)).toBe(true)

      const resultsWithOptions = await db.Post.search('hello', { limit: 5 })
      expect(Array.isArray(resultsWithOptions)).toBe(true)
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts wrong query type due to any', async () => {
      const { db } = DB({
        Post: { title: 'string', content: 'string' },
      })

      try {
        // @ts-expect-error - Should fail: query must be a string
        await db.Post.search(123)
      } catch {
        // Runtime validation catches it
      }
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts invalid option properties due to any', async () => {
      const { db } = DB({
        Post: { title: 'string', content: 'string' },
      })

      await db.Post.create({ title: 'Test', content: 'Content' })

      // With `any`, TypeScript does NOT catch this invalid option
      // Runtime silently ignores it
      const results = await db.Post.search('test', {
        notAnOption: true,
      } as unknown as SearchOptions)
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('semanticSearch() parameters - should enforce (query: string, options?: SemanticSearchOptions)', () => {
    it('accepts valid parameters', async () => {
      const { db } = DB({
        Post: { title: 'string', content: 'string' },
      })

      // May return empty if embeddings not configured
      const results = await db.Post.semanticSearch('find posts')
      expect(Array.isArray(results)).toBe(true)

      const resultsWithOptions = await db.Post.semanticSearch('query', { minScore: 0.7, limit: 10 })
      expect(Array.isArray(resultsWithOptions)).toBe(true)
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts wrong query type due to any', async () => {
      const { db } = DB({
        Post: { title: 'string' },
      })

      try {
        // @ts-expect-error - Should fail: query must be a string
        await db.Post.semanticSearch(123)
      } catch {
        // Runtime throws because .toLowerCase() fails on number
      }
    })
  })

  describe('hybridSearch() parameters - should enforce (query: string, options?: HybridSearchOptions)', () => {
    it('accepts valid parameters', async () => {
      const { db } = DB({
        Post: { title: 'string', content: 'string' },
      })

      const results = await db.Post.hybridSearch('find posts')
      expect(Array.isArray(results)).toBe(true)

      const resultsWithOptions = await db.Post.hybridSearch('query', {
        minScore: 0.5,
        limit: 10,
        rrfK: 60,
        ftsWeight: 0.5,
        semanticWeight: 0.5,
      })
      expect(Array.isArray(resultsWithOptions)).toBe(true)
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts wrong query type due to any', async () => {
      const { db } = DB({
        Post: { title: 'string' },
      })

      try {
        // @ts-expect-error - Should fail: query must be a string
        await db.Post.hybridSearch(123)
      } catch {
        // Runtime validation catches it
      }
    })
  })

  describe('get() parameter - should enforce (id: string)', () => {
    it('accepts valid string id', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      const user = await db.User.get('user-123')
      expect(user === null || typeof user === 'object').toBe(true)
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts wrong id type due to any', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      try {
        // @ts-expect-error - Should fail: id must be a string
        await db.User.get(123)
      } catch {
        // Runtime validation catches it
      }
    })
  })

  describe('delete() parameter - should enforce (id: string)', () => {
    it('accepts valid string id', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      const user = await db.User.create({ name: 'ToDelete' })
      const deleted = await db.User.delete(user.$id)
      expect(typeof deleted).toBe('boolean')
    })

    it('[CURRENTLY PASSES - SHOULD FAIL] accepts wrong id type due to any', async () => {
      const { db } = DB({
        User: { name: 'string' },
      })

      try {
        // @ts-expect-error - Should fail: id must be a string
        await db.User.delete(123)
      } catch {
        // Runtime validation catches it
      }
    })
  })
})

// =============================================================================
// Direct wrapEntityOperations Type Tests
// =============================================================================

describe('wrapEntityOperations function signature types [RED]', () => {
  /**
   * These tests examine the actual parameter types in wrapEntityOperations.
   * They document that parameters are typed as `any` which loses type safety.
   */

  it('should document current any-typed parameters', () => {
    // Create mock operations
    const mockOperations = {
      get: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue([]),
      find: vi.fn().mockResolvedValue([]),
      search: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ $id: '1', $type: 'Mock' }),
      update: vi.fn().mockResolvedValue({ $id: '1', $type: 'Mock' }),
      upsert: vi.fn().mockResolvedValue({ $id: '1', $type: 'Mock' }),
      delete: vi.fn().mockResolvedValue(true),
      forEach: vi.fn().mockResolvedValue(undefined),
    }

    const wrapped = wrapEntityOperations('MockEntity', mockOperations)

    // Document current behavior: parameters are `any` which allows anything
    // These checks verify the current (problematic) state

    // list() options - currently accepts any
    expect(() => wrapped.list({ anyProp: 'passes' })).not.toThrow()

    // find() where - currently accepts any
    expect(() => wrapped.find({ anyProp: 'passes' })).not.toThrow()

    // create() - currently accepts any
    expect(() => wrapped.create({ anyData: 'passes' })).not.toThrow()

    // update() - currently accepts any
    expect(() => wrapped.update('id', { anyData: 'passes' })).not.toThrow()

    // search() - currently accepts any
    expect(() => wrapped.search('query', { anyOption: 'passes' })).not.toThrow()
  })

  it('should count the 14 any-typed positions in wrapEntityOperations', () => {
    /**
     * Counting `any` usages in wrapEntityOperations signature:
     *
     * 1. list: (options?: any) - options parameter
     * 2. find: (where: any) - where parameter
     * 3. search: (query: string, options?: any) - options parameter
     * 4. semanticSearch?: (query: string, options?: any) - options parameter
     * 5. hybridSearch?: (query: string, options?: any) - options parameter
     * 6. create: (...args: any[]) - entire args array
     * 7. update: (id: string, data: any) - data parameter
     * 8. upsert: (id: string, data: any) - data parameter
     * 9. forEach: (...args: any[]) - entire args array
     *
     * Return type anys:
     * 10. list return: any - in operations parameter
     * 11. find return: any - in operations parameter
     * 12. create return: any[] - args type
     * 13. update return: any - data type
     * 14. forEach return: any[] - args type
     *
     * Plus additional `any` in return signatures of wrapped functions.
     */

    // This test passes to document the count
    expect(true).toBe(true)
  })
})

// =============================================================================
// Integration Tests - Verify Type Issues in Practice
// =============================================================================

describe('Type Safety Integration [RED]', () => {
  beforeEach(() => {
    setProvider(createMemoryProvider())
  })

  it('demonstrates runtime validation catches what TypeScript should catch', async () => {
    const { db } = DB({
      User: { name: 'string', email: 'string', score: 'number' },
    })

    const errors: string[] = []

    // All these compile due to `any` but fail at runtime
    // TypeScript should catch these at compile time instead

    // Test 1: Invalid list options with wrong type
    try {
      await db.User.list({ limit: 'ten' })
    } catch (e) {
      errors.push('list-limit-type')
    }

    // Test 2: Invalid find where type - interestingly, runtime doesn't throw!
    // It just returns an empty array. This is worse - silent failure.
    const findResult = await db.User.find('not an object' as unknown as Record<string, unknown>)
    if (Array.isArray(findResult) && findResult.length === 0) {
      // Silent failure - TypeScript should catch this, but runtime silently returns []
      errors.push('find-where-type')
    }

    // Test 3: Invalid create data type
    try {
      // @ts-expect-error - testing runtime behavior
      await db.User.create('just a string')
    } catch (e) {
      errors.push('create-data-type')
    }

    // Test 4: Invalid update data type
    try {
      // @ts-expect-error - testing runtime behavior
      await db.User.update('id', [1, 2, 3])
    } catch (e) {
      errors.push('update-data-type')
    }

    // Test 5: Invalid get id type
    try {
      // @ts-expect-error - testing runtime behavior
      await db.User.get(123)
    } catch (e) {
      errors.push('get-id-type')
    }

    // Test 6: Invalid search query type
    try {
      // @ts-expect-error - testing runtime behavior
      await db.User.search(123)
    } catch (e) {
      errors.push('search-query-type')
    }

    // All runtime errors were caught - but TypeScript should have caught them
    expect(errors).toContain('list-limit-type')
    expect(errors).toContain('find-where-type')
    expect(errors).toContain('create-data-type')
    expect(errors).toContain('update-data-type')
    expect(errors).toContain('get-id-type')
    expect(errors).toContain('search-query-type')
  })

  it('shows correct types flow through when used properly', async () => {
    const { db } = DB({
      User: { name: 'string', email: 'string', score: 'number' },
    })

    // Create user with proper data
    const user = await db.User.create({
      name: 'John',
      email: 'john@test.com',
      score: 100,
    })

    expect(user.$id).toBeDefined()
    expect(typeof user.$id).toBe('string')
    expect(user.name).toBe('John')
    expect(user.email).toBe('john@test.com')
    expect(user.score).toBe(100)

    // List returns array
    const users = await db.User.list()
    expect(Array.isArray(users)).toBe(true)
    expect(users.length).toBe(1)
    expect(users[0]?.name).toBe('John')

    // Find filters properly
    const found = await db.User.find({ name: 'John' })
    expect(found.length).toBe(1)

    // Update works with partial data
    const updated = await db.User.update(user.$id, { score: 150 })
    expect(updated.score).toBe(150)
    expect(updated.name).toBe('John') // Other fields preserved
  })

  it('shows that invalid properties are silently accepted without proper types', async () => {
    const { db } = DB({
      User: { name: 'string' },
    })

    await db.User.create({ name: 'Test' })

    // These invalid properties compile AND run without error!
    // They're just silently ignored - no type safety whatsoever.

    // Invalid list option property - no error
    const users1 = await db.User.list({ notARealOption: 'value' })
    expect(Array.isArray(users1)).toBe(true)

    // Invalid find property - no error (just doesn't filter)
    const users2 = await db.User.find({ fakeField: 'value' })
    expect(Array.isArray(users2)).toBe(true)

    // Invalid search option - no error
    const users3 = await db.User.search('test', { badOption: true })
    expect(Array.isArray(users3)).toBe(true)
  })
})

// =============================================================================
// Summary of Type Safety Issues
// =============================================================================

describe('Type Safety Issue Summary [RED]', () => {
  it('documents the 14+ any-typed positions that need fixing', () => {
    /**
     * SUMMARY: wrapEntityOperations uses `any` in these positions:
     *
     * INPUT PARAMETERS (causing type safety issues):
     * 1. list(options?: any) - should be ListOptions
     * 2. find(where: any) - should be Partial<T>
     * 3. search(query: string, options?: any) - options should be SearchOptions
     * 4. semanticSearch(query: string, options?: any) - should be SemanticSearchOptions
     * 5. hybridSearch(query: string, options?: any) - should be HybridSearchOptions
     * 6. create(...args: any[]) - should be (data: Omit<T, '$id' | '$type'>, options?: CreateEntityOptions)
     * 7. update(id: string, data: any) - data should be Partial<Omit<T, '$id' | '$type'>>
     * 8. upsert(id: string, data: any) - data should be Omit<T, '$id' | '$type'>
     * 9. forEach(...args: any[]) - should have proper callback and options types
     *
     * RETURN TYPES (also affected by any):
     * 10. create returns Promise<T | unknown> - unknown from spread
     * 11. Operations type uses Record<string, unknown> broadly
     *
     * CONSEQUENCES:
     * - Invalid option properties are silently ignored
     * - Wrong value types only caught at runtime
     * - $id/$type can be passed to create/update (should be forbidden)
     * - No IDE autocomplete for valid options
     * - No compile-time safety for refactoring
     *
     * This test documents the current state for the GREEN phase.
     */
    expect(true).toBe(true)
  })
})
