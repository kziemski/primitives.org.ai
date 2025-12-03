/**
 * Local RPC target for in-memory implementations
 *
 * Allows using the same RPC semantics (including promise pipelining)
 * for local in-memory implementations, useful for:
 * - Testing
 * - Client-side caching
 * - Offline support
 * - Development without a server
 */

import { RpcTarget } from 'capnweb'

/**
 * Create a local RPC target that can be used with the same API
 * as remote targets, but executes locally.
 *
 * @example
 * ```ts
 * class MyLocalAPI extends RpcTarget {
 *   async getData(id: string) {
 *     return this.localStore.get(id)
 *   }
 * }
 *
 * const api = createLocalTarget(new MyLocalAPI())
 * const data = await api.getData('123') // Executes locally
 * ```
 */
export function createLocalTarget<T extends RpcTarget>(target: T): T {
  // For local targets, we can return the target directly
  // since capnweb's RpcTarget already handles method calls properly
  return target
}

/**
 * Base class for local implementations that mirror remote APIs
 */
export abstract class LocalTarget extends RpcTarget {
  /**
   * Override to provide initialization logic
   */
  async initialize(): Promise<void> {
    // Default: no initialization needed
  }

  /**
   * Override to provide cleanup logic
   */
  async dispose(): Promise<void> {
    // Default: no cleanup needed
  }
}
