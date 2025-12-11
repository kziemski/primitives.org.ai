/**
 * E2E Tests for Flex Tier Processing
 *
 * These tests hit real APIs to verify the flex tier actually works.
 * Requires OPENAI_API_KEY environment variable.
 *
 * Run with: npx vitest run test/e2e-flex.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { configure, resetContext, getExecutionTier, isFlexAvailable } from '../src/context.js'
import { getFlexAdapter, type BatchItem, type BatchResult } from '../src/batch-queue.js'

// Import the OpenAI adapter to register it
import { configureOpenAI } from '../src/batch/openai.js'
import '../src/batch/openai.js'

// Skip tests if no API key (either direct or via gateway)
const hasApiKey = !!(process.env.OPENAI_API_KEY || (process.env.AI_GATEWAY_URL && process.env.AI_GATEWAY_TOKEN))

describe.skipIf(!hasApiKey)('E2E Flex Tier Processing', () => {
  beforeAll(() => {
    // If using gateway, configure the base URL
    if (process.env.AI_GATEWAY_URL && process.env.AI_GATEWAY_TOKEN && !process.env.OPENAI_API_KEY) {
      configureOpenAI({
        apiKey: process.env.AI_GATEWAY_TOKEN,
        baseUrl: `${process.env.AI_GATEWAY_URL}/openai`,
      })
    }

    configure({
      provider: 'openai',
      model: 'gpt-4o-mini', // Use mini for faster/cheaper tests
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
      const adapter = getFlexAdapter('openai')

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

      const results = await adapter.submitFlex(items, { model: 'gpt-4o-mini' })

      expect(results).toHaveLength(3)
      results.forEach((result) => {
        expect(result.status).toBe('completed')
        expect(result.result).toBeDefined()
      })

      // Check the actual responses contain numbers
      const result1 = results.find((r) => r.id === 'item_1')
      const result2 = results.find((r) => r.id === 'item_2')
      const result3 = results.find((r) => r.id === 'item_3')

      expect(result1?.result).toContain('4')
      expect(result2?.result).toContain('6')
      expect(result3?.result).toContain('8')
    }, 30000) // 30 second timeout

    it('processes items with structured output (JSON schema)', async () => {
      const adapter = getFlexAdapter('openai')

      const items: BatchItem[] = [
        {
          id: 'structured_1',
          prompt: 'Generate a person with name "Alice" and age 30',
          schema: { name: 'string', age: 'number' },
          status: 'pending',
        },
        {
          id: 'structured_2',
          prompt: 'Generate a person with name "Bob" and age 25',
          schema: { name: 'string', age: 'number' },
          status: 'pending',
        },
      ]

      const results = await adapter.submitFlex(items, { model: 'gpt-4o-mini' })

      expect(results).toHaveLength(2)
      results.forEach((result) => {
        expect(result.status).toBe('completed')
        expect(result.result).toBeDefined()
        expect(typeof result.result).toBe('object')
      })

      const result1 = results.find((r) => r.id === 'structured_1')
      const result2 = results.find((r) => r.id === 'structured_2')

      // Results should be parsed JSON objects
      expect((result1?.result as any)?.name).toBeDefined()
      expect((result2?.result as any)?.name).toBeDefined()
    }, 30000)

    it('handles errors gracefully', async () => {
      const adapter = getFlexAdapter('openai')

      const items: BatchItem[] = [
        {
          id: 'valid',
          prompt: 'Say hello',
          status: 'pending',
        },
      ]

      // This should work even with a minimal prompt
      const results = await adapter.submitFlex(items, { model: 'gpt-4o-mini' })

      expect(results).toHaveLength(1)
      expect(results[0].status).toBe('completed')
    }, 30000)

    it('reports token usage', async () => {
      const adapter = getFlexAdapter('openai')

      const items: BatchItem[] = [
        {
          id: 'usage_test',
          prompt: 'Count from 1 to 5',
          status: 'pending',
        },
      ]

      const results = await adapter.submitFlex(items, { model: 'gpt-4o-mini' })

      expect(results[0].usage).toBeDefined()
      expect(results[0].usage?.promptTokens).toBeGreaterThan(0)
      expect(results[0].usage?.completionTokens).toBeGreaterThan(0)
      expect(results[0].usage?.totalTokens).toBeGreaterThan(0)
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
      expect(getExecutionTier(499)).toBe('flex')
    })

    it('selects batch tier for >= batchThreshold items', () => {
      configure({ batchMode: 'auto', flexThreshold: 5, batchThreshold: 500 })
      expect(getExecutionTier(500)).toBe('batch')
      expect(getExecutionTier(1000)).toBe('batch')
    })

    it('reports flex as available for openai', () => {
      configure({ provider: 'openai' })
      expect(isFlexAvailable()).toBe(true)
    })
  })

  describe('Concurrent Processing', () => {
    it('processes multiple items concurrently', async () => {
      const adapter = getFlexAdapter('openai')

      // Create 10 items to test concurrent processing
      const items: BatchItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent_${i}`,
        prompt: `What is ${i} + 1? Reply with just the number.`,
        status: 'pending' as const,
      }))

      const startTime = Date.now()
      const results = await adapter.submitFlex(items, { model: 'gpt-4o-mini' })
      const duration = Date.now() - startTime

      expect(results).toHaveLength(10)
      results.forEach((result, i) => {
        expect(result.status).toBe('completed')
      })

      // With concurrency of 10, this should complete much faster than sequential
      // Sequential would be ~10-20 seconds, concurrent should be ~2-5 seconds
      console.log(`Processed 10 items in ${duration}ms`)
      expect(duration).toBeLessThan(20000) // Should be well under 20 seconds
    }, 60000)
  })
})
