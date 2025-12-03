/**
 * RPC primitives with unified auth
 *
 * Re-exports capnweb's RPC capabilities with:
 * - Unified authentication via oauth.do
 * - Default RPC target: apis.do/rpc
 * - Token from DO_TOKEN env or oauth.do CLI flow
 *
 * @packageDocumentation
 */

// Re-export core capnweb types - consumers import from here, not capnweb directly
export {
  newWebSocketRpcSession,
  newHttpBatchRpcSession,
  RpcTarget,
  type RpcStub,
  type RpcPromise
} from 'capnweb'

// For Cloudflare Workers server-side
export { newWorkersRpcResponse } from 'capnweb'

// Export our session utilities
export { createRPCSession, type RPCSessionOptions } from './session.js'
export { createLocalTarget, LocalTarget } from './local.js'

// Export authenticated client
export {
  createAuthenticatedClient,
  getDefaultRPCClient,
  configureRPC,
  type AuthenticatedClientOptions,
  type RPCConfig
} from './auth.js'
