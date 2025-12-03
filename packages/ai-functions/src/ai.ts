/**
 * AI() and ai() - Core AI function constructors
 *
 * These provide the main entry points for AI-powered functions,
 * with full RPC promise pipelining support via capnweb.
 */

import { RpcTarget } from 'capnweb'
import type { RpcPromise } from 'capnweb'
import { createRPCSession, type RPCSessionOptions } from './rpc/session.js'
import { generateObject } from './generate.js'
import type { SimpleSchema } from './schema.js'
import type { LanguageModel } from 'ai'
import type {
  AIClient,
  AIFunctionDefinition,
  AIGenerateOptions,
  AIGenerateResult,
  JSONSchema,
  ImageOptions,
  ImageResult,
  VideoOptions,
  VideoResult,
  WriteOptions
} from './types.js'

/**
 * Options for creating an AI RPC client instance
 */
export interface AIClientOptions extends RPCSessionOptions {
  /** Default model to use */
  model?: string
  /** Default temperature */
  temperature?: number
  /** Default max tokens */
  maxTokens?: number
  /** Custom functions available to the AI */
  functions?: AIFunctionDefinition[]
}

/**
 * Options for AI schema functions (subset of generateObject options)
 */
export interface AISchemaOptions {
  /** Model to use (string alias or LanguageModel) */
  model?: string | LanguageModel
  /** System prompt */
  system?: string
  /** Generation mode */
  mode?: 'auto' | 'json' | 'tool'
  /** Temperature (0-2) */
  temperature?: number
  /** Top P sampling */
  topP?: number
  /** Top K sampling */
  topK?: number
  /** Presence penalty */
  presencePenalty?: number
  /** Frequency penalty */
  frequencyPenalty?: number
  /** Max tokens to generate */
  maxTokens?: number
  /** Max retries on failure */
  maxRetries?: number
  /** Abort signal */
  abortSignal?: AbortSignal
  /** Custom headers */
  headers?: Record<string, string>
}

/**
 * Schema-based functions
 */
type SchemaFunctions<T extends Record<string, SimpleSchema>> = {
  [K in keyof T]: (prompt?: string, options?: AISchemaOptions) => Promise<InferSimpleSchemaResult<T[K]>>
}

/**
 * Create AI functions from schemas
 *
 * @example
 * ```ts
 * const ai = AI({
 *   storyBrand: {
 *     hero: 'Who is the customer?',
 *     problem: {
 *       internal: 'What internal problem do they face?',
 *       external: 'What external challenge exists?',
 *       philosophical: 'Why is this wrong?',
 *     },
 *     guide: 'Who helps them? (the brand)',
 *     plan: ['What are the steps to success?'],
 *     callToAction: 'What should they do?',
 *     success: 'What does success look like?',
 *     failure: 'What happens if they fail?',
 *   },
 *   recipe: {
 *     name: 'Recipe name',
 *     type: 'food | drink | dessert',
 *     servings: 'How many servings? (number)',
 *     ingredients: ['List all ingredients'],
 *     steps: ['Cooking steps in order'],
 *   },
 * })
 *
 * // Call the generated functions
 * const brand = await ai.storyBrand('Acme Corp sells widgets')
 * const dinner = await ai.recipe('Italian pasta for 4 people')
 * ```
 */
export function AI<T extends Record<string, SimpleSchema>>(
  schemas: T,
  defaultOptions?: AISchemaOptions
): SchemaFunctions<T>

/**
 * Create an AI RPC client instance
 *
 * @example
 * ```ts
 * // Connect to remote AI service
 * const ai = AI({ wsUrl: 'wss://ai.example.com/rpc' })
 *
 * // Use promise pipelining - single round trip!
 * const result = ai.generate({ prompt: 'Hello' })
 * const upper = result.text.map(t => t.toUpperCase())
 * console.log(await upper)
 *
 * // Dynamic function calling
 * const summary = await ai.summarize({ text: longText })
 * ```
 */
export function AI(options: AIClientOptions): AIClient & Record<string, (...args: unknown[]) => RpcPromise<unknown>>

export function AI<T extends Record<string, SimpleSchema>>(
  schemasOrOptions: T | AIClientOptions,
  defaultOptions?: AISchemaOptions
): SchemaFunctions<T> | (AIClient & Record<string, (...args: unknown[]) => RpcPromise<unknown>>) {
  // Check if this is RPC client mode
  if (isAIClientOptions(schemasOrOptions)) {
    const { model, temperature, maxTokens, functions, ...sessionOptions } = schemasOrOptions

    // Create RPC session to AI service
    const client = createRPCSession<AIClient>(sessionOptions)

    // Create a proxy that handles both defined methods and dynamic function calls
    return new Proxy(client, {
      get(target, prop: string) {
        // Return existing methods
        if (prop in target) {
          return (target as Record<string, unknown>)[prop]
        }

        // Handle dynamic function calls (ai.functionName())
        return (...args: unknown[]) => {
          return target.do(prop, args.length === 1 ? args[0] : args)
        }
      }
    }) as AIClient & Record<string, (...args: unknown[]) => RpcPromise<unknown>>
  }

  // Schema functions mode - create a function for each schema
  return createSchemaFunctions(schemasOrOptions as Record<string, SimpleSchema>, defaultOptions)
}

/**
 * Check if options are AI client options vs schemas
 */
function isAIClientOptions(value: unknown): value is AIClientOptions {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return 'wsUrl' in obj || 'httpUrl' in obj || 'functions' in obj
}

/**
 * Infer result type from simple schema
 */
type InferSimpleSchemaResult<T> = T extends string
  ? string
  : T extends [string]
  ? string[]
  : T extends { [K: string]: SimpleSchema }
  ? { [K in keyof T]: InferSimpleSchemaResult<T[K]> }
  : unknown

/**
 * Create schema-based functions from a map of schemas
 */
function createSchemaFunctions<T extends Record<string, SimpleSchema>>(
  schemas: T,
  defaultOptions: AISchemaOptions = {}
): SchemaFunctions<T> {
  const functions: Record<string, (prompt?: string, options?: AISchemaOptions) => Promise<unknown>> = {}

  for (const [name, schema] of Object.entries(schemas)) {
    functions[name] = async (prompt?: string, options?: AISchemaOptions) => {
      const mergedOptions = { ...defaultOptions, ...options }
      const { model = 'sonnet', system, ...rest } = mergedOptions

      // Build prompt from schema descriptions if none provided
      const schemaPrompt = prompt || buildPromptFromSchema(schema)

      const result = await generateObject({
        model,
        schema,
        prompt: schemaPrompt,
        system,
        ...rest,
      })

      return result.object
    }
  }

  return functions as SchemaFunctions<T>
}

/**
 * Build a prompt by extracting descriptions from the schema
 */
function buildPromptFromSchema(schema: SimpleSchema, path = ''): string {
  if (typeof schema === 'string') {
    return schema
  }

  if (Array.isArray(schema)) {
    return schema[0] as string || 'Generate items'
  }

  if (typeof schema === 'object' && schema !== null) {
    const descriptions: string[] = []
    for (const [key, value] of Object.entries(schema)) {
      const subPrompt = buildPromptFromSchema(value as SimpleSchema, path ? `${path}.${key}` : key)
      if (subPrompt) {
        descriptions.push(`${key}: ${subPrompt}`)
      }
    }
    return descriptions.length > 0 ? `Generate the following:\n${descriptions.join('\n')}` : ''
  }

  return ''
}

/**
 * Shorthand for creating an AI client with default options
 *
 * @example
 * ```ts
 * const result = await ai({ prompt: 'Explain quantum computing' })
 * ```
 */
export function ai(options: AIGenerateOptions): RpcPromise<AIGenerateResult>
export function ai(prompt: string): RpcPromise<AIGenerateResult>
export function ai(optionsOrPrompt: AIGenerateOptions | string): RpcPromise<AIGenerateResult> {
  // Get default AI client from environment or config
  const client = getDefaultAIClient()

  const options: AIGenerateOptions = typeof optionsOrPrompt === 'string'
    ? { prompt: optionsOrPrompt }
    : optionsOrPrompt

  return client.generate(options)
}

// Attach methods to ai function
ai.do = (action: string, context?: unknown) => getDefaultAIClient().do(action, context)
ai.is = (value: unknown, type: string | JSONSchema) => getDefaultAIClient().is(value, type)
ai.code = (prompt: string, language?: string) => getDefaultAIClient().code(prompt, language)
ai.decide = <T extends string>(options: T[], context?: string) => getDefaultAIClient().decide(options, context)
ai.diagram = (description: string, format?: 'mermaid' | 'svg' | 'ascii') => getDefaultAIClient().diagram(description, format)
ai.generate = (options: AIGenerateOptions) => getDefaultAIClient().generate(options)
ai.image = (prompt: string, options?: ImageOptions) => getDefaultAIClient().image(prompt, options)
ai.video = (prompt: string, options?: VideoOptions) => getDefaultAIClient().video(prompt, options)
ai.write = (prompt: string, options?: WriteOptions) => getDefaultAIClient().write(prompt, options)

/**
 * Define a function that can be called by AI
 */
ai.defineFunction = <TInput, TOutput>(
  definition: AIFunctionDefinition<TInput, TOutput>
): AIFunctionDefinition<TInput, TOutput> => {
  return definition
}

// Default client management
let defaultClient: AIClient | null = null

/**
 * Configure the default AI client
 */
export function configureAI(options: AIClientOptions): void {
  defaultClient = AI(options)
}

/**
 * Get the default AI client, throwing if not configured
 */
function getDefaultAIClient(): AIClient {
  if (!defaultClient) {
    // Try to auto-configure from environment
    const wsUrl = typeof process !== 'undefined' ? process.env?.AI_WS_URL : undefined
    const httpUrl = typeof process !== 'undefined' ? process.env?.AI_HTTP_URL : undefined

    if (wsUrl || httpUrl) {
      defaultClient = AI({ wsUrl, httpUrl })
    } else {
      throw new Error(
        'AI client not configured. Call configureAI() first or set AI_WS_URL/AI_HTTP_URL environment variables.'
      )
    }
  }
  return defaultClient
}

/**
 * Base class for implementing AI services
 *
 * Extend this class to create your own AI service implementation.
 *
 * @example
 * ```ts
 * class MyAIService extends AIServiceTarget {
 *   async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
 *     // Your implementation
 *   }
 * }
 * ```
 */
export abstract class AIServiceTarget extends RpcTarget implements AIClient {
  abstract generate(options: AIGenerateOptions): RpcPromise<AIGenerateResult>
  abstract do(action: string, context?: unknown): RpcPromise<unknown>
  abstract is(value: unknown, type: string | JSONSchema): RpcPromise<boolean>
  abstract code(prompt: string, language?: string): RpcPromise<string>
  abstract decide<T extends string>(options: T[], context?: string): RpcPromise<T>
  abstract diagram(description: string, format?: 'mermaid' | 'svg' | 'ascii'): RpcPromise<string>
  abstract image(prompt: string, options?: ImageOptions): RpcPromise<ImageResult>
  abstract video(prompt: string, options?: VideoOptions): RpcPromise<VideoResult>
  abstract write(prompt: string, options?: WriteOptions): RpcPromise<string>
}
