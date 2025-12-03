/**
 * Deferred<T> - Cap'n Proto style promise pipelining for TypeScript
 *
 * Allows calling methods and accessing properties on promises before they resolve.
 * All operations are batched and sent in a single round trip when awaited.
 */

// Symbol to identify Deferred objects
export const DEFERRED = Symbol('Deferred')
export const DEFERRED_CHAIN = Symbol('DeferredChain')

/**
 * A chain of operations to apply to a value
 */
export type Operation =
  | { type: 'property'; key: string | symbol }
  | { type: 'call'; args: unknown[] }
  | { type: 'map'; fn: (value: unknown) => unknown }

/**
 * Deferred<T> wraps a future value T, allowing property access and method calls
 * to be pipelined before the value resolves.
 */
export type Deferred<T> = {
  readonly [DEFERRED]: true
  readonly [DEFERRED_CHAIN]: Operation[]
} & {
  // Properties become Deferred<PropertyType>
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Deferred<Awaited<R>>
    : Deferred<T[K]>
} & {
  // Transform the eventual value
  map<U>(fn: (value: T) => U): Deferred<U>
  // Await the value
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult>
  finally(onfinally?: (() => void) | null): Promise<T>
}

/**
 * Context for resolving deferred values
 */
export interface DeferredContext {
  resolve<T>(operations: Operation[]): Promise<T>
}

/**
 * Create a Deferred value that will be resolved by the given context
 */
export function createDeferred<T>(
  context: DeferredContext,
  chain: Operation[] = []
): Deferred<T> {
  const resolve = () => context.resolve<T>(chain)

  const handler: ProxyHandler<object> = {
    get(_, prop) {
      // Handle special symbols
      if (prop === DEFERRED) return true
      if (prop === DEFERRED_CHAIN) return chain

      // Handle Promise interface
      if (prop === 'then') {
        return (onfulfilled?: (value: T) => unknown, onrejected?: (reason: unknown) => unknown) =>
          resolve().then(onfulfilled, onrejected)
      }
      if (prop === 'catch') {
        return (onrejected?: (reason: unknown) => unknown) =>
          resolve().catch(onrejected)
      }
      if (prop === 'finally') {
        return (onfinally?: () => void) =>
          resolve().finally(onfinally)
      }

      // Handle map
      if (prop === 'map') {
        return (fn: (value: unknown) => unknown) =>
          createDeferred(context, [...chain, { type: 'map', fn }])
      }

      // Property access - add to chain
      return createDeferred(context, [...chain, { type: 'property', key: prop }])
    },

    apply(_, __, args) {
      // Function call - add to chain
      return createDeferred(context, [...chain, { type: 'call', args }])
    },

    // Make it callable
    has(_, prop) {
      return prop === DEFERRED || prop === DEFERRED_CHAIN || prop === 'then' || prop === 'catch' || prop === 'finally' || prop === 'map'
    }
  }

  // Create a function so it can be called
  const target = function() {} as unknown as object
  return new Proxy(target, handler) as Deferred<T>
}

/**
 * Check if a value is a Deferred
 */
export function isDeferred<T>(value: unknown): value is Deferred<T> {
  return typeof value === 'object' && value !== null && DEFERRED in value
}

/**
 * Apply a chain of operations to a value
 */
export function applyChain(value: unknown, operations: Operation[]): unknown {
  let result = value

  for (const op of operations) {
    if (result === null || result === undefined) {
      return result
    }

    switch (op.type) {
      case 'property':
        result = (result as Record<string | symbol, unknown>)[op.key]
        break
      case 'call':
        if (typeof result !== 'function') {
          throw new Error(`Cannot call non-function`)
        }
        result = (result as (...args: unknown[]) => unknown)(...op.args)
        break
      case 'map':
        result = op.fn(result)
        break
    }
  }

  return result
}

/**
 * Create a simple local context that resolves immediately
 * (useful for testing or in-memory implementations)
 */
export function createLocalContext<T>(getValue: () => T | Promise<T>): DeferredContext {
  return {
    async resolve<R>(operations: Operation[]): Promise<R> {
      const value = await getValue()
      return applyChain(value, operations) as R
    }
  }
}
