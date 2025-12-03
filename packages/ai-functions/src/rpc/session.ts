/**
 * RPC session management utilities
 */

// Use require-style imports to avoid TypeScript's deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const capnweb = require('capnweb') as {
  newWebSocketRpcSession: (url: string) => unknown
  newHttpBatchRpcSession: (url: string) => unknown
}

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
    // RpcStub<T> proxies all methods of T, so cast is safe at runtime
    return capnweb.newWebSocketRpcSession(wsUrl) as T
  }

  if (httpUrl) {
    // RpcStub<T> proxies all methods of T, so cast is safe at runtime
    return capnweb.newHttpBatchRpcSession(httpUrl) as T
  }

  throw new Error('No valid URL provided')
}
