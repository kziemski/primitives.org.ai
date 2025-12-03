/**
 * RPC session management utilities
 */

import {
  newWebSocketRpcSession,
  newHttpBatchRpcSession
} from 'capnweb'

export interface RPCSessionOptions {
  /** WebSocket URL for persistent connections */
  wsUrl?: string
  /** HTTP URL for batch requests */
  httpUrl?: string
  /** Prefer WebSocket over HTTP when both are available */
  preferWebSocket?: boolean
}

/**
 * Create an RPC session with the appropriate transport
 *
 * @example
 * ```ts
 * // WebSocket session (interactive, persistent)
 * const api = createRPCSession<MyAPI>({ wsUrl: 'wss://api.example.com' })
 *
 * // HTTP batch session (request/response pattern)
 * const api = createRPCSession<MyAPI>({ httpUrl: 'https://api.example.com' })
 *
 * // Auto-select based on availability
 * const api = createRPCSession<MyAPI>({
 *   wsUrl: 'wss://api.example.com',
 *   httpUrl: 'https://api.example.com',
 *   preferWebSocket: true
 * })
 * ```
 */
export function createRPCSession<T>(options: RPCSessionOptions): T {
  const { wsUrl, httpUrl, preferWebSocket = true } = options

  if (!wsUrl && !httpUrl) {
    throw new Error('Either wsUrl or httpUrl must be provided')
  }

  // Determine which transport to use
  const useWebSocket = preferWebSocket ? wsUrl : (wsUrl && !httpUrl)

  if (useWebSocket && wsUrl) {
    return newWebSocketRpcSession<T>(wsUrl)
  }

  if (httpUrl) {
    return newHttpBatchRpcSession<T>(httpUrl)
  }

  throw new Error('No valid URL provided')
}
