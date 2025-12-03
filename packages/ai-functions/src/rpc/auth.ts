/**
 * Authenticated RPC client with oauth.do integration
 *
 * Provides unified auth for all primitives:
 * - Default target: apis.do/rpc
 * - Token from DO_TOKEN env or oauth.do CLI flow
 */

// Use require-style imports to avoid TypeScript's deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const capnweb = require('capnweb') as {
  newWebSocketRpcSession: (url: string) => unknown
  newHttpBatchRpcSession: (url: string) => unknown
}

/**
 * Default RPC endpoints
 */
export const DEFAULT_WS_URL = 'wss://apis.do/rpc'
export const DEFAULT_HTTP_URL = 'https://apis.do/rpc'

/**
 * Options for creating an authenticated client
 */
export interface AuthenticatedClientOptions {
  /** WebSocket URL (default: wss://apis.do/rpc) */
  wsUrl?: string
  /** HTTP URL (default: https://apis.do/rpc) */
  httpUrl?: string
  /** Bearer token (default: from DO_TOKEN env or oauth.do) */
  token?: string
  /** Prefer WebSocket over HTTP */
  preferWebSocket?: boolean
}

/**
 * Global RPC configuration
 */
export interface RPCConfig {
  /** Default WebSocket URL */
  wsUrl?: string
  /** Default HTTP URL */
  httpUrl?: string
  /** Bearer token */
  token?: string
  /** Prefer WebSocket */
  preferWebSocket?: boolean
}

let globalConfig: RPCConfig = {}
let cachedToken: string | null = null

/**
 * Configure global RPC settings
 */
export function configureRPC(config: RPCConfig): void {
  globalConfig = { ...globalConfig, ...config }
  if (config.token) {
    cachedToken = config.token
  }
}

/**
 * Get the auth token from various sources
 *
 * Priority:
 * 1. Explicitly provided token
 * 2. Cached token from previous auth
 * 3. DO_TOKEN environment variable
 * 4. oauth.do CLI flow (if available)
 */
async function getToken(explicitToken?: string): Promise<string> {
  // 1. Explicit token
  if (explicitToken) {
    return explicitToken
  }

  // 2. Cached token
  if (cachedToken) {
    return cachedToken
  }

  // 3. Environment variable
  const envToken = typeof process !== 'undefined' ? process.env?.DO_TOKEN : undefined
  if (envToken) {
    cachedToken = envToken
    return envToken
  }

  // 4. Try oauth.do CLI flow
  try {
    const token = await getTokenFromOAuth()
    if (token) {
      cachedToken = token
      return token
    }
  } catch {
    // oauth.do not available, continue without auth
  }

  throw new Error(
    'No auth token available. Set DO_TOKEN environment variable or run `npx oauth.do login`'
  )
}

/**
 * Get token from oauth.do CLI secrets
 */
async function getTokenFromOAuth(): Promise<string | null> {
  // Dynamic import to avoid bundling oauth.do if not needed
  try {
    // @ts-expect-error oauth.do is an optional dependency
    const oauth = await import('oauth.do')
    const token = await oauth.getToken?.()
    return token || null
  } catch {
    return null
  }
}

/**
 * Create an authenticated RPC session
 *
 * @example
 * ```ts
 * // Uses default apis.do/rpc with DO_TOKEN
 * const api = await createAuthenticatedClient<MyAPI>()
 *
 * // Custom endpoint
 * const api = await createAuthenticatedClient<MyAPI>({
 *   wsUrl: 'wss://custom.example.com/rpc',
 *   token: 'my-token'
 * })
 * ```
 */
export async function createAuthenticatedClient<T>(
  options: AuthenticatedClientOptions = {}
): Promise<T> {
  const {
    wsUrl = globalConfig.wsUrl || DEFAULT_WS_URL,
    httpUrl = globalConfig.httpUrl || DEFAULT_HTTP_URL,
    token,
    preferWebSocket = globalConfig.preferWebSocket ?? true
  } = options

  const authToken = await getToken(token || globalConfig.token)

  // Create session with auth header
  // Note: capnweb handles auth via the URL or we need to extend it
  const authWsUrl = addAuthToUrl(wsUrl, authToken)
  const authHttpUrl = addAuthToUrl(httpUrl, authToken)

  if (preferWebSocket) {
    // RpcStub<T> proxies all methods of T, so cast is safe at runtime
    return capnweb.newWebSocketRpcSession(authWsUrl) as T
  }

  // RpcStub<T> proxies all methods of T, so cast is safe at runtime
  return capnweb.newHttpBatchRpcSession(authHttpUrl) as T
}

/**
 * Add auth token to URL (as query param for WebSocket, header handled separately for HTTP)
 */
function addAuthToUrl(url: string, token: string): string {
  const parsed = new URL(url)
  parsed.searchParams.set('token', token)
  return parsed.toString()
}

// Default client singleton
let defaultClient: unknown = null

/**
 * Get or create the default RPC client
 *
 * Uses apis.do/rpc with auth from DO_TOKEN or oauth.do
 */
export async function getDefaultRPCClient<T>(): Promise<T> {
  if (!defaultClient) {
    defaultClient = await createAuthenticatedClient<T>()
  }
  return defaultClient as T
}

/**
 * Clear the cached token and client (useful for logout)
 */
export function clearRPCAuth(): void {
  cachedToken = null
  defaultClient = null
}
