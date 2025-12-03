/**
 * Core types for AI functions
 */

import type { RpcPromise } from 'capnweb'

/**
 * A function definition that can be called by AI
 */
export interface AIFunctionDefinition<
  TInput = unknown,
  TOutput = unknown
> {
  /** Unique name for the function */
  name: string
  /** Human-readable description for the AI */
  description: string
  /** JSON Schema for the input parameters */
  parameters: JSONSchema
  /** The implementation */
  handler: (input: TInput) => TOutput | Promise<TOutput>
}

/**
 * JSON Schema type (simplified)
 */
export interface JSONSchema {
  type?: string
  properties?: Record<string, JSONSchema>
  items?: JSONSchema
  required?: string[]
  description?: string
  enum?: unknown[]
  default?: unknown
  [key: string]: unknown
}

/**
 * Options for AI generation
 */
export interface AIGenerateOptions {
  /** The prompt or input */
  prompt?: string
  /** System message */
  system?: string
  /** Model to use */
  model?: string
  /** Temperature (0-1) */
  temperature?: number
  /** Maximum tokens to generate */
  maxTokens?: number
  /** Stop sequences */
  stop?: string[]
  /** Structured output schema */
  schema?: JSONSchema
  /** Available functions */
  functions?: AIFunctionDefinition[]
}

/**
 * Result of AI generation
 */
export interface AIGenerateResult {
  /** Generated text */
  text: string
  /** Structured output (if schema was provided) */
  object?: unknown
  /** Function calls (if functions were provided) */
  functionCalls?: AIFunctionCall[]
  /** Token usage */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * A function call made by the AI
 */
export interface AIFunctionCall {
  /** Name of the function to call */
  name: string
  /** Arguments as JSON */
  arguments: unknown
}

/**
 * AI client interface - all methods return RpcPromise for pipelining
 */
export interface AIClient {
  /** Generate text or structured output */
  generate(options: AIGenerateOptions): RpcPromise<AIGenerateResult>

  /** Execute an action */
  do(action: string, context?: unknown): RpcPromise<unknown>

  /** Type checking / validation */
  is(value: unknown, type: string | JSONSchema): RpcPromise<boolean>

  /** Generate code */
  code(prompt: string, language?: string): RpcPromise<string>

  /** Make a decision */
  decide<T extends string>(options: T[], context?: string): RpcPromise<T>

  /** Generate a diagram */
  diagram(description: string, format?: 'mermaid' | 'svg' | 'ascii'): RpcPromise<string>

  /** Generate an image */
  image(prompt: string, options?: ImageOptions): RpcPromise<ImageResult>

  /** Generate a video */
  video(prompt: string, options?: VideoOptions): RpcPromise<VideoResult>

  /** Write/generate text content */
  write(prompt: string, options?: WriteOptions): RpcPromise<string>
}

export interface ImageOptions {
  width?: number
  height?: number
  style?: string
  model?: string
}

export interface ImageResult {
  url: string
  base64?: string
  width: number
  height: number
}

export interface VideoOptions {
  duration?: number
  width?: number
  height?: number
  fps?: number
  model?: string
}

export interface VideoResult {
  url: string
  duration: number
  width: number
  height: number
}

export interface WriteOptions {
  tone?: string
  length?: 'short' | 'medium' | 'long'
  format?: 'text' | 'markdown' | 'html'
}
