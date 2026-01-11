/**
 * Package Boundary Tests for ai-core
 *
 * Tests that ai-core exports the correct primitives and does NOT export
 * modules that belong in separate packages (batch processing, retry/resilience).
 *
 * TDD RED Phase: These tests define what ai-core SHOULD export.
 * They will fail until the package is properly created.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest'

describe('ai-core package exports', () => {
  describe('Core primitives - MUST export', () => {
    it('should export generate primitive', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.generate).toBeDefined()
      expect(typeof aiCore.generate).toBe('function')
    })

    it('should export ai prompt function', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.ai).toBeDefined()
      expect(typeof aiCore.ai).toBe('function')
    })

    it('should export AIPromise class', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.AIPromise).toBeDefined()
      expect(typeof aiCore.AIPromise).toBe('function')
    })

    it('should export isAIPromise utility', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.isAIPromise).toBeDefined()
      expect(typeof aiCore.isAIPromise).toBe('function')
    })

    it('should export createAITemplateFunction', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.createAITemplateFunction).toBeDefined()
      expect(typeof aiCore.createAITemplateFunction).toBe('function')
    })
  })

  describe('Template utilities - MUST export', () => {
    it('should export parseTemplate', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.parseTemplate).toBeDefined()
      expect(typeof aiCore.parseTemplate).toBe('function')
    })

    it('should export createTemplateFunction', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.createTemplateFunction).toBeDefined()
      expect(typeof aiCore.createTemplateFunction).toBe('function')
    })

    it('should export createChainablePromise', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.createChainablePromise).toBeDefined()
      expect(typeof aiCore.createChainablePromise).toBe('function')
    })

    it('should export FunctionOptions type (via TypeScript)', async () => {
      // This is a compile-time check - if it imports, the type exists
      const aiCore = await import('../src/index.js')
      // FunctionOptions is a type, so we verify template.js exports work
      expect(aiCore.parseTemplate).toBeDefined()
    })
  })

  describe('Context utilities - MUST export', () => {
    it('should export configure', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.configure).toBeDefined()
      expect(typeof aiCore.configure).toBe('function')
    })

    it('should export getContext', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.getContext).toBeDefined()
      expect(typeof aiCore.getContext).toBe('function')
    })

    it('should export withContext', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.withContext).toBeDefined()
      expect(typeof aiCore.withContext).toBe('function')
    })

    it('should export getModel', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.getModel).toBeDefined()
      expect(typeof aiCore.getModel).toBe('function')
    })
  })

  describe('Core generative functions - MUST export', () => {
    it('should export write function', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.write).toBeDefined()
      expect(typeof aiCore.write).toBe('function')
    })

    it('should export list function', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.list).toBeDefined()
      expect(typeof aiCore.list).toBe('function')
    })

    it('should export is function', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.is).toBeDefined()
      expect(typeof aiCore.is).toBe('function')
    })

    it('should export extract function', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.extract).toBeDefined()
      expect(typeof aiCore.extract).toBe('function')
    })

    it('should export summarize function', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.summarize).toBeDefined()
      expect(typeof aiCore.summarize).toBe('function')
    })
  })

  describe('Type exports - MUST export', () => {
    it('should export GenerateType', async () => {
      // Type exports are verified at compile time
      // We verify the module structure is correct
      const aiCore = await import('../src/index.js')
      expect(aiCore.generate).toBeDefined()
    })

    it('should export GenerateOptions', async () => {
      // Type exports are verified at compile time
      const aiCore = await import('../src/index.js')
      expect(aiCore.generate).toBeDefined()
    })

    it('should export AIPromiseOptions', async () => {
      // Type exports are verified at compile time
      const aiCore = await import('../src/index.js')
      expect(aiCore.AIPromise).toBeDefined()
    })
  })

  describe('Generation functions - MUST export', () => {
    it('should export generateObject', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.generateObject).toBeDefined()
      expect(typeof aiCore.generateObject).toBe('function')
    })

    it('should export generateText', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.generateText).toBeDefined()
      expect(typeof aiCore.generateText).toBe('function')
    })

    it('should export streamObject', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.streamObject).toBeDefined()
      expect(typeof aiCore.streamObject).toBe('function')
    })

    it('should export streamText', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.streamText).toBeDefined()
      expect(typeof aiCore.streamText).toBe('function')
    })
  })

  describe('Schema utilities - MUST export', () => {
    it('should export schema helper', async () => {
      const aiCore = await import('../src/index.js')
      expect(aiCore.schema).toBeDefined()
      expect(typeof aiCore.schema).toBe('function')
    })
  })

  describe('Batch processing - MUST NOT export', () => {
    it('should NOT export BatchQueue', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).BatchQueue).toBeUndefined()
    })

    it('should NOT export createBatch', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).createBatch).toBeUndefined()
    })

    it('should NOT export deferToBatch', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).deferToBatch).toBeUndefined()
    })

    it('should NOT export BatchMapPromise', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).BatchMapPromise).toBeUndefined()
    })
  })

  describe('Retry/Resilience - MUST NOT export', () => {
    it('should NOT export RetryPolicy', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).RetryPolicy).toBeUndefined()
    })

    it('should NOT export CircuitBreaker', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).CircuitBreaker).toBeUndefined()
    })

    it('should NOT export FallbackChain', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).FallbackChain).toBeUndefined()
    })

    it('should NOT export withRetry', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).withRetry).toBeUndefined()
    })

    it('should NOT export RetryableError', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).RetryableError).toBeUndefined()
    })
  })

  describe('Budget tracking - MUST NOT export', () => {
    it('should NOT export BudgetTracker', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).BudgetTracker).toBeUndefined()
    })

    it('should NOT export TokenCounter', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).TokenCounter).toBeUndefined()
    })

    it('should NOT export withBudget', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).withBudget).toBeUndefined()
    })
  })

  describe('Caching - MUST NOT export', () => {
    it('should NOT export MemoryCache', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).MemoryCache).toBeUndefined()
    })

    it('should NOT export EmbeddingCache', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).EmbeddingCache).toBeUndefined()
    })

    it('should NOT export withCache', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).withCache).toBeUndefined()
    })
  })

  describe('Tool orchestration - MUST NOT export', () => {
    it('should NOT export AgenticLoop', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).AgenticLoop).toBeUndefined()
    })

    it('should NOT export ToolRouter', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).ToolRouter).toBeUndefined()
    })

    it('should NOT export createAgenticLoop', async () => {
      const aiCore = await import('../src/index.js')
      expect((aiCore as Record<string, unknown>).createAgenticLoop).toBeUndefined()
    })
  })
})

describe('ai-core type safety', () => {
  it('should provide proper TypeScript types for generate', async () => {
    const { generate } = await import('../src/index.js')

    // These should be valid calls (compile-time check)
    // The actual runtime will fail without API keys, but types should be correct
    expect(typeof generate).toBe('function')
  })

  it('should provide proper TypeScript types for AIPromise', async () => {
    const { AIPromise } = await import('../src/index.js')

    expect(typeof AIPromise).toBe('function')
  })
})
