/**
 * Execution Context for AI Core
 *
 * Provides configuration without polluting function signatures.
 * Settings flow from environment -> global context -> local context.
 *
 * Note: This is the core context module. For batch mode and budget tracking,
 * use the full context from ai-functions package.
 *
 * @example
 * ```ts
 * // Set global defaults (from environment or initialization)
 * configure({
 *   model: 'claude-sonnet-4-20250514',
 * })
 *
 * // Or use execution context for specific operations
 * await withContext({ model: 'gpt-4o' }, async () => {
 *   const titles = await list`10 blog titles`
 *   return titles
 * })
 * ```
 *
 * @packageDocumentation
 */

import type { FunctionOptions } from './template.js'

// ============================================================================
// Types
// ============================================================================

/** Core execution context configuration */
export interface ExecutionContext extends FunctionOptions {
  /** Provider to use (for model resolution) */
  provider?: string
}

// ============================================================================
// Global Context
// ============================================================================

let globalContext: ExecutionContext = {}

/**
 * Configure global defaults for AI functions
 *
 * @example
 * ```ts
 * configure({
 *   model: 'claude-sonnet-4-20250514',
 * })
 * ```
 */
export function configure(context: ExecutionContext): void {
  globalContext = { ...globalContext, ...context }
}

/**
 * Get the current global context
 */
export function getGlobalContext(): ExecutionContext {
  return { ...globalContext }
}

/**
 * Reset global context to defaults
 */
export function resetContext(): void {
  globalContext = {}
}

// ============================================================================
// Async Local Storage for Execution Context
// ============================================================================

// Use AsyncLocalStorage if available (Node.js), otherwise fallback to global
let asyncLocalStorage: {
  getStore: () => ExecutionContext | undefined
  run: <T>(store: ExecutionContext, callback: () => T) => T
} | null = null

// Lazy initialization of AsyncLocalStorage
let asyncLocalStorageInitialized = false

// Initialize synchronously if possible (for Node.js environments)
if (typeof process !== 'undefined' && process.versions?.node) {
  import('async_hooks')
    .then(({ AsyncLocalStorage }) => {
      asyncLocalStorage = new AsyncLocalStorage<ExecutionContext>()
      asyncLocalStorageInitialized = true
    })
    .catch(() => {
      asyncLocalStorageInitialized = true
    })
}

/**
 * Get the current execution context
 * Merges: environment defaults -> global context -> local context
 */
export function getContext(): ExecutionContext {
  const envContext = getEnvContext()
  const localContext = asyncLocalStorage?.getStore()

  return {
    ...envContext,
    ...globalContext,
    ...localContext,
  }
}

/**
 * Run a function with a specific execution context
 *
 * @example
 * ```ts
 * const posts = await withContext({ model: 'gpt-4o' }, async () => {
 *   const titles = await list`10 blog titles`
 *   return titles.map(title => write`blog post: ${title}`)
 * })
 * ```
 */
export function withContext<T>(
  context: ExecutionContext,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const mergedContext = { ...getContext(), ...context }

  if (asyncLocalStorage) {
    return asyncLocalStorage.run(mergedContext, fn)
  }

  // Fallback: temporarily modify global context
  const previousContext = globalContext
  globalContext = mergedContext
  try {
    return fn()
  } finally {
    globalContext = previousContext
  }
}

// ============================================================================
// Environment Defaults
// ============================================================================

function getEnvContext(): ExecutionContext {
  if (typeof process === 'undefined') return {}

  const context: ExecutionContext = {}

  // Model defaults
  if (process.env.AI_MODEL) {
    context.model = process.env.AI_MODEL
  }

  // Provider defaults
  if (process.env.AI_PROVIDER) {
    context.provider = process.env.AI_PROVIDER
  } else if (process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    context.provider = 'anthropic'
  } else if (process.env.OPENAI_API_KEY) {
    context.provider = 'openai'
  } else if (process.env.CLOUDFLARE_API_TOKEN) {
    context.provider = 'cloudflare'
  } else if (process.env.AWS_ACCESS_KEY_ID) {
    context.provider = 'bedrock'
  }

  return context
}

// ============================================================================
// Context Helpers
// ============================================================================

/**
 * Get the effective model from context
 */
export function getModel(): string {
  const ctx = getContext()
  return ctx.model || 'sonnet'
}

/**
 * Get the effective provider from context
 */
export function getProvider(): string {
  const ctx = getContext()
  return ctx.provider || 'openai'
}
