/**
 * RPC Client with promise pipelining support
 *
 * Batches multiple deferred operations into single round trips.
 */

import { createDeferred, applyChain, type Deferred, type Operation, type DeferredContext } from './deferred.js'

/**
 * RPC transport interface - implement this for different protocols
 */
export interface RPCTransport {
  /**
   * Execute a batch of calls and return results
   */
  batch(calls: RPCCall[]): Promise<RPCResult[]>

  /**
   * Optional: execute a single call (defaults to batch of 1)
   */
  call?(call: RPCCall): Promise<RPCResult>
}

/**
 * A single RPC call
 */
export interface RPCCall {
  id: string
  method: string
  params: unknown[]
  chain?: Operation[]
}

/**
 * Result of an RPC call
 */
export interface RPCResult {
  id: string
  result?: unknown
  error?: { message: string; code?: string }
}

/**
 * Options for creating an RPC client
 */
export interface RPCClientOptions {
  /** The transport to use for RPC calls */
  transport: RPCTransport
  /** How long to wait before flushing pending calls (default: 0 - microtask) */
  batchDelayMs?: number
  /** Maximum calls per batch (default: 100) */
  maxBatchSize?: number
}

/**
 * Pending call waiting to be batched
 */
interface PendingCall {
  call: RPCCall
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

/**
 * Create an RPC client with automatic batching
 */
export function createRPCClient(options: RPCClientOptions) {
  const { transport, batchDelayMs = 0, maxBatchSize = 100 } = options

  let pendingCalls: PendingCall[] = []
  let flushScheduled = false
  let callId = 0

  const flush = async () => {
    if (pendingCalls.length === 0) return

    const batch = pendingCalls.splice(0, maxBatchSize)
    flushScheduled = pendingCalls.length > 0

    if (flushScheduled) {
      scheduleFlush()
    }

    try {
      const results = await transport.batch(batch.map(p => p.call))
      const resultMap = new Map(results.map(r => [r.id, r]))

      for (const pending of batch) {
        const result = resultMap.get(pending.call.id)
        if (!result) {
          pending.reject(new Error(`No result for call ${pending.call.id}`))
        } else if (result.error) {
          pending.reject(new Error(result.error.message))
        } else {
          pending.resolve(result.result)
        }
      }
    } catch (error) {
      for (const pending of batch) {
        pending.reject(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  const scheduleFlush = () => {
    if (flushScheduled) return
    flushScheduled = true

    if (batchDelayMs === 0) {
      queueMicrotask(() => {
        flushScheduled = false
        flush()
      })
    } else {
      setTimeout(() => {
        flushScheduled = false
        flush()
      }, batchDelayMs)
    }
  }

  /**
   * Queue an RPC call and return a promise for the result
   */
  const queueCall = (method: string, params: unknown[], chain: Operation[] = []): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const id = `${++callId}`
      pendingCalls.push({
        call: { id, method, params, chain },
        resolve,
        reject
      })
      scheduleFlush()
    })
  }

  /**
   * Create a DeferredContext that uses this client
   */
  const createContext = (method: string, params: unknown[]): DeferredContext => ({
    resolve: <T>(operations: Operation[]) =>
      queueCall(method, params, operations) as Promise<T>
  })

  /**
   * Call a method and get a Deferred result
   */
  const call = <T>(method: string, ...params: unknown[]): Deferred<T> => {
    const context = createContext(method, params)
    return createDeferred<T>(context)
  }

  /**
   * Force flush any pending calls
   */
  const forceFlush = () => flush()

  return {
    call,
    forceFlush,
    createContext,
    /** Number of pending calls */
    get pendingCount() {
      return pendingCalls.length
    }
  }
}

export type RPCClient = ReturnType<typeof createRPCClient>
