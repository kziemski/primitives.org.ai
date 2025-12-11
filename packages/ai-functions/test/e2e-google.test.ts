/**
 * E2E Tests for Google GenAI (Gemini) Flex Tier Processing
 *
 * These tests hit real Google GenAI APIs to verify the flex tier actually works.
 * Requires Google API key:
 * - GOOGLE_API_KEY or GEMINI_API_KEY
 *
 * Run with: npx vitest run test/e2e-google.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { configure, resetContext, getExecutionTier, isFlexAvailable } from '../src/context.js'
import { getFlexAdapter, type BatchItem } from '../src/batch-queue.js'

// Import the Google adapter to register it
import { configureGoogleGenAI, googleFlexAdapter } from '../src/batch/google.js'
import '../src/batch/google.js'

// Skip tests if no Google API key or gateway
const hasApiKey = !!(
  process.env.GOOGLE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  (process.env.AI_GATEWAY_URL && process.env.AI_GATEWAY_TOKEN)
)

// Gemini 2.0 Flash model
const GEMINI_MODEL = 'gemini-2.0-flash'

describe.skipIf(!hasApiKey)('E2E Google GenAI Flex Tier Processing', () => {
  beforeAll(() => {
    // Configure Google GenAI - can use either direct API key or AI Gateway
    configureGoogleGenAI({
      gatewayUrl: process.env.AI_GATEWAY_URL,
      gatewayToken: process.env.AI_GATEWAY_TOKEN,
    })

    configure({
      provider: 'google',
      model: GEMINI_MODEL,
      batchMode: 'auto',
      flexThreshold: 3,
      batchThreshold: 500,
    })
  })

  afterAll(() => {
    resetContext()
  })

  describe('Flex Adapter Direct', () => {
    it('processes a small batch via flex adapter', async () => {
      const items: BatchItem[] = [
        {
          id: 'item_1',
          prompt: 'What is 2 + 2? Reply with just the number.',
          status: 'pending',
        },
        {
          id: 'item_2',
          prompt: 'What is 3 + 3? Reply with just the number.',
          status: 'pending',
        },
        {
          id: 'item_3',
          prompt: 'What is 4 + 4? Reply with just the number.',
          status: 'pending',
        },
      ]

      const results = await googleFlexAdapter.submitFlex(items, { model: GEMINI_MODEL })

      expect(results).toHaveLength(3)
      results.forEach((result) => {
        expect(result.status).toBe('completed')
        expect(result.result).toBeDefined()
      })

      // Check the actual responses contain numbers
      const result1 = results.find((r) => r.id === 'item_1')
      const result2 = results.find((r) => r.id === 'item_2')
      const result3 = results.find((r) => r.id === 'item_3')

      expect(String(result1?.result)).toContain('4')
      expect(String(result2?.result)).toContain('6')
      expect(String(result3?.result)).toContain('8')
    }, 30000)

    it('reports token usage', async () => {
      const items: BatchItem[] = [
        {
          id: 'usage_test',
          prompt: 'Count from 1 to 5',
          status: 'pending',
        },
      ]

      const results = await googleFlexAdapter.submitFlex(items, { model: GEMINI_MODEL })

      expect(results[0].usage).toBeDefined()
      expect(results[0].usage?.promptTokens).toBeGreaterThan(0)
      expect(results[0].usage?.completionTokens).toBeGreaterThan(0)
      expect(results[0].usage?.totalTokens).toBeGreaterThan(0)
    }, 30000)

    it('handles system prompts', async () => {
      const items: BatchItem[] = [
        {
          id: 'system_test',
          prompt: 'What should I say?',
          options: {
            system: 'You are a helpful assistant that always responds with exactly "Hello World"',
          },
          status: 'pending',
        },
      ]

      const results = await googleFlexAdapter.submitFlex(items, { model: GEMINI_MODEL })

      expect(results[0].status).toBe('completed')
      expect(String(results[0].result).toLowerCase()).toContain('hello')
    }, 30000)

    it('handles structured output (JSON)', async () => {
      const items: BatchItem[] = [
        {
          id: 'json_test',
          prompt: 'Generate a JSON object with name "Alice" and age 30. Return only valid JSON.',
          schema: { name: 'string', age: 'number' },
          status: 'pending',
        },
      ]

      const results = await googleFlexAdapter.submitFlex(items, { model: GEMINI_MODEL })

      expect(results[0].status).toBe('completed')
      const result = results[0].result as { name?: string; age?: number }
      expect(result).toBeDefined()
      // The result should be parsed JSON
      expect(typeof result === 'object').toBe(true)
    }, 30000)
  })

  describe('Execution Tier Selection', () => {
    it('selects immediate tier for < flexThreshold items', () => {
      configure({ batchMode: 'auto', flexThreshold: 5, batchThreshold: 500 })
      expect(getExecutionTier(1)).toBe('immediate')
      expect(getExecutionTier(4)).toBe('immediate')
    })

    it('selects flex tier for flexThreshold to < batchThreshold items', () => {
      configure({ batchMode: 'auto', flexThreshold: 5, batchThreshold: 500 })
      expect(getExecutionTier(5)).toBe('flex')
      expect(getExecutionTier(100)).toBe('flex')
    })

    it('reports flex as available for google', () => {
      configure({ provider: 'google' })
      expect(isFlexAvailable()).toBe(true)
    })
  })

  describe('Concurrent Processing', () => {
    it('processes multiple items concurrently', async () => {
      // Create 10 items to test concurrent processing
      const items: BatchItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent_${i}`,
        prompt: `What is ${i} + 1? Reply with just the number.`,
        status: 'pending' as const,
      }))

      const startTime = Date.now()
      const results = await googleFlexAdapter.submitFlex(items, { model: GEMINI_MODEL })
      const duration = Date.now() - startTime

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result.status).toBe('completed')
      })

      console.log(`Processed 10 items in ${duration}ms`)
      // With concurrency, should be much faster than sequential
      expect(duration).toBeLessThan(30000) // Should complete in under 30 seconds
    }, 60000)
  })
})

// Test with different Gemini models (optional - may not be available via gateway)
describe.skipIf(!hasApiKey)('E2E Google GenAI with Different Models', () => {
  it.skip('works with gemini-1.5-flash (may not be in gateway)', async () => {
    const items: BatchItem[] = [
      {
        id: 'flash_test',
        prompt: 'Say "hello" and nothing else.',
        status: 'pending',
      },
    ]

    const results = await googleFlexAdapter.submitFlex(items, { model: 'gemini-1.5-flash' })
    expect(results[0].status).toBe('completed')
    expect(String(results[0].result).toLowerCase()).toContain('hello')
  }, 30000)

  it.skip('works with gemini-1.5-pro (may not be in gateway)', async () => {
    const items: BatchItem[] = [
      {
        id: 'pro_test',
        prompt: 'Say "hello" and nothing else.',
        status: 'pending',
      },
    ]

    const results = await googleFlexAdapter.submitFlex(items, { model: 'gemini-1.5-pro' })
    expect(results[0].status).toBe('completed')
    expect(String(results[0].result).toLowerCase()).toContain('hello')
  }, 30000)
})
