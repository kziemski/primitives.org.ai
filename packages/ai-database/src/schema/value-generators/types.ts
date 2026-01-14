/**
 * ValueGenerator Type Definitions
 *
 * Defines the interface for value generation strategies used during
 * entity creation. Supports both placeholder (deterministic test fixtures)
 * and AI-powered (production) generation.
 *
 * @packageDocumentation
 */

import type { Entity } from '../generation-context.js'

// =============================================================================
// Generation Request
// =============================================================================

/**
 * Context about the array field being generated
 */
export interface ArrayContext {
  /** The name of the array field */
  fieldName: string
  /** Previously generated items in this array */
  previousItems: Entity[]
  /** Current index being generated */
  index: number
}

/**
 * Extended generation context from GenerationContext
 */
export interface GenerationContextData {
  /** Chain of parent entities leading to this entity */
  parentChain?: Entity[]
  /** All entities previously generated in this session */
  previouslyGenerated?: Entity[]
  /** Context for array field generation */
  arrayContext?: ArrayContext
}

/**
 * Request for generating a field value
 */
export interface GenerationRequest {
  /** Name of the field being generated */
  fieldName: string
  /** Entity type name */
  type: string
  /** Combined context string (instructions, parent data, etc.) */
  fullContext?: string
  /** Optional hint for guiding generation (e.g., prompt field type) */
  hint?: string
  /** Data from parent entity for context inheritance */
  parentData?: Record<string, unknown>
  /** Extended generation context with parent chain and array info */
  generationContext?: GenerationContextData
}

// =============================================================================
// Generation Result
// =============================================================================

/**
 * Metadata about how the value was generated
 */
export interface GenerationMetadata {
  /** Source of the generated value */
  source: 'placeholder' | 'ai' | 'test'
  /** Model used for AI generation */
  model?: string
  /** Token count for AI generation */
  tokens?: number
  /** Whether the result was cached */
  cached?: boolean
  /** Whether this was a fallback from AI to placeholder */
  fallback?: boolean
}

/**
 * Result of value generation
 */
export interface GenerationResult {
  /** The generated value */
  value: string
  /** Optional metadata about generation */
  metadata?: GenerationMetadata
}

// =============================================================================
// ValueGenerator Interface
// =============================================================================

/**
 * Interface for value generation strategies
 *
 * Implementations provide different generation approaches:
 * - PlaceholderValueGenerator: Deterministic values for testing
 * - AIValueGenerator: AI-powered contextual generation
 */
export interface ValueGenerator {
  /**
   * Generate a value for a field
   *
   * @param request - The generation request with field info and context
   * @returns Promise resolving to the generated value and metadata
   */
  generate(request: GenerationRequest): Promise<GenerationResult>
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * AI function signature for value generation
 */
export type AIFunction = (prompt: string) => Promise<{
  text: string
  usage?: { tokens: number }
}>

/**
 * Configuration for creating a ValueGenerator
 */
export interface ValueGeneratorConfig {
  /** Type of generator to create */
  type?: 'placeholder' | 'ai'
  /** AI function for AI generator (required when type is 'ai') */
  aiFunction?: AIFunction
  /** Model to use for AI generation */
  model?: string
  /** Maximum tokens for AI generation */
  maxTokens?: number
  /** Temperature for AI generation */
  temperature?: number
  /** Whether to fall back to placeholder on AI errors */
  fallbackToPlaceholder?: boolean
}
