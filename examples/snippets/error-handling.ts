/**
 * Error Handling Examples
 *
 * Demonstrates robust error handling patterns:
 * - Retry with exponential backoff
 * - Fallback chains across multiple models
 * - Circuit breaker for fail-fast behavior
 *
 * @packageDocumentation
 */

import {
  generateText,
  RetryPolicy,
  FallbackChain,
  CircuitBreaker,
  type RetryOptions,
  type CircuitBreakerOptions,
} from 'ai-functions'

// Import model resolution for fallback
import { model } from 'ai-providers'

// ============================================================================
// Types
// ============================================================================

/**
 * Options for retry example
 */
export interface RetryExampleOptions extends RetryOptions {
  /** Model to use */
  model?: string
}

/**
 * Options for circuit breaker example
 */
export interface CircuitBreakerExampleOptions extends CircuitBreakerOptions {
  /** Whether to return circuit state info */
  returnState?: boolean
}

/**
 * Result with circuit state
 */
export interface CircuitBreakerResult {
  result: string
  circuitState: 'closed' | 'open' | 'half-open'
}

// ============================================================================
// Retry with Exponential Backoff
// ============================================================================

/**
 * Retry operations with exponential backoff
 *
 * When AI API calls fail due to transient errors (rate limits, network issues),
 * automatic retry with exponential backoff helps ensure eventual success.
 *
 * @example
 * ```ts
 * // Basic retry
 * const result = await retryExample('Summarize this article: ...')
 *
 * // Custom retry configuration
 * const result = await retryExample('Generate code', {
 *   maxRetries: 5,
 *   baseDelay: 500,  // Start with 500ms
 *   maxDelay: 30000, // Cap at 30 seconds
 * })
 * ```
 *
 * How exponential backoff works:
 * - 1st retry: wait baseDelay (e.g., 1s)
 * - 2nd retry: wait baseDelay * 2 (e.g., 2s)
 * - 3rd retry: wait baseDelay * 4 (e.g., 4s)
 * - And so on, up to maxDelay
 *
 * @param prompt - The prompt to send
 * @param options - Retry configuration
 * @returns Generated text
 */
export async function retryExample(
  prompt: string,
  options: RetryExampleOptions = {}
): Promise<string> {
  const {
    model: modelName = 'sonnet',
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitter = 0.2,
  } = options

  const policy = new RetryPolicy({
    maxRetries,
    baseDelay,
    maxDelay,
    jitter,
  })

  return policy.execute(async () => {
    const result = await generateText({
      model: modelName,
      prompt,
    })
    return result.text
  })
}

// ============================================================================
// Fallback Chain
// ============================================================================

/**
 * Fall back to alternative models on failure
 *
 * If your primary model is unavailable or fails, automatically
 * try alternative models in sequence until one succeeds.
 *
 * @example
 * ```ts
 * // Try Sonnet first, fall back to Opus, then GPT-4o
 * const result = await fallbackExample(
 *   'Complex reasoning task',
 *   ['sonnet', 'opus', 'gpt-4o']
 * )
 * ```
 *
 * Use cases:
 * - Handle model-specific rate limits
 * - Ensure availability during outages
 * - Balance cost vs capability
 *
 * @param prompt - The prompt to send
 * @param models - Array of model names to try in order
 * @returns Generated text from first successful model
 */
export async function fallbackExample(
  prompt: string,
  models: string[]
): Promise<string> {
  const fallbackModels = models.map((modelName) => ({
    name: modelName,
    execute: async () => {
      const resolvedModel = await model(modelName)
      const result = await generateText({
        model: resolvedModel,
        prompt,
      })
      return result.text
    },
  }))

  const chain = new FallbackChain(fallbackModels)
  return chain.execute()
}

// ============================================================================
// Circuit Breaker
// ============================================================================

// Store circuit breakers by configuration key
const circuitBreakers = new Map<string, CircuitBreaker>()

/**
 * Get or create a circuit breaker for given options
 */
function getCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  const key = `${options.failureThreshold}-${options.resetTimeout}`

  let breaker = circuitBreakers.get(key)
  if (!breaker) {
    breaker = new CircuitBreaker(options)
    circuitBreakers.set(key, breaker)
  }

  return breaker
}

/**
 * Use circuit breaker for fail-fast behavior
 *
 * A circuit breaker prevents repeated calls to a failing service,
 * giving it time to recover. This protects your application from
 * cascading failures.
 *
 * @example
 * ```ts
 * // Basic circuit breaker
 * const result = await circuitBreakerExample('Generate content')
 *
 * // With state reporting
 * const { result, circuitState } = await circuitBreakerExample(
 *   'Generate content',
 *   { returnState: true, failureThreshold: 3 }
 * )
 * console.log(`Circuit is ${circuitState}`)
 * ```
 *
 * Circuit states:
 * - CLOSED: Normal operation, tracking failures
 * - OPEN: Failing fast, rejecting all requests
 * - HALF-OPEN: Testing if service recovered
 *
 * @param prompt - The prompt to send
 * @param options - Circuit breaker configuration
 * @returns Generated text or result with state
 */
export async function circuitBreakerExample(
  prompt: string,
  options: CircuitBreakerExampleOptions = {}
): Promise<string | CircuitBreakerResult> {
  const {
    failureThreshold = 5,
    resetTimeout = 30000,
    successThreshold = 1,
    returnState = false,
  } = options

  const breaker = getCircuitBreaker({
    failureThreshold,
    resetTimeout,
    successThreshold,
  })

  const result = await breaker.execute(async () => {
    const response = await generateText({
      model: 'sonnet',
      prompt,
    })
    return response.text
  })

  if (returnState) {
    return {
      result,
      circuitState: breaker.state,
    }
  }

  return result
}

/**
 * Reset all circuit breakers (useful for testing)
 */
export function resetCircuitBreakers(): void {
  circuitBreakers.forEach((breaker) => breaker.reset())
  circuitBreakers.clear()
}
