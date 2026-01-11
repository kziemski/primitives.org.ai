/**
 * Tests for Getting Started Guide examples
 *
 * TDD RED Phase: These tests verify that example code is correct and runnable.
 * Uses mocks at the ai-functions level to avoid real API calls.
 *
 * Tests cover:
 * 1. Basic generation (text, object, list) examples
 * 2. AIPromise pipelining examples
 * 3. Error handling examples (retry, fallback, circuit breaker)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock ai-functions at the module level BEFORE imports
vi.mock('ai-functions', async (importOriginal) => {
  const original = await importOriginal<typeof import('ai-functions')>()

  return {
    ...original,
    generateText: vi.fn(),
    generateObject: vi.fn(),
    streamText: vi.fn(),
    streamObject: vi.fn(),
  }
})

// Mock ai-providers model resolution
vi.mock('ai-providers', () => ({
  model: vi.fn((name: string) => ({
    id: name,
    provider: 'mock',
    specificationVersion: 'v2',
  })),
}))

// Now import examples (they will use mocked ai-functions)
import {
  generateTextExample,
  generateObjectExample,
  generateListExample,
} from '../src/basic-generation.js'

import {
  promisePipeliningExample,
  batchProcessingExample,
  streamingExample,
} from '../src/promise-pipelining.js'

import {
  retryExample,
  fallbackExample,
  circuitBreakerExample,
  resetCircuitBreakers,
} from '../src/error-handling.js'

// Import mocked functions for test assertions
import { generateText, generateObject, streamText } from 'ai-functions'

const mockGenerateText = generateText as ReturnType<typeof vi.fn>
const mockGenerateObject = generateObject as ReturnType<typeof vi.fn>
const mockStreamText = streamText as ReturnType<typeof vi.fn>

// ============================================================================
// 1. BASIC GENERATION TESTS
// ============================================================================

describe('Basic Generation Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateTextExample', () => {
    it('generates text content using generateText', async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: 'AI stands for Artificial Intelligence. It is a field of computer science...',
        usage: { promptTokens: 10, completionTokens: 50 },
      })

      const result = await generateTextExample('What is AI?')

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(mockGenerateText).toHaveBeenCalledTimes(1)
    })

    it('uses the specified model', async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: 'Generated text',
        usage: { promptTokens: 5, completionTokens: 10 },
      })

      await generateTextExample('Test prompt', { model: 'sonnet' })

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'sonnet',
          prompt: 'Test prompt',
        })
      )
    })

    it('passes temperature and maxTokens options', async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: 'Creative output',
      })

      await generateTextExample('Be creative', {
        model: 'opus',
        temperature: 0.9,
        maxTokens: 500,
      })

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
          maxTokens: 500,
        })
      )
    })
  })

  describe('generateObjectExample', () => {
    it('generates structured objects with schema', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          name: 'John Doe',
          age: 30,
          email: 'john@example.com',
        },
      })

      const result = await generateObjectExample('Extract user info from: John Doe, age 30, email john@example.com')

      expect(result).toBeDefined()
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('age')
      expect(result).toHaveProperty('email')
    })

    it('accepts custom schema definition', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          title: 'My Recipe',
          ingredients: ['flour', 'sugar', 'eggs'],
          steps: ['Mix ingredients', 'Bake at 350F'],
        },
      })

      const schema = {
        title: 'Recipe title',
        ingredients: ['List of ingredients'],
        steps: ['Cooking steps'],
      }

      const result = await generateObjectExample('Create a simple cake recipe', { schema })

      expect(result).toHaveProperty('title')
      expect(Array.isArray(result.ingredients)).toBe(true)
      expect(Array.isArray(result.steps)).toBe(true)
    })
  })

  describe('generateListExample', () => {
    it('generates a list of items', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          items: ['TypeScript', 'Python', 'Rust', 'Go', 'JavaScript'],
        },
      })

      const result = await generateListExample('5 popular programming languages')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(5)
      result.forEach((item) => {
        expect(typeof item).toBe('string')
      })
    })

    it('respects count parameter', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          items: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
        },
      })

      const result = await generateListExample('startup ideas', { count: 3 })

      expect(result.length).toBeLessThanOrEqual(3)
    })
  })
})

// ============================================================================
// 2. PROMISE PIPELINING TESTS
// ============================================================================

describe('Promise Pipelining Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('promisePipeliningExample', () => {
    it('chains multiple AI operations without await', async () => {
      // First call generates initial content
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          summary: 'AI is transforming software development',
          keyPoints: ['Automation', 'Efficiency', 'New capabilities'],
          conclusion: 'AI will continue to evolve',
        },
      })

      // Second call validates the conclusion
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          answer: 'true',
        },
      })

      const result = await promisePipeliningExample('AI in software development')

      expect(result).toBeDefined()
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('isValid')
      expect(result.summary).toBe('AI is transforming software development')
    })

    it('resolves dependencies in correct order', async () => {
      const callOrder: string[] = []

      mockGenerateObject.mockImplementation(async (opts: { prompt?: string }) => {
        const prompt = opts.prompt || ''
        if (prompt.includes('write about')) {
          callOrder.push('content')
          return {
            object: {
              summary: 'Test summary',
              keyPoints: ['Point 1', 'Point 2'],
              conclusion: 'Test conclusion',
            },
          }
        } else {
          callOrder.push('validation')
          return { object: { answer: 'true' } }
        }
      })

      await promisePipeliningExample('test topic')

      // Content generation should happen before validation
      expect(callOrder[0]).toBe('content')
      expect(callOrder[1]).toBe('validation')
    })
  })

  describe('batchProcessingExample', () => {
    it('processes multiple items with .map()', async () => {
      // First call generates the list
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          items: ['Idea 1', 'Idea 2', 'Idea 3'],
        },
      })

      // Each evaluation call
      mockGenerateObject.mockResolvedValueOnce({
        object: { viable: 'true', market: 'Large' },
      })
      mockGenerateObject.mockResolvedValueOnce({
        object: { viable: 'false', market: 'Small' },
      })
      mockGenerateObject.mockResolvedValueOnce({
        object: { viable: 'true', market: 'Medium' },
      })

      const result = await batchProcessingExample('startup ideas')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(3)
    })

    it('returns structured results for each item', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { items: ['Test idea'] },
      })

      mockGenerateObject.mockResolvedValueOnce({
        object: { viable: 'true', market: 'Test market' },
      })

      const result = await batchProcessingExample('one idea')

      expect(result[0]).toHaveProperty('idea')
      expect(result[0]).toHaveProperty('viable')
      expect(result[0]).toHaveProperty('market')
      expect(result[0].idea).toBe('Test idea')
      expect(result[0].viable).toBe(true)
    })
  })

  describe('streamingExample', () => {
    it('streams text generation progressively', async () => {
      const chunks = ['Hello', ' ', 'World', '!']

      mockStreamText.mockResolvedValueOnce({
        textStream: {
          async *[Symbol.asyncIterator]() {
            for (const chunk of chunks) {
              yield chunk
            }
          },
        },
      })

      const collectedChunks: string[] = []
      await streamingExample('Say hello', (chunk) => {
        collectedChunks.push(chunk)
      })

      expect(collectedChunks.length).toBe(4)
      expect(collectedChunks.join('')).toBe('Hello World!')
    })

    it('returns final complete text', async () => {
      mockStreamText.mockResolvedValueOnce({
        textStream: {
          async *[Symbol.asyncIterator]() {
            yield 'Final'
            yield ' '
            yield 'Result'
          },
        },
      })

      const result = await streamingExample('Test prompt')

      expect(result).toBe('Final Result')
    })
  })
})

// ============================================================================
// 3. ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    resetCircuitBreakers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('retryExample', () => {
    it('retries on transient failures', async () => {
      // Use real timers for this test with short delays
      vi.useRealTimers()

      let attempts = 0
      mockGenerateText.mockImplementation(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Rate limit exceeded')
        }
        return { text: 'Success after retry' }
      })

      const result = await retryExample('Test prompt', {
        maxRetries: 3,
        baseDelay: 10, // Very short delay for fast test
      })

      expect(result).toBe('Success after retry')
      expect(attempts).toBe(3)

      // Restore fake timers
      vi.useFakeTimers()
    })

    it('respects maxRetries configuration', async () => {
      // Use real timers for this test
      vi.useRealTimers()

      mockGenerateText.mockRejectedValue(new Error('Persistent failure'))

      await expect(
        retryExample('Test prompt', {
          maxRetries: 2,
          baseDelay: 10,
        })
      ).rejects.toThrow('Persistent failure')

      vi.useFakeTimers()
    })

    it('applies exponential backoff', async () => {
      // Use real timers for this test
      vi.useRealTimers()

      const timestamps: number[] = []

      mockGenerateText.mockImplementation(async () => {
        timestamps.push(Date.now())
        if (timestamps.length < 4) {
          throw new Error('Temporary error')
        }
        return { text: 'Done' }
      })

      await retryExample('Test', {
        maxRetries: 5,
        baseDelay: 10, // Short delays for fast test
      })

      // Verify backoff pattern - each delay should be longer than previous
      // With base 10ms and multiplier 2: 10ms, 20ms, 40ms...
      expect(timestamps.length).toBe(4)

      // Check that delays increase exponentially
      const delay1 = timestamps[1] - timestamps[0]
      const delay2 = timestamps[2] - timestamps[1]
      const delay3 = timestamps[3] - timestamps[2]

      // With jitter, delays should roughly double each time
      expect(delay2).toBeGreaterThanOrEqual(delay1 * 0.8) // Allow for jitter
      expect(delay3).toBeGreaterThanOrEqual(delay2 * 0.8)

      vi.useFakeTimers()
    })
  })

  describe('fallbackExample', () => {
    it('falls back to secondary model on failure', async () => {
      const callOrder: string[] = []

      mockGenerateText.mockImplementation(async (opts: { model?: { id: string } | string }) => {
        const modelId = typeof opts.model === 'string' ? opts.model : opts.model?.id || 'unknown'
        callOrder.push(modelId)

        if (modelId === 'sonnet') {
          throw new Error('Primary model unavailable')
        }
        return { text: 'Fallback result' }
      })

      const result = await fallbackExample('Test prompt', ['sonnet', 'opus', 'gpt-4o'])

      expect(result).toBe('Fallback result')
      expect(callOrder.length).toBeGreaterThan(1)
    })

    it('tries models in order until one succeeds', async () => {
      const attempted: string[] = []

      mockGenerateText.mockImplementation(async (opts: { model?: { id: string } | string }) => {
        const modelId = typeof opts.model === 'string' ? opts.model : opts.model?.id || 'unknown'
        attempted.push(modelId)

        if (modelId !== 'gpt-4o') {
          throw new Error(`${modelId} failed`)
        }
        return { text: 'GPT-4o success' }
      })

      const result = await fallbackExample('Test', ['sonnet', 'opus', 'gpt-4o'])

      expect(result).toBe('GPT-4o success')
      expect(attempted).toEqual(['sonnet', 'opus', 'gpt-4o'])
    })

    it('throws when all models fail', async () => {
      mockGenerateText.mockRejectedValue(new Error('Model failed'))

      await expect(fallbackExample('Test', ['model1', 'model2'])).rejects.toThrow('All fallback models failed')
    })
  })

  describe('circuitBreakerExample', () => {
    it('opens circuit after consecutive failures', async () => {
      let callCount = 0

      mockGenerateText.mockImplementation(async () => {
        callCount++
        throw new Error('Service unavailable')
      })

      // Make failureThreshold failures to open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreakerExample('Test', { failureThreshold: 3 })
        } catch {
          // Expected to fail
        }
      }

      const callCountAfterOpen = callCount

      // Next call should fail fast without calling underlying function
      try {
        await circuitBreakerExample('Test', { failureThreshold: 3 })
      } catch (e) {
        expect((e as Error).message).toBe('Circuit breaker is open')
      }

      // No additional calls should have been made
      expect(callCount).toBe(callCountAfterOpen)
    })

    it('allows requests after reset timeout', async () => {
      mockGenerateText.mockRejectedValue(new Error('Failure'))

      // Open the circuit with 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreakerExample('Test', { failureThreshold: 3, resetTimeout: 1000 })
        } catch {
          // Expected
        }
      }

      // Advance past reset timeout
      await vi.advanceTimersByTimeAsync(1100)

      // Circuit should be half-open, allowing test request
      mockGenerateText.mockResolvedValueOnce({ text: 'Recovery success' })

      const result = await circuitBreakerExample('Test', { failureThreshold: 3, resetTimeout: 1000 })

      expect(result).toBe('Recovery success')
    })

    it('reports circuit state', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: 'Success' })

      const result = await circuitBreakerExample('Test', {
        failureThreshold: 3,
        returnState: true,
      })

      expect(result).toHaveProperty('result')
      expect(result).toHaveProperty('circuitState')
      expect((result as { circuitState: string }).circuitState).toBe('closed')
    })
  })
})

// ============================================================================
// 4. TYPE SAFETY TESTS
// ============================================================================

describe('Type Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generateObjectExample returns typed results', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: { name: 'Test', value: 42 },
    })

    interface TestType {
      name: string
      value: number
    }

    const result = await generateObjectExample<TestType>('Generate test data', {
      schema: { name: 'Name string', value: 'Numeric value' },
    })

    // TypeScript should infer correct types
    const name: string = result.name
    const value: number = result.value

    expect(typeof name).toBe('string')
    expect(typeof value).toBe('number')
  })
})
