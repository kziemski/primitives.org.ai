/**
 * Tests for ValueGenerator Strategy Interface
 *
 * The ValueGenerator interface separates placeholder generation (test fixtures)
 * from production code (AI generation). This enables:
 * - Deterministic test values via PlaceholderValueGenerator
 * - AI-powered generation via AIValueGenerator in production
 * - Injectable generators via configuration
 * - Context propagation through the generation pipeline
 *
 * These tests define the contract for the ValueGenerator interface.
 * They will fail until the implementation is created in:
 * src/schema/value-generators/index.ts
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { GenerationContext, Entity } from '../src/schema/generation-context.js'

// Import from non-existent module - tests will fail until implementation exists
import {
  type ValueGenerator,
  type ValueGeneratorConfig,
  type GenerationRequest,
  type GenerationResult,
  PlaceholderValueGenerator,
  AIValueGenerator,
  createValueGenerator,
  configureValueGenerator,
  getValueGenerator,
} from '../src/schema/value-generators/index.js'

// =============================================================================
// Test Fixtures
// =============================================================================

const sampleParentData: Record<string, unknown> = {
  name: 'TechCorp',
  industry: 'Technology',
}

const sampleGenerationRequest: GenerationRequest = {
  fieldName: 'description',
  type: 'Product',
  fullContext: 'luxury premium tech startup',
  hint: 'A high-end product',
  parentData: sampleParentData,
}

// =============================================================================
// ValueGenerator Interface Contract Tests
// =============================================================================

describe('ValueGenerator Interface', () => {
  describe('Interface Contract', () => {
    it('should define generate() method that returns a string', async () => {
      const generator: ValueGenerator = {
        generate: async (request: GenerationRequest): Promise<GenerationResult> => {
          return {
            value: 'test value',
            metadata: { source: 'test' },
          }
        },
      }

      const result = await generator.generate(sampleGenerationRequest)
      expect(result).toHaveProperty('value')
      expect(typeof result.value).toBe('string')
    })

    it('should accept GenerationRequest with required fields', async () => {
      const generator: ValueGenerator = {
        generate: async (request: GenerationRequest): Promise<GenerationResult> => {
          // Verify required fields are present
          expect(request).toHaveProperty('fieldName')
          expect(request).toHaveProperty('type')
          expect(typeof request.fieldName).toBe('string')
          expect(typeof request.type).toBe('string')

          return { value: 'test' }
        },
      }

      await generator.generate({
        fieldName: 'name',
        type: 'Person',
      })
    })

    it('should accept optional context fields in GenerationRequest', async () => {
      const generator: ValueGenerator = {
        generate: async (request: GenerationRequest): Promise<GenerationResult> => {
          // Optional fields may or may not be present
          expect(request.fullContext).toBe('tech startup')
          expect(request.hint).toBe('experienced founder')
          expect(request.parentData).toEqual({ company: 'Acme' })

          return { value: 'generated' }
        },
      }

      await generator.generate({
        fieldName: 'background',
        type: 'Founder',
        fullContext: 'tech startup',
        hint: 'experienced founder',
        parentData: { company: 'Acme' },
      })
    })

    it('should return GenerationResult with optional metadata', async () => {
      const generator: ValueGenerator = {
        generate: async (): Promise<GenerationResult> => {
          return {
            value: 'Generated description',
            metadata: {
              source: 'ai',
              model: 'claude-3',
              tokens: 150,
              cached: false,
            },
          }
        },
      }

      const result = await generator.generate(sampleGenerationRequest)
      expect(result.value).toBe('Generated description')
      expect(result.metadata).toBeDefined()
      expect(result.metadata?.source).toBe('ai')
    })

    it('should support async generation', async () => {
      const generator: ValueGenerator = {
        generate: async (request: GenerationRequest): Promise<GenerationResult> => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10))
          return { value: `Async generated ${request.fieldName}` }
        },
      }

      const result = await generator.generate(sampleGenerationRequest)
      expect(result.value).toBe('Async generated description')
    })
  })

  describe('GenerationRequest structure', () => {
    it('should support context from GenerationContext', async () => {
      // GenerationRequest should be able to include context from GenerationContext
      const request: GenerationRequest = {
        fieldName: 'summary',
        type: 'Report',
        fullContext: 'quarterly financial report',
        generationContext: {
          parentChain: [
            { $id: 'company-1', $type: 'Company', name: 'Acme' },
            { $id: 'dept-1', $type: 'Department', name: 'Finance' },
          ],
          previouslyGenerated: [{ $id: 'report-1', $type: 'Report', title: 'Q1 Report' }],
          arrayContext: {
            fieldName: 'reports',
            previousItems: [],
            index: 0,
          },
        },
      }

      expect(request.generationContext).toBeDefined()
      expect(request.generationContext?.parentChain).toHaveLength(2)
    })
  })
})

// =============================================================================
// PlaceholderValueGenerator Tests
// =============================================================================

describe('PlaceholderValueGenerator', () => {
  let generator: PlaceholderValueGenerator

  beforeEach(() => {
    generator = new PlaceholderValueGenerator()
  })

  describe('Deterministic values', () => {
    it('should return deterministic values for the same input', async () => {
      const request: GenerationRequest = {
        fieldName: 'name',
        type: 'Person',
        fullContext: 'tech entrepreneur startup',
      }

      const result1 = await generator.generate(request)
      const result2 = await generator.generate(request)

      expect(result1.value).toBe(result2.value)
    })

    it('should return "Aristotle" for philosopher context', async () => {
      const result = await generator.generate({
        fieldName: 'name',
        type: 'Person',
        hint: 'philosopher',
      })

      expect(result.value).toBe('Aristotle')
    })

    it('should return "Alex Chen" for tech entrepreneur context', async () => {
      const result = await generator.generate({
        fieldName: 'name',
        type: 'Person',
        hint: 'tech entrepreneur',
      })

      expect(result.value).toBe('Alex Chen')
    })

    it('should return context-aware style values', async () => {
      const horrorResult = await generator.generate({
        fieldName: 'style',
        type: 'Film',
        fullContext: 'horror dark atmospheric',
      })
      expect(horrorResult.value).toContain('horror')

      const sciFiResult = await generator.generate({
        fieldName: 'style',
        type: 'Film',
        fullContext: 'sci-fi futuristic',
      })
      expect(sciFiResult.value).toContain('sci-fi')
    })

    it('should return context-aware background values', async () => {
      const result = await generator.generate({
        fieldName: 'background',
        type: 'Person',
        hint: 'tech entrepreneur startup',
      })

      expect(result.value).toContain('startup')
    })

    it('should return context-aware specialty values', async () => {
      const result = await generator.generate({
        fieldName: 'specialty',
        type: 'Chef',
        fullContext: 'french restaurant',
      })

      expect(result.value).toContain('French')
    })

    it('should return context-aware description values', async () => {
      const luxuryResult = await generator.generate({
        fieldName: 'description',
        type: 'Product',
        fullContext: 'luxury premium high-end',
      })
      expect(luxuryResult.value).toContain('luxury')

      const cyberpunkResult = await generator.generate({
        fieldName: 'description',
        type: 'Character',
        fullContext: 'cyberpunk neon futuristic',
      })
      expect(cyberpunkResult.value).toContain('Cyberpunk')
    })

    it('should return enum values for severity field', async () => {
      const result = await generator.generate({
        fieldName: 'severity',
        type: 'Bug',
        hint: 'low/medium/high',
        fullContext: 'critical urgent issue',
      })

      expect(['low', 'medium', 'high']).toContain(result.value)
    })

    it('should return enum values for effort field', async () => {
      const result = await generator.generate({
        fieldName: 'effort',
        type: 'Task',
        hint: 'easy/medium/hard',
        fullContext: 'simple quick task',
      })

      expect(['easy', 'medium', 'hard']).toContain(result.value)
    })

    it('should return enum values for level field', async () => {
      const result = await generator.generate({
        fieldName: 'level',
        type: 'Course',
        hint: 'beginner/intermediate/expert',
        fullContext: 'beginner basic introduction',
      })

      expect(['beginner', 'intermediate', 'expert']).toContain(result.value)
    })
  })

  describe('Fallback behavior', () => {
    it('should return formatted fallback for unknown field/context combinations', async () => {
      const result = await generator.generate({
        fieldName: 'unknownField',
        type: 'UnknownType',
        fullContext: 'random context',
      })

      expect(result.value).toContain('unknownField')
    })

    it('should return static placeholder when no context provided', async () => {
      const result = await generator.generate({
        fieldName: 'name',
        type: 'Person',
      })

      expect(result.value).toContain('Generated')
    })
  })

  describe('Parent data propagation', () => {
    it('should copy value from parent if parent has same field', async () => {
      const result = await generator.generate({
        fieldName: 'name',
        type: 'Company',
        fullContext: 'competitor analysis',
        parentData: { name: 'ParentCompanyName' },
      })

      expect(result.value).toBe('ParentCompanyName')
    })
  })

  describe('Metadata', () => {
    it('should include source: "placeholder" in metadata', async () => {
      const result = await generator.generate(sampleGenerationRequest)

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.source).toBe('placeholder')
    })
  })
})

// =============================================================================
// AIValueGenerator Tests
// =============================================================================

describe('AIValueGenerator', () => {
  let generator: AIValueGenerator
  let mockAIFunction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockAIFunction = vi.fn().mockResolvedValue({
      text: 'AI generated description for luxury product',
      usage: { tokens: 100 },
    })

    generator = new AIValueGenerator({
      aiFunction: mockAIFunction,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('AI function integration', () => {
    it('should call the configured AI function', async () => {
      await generator.generate(sampleGenerationRequest)

      expect(mockAIFunction).toHaveBeenCalled()
    })

    it('should pass field context to AI function', async () => {
      await generator.generate({
        fieldName: 'description',
        type: 'Product',
        fullContext: 'luxury premium',
        hint: 'elegant design',
      })

      const callArgs = mockAIFunction.mock.calls[0][0]
      expect(callArgs).toContain('description')
      expect(callArgs).toContain('Product')
    })

    it('should return AI-generated value', async () => {
      const result = await generator.generate(sampleGenerationRequest)

      expect(result.value).toBe('AI generated description for luxury product')
    })

    it('should include AI metadata in result', async () => {
      const result = await generator.generate(sampleGenerationRequest)

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.source).toBe('ai')
      expect(result.metadata?.tokens).toBe(100)
    })
  })

  describe('Error handling', () => {
    it('should handle AI function errors gracefully', async () => {
      mockAIFunction.mockRejectedValue(new Error('AI service unavailable'))

      await expect(generator.generate(sampleGenerationRequest)).rejects.toThrow(
        'AI service unavailable'
      )
    })

    it('should support fallback to placeholder on error', async () => {
      mockAIFunction.mockRejectedValue(new Error('Rate limited'))

      const generatorWithFallback = new AIValueGenerator({
        aiFunction: mockAIFunction,
        fallbackToPlaceholder: true,
      })

      const result = await generatorWithFallback.generate(sampleGenerationRequest)

      expect(result.value).toBeDefined()
      expect(result.metadata?.source).toBe('placeholder')
      expect(result.metadata?.fallback).toBe(true)
    })
  })

  describe('Context building', () => {
    it('should build context string from GenerationContext', async () => {
      await generator.generate({
        fieldName: 'summary',
        type: 'Report',
        fullContext: 'quarterly report',
        generationContext: {
          parentChain: [{ $id: 'company-1', $type: 'Company', name: 'Acme Corp' }],
          previouslyGenerated: [{ $id: 'report-1', $type: 'Report', title: 'Q1' }],
        },
      })

      const callArgs = mockAIFunction.mock.calls[0][0]
      expect(callArgs).toContain('Acme Corp')
    })

    it('should include array context for array field generation', async () => {
      await generator.generate({
        fieldName: 'items',
        type: 'ListItem',
        fullContext: 'shopping list',
        generationContext: {
          arrayContext: {
            fieldName: 'items',
            previousItems: [
              { $id: 'item-1', $type: 'ListItem', name: 'Milk' },
              { $id: 'item-2', $type: 'ListItem', name: 'Bread' },
            ],
            index: 2,
          },
        },
      })

      const callArgs = mockAIFunction.mock.calls[0][0]
      expect(callArgs).toContain('Milk')
      expect(callArgs).toContain('Bread')
    })
  })

  describe('Model configuration', () => {
    it('should accept model configuration', () => {
      const configuredGenerator = new AIValueGenerator({
        aiFunction: mockAIFunction,
        model: 'claude-3-opus',
        maxTokens: 500,
        temperature: 0.7,
      })

      expect(configuredGenerator).toBeDefined()
    })
  })
})

// =============================================================================
// Generator Factory and Configuration Tests
// =============================================================================

describe('Generator Factory', () => {
  describe('createValueGenerator', () => {
    it('should create PlaceholderValueGenerator by default', () => {
      const generator = createValueGenerator()

      expect(generator).toBeInstanceOf(PlaceholderValueGenerator)
    })

    it('should create PlaceholderValueGenerator when type is "placeholder"', () => {
      const generator = createValueGenerator({ type: 'placeholder' })

      expect(generator).toBeInstanceOf(PlaceholderValueGenerator)
    })

    it('should create AIValueGenerator when type is "ai"', () => {
      const mockAIFn = vi.fn()
      const generator = createValueGenerator({
        type: 'ai',
        aiFunction: mockAIFn,
      })

      expect(generator).toBeInstanceOf(AIValueGenerator)
    })

    it('should throw error when AI type specified without aiFunction', () => {
      expect(() => createValueGenerator({ type: 'ai' })).toThrow(/aiFunction.*required/i)
    })
  })

  describe('Global configuration', () => {
    afterEach(() => {
      // Reset to default after each test
      configureValueGenerator({ type: 'placeholder' })
    })

    it('should configure global default generator', () => {
      configureValueGenerator({ type: 'placeholder' })

      const generator = getValueGenerator()
      expect(generator).toBeInstanceOf(PlaceholderValueGenerator)
    })

    it('should allow switching between placeholder and AI globally', () => {
      const mockAIFn = vi.fn()

      configureValueGenerator({
        type: 'ai',
        aiFunction: mockAIFn,
      })

      const generator = getValueGenerator()
      expect(generator).toBeInstanceOf(AIValueGenerator)
    })

    it('should return the same instance on repeated calls', () => {
      const generator1 = getValueGenerator()
      const generator2 = getValueGenerator()

      expect(generator1).toBe(generator2)
    })

    it('should create new instance after reconfiguration', () => {
      const generator1 = getValueGenerator()

      configureValueGenerator({ type: 'placeholder' })

      const generator2 = getValueGenerator()
      expect(generator1).not.toBe(generator2)
    })
  })
})

// =============================================================================
// Context Propagation Tests
// =============================================================================

describe('Context Propagation', () => {
  let generator: PlaceholderValueGenerator

  beforeEach(() => {
    generator = new PlaceholderValueGenerator()
  })

  describe('Through generation pipeline', () => {
    it('should propagate parent entity context', async () => {
      const request: GenerationRequest = {
        fieldName: 'role',
        type: 'Employee',
        fullContext: 'software company',
        generationContext: {
          parentChain: [
            { $id: 'company-1', $type: 'Company', name: 'TechCorp', industry: 'Technology' },
            { $id: 'dept-1', $type: 'Department', name: 'Engineering', budget: 1000000 },
          ],
        },
      }

      const result = await generator.generate(request)

      // Value should be influenced by parent context
      expect(result.value).toBeDefined()
    })

    it('should propagate previouslyGenerated entities', async () => {
      const request: GenerationRequest = {
        fieldName: 'name',
        type: 'Employee',
        fullContext: 'tech team',
        generationContext: {
          previouslyGenerated: [
            { $id: 'emp-1', $type: 'Employee', name: 'Alice' },
            { $id: 'emp-2', $type: 'Employee', name: 'Bob' },
          ],
        },
      }

      const result = await generator.generate(request)

      // Generator has access to what was previously generated
      expect(result.value).toBeDefined()
    })

    it('should propagate array generation context', async () => {
      const request: GenerationRequest = {
        fieldName: 'tag',
        type: 'Tag',
        fullContext: 'blog post tags',
        generationContext: {
          arrayContext: {
            fieldName: 'tags',
            previousItems: [
              { $id: 'tag-1', $type: 'Tag', name: 'javascript' },
              { $id: 'tag-2', $type: 'Tag', name: 'typescript' },
            ],
            index: 2,
          },
        },
      }

      const result = await generator.generate(request)

      // Generator knows this is the 3rd item in an array
      expect(result.value).toBeDefined()
    })
  })

  describe('Context merging', () => {
    it('should merge hint with fullContext', async () => {
      const request: GenerationRequest = {
        fieldName: 'expertise',
        type: 'Researcher',
        fullContext: 'academic institution',
        hint: 'machine learning medical applications',
      }

      const result = await generator.generate(request)

      // Both context and hint should influence the result
      expect(result.value.toLowerCase()).toMatch(/machine learning|medical/i)
    })

    it('should prioritize hint over fullContext when conflicting', async () => {
      const result = await generator.generate({
        fieldName: 'specialty',
        type: 'Chef',
        fullContext: 'italian restaurant',
        hint: 'security authentication systems',
      })

      // Hint takes priority
      expect(result.value.toLowerCase()).toContain('security')
    })
  })
})

// =============================================================================
// Integration with GenerationContext Tests
// =============================================================================

describe('Integration with GenerationContext', () => {
  it('should work with GenerationContext instance', async () => {
    // This test verifies the generator can work with the existing GenerationContext class
    const { createGenerationContext } = await import('../src/schema/generation-context.js')

    const ctx = createGenerationContext()
    ctx.pushParent({ $id: 'company-1', $type: 'Company', name: 'Acme' })
    ctx.addGenerated({ $id: 'emp-1', $type: 'Employee', name: 'Alice' })

    const generator = new PlaceholderValueGenerator()

    const request: GenerationRequest = {
      fieldName: 'name',
      type: 'Employee',
      fullContext: 'new hire',
      generationContext: {
        parentChain: ctx.getParentChain(),
        previouslyGenerated: ctx.getAllGenerated(),
      },
    }

    const result = await generator.generate(request)
    expect(result.value).toBeDefined()
  })

  it('should support array context from GenerationContext', async () => {
    const { createGenerationContext } = await import('../src/schema/generation-context.js')

    const ctx = createGenerationContext()
    ctx.startArrayGeneration('tasks')
    ctx.addArrayItem('tasks', { $id: 'task-1', $type: 'Task', name: 'Task 1' })
    ctx.addArrayItem('tasks', { $id: 'task-2', $type: 'Task', name: 'Task 2' })

    const generator = new PlaceholderValueGenerator()

    const request: GenerationRequest = {
      fieldName: 'name',
      type: 'Task',
      fullContext: 'project tasks',
      generationContext: {
        arrayContext: {
          fieldName: 'tasks',
          previousItems: ctx.getPreviousInArray('tasks'),
          index: 2,
        },
      },
    }

    const result = await generator.generate(request)
    expect(result.value).toBeDefined()
  })
})

// =============================================================================
// Type Definitions (for documentation)
// =============================================================================

/**
 * Expected interface definitions in src/schema/value-generators/types.ts:
 *
 * ```typescript
 * export interface GenerationRequest {
 *   fieldName: string
 *   type: string
 *   fullContext?: string
 *   hint?: string
 *   parentData?: Record<string, unknown>
 *   generationContext?: {
 *     parentChain?: Entity[]
 *     previouslyGenerated?: Entity[]
 *     arrayContext?: {
 *       fieldName: string
 *       previousItems: Entity[]
 *       index: number
 *     }
 *   }
 * }
 *
 * export interface GenerationResult {
 *   value: string
 *   metadata?: {
 *     source: 'placeholder' | 'ai'
 *     model?: string
 *     tokens?: number
 *     cached?: boolean
 *     fallback?: boolean
 *   }
 * }
 *
 * export interface ValueGenerator {
 *   generate(request: GenerationRequest): Promise<GenerationResult>
 * }
 *
 * export interface ValueGeneratorConfig {
 *   type: 'placeholder' | 'ai'
 *   aiFunction?: (prompt: string) => Promise<{ text: string; usage?: { tokens: number } }>
 *   model?: string
 *   maxTokens?: number
 *   temperature?: number
 *   fallbackToPlaceholder?: boolean
 * }
 * ```
 */
