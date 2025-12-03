/**
 * RPC primitives built on capnweb
 *
 * Re-exports capnweb's promise pipelining capabilities with additional
 * utilities for AI primitives.
 *
 * @see https://github.com/cloudflare/capnweb
 */

// Re-export core capnweb types and functions
export {
  newWebSocketRpcSession,
  newHttpBatchRpcSession,
  RpcTarget,
  type RpcStub,
  type RpcPromise
} from 'capnweb'

// For Cloudflare Workers server-side
export { newWorkersRpcResponse } from 'capnweb'

/**
 * Create an RPC session with the appropriate transport
 */
export interface RPCSessionOptions {
  /** WebSocket URL for persistent connections */
  wsUrl?: string
  /** HTTP URL for batch requests */
  httpUrl?: string
  /** Prefer WebSocket over HTTP when both are available */
  preferWebSocket?: boolean
}

export { createRPCSession } from './session.js'
export { createLocalTarget } from './local.js'
