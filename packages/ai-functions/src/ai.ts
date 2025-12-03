/**
 * AI() and ai() - Core AI function constructors
 *
 * These provide the main entry points for AI-powered functions,
 * with full RPC promise pipelining support via capnweb.
 */

import { RpcTarget } from 'capnweb'
import type { RpcPromise } from 'capnweb'
import { createRPCSession, type RPCSessionOptions } from './rpc/session.js'
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
 * Options for creating an AI instance
 */
export interface AIOptions extends RPCSessionOptions {
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
 * Create an AI client instance
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
export function AI(options: AIOptions): AIClient & Record<string, (...args: unknown[]) => RpcPromise<unknown>> {
  const { model, temperature, maxTokens, functions, ...sessionOptions } = options

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
export function configureAI(options: AIOptions): void {
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
