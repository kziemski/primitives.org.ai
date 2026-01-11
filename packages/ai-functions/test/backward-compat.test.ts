/**
 * Backward Compatibility Tests for ai-functions
 *
 * These tests ensure that all existing imports from ai-functions
 * continue to work after extracting ai-core.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest'

describe('ai-functions backward compatibility', () => {
  describe('Core primitives from ai-core', () => {
    it('should export generate primitive', async () => {
      const { generate } = await import('../src/index.js')
      expect(generate).toBeDefined()
      expect(typeof generate).toBe('function')
    })

    it('should export ai template function', async () => {
      const { ai } = await import('../src/index.js')
      expect(ai).toBeDefined()
      expect(typeof ai).toBe('function')
    })

    it('should export AIPromise class', async () => {
      const { AIPromise } = await import('../src/index.js')
      expect(AIPromise).toBeDefined()
      expect(typeof AIPromise).toBe('function')
    })

    it('should export generative functions', async () => {
      const { write, list, is, extract, summarize } = await import('../src/index.js')
      expect(write).toBeDefined()
      expect(list).toBeDefined()
      expect(is).toBeDefined()
      expect(extract).toBeDefined()
      expect(summarize).toBeDefined()
    })

    it('should export template utilities', async () => {
      const { parseTemplate, createTemplateFunction, createChainablePromise } = await import('../src/index.js')
      expect(parseTemplate).toBeDefined()
      expect(createTemplateFunction).toBeDefined()
      expect(createChainablePromise).toBeDefined()
    })

    it('should export context utilities', async () => {
      const { configure, getContext, withContext, getModel, getProvider } = await import('../src/index.js')
      expect(configure).toBeDefined()
      expect(getContext).toBeDefined()
      expect(withContext).toBeDefined()
      expect(getModel).toBeDefined()
      expect(getProvider).toBeDefined()
    })

    it('should export generation functions', async () => {
      const { generateObject, generateText, streamObject, streamText } = await import('../src/index.js')
      expect(generateObject).toBeDefined()
      expect(generateText).toBeDefined()
      expect(streamObject).toBeDefined()
      expect(streamText).toBeDefined()
    })

    it('should export schema helper', async () => {
      const { schema } = await import('../src/index.js')
      expect(schema).toBeDefined()
      expect(typeof schema).toBe('function')
    })
  })

  describe('Extended features (ai-functions only)', () => {
    it('should export batch processing', async () => {
      const { BatchQueue, createBatch, BATCH_MODE_SYMBOL } = await import('../src/index.js')
      expect(BatchQueue).toBeDefined()
      expect(createBatch).toBeDefined()
      expect(BATCH_MODE_SYMBOL).toBeDefined()
    })

    it('should export batch map', async () => {
      const { BatchMapPromise, createBatchMap } = await import('../src/index.js')
      expect(BatchMapPromise).toBeDefined()
      expect(createBatchMap).toBeDefined()
    })

    it('should export extended context utilities', async () => {
      const { getBatchMode, getBatchThreshold, shouldUseBatchAPI } = await import('../src/index.js')
      expect(getBatchMode).toBeDefined()
      expect(getBatchThreshold).toBeDefined()
      expect(shouldUseBatchAPI).toBeDefined()
    })

    it('should export budget tracking', async () => {
      const { BudgetTracker, TokenCounter, BudgetExceededError, withBudget } = await import('../src/index.js')
      expect(BudgetTracker).toBeDefined()
      expect(TokenCounter).toBeDefined()
      expect(BudgetExceededError).toBeDefined()
      expect(withBudget).toBeDefined()
    })

    it('should export retry/resilience patterns', async () => {
      const { RetryPolicy, CircuitBreaker, FallbackChain, withRetry, RetryableError } = await import('../src/index.js')
      expect(RetryPolicy).toBeDefined()
      expect(CircuitBreaker).toBeDefined()
      expect(FallbackChain).toBeDefined()
      expect(withRetry).toBeDefined()
      expect(RetryableError).toBeDefined()
    })

    it('should export caching', async () => {
      const { MemoryCache, EmbeddingCache, GenerationCache, withCache } = await import('../src/index.js')
      expect(MemoryCache).toBeDefined()
      expect(EmbeddingCache).toBeDefined()
      expect(GenerationCache).toBeDefined()
      expect(withCache).toBeDefined()
    })

    it('should export tool orchestration', async () => {
      const { AgenticLoop, ToolRouter, createTool, createAgenticLoop } = await import('../src/index.js')
      expect(AgenticLoop).toBeDefined()
      expect(ToolRouter).toBeDefined()
      expect(createTool).toBeDefined()
      expect(createAgenticLoop).toBeDefined()
    })

    it('should export AI proxy', async () => {
      const { AI } = await import('../src/index.js')
      expect(AI).toBeDefined()
    })

    it('should export embeddings', async () => {
      const { embed, embedMany, cosineSimilarity } = await import('../src/index.js')
      expect(embed).toBeDefined()
      expect(embedMany).toBeDefined()
      expect(cosineSimilarity).toBeDefined()
    })
  })

  describe('Type exports', () => {
    it('should export core types', async () => {
      // Type exports are verified at compile time
      // If this module imports successfully, types are exported
      const mod = await import('../src/index.js')
      expect(mod).toBeDefined()
    })
  })
})
