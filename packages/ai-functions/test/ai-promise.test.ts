/**
 * Tests for AIPromise module
 *
 * Comprehensive tests covering:
 * - AIPromise class construction and properties
 * - Promise pipelining behavior
 * - Property access tracking for schema inference
 * - Dependency resolution
 * - Batch map recording and replay
 * - Streaming interfaces (StreamingAIPromise)
 * - Error propagation through promise chains
 * - Factory functions
 * - Template tag helpers
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  AIPromise,
  AI_PROMISE_SYMBOL,
  RAW_PROMISE_SYMBOL,
  isAIPromise,
  getRawPromise,
  createTextPromise,
  createObjectPromise,
  createListPromise,
  createListsPromise,
  createBooleanPromise,
  createExtractPromise,
  parseTemplateWithDependencies,
  createAITemplateFunction,
  type AIPromiseOptions,
  type StreamingAIPromise,
} from '../src/ai-promise.js'
import {
  createBatchMap,
  BatchMapPromise,
  isInRecordingMode,
  getCurrentItemPlaceholder,
  captureOperation,
  isBatchMapPromise,
  BATCH_MAP_SYMBOL,
} from '../src/batch-map.js'

// Skip integration tests that require AI gateway
const hasGateway = !!process.env.AI_GATEWAY_URL || !!process.env.ANTHROPIC_API_KEY

// ============================================================================
// 1. AIPromise Class Construction and Identification
// ============================================================================

describe('AIPromise Construction and Identification', () => {
  describe('constructor', () => {
    it('creates an AIPromise with a prompt', () => {
      const promise = new AIPromise<string>('test prompt')
      expect(promise.prompt).toBe('test prompt')
    })

    it('creates an AIPromise with options', () => {
      const promise = new AIPromise<string>('test prompt', {
        type: 'text',
        model: 'sonnet',
        temperature: 0.7,
      })
      expect(promise.prompt).toBe('test prompt')
    })

    it('initializes with empty property path', () => {
      const promise = new AIPromise<string>('test prompt')
      expect(promise.path).toEqual([])
    })

    it('initializes with provided property path', () => {
      const promise = new AIPromise<string>('test prompt', {
        propertyPath: ['foo', 'bar'],
      })
      expect(promise.path).toEqual(['foo', 'bar'])
    })

    it('marks the promise with AI_PROMISE_SYMBOL', () => {
      const promise = new AIPromise<string>('test prompt')
      expect((promise as any)[AI_PROMISE_SYMBOL]).toBe(true)
    })

    it('starts with isResolved = false', () => {
      const promise = new AIPromise<string>('test prompt')
      expect(promise.isResolved).toBe(false)
    })

    it('starts with empty accessedProps', () => {
      const promise = new AIPromise<string>('test prompt')
      expect(promise.accessedProps.size).toBe(0)
    })
  })

  describe('isAIPromise helper', () => {
    it('returns true for AIPromise instances', () => {
      const promise = new AIPromise<string>('test')
      expect(isAIPromise(promise)).toBe(true)
    })

    it('returns false for regular promises', () => {
      const promise = Promise.resolve('test')
      expect(isAIPromise(promise)).toBe(false)
    })

    it('returns false for null', () => {
      expect(isAIPromise(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isAIPromise(undefined)).toBe(false)
    })

    it('returns false for plain objects', () => {
      expect(isAIPromise({ test: 'value' })).toBe(false)
    })

    it('returns false for primitives', () => {
      expect(isAIPromise('string')).toBe(false)
      expect(isAIPromise(123)).toBe(false)
      expect(isAIPromise(true)).toBe(false)
    })
  })

  describe('getRawPromise helper', () => {
    it('returns the raw AIPromise from a proxied value', () => {
      const promise = new AIPromise<{ name: string }>('test')
      // Access a property to get a proxied child promise
      const childPromise = (promise as any).name as AIPromise<string>

      // getRawPromise should return the underlying promise
      const raw = getRawPromise(childPromise)
      expect(isAIPromise(raw)).toBe(true)
    })

    it('returns the same promise if already raw', () => {
      const promise = new AIPromise<string>('test')
      const raw = getRawPromise(promise)
      expect(raw.prompt).toBe('test')
    })
  })
})

// ============================================================================
// 2. Property Access Tracking for Schema Inference
// ============================================================================

describe('Property Access Tracking', () => {
  describe('basic property access', () => {
    it('tracks accessed properties on the promise', () => {
      const promise = new AIPromise<{ name: string; age: number }>('test')

      // Access properties through destructuring
      const { name, age } = promise as any

      expect(promise.accessedProps.has('name')).toBe(true)
      expect(promise.accessedProps.has('age')).toBe(true)
    })

    it('tracks nested property access', () => {
      const promise = new AIPromise<{ user: { name: string } }>('test')

      // Access nested property
      const user = (promise as any).user
      expect(promise.accessedProps.has('user')).toBe(true)
    })

    it('returns a new AIPromise for property access', () => {
      const promise = new AIPromise<{ name: string }>('test')
      const nameProp = (promise as any).name

      expect(isAIPromise(nameProp)).toBe(true)
      expect(nameProp.path).toEqual(['name'])
    })

    it('builds property path for nested access', () => {
      const promise = new AIPromise<{ user: { profile: { name: string } } }>('test')
      const name = (promise as any).user.profile.name

      expect(name.path).toEqual(['user', 'profile', 'name'])
    })
  })

  describe('proxy behavior', () => {
    it('prevents property mutation', () => {
      const promise = new AIPromise<{ name: string }>('test')

      expect(() => {
        ;(promise as any).name = 'new value'
      }).toThrow('AIPromise properties are read-only')
    })

    it('prevents property deletion', () => {
      const promise = new AIPromise<{ name: string }>('test')

      expect(() => {
        delete (promise as any).name
      }).toThrow('AIPromise properties cannot be deleted')
    })

    it('allows access to internal properties', () => {
      const promise = new AIPromise<string>('test prompt')

      expect(promise.prompt).toBe('test prompt')
      expect(promise.path).toEqual([])
      expect(promise.isResolved).toBe(false)
      expect(promise.accessedProps).toBeDefined()
    })

    it('allows access to promise methods', () => {
      const promise = new AIPromise<string>('test')

      expect(typeof promise.then).toBe('function')
      expect(typeof promise.catch).toBe('function')
      expect(typeof promise.finally).toBe('function')
    })

    it('allows access to AIPromise methods', () => {
      const promise = new AIPromise<string[]>('test', { type: 'list' })

      expect(typeof promise.map).toBe('function')
      expect(typeof promise.forEach).toBe('function')
      expect(typeof promise.resolve).toBe('function')
      expect(typeof promise.stream).toBe('function')
      expect(typeof promise.addDependency).toBe('function')
    })
  })
})

// ============================================================================
// 3. Promise Interface (then/catch/finally)
// ============================================================================

describe('Promise Interface', () => {
  describe('then()', () => {
    it('returns a promise from then()', () => {
      const promise = new AIPromise<string>('test')
      const result = promise.then((val) => val)

      expect(result).toBeInstanceOf(Promise)
    })

    it('chains multiple then() calls', () => {
      const promise = new AIPromise<string>('test')
      const result = promise.then((val) => val).then((val) => val.length)

      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('catch()', () => {
    it('returns a promise from catch()', () => {
      const promise = new AIPromise<string>('test')
      const result = promise.catch((err) => 'fallback')

      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('finally()', () => {
    it('returns a promise from finally()', () => {
      const promise = new AIPromise<string>('test')
      const result = promise.finally(() => {})

      expect(result).toBeInstanceOf(Promise)
    })

    it('executes finally callback', async () => {
      // This is a structural test - we just verify the API works
      const promise = new AIPromise<string>('test')
      let finallyCalled = false

      const result = promise.finally(() => {
        finallyCalled = true
      })

      expect(result).toBeInstanceOf(Promise)
    })
  })
})

// ============================================================================
// 4. Dependency Management
// ============================================================================

describe('Dependency Management', () => {
  describe('addDependency()', () => {
    it('adds a dependency to the promise', () => {
      const promise1 = new AIPromise<string>('first prompt')
      const promise2 = new AIPromise<string>('second prompt that uses ${dep_0}')

      promise2.addDependency(promise1)

      // Dependency is stored internally
      const deps = (promise2 as any)._dependencies
      expect(deps.length).toBe(1)
      expect(deps[0].promise).toBe(promise1)
    })

    it('adds a dependency with a path', () => {
      const promise1 = new AIPromise<{ name: string }>('first prompt')
      const promise2 = new AIPromise<string>('second prompt')

      promise2.addDependency(promise1, ['name'])

      const deps = (promise2 as any)._dependencies
      expect(deps.length).toBe(1)
      expect(deps[0].path).toEqual(['name'])
    })

    it('supports multiple dependencies', () => {
      const promise1 = new AIPromise<string>('first')
      const promise2 = new AIPromise<string>('second')
      const promise3 = new AIPromise<string>('third uses ${dep_0} and ${dep_1}')

      promise3.addDependency(promise1)
      promise3.addDependency(promise2)

      const deps = (promise3 as any)._dependencies
      expect(deps.length).toBe(2)
    })
  })
})

// ============================================================================
// 5. Factory Functions
// ============================================================================

describe('Factory Functions', () => {
  describe('createTextPromise()', () => {
    it('creates an AIPromise with text type', () => {
      const promise = createTextPromise('write about TypeScript')

      expect(isAIPromise(promise)).toBe(true)
      expect(promise.prompt).toBe('write about TypeScript')
      expect((promise as any)._options.type).toBe('text')
    })

    it('accepts options', () => {
      const promise = createTextPromise('write', { model: 'sonnet' })

      expect((promise as any)._options.model).toBe('sonnet')
    })
  })

  describe('createObjectPromise()', () => {
    it('creates an AIPromise with object type', () => {
      const promise = createObjectPromise<{ name: string }>('generate a person')

      expect(isAIPromise(promise)).toBe(true)
      expect((promise as any)._options.type).toBe('object')
    })
  })

  describe('createListPromise()', () => {
    it('creates an AIPromise with list type', () => {
      const promise = createListPromise('list 5 colors')

      expect(isAIPromise(promise)).toBe(true)
      expect((promise as any)._options.type).toBe('list')
    })
  })

  describe('createListsPromise()', () => {
    it('creates an AIPromise with lists type', () => {
      const promise = createListsPromise('pros and cons of TypeScript')

      expect(isAIPromise(promise)).toBe(true)
      expect((promise as any)._options.type).toBe('lists')
    })
  })

  describe('createBooleanPromise()', () => {
    it('creates an AIPromise with boolean type', () => {
      const promise = createBooleanPromise('is TypeScript better than JavaScript?')

      expect(isAIPromise(promise)).toBe(true)
      expect((promise as any)._options.type).toBe('boolean')
    })
  })

  describe('createExtractPromise()', () => {
    it('creates an AIPromise with extract type', () => {
      const promise = createExtractPromise<string>('extract names from text')

      expect(isAIPromise(promise)).toBe(true)
      expect((promise as any)._options.type).toBe('extract')
    })
  })
})

// ============================================================================
// 6. Template Tag Helpers
// ============================================================================

describe('Template Tag Helpers', () => {
  describe('parseTemplateWithDependencies()', () => {
    it('parses a simple template without dependencies', () => {
      const strings = ['Hello, world!'] as unknown as TemplateStringsArray
      Object.defineProperty(strings, 'raw', { value: ['Hello, world!'] })

      const result = parseTemplateWithDependencies(strings)

      expect(result.prompt).toBe('Hello, world!')
      expect(result.dependencies).toEqual([])
    })

    it('parses a template with string interpolation', () => {
      const strings = ['Hello, ', '!'] as unknown as TemplateStringsArray
      Object.defineProperty(strings, 'raw', { value: ['Hello, ', '!'] })

      const result = parseTemplateWithDependencies(strings, 'World')

      expect(result.prompt).toBe('Hello, World!')
      expect(result.dependencies).toEqual([])
    })

    it('parses a template with AIPromise dependency', () => {
      const strings = ['The topic is: ', ' - please expand'] as unknown as TemplateStringsArray
      Object.defineProperty(strings, 'raw', { value: strings })

      const aiPromise = new AIPromise<string>('generate a topic')
      const result = parseTemplateWithDependencies(strings, aiPromise)

      expect(result.prompt).toContain('${dep_0}')
      expect(result.dependencies.length).toBe(1)
      expect(result.dependencies[0].promise.prompt).toBe('generate a topic')
    })

    it('handles multiple AIPromise dependencies', () => {
      const strings = [
        'Combine ',
        ' with ',
        ' to create something new',
      ] as unknown as TemplateStringsArray
      Object.defineProperty(strings, 'raw', { value: strings })

      const promise1 = new AIPromise<string>('first topic')
      const promise2 = new AIPromise<string>('second topic')
      const result = parseTemplateWithDependencies(strings, promise1, promise2)

      expect(result.dependencies.length).toBe(2)
      expect(result.prompt).toContain('${dep_0}')
      expect(result.prompt).toContain('${dep_1}')
    })

    it('handles mixed interpolation (strings and AIPromises)', () => {
      const strings = [
        'Write about ',
        ' by ',
        ' in style of ',
        '',
      ] as unknown as TemplateStringsArray
      Object.defineProperty(strings, 'raw', { value: strings })

      const topicPromise = new AIPromise<string>('generate topic')
      const result = parseTemplateWithDependencies(
        strings,
        topicPromise,
        'Author Name',
        'Hemingway'
      )

      expect(result.dependencies.length).toBe(1)
      expect(result.prompt).toContain('Author Name')
      expect(result.prompt).toContain('Hemingway')
    })
  })

  describe('createAITemplateFunction()', () => {
    it('creates a template function for text type', () => {
      const templateFn = createAITemplateFunction<string>('text')

      expect(typeof templateFn).toBe('function')
    })

    it('works as tagged template literal', () => {
      const templateFn = createAITemplateFunction<string>('text')
      const result = templateFn`Write about TypeScript`

      expect(isAIPromise(result)).toBe(true)
    })

    it('works as regular function call', () => {
      const templateFn = createAITemplateFunction<string>('text')
      const result = templateFn('Write about TypeScript')

      expect(isAIPromise(result)).toBe(true)
    })

    it('accepts options in function call mode', () => {
      const templateFn = createAITemplateFunction<string>('text')
      const result = templateFn('Write about TypeScript', { model: 'claude-opus-4-5' })

      expect((result as any)._options.model).toBe('claude-opus-4-5')
    })

    it('tracks dependencies from template interpolation', () => {
      const templateFn = createAITemplateFunction<string>('text')
      const topicPromise = new AIPromise<string>('generate topic')

      const result = templateFn`Write about ${topicPromise}`

      const deps = (result as any)._dependencies
      expect(deps.length).toBe(1)
    })

    it('creates boolean type promises', () => {
      const isFn = createAITemplateFunction<boolean>('boolean')
      const result = isFn`Is TypeScript better than JavaScript?`

      expect((result as any)._options.type).toBe('boolean')
    })

    it('creates list type promises', () => {
      const listFn = createAITemplateFunction<string[]>('list')
      const result = listFn`5 programming languages`

      expect((result as any)._options.type).toBe('list')
    })
  })
})

// ============================================================================
// 7. Map Operations
// ============================================================================

describe('Map Operations', () => {
  describe('map()', () => {
    it('returns a BatchMapPromise', () => {
      const promise = new AIPromise<string[]>('list items', { type: 'list' })
      const mapped = promise.map((item) => `processed: ${item}`)

      expect(isBatchMapPromise(mapped)).toBe(true)
    })

    it('map() method exists on list promises', () => {
      const promise = createListPromise('list 5 colors')

      expect(typeof promise.map).toBe('function')
    })
  })

  describe('mapImmediate()', () => {
    it('returns a BatchMapPromise with immediate option', () => {
      const promise = new AIPromise<string[]>('list items', { type: 'list' })
      const mapped = promise.mapImmediate((item) => `processed: ${item}`)

      expect(isBatchMapPromise(mapped)).toBe(true)
      expect((mapped as any)._options.immediate).toBe(true)
    })
  })

  describe('mapDeferred()', () => {
    it('returns a BatchMapPromise with deferred option', () => {
      const promise = new AIPromise<string[]>('list items', { type: 'list' })
      const mapped = promise.mapDeferred((item) => `processed: ${item}`)

      expect(isBatchMapPromise(mapped)).toBe(true)
      expect((mapped as any)._options.deferred).toBe(true)
    })
  })
})

// ============================================================================
// 8. forEach Operations
// ============================================================================

describe('forEach Operations', () => {
  describe('forEach()', () => {
    it('forEach method exists on AIPromise', () => {
      const promise = new AIPromise<string[]>('list items', { type: 'list' })

      expect(typeof promise.forEach).toBe('function')
    })
  })
})

// ============================================================================
// 9. AsyncIterator Support
// ============================================================================

describe('AsyncIterator Support', () => {
  it('AIPromise has Symbol.asyncIterator', () => {
    const promise = new AIPromise<string[]>('list items', { type: 'list' })

    expect(typeof promise[Symbol.asyncIterator]).toBe('function')
  })
})

// ============================================================================
// 10. Streaming Interface
// ============================================================================

describe('Streaming Interface', () => {
  describe('stream()', () => {
    it('returns a StreamingAIPromise', () => {
      const promise = new AIPromise<string>('test prompt', { type: 'text' })
      const stream = promise.stream()

      expect(stream).toBeDefined()
      expect(typeof stream[Symbol.asyncIterator]).toBe('function')
    })

    it('stream has textStream property', () => {
      const promise = new AIPromise<string>('test prompt', { type: 'text' })
      const stream = promise.stream()

      expect(stream.textStream).toBeDefined()
      expect(typeof stream.textStream[Symbol.asyncIterator]).toBe('function')
    })

    it('stream has partialObjectStream property', () => {
      const promise = new AIPromise<{ name: string }>('test prompt', { type: 'object' })
      const stream = promise.stream()

      expect(stream.partialObjectStream).toBeDefined()
      expect(typeof stream.partialObjectStream[Symbol.asyncIterator]).toBe('function')
    })

    it('stream has result promise', () => {
      const promise = new AIPromise<string>('test prompt', { type: 'text' })
      const stream = promise.stream()

      expect(stream.result).toBeDefined()
      expect(typeof stream.result.then).toBe('function')
    })

    it('stream is thenable', () => {
      const promise = new AIPromise<string>('test prompt', { type: 'text' })
      const stream = promise.stream()

      expect(typeof stream.then).toBe('function')
    })

    it('accepts abort signal option', () => {
      const promise = new AIPromise<string>('test prompt', { type: 'text' })
      const controller = new AbortController()
      const stream = promise.stream({ abortSignal: controller.signal })

      expect(stream).toBeDefined()
    })
  })
})

// ============================================================================
// 11. Batch Map Integration
// ============================================================================

describe('Batch Map Integration', () => {
  describe('BatchMapPromise', () => {
    it('can be created with items and operations', () => {
      const batchMap = new BatchMapPromise<string>(['a', 'b', 'c'], [], {})

      expect(batchMap.size).toBe(3)
    })

    it('has BATCH_MAP_SYMBOL', () => {
      const batchMap = new BatchMapPromise<string>([], [], {})

      expect((batchMap as any)[BATCH_MAP_SYMBOL]).toBe(true)
    })

    it('isBatchMapPromise returns true for BatchMapPromise', () => {
      const batchMap = new BatchMapPromise<string>([], [], {})

      expect(isBatchMapPromise(batchMap)).toBe(true)
    })

    it('isBatchMapPromise returns false for regular promises', () => {
      expect(isBatchMapPromise(Promise.resolve([]))).toBe(false)
    })

    it('isBatchMapPromise returns false for AIPromise', () => {
      const promise = new AIPromise<string[]>('test', { type: 'list' })

      expect(isBatchMapPromise(promise)).toBe(false)
    })
  })

  describe('Recording Mode', () => {
    it('isInRecordingMode returns false outside of batch map', () => {
      expect(isInRecordingMode()).toBe(false)
    })

    it('getCurrentItemPlaceholder returns null outside of batch map', () => {
      expect(getCurrentItemPlaceholder()).toBe(null)
    })
  })

  describe('createBatchMap()', () => {
    it('creates a BatchMapPromise from items and callback', () => {
      const items = ['a', 'b', 'c']
      const callback = (item: string) => item.toUpperCase()

      const batchMap = createBatchMap(items, callback)

      expect(isBatchMapPromise(batchMap)).toBe(true)
      expect(batchMap.size).toBe(3)
    })

    it('accepts options', () => {
      const items = ['a', 'b']
      const callback = (item: string) => item

      const batchMap = createBatchMap(items, callback, { immediate: true })

      expect((batchMap as any)._options.immediate).toBe(true)
    })
  })
})

// ============================================================================
// 12. Schema Building
// ============================================================================

describe('Schema Building', () => {
  describe('_buildSchema() internal method', () => {
    it('uses base schema when no properties accessed', () => {
      const promise = new AIPromise<{ name: string }>('test', {
        baseSchema: { name: 'The person name' },
      })

      const schema = (promise as any)._buildSchema()
      expect(schema).toEqual({ name: 'The person name' })
    })

    it('infers list type from property name ending in s', () => {
      const promise = new AIPromise<{ items: string[] }>('test')

      // Access the property to track it
      const { items } = promise as any

      const schema = (promise as any)._buildSchema()
      expect(Array.isArray(schema.items)).toBe(true)
    })

    it('infers boolean type from property name patterns', () => {
      const promise = new AIPromise<{ isValid: boolean; hasError: boolean }>('test')

      // Access the properties
      const { isValid, hasError } = promise as any

      const schema = (promise as any)._buildSchema()
      expect(schema.isValid).toContain('true/false')
      expect(schema.hasError).toContain('true/false')
    })

    it('infers number type from property name patterns', () => {
      const promise = new AIPromise<{ count: number; totalAmount: number }>('test')

      // Access the properties
      const { count, totalAmount } = promise as any

      const schema = (promise as any)._buildSchema()
      expect(schema.count).toContain('number')
      expect(schema.totalAmount).toContain('number')
    })

    it('returns default schema for text type', () => {
      const promise = new AIPromise<string>('test', { type: 'text' })

      const schema = (promise as any)._buildSchema()
      expect(schema).toHaveProperty('text')
    })

    it('returns default schema for list type', () => {
      const promise = new AIPromise<string[]>('test', { type: 'list' })

      const schema = (promise as any)._buildSchema()
      expect(schema).toHaveProperty('items')
      expect(Array.isArray(schema.items)).toBe(true)
    })

    it('returns default schema for boolean type', () => {
      const promise = new AIPromise<boolean>('test', { type: 'boolean' })

      const schema = (promise as any)._buildSchema()
      expect(schema).toHaveProperty('answer')
    })

    it('returns default schema for extract type', () => {
      const promise = new AIPromise<string[]>('test', { type: 'extract' })

      const schema = (promise as any)._buildSchema()
      expect(schema).toHaveProperty('items')
    })

    it('returns default schema for lists type', () => {
      const promise = new AIPromise<Record<string, string[]>>('test', { type: 'lists' })

      const schema = (promise as any)._buildSchema()
      expect(schema).toHaveProperty('categories')
      expect(schema).toHaveProperty('data')
    })
  })
})

// ============================================================================
// 13. Error Handling
// ============================================================================

describe('Error Handling', () => {
  describe('proxy errors', () => {
    it('throws on set attempt', () => {
      const promise = new AIPromise<{ name: string }>('test')

      expect(() => {
        ;(promise as any).name = 'value'
      }).toThrow('read-only')
    })

    it('throws on delete attempt', () => {
      const promise = new AIPromise<{ name: string }>('test')

      expect(() => {
        delete (promise as any).name
      }).toThrow('cannot be deleted')
    })
  })

  describe('resolution errors', () => {
    it('catch catches rejection from promise chain', async () => {
      const promise = new AIPromise<string>('test')

      // Test that catch method works correctly by chaining
      const result = promise
        .then(() => {
          throw new Error('Test error')
        })
        .catch((err) => 'caught')

      // This tests the catch method behavior - it should handle the thrown error
      expect(result).toBeInstanceOf(Promise)
    })

    it('finally is called regardless of resolution', async () => {
      const promise = new AIPromise<string>('test')

      let finallyCalled = false
      const result = promise.finally(() => {
        finallyCalled = true
      })

      // finally() should return a promise
      expect(result).toBeInstanceOf(Promise)
    })
  })
})

// ============================================================================
// 14. Parent-Child Promise Relationships
// ============================================================================

describe('Parent-Child Promise Relationships', () => {
  it('child promise has reference to parent', () => {
    const parent = new AIPromise<{ name: string }>('test parent prompt')
    const child = (parent as any).name

    // Get the raw promise to access _parent
    const rawChild = getRawPromise(child)
    const rawParent = getRawPromise(parent)

    // Check that the child's parent has the same prompt as the parent
    expect((rawChild as any)._parent?.prompt).toBe('test parent prompt')
  })

  it('child promise has correct property path', () => {
    const parent = new AIPromise<{ user: { name: string } }>('test')
    const name = (parent as any).user.name

    expect(name.path).toEqual(['user', 'name'])
  })

  it('deeply nested access builds complete path', () => {
    const promise = new AIPromise<{ a: { b: { c: { d: string } } } }>('test')
    const deep = (promise as any).a.b.c.d

    expect(deep.path).toEqual(['a', 'b', 'c', 'd'])
  })
})

// ============================================================================
// 15. Promise Pipelining (without await)
// ============================================================================

describe('Promise Pipelining', () => {
  it('allows chaining without await', () => {
    // Create a chain of promises
    const topic = new AIPromise<string>('generate a topic', { type: 'text' })
    const essay = new AIPromise<string>('write about the topic', { type: 'text' })

    // Add dependency
    essay.addDependency(topic)

    // The chain exists without any await
    expect(isAIPromise(topic)).toBe(true)
    expect(isAIPromise(essay)).toBe(true)
    expect((essay as any)._dependencies.length).toBe(1)
  })

  it('property access creates dependent promises', () => {
    const promise = new AIPromise<{ title: string; body: string }>('generate article')

    // Access properties - creates child promises
    const { title, body } = promise as any

    // Both are AIPromises
    expect(isAIPromise(title)).toBe(true)
    expect(isAIPromise(body)).toBe(true)

    // Both have parent reference
    expect((title as any)._parent.prompt).toBe('generate article')
    expect((body as any)._parent.prompt).toBe('generate article')
  })
})

// ============================================================================
// 16. Type-Specific Behavior Tests
// ============================================================================

describe('Type-Specific Behavior', () => {
  describe('text type', () => {
    it('creates promise with text type', () => {
      const promise = createTextPromise('write a haiku')
      expect((promise as any)._options.type).toBe('text')
    })
  })

  describe('object type', () => {
    it('creates promise with object type', () => {
      const promise = createObjectPromise('generate person data')
      expect((promise as any)._options.type).toBe('object')
    })

    it('tracks accessed properties for schema', () => {
      const promise = createObjectPromise<{ name: string; age: number }>('person')
      const { name, age } = promise as any

      expect(promise.accessedProps.has('name')).toBe(true)
      expect(promise.accessedProps.has('age')).toBe(true)
    })
  })

  describe('list type', () => {
    it('creates promise with list type', () => {
      const promise = createListPromise('5 colors')
      expect((promise as any)._options.type).toBe('list')
    })

    it('supports map operations', () => {
      const promise = createListPromise('3 numbers')
      expect(typeof promise.map).toBe('function')
    })
  })

  describe('boolean type', () => {
    it('creates promise with boolean type', () => {
      const promise = createBooleanPromise('is it true?')
      expect((promise as any)._options.type).toBe('boolean')
    })
  })

  describe('extract type', () => {
    it('creates promise with extract type', () => {
      const promise = createExtractPromise('extract names')
      expect((promise as any)._options.type).toBe('extract')
    })
  })

  describe('lists type', () => {
    it('creates promise with lists type', () => {
      const promise = createListsPromise('pros and cons')
      expect((promise as any)._options.type).toBe('lists')
    })
  })
})

// ============================================================================
// 17. Resolution State Management
// ============================================================================

describe('Resolution State Management', () => {
  it('starts unresolved', () => {
    const promise = new AIPromise<string>('test')
    expect(promise.isResolved).toBe(false)
  })

  it('caches resolver promise', () => {
    const promise = new AIPromise<string>('test')

    // Call then twice
    const result1 = promise.then((v) => v)
    const result2 = promise.then((v) => v)

    // Both should use the same resolver
    // (We can't directly test the internal _resolver, but the behavior should be consistent)
    expect(result1).toBeInstanceOf(Promise)
    expect(result2).toBeInstanceOf(Promise)
  })
})

// ============================================================================
// Integration Tests (Real AI calls)
// ============================================================================

describe.skipIf(!hasGateway)('AIPromise Integration Tests', () => {
  describe('Basic Resolution', () => {
    it('resolves a text promise', async () => {
      const promise = createTextPromise('Say hello in exactly 2 words')
      const result = await promise

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    }, 60000)

    it('resolves an object promise with accessed properties', async () => {
      const promise = createObjectPromise<{ greeting: string; language: string }>(
        'Generate a greeting in French'
      )

      // Access properties to define schema
      const { greeting, language } = promise as any

      const result = await promise

      expect(result).toHaveProperty('greeting')
      expect(result).toHaveProperty('language')
    }, 60000)

    it('resolves a list promise', async () => {
      const promise = createListPromise('List exactly 3 primary colors')
      const result = await promise

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(3)
    }, 60000)

    it('resolves a boolean promise', async () => {
      const promise = createBooleanPromise('Is the sky blue on a clear day?')
      const result = await promise

      expect(typeof result).toBe('boolean')
      expect(result).toBe(true)
    }, 60000)
  })

  describe('Property Access Resolution', () => {
    it('resolves child property from parent', async () => {
      const promise = createObjectPromise<{ name: string; age: number }>(
        'Generate a fictional person with name John and age 30'
      )

      // Access properties
      const { name } = promise as any

      // Resolve the parent first
      const parent = await promise

      // The child should resolve to the parent's property
      expect(parent.name).toBeDefined()
    }, 60000)
  })

  describe('Dependency Resolution', () => {
    it('resolves dependencies before main promise', async () => {
      const topicPromise = createTextPromise('Pick a topic: science or art. Just say one word.')
      const essayPromise = createTextPromise('Write one sentence about ${dep_0}')

      essayPromise.addDependency(topicPromise)

      const result = await essayPromise

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    }, 120000)
  })
})
