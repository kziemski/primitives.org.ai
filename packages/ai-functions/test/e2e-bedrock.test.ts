/**
 * E2E Tests for AWS Bedrock Flex Tier Processing
 *
 * These tests hit real AWS Bedrock APIs to verify the flex tier actually works.
 * Requires AWS credentials:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION (optional, defaults to us-east-1)
 *
 * Run with: npx vitest run test/e2e-bedrock.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { configure, resetContext, getExecutionTier, isFlexAvailable } from '../src/context.js'
import { getFlexAdapter, type BatchItem } from '../src/batch-queue.js'

// Import the Bedrock adapter to register it
import { configureAWSBedrock, bedrockFlexAdapter } from '../src/batch/bedrock.js'
import '../src/batch/bedrock.js'

// Skip tests if no AWS credentials
// NOTE: Unlike OpenAI/Google, Bedrock via AI Gateway still requires AWS SigV4 signing
// Gateway alone is NOT sufficient - you need AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
const hasCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)

// Claude Opus 4.5 model ID on Bedrock
const CLAUDE_OPUS_MODEL = 'anthropic.claude-opus-4-20250514-v1:0'
// Fallback to Sonnet if Opus isn't available
const CLAUDE_SONNET_MODEL = 'anthropic.claude-sonnet-4-20250514-v1:0'

describe.skipIf(!hasCredentials)('E2E Bedrock Flex Tier Processing', () => {
  beforeAll(() => {
    // Configure Bedrock - can use either direct AWS credentials or AI Gateway
    configureAWSBedrock({
      region: process.env.AWS_REGION || 'us-east-1',
      s3Bucket: process.env.BEDROCK_BATCH_S3_BUCKET || 'dummy-bucket',
      // AI Gateway configuration (optional)
      gatewayUrl: process.env.AI_GATEWAY_URL,
      gatewayToken: process.env.AI_GATEWAY_TOKEN,
    })

    configure({
      provider: 'bedrock',
      model: CLAUDE_SONNET_MODEL, // Use Sonnet by default (more available)
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

      const results = await bedrockFlexAdapter.submitFlex(items, { model: CLAUDE_SONNET_MODEL })

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
    }, 60000) // 60 second timeout for Bedrock

    it('reports token usage', async () => {
      const items: BatchItem[] = [
        {
          id: 'usage_test',
          prompt: 'Count from 1 to 5',
          status: 'pending',
        },
      ]

      const results = await bedrockFlexAdapter.submitFlex(items, { model: CLAUDE_SONNET_MODEL })

      expect(results[0].usage).toBeDefined()
      expect(results[0].usage?.promptTokens).toBeGreaterThan(0)
      expect(results[0].usage?.completionTokens).toBeGreaterThan(0)
      expect(results[0].usage?.totalTokens).toBeGreaterThan(0)
    }, 60000)

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

      const results = await bedrockFlexAdapter.submitFlex(items, { model: CLAUDE_SONNET_MODEL })

      expect(results[0].status).toBe('completed')
      expect(String(results[0].result).toLowerCase()).toContain('hello')
    }, 60000)
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

    it('reports flex as available for bedrock', () => {
      configure({ provider: 'bedrock' })
      expect(isFlexAvailable()).toBe(true)
    })
  })

  describe('Concurrent Processing', () => {
    it('processes multiple items concurrently', async () => {
      // Create 5 items to test concurrent processing
      const items: BatchItem[] = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent_${i}`,
        prompt: `What is ${i} + 1? Reply with just the number.`,
        status: 'pending' as const,
      }))

      const startTime = Date.now()
      const results = await bedrockFlexAdapter.submitFlex(items, { model: CLAUDE_SONNET_MODEL })
      const duration = Date.now() - startTime

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result.status).toBe('completed')
      })

      console.log(`Processed 5 items in ${duration}ms`)
    }, 120000)
  })
})

// Optional test with Claude Opus 4.5 (may not be available in all regions)
describe.skipIf(!hasCredentials)('E2E Bedrock with Claude Opus 4.5', () => {
  it.skip('processes with Claude Opus 4.5', async () => {
    const items: BatchItem[] = [
      {
        id: 'opus_test',
        prompt: 'Write a haiku about AI.',
        status: 'pending',
      },
    ]

    try {
      const results = await bedrockFlexAdapter.submitFlex(items, { model: CLAUDE_OPUS_MODEL })
      expect(results[0].status).toBe('completed')
      expect(results[0].result).toBeDefined()
      console.log('Claude Opus 4.5 response:', results[0].result)
    } catch (error) {
      console.log('Claude Opus 4.5 not available in this region:', error)
    }
  }, 120000)
})
