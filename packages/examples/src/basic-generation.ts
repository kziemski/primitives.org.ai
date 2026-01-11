/**
 * Basic Generation Examples
 *
 * Demonstrates the fundamental generation patterns:
 * - Text generation with generateText
 * - Structured object generation with generateObject
 * - List generation with the list primitive
 *
 * @packageDocumentation
 */

import {
  generateText,
  generateObject,
  type SimpleSchema,
} from 'ai-functions'

// ============================================================================
// Types
// ============================================================================

/**
 * Options for text generation
 */
export interface TextGenerationOptions {
  /** Model to use (e.g., 'sonnet', 'opus', 'gpt-4o') */
  model?: string
  /** System prompt to set context */
  system?: string
  /** Temperature for randomness (0-2) */
  temperature?: number
  /** Maximum tokens to generate */
  maxTokens?: number
}

/**
 * Options for object generation
 */
export interface ObjectGenerationOptions {
  /** Model to use */
  model?: string
  /** Schema defining the object structure */
  schema?: SimpleSchema
  /** System prompt */
  system?: string
  /** Temperature */
  temperature?: number
}

/**
 * Options for list generation
 */
export interface ListGenerationOptions {
  /** Model to use */
  model?: string
  /** Number of items to generate */
  count?: number
  /** System prompt */
  system?: string
}

// ============================================================================
// Text Generation
// ============================================================================

/**
 * Generate text content from a prompt
 *
 * This is the simplest form of AI generation - give it a prompt,
 * get back generated text.
 *
 * @example
 * ```ts
 * // Simple text generation
 * const explanation = await generateTextExample('Explain quantum computing in simple terms')
 * console.log(explanation)
 *
 * // With options
 * const poem = await generateTextExample('Write a haiku about programming', {
 *   model: 'opus',
 *   temperature: 0.8,
 * })
 * ```
 *
 * @param prompt - The prompt to generate text from
 * @param options - Generation options
 * @returns The generated text
 */
export async function generateTextExample(
  prompt: string,
  options: TextGenerationOptions = {}
): Promise<string> {
  const { model = 'sonnet', system, temperature, maxTokens } = options

  const result = await generateText({
    model,
    prompt,
    system,
    temperature,
    maxTokens,
  })

  return result.text
}

// ============================================================================
// Object Generation
// ============================================================================

/**
 * Generate a structured object with type-safe output
 *
 * Uses a schema to ensure the AI returns data in the expected format.
 * Supports both simplified schema syntax and Zod schemas.
 *
 * @example
 * ```ts
 * // Extract structured data
 * const user = await generateObjectExample<{name: string, age: number}>(
 *   'Extract user info: John Doe, 30 years old',
 *   { schema: { name: 'User name', age: 'User age as number' } }
 * )
 * console.log(user.name, user.age)
 *
 * // Generate structured content
 * const recipe = await generateObjectExample(
 *   'Create a simple pasta recipe',
 *   {
 *     schema: {
 *       title: 'Recipe title',
 *       ingredients: ['List of ingredients'],
 *       steps: ['Cooking steps'],
 *       prepTime: 'Preparation time in minutes',
 *     }
 *   }
 * )
 * ```
 *
 * @param prompt - The prompt describing what to generate
 * @param options - Generation options including schema
 * @returns The generated object matching the schema type
 */
export async function generateObjectExample<T = Record<string, unknown>>(
  prompt: string,
  options: ObjectGenerationOptions = {}
): Promise<T> {
  const {
    model = 'sonnet',
    schema = { result: 'The generated result' },
    system,
    temperature,
  } = options

  const result = await generateObject({
    model,
    schema,
    prompt,
    system,
    temperature,
  })

  return result.object as T
}

// ============================================================================
// List Generation
// ============================================================================

/**
 * Generate a list of items
 *
 * Perfect for brainstorming, generating ideas, or extracting
 * multiple items from content.
 *
 * @example
 * ```ts
 * // Generate ideas
 * const ideas = await generateListExample('5 startup ideas in the AI space')
 * console.log(ideas) // ['Idea 1', 'Idea 2', ...]
 *
 * // With count limit
 * const languages = await generateListExample(
 *   'popular programming languages',
 *   { count: 3 }
 * )
 * ```
 *
 * @param prompt - What kind of list to generate
 * @param options - Generation options
 * @returns Array of generated items
 */
export async function generateListExample(
  prompt: string,
  options: ListGenerationOptions = {}
): Promise<string[]> {
  const { model = 'sonnet', count, system } = options

  const effectivePrompt = count
    ? `Generate exactly ${count} items: ${prompt}`
    : prompt

  const result = await generateObject({
    model,
    schema: { items: ['List items'] },
    prompt: effectivePrompt,
    system: system || 'Generate a list of items. Be concise and specific.',
  })

  const items = (result.object as { items: string[] }).items

  // Respect count limit if specified
  return count ? items.slice(0, count) : items
}
