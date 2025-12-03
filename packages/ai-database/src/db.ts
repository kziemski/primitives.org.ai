/**
 * DB() and db - Database client constructors
 *
 * Provides the main entry points for database operations,
 * with full RPC promise pipelining and unified auth via ai-functions.
 */

import { createAuthenticatedClient, type AuthenticatedClientOptions } from 'ai-functions/rpc'
import type { DBClient, QueryOptions } from './types.js'
import { createMemoryDB } from './memory.js'

/**
 * Default database RPC endpoint
 */
export const DEFAULT_DB_URL = 'https://db.apis.do/rpc'
export const DEFAULT_DB_WS_URL = 'wss://db.apis.do/rpc'

/**
 * Options for creating a DB instance
 */
export interface DBOptions extends Partial<AuthenticatedClientOptions> {
  /** Default namespace for operations */
  ns?: string
  /** Use in-memory storage (for testing/development) */
  memory?: boolean
}

/**
 * Create a database client instance
 *
 * @example
 * ```ts
 * // Connect to default db.apis.do with DO_TOKEN auth
 * const db = await DB({ ns: 'example.com' })
 *
 * // Use promise pipelining - single round trip!
 * const user = db.get('https://example.com/users/123')
 * const posts = user.map(u => db.find({ ns: 'example.com', type: 'posts', where: { authorId: u.id } }))
 * console.log(await posts)
 *
 * // In-memory for testing (sync)
 * const testDb = DB({ memory: true })
 *
 * // Custom endpoint
 * const db = await DB({ httpUrl: 'https://custom.example.com/rpc' })
 * ```
 */
export function DB(options: DBOptions & { memory: true }): DBClient
export function DB(options?: DBOptions): Promise<DBClient>
export function DB(options: DBOptions = {}): DBClient | Promise<DBClient> {
  const { ns, memory, ...clientOptions } = options

  // Use in-memory storage (synchronous)
  if (memory) {
    return createMemoryDB()
  }

  // Use authenticated RPC client (async)
  return createAuthenticatedClient<DBClient>({
    httpUrl: DEFAULT_DB_URL,
    wsUrl: DEFAULT_DB_WS_URL,
    ...clientOptions
  })
}

// Default client management
let defaultClient: DBClient | null = null
let defaultClientPromise: Promise<DBClient> | null = null
let defaultNs: string | null = null

/**
 * Configure the default database client
 */
export async function configureDB(options: DBOptions): Promise<void> {
  if (options.memory) {
    defaultClient = createMemoryDB()
  } else {
    defaultClient = await DB(options)
  }
  defaultNs = options.ns || null
}

/**
 * Get the default database client (async initialization)
 */
async function getDefaultDBClient(): Promise<DBClient> {
  if (defaultClient) {
    return defaultClient
  }

  if (!defaultClientPromise) {
    defaultClientPromise = (async () => {
      // Try to auto-configure from environment
      const httpUrl = typeof process !== 'undefined' ? process.env?.DB_HTTP_URL : undefined
      const wsUrl = typeof process !== 'undefined' ? process.env?.DB_WS_URL : undefined
      const ns = typeof process !== 'undefined' ? process.env?.DB_NS : undefined

      // If no URLs specified, use default apis.do endpoint with auth
      defaultClient = await DB({ httpUrl, wsUrl, ns })
      defaultNs = ns || null
      return defaultClient
    })()
  }

  return defaultClientPromise
}

/**
 * Get in-memory client for sync operations (testing)
 */
function getMemoryClient(): DBClient {
  if (!defaultClient) {
    defaultClient = createMemoryDB()
  }
  return defaultClient
}

/**
 * Shorthand database operations using default client
 *
 * Note: These return promises that resolve to RpcPromise.
 * For sync testing, use DB({ memory: true }) directly.
 */
export const db = {
  list: async <T extends Record<string, unknown>>(options?: QueryOptions) =>
    (await getDefaultDBClient()).list<T>(options),

  find: async <T extends Record<string, unknown>>(options: QueryOptions) =>
    (await getDefaultDBClient()).find<T>(options),

  search: async <T extends Record<string, unknown>>(options: Parameters<DBClient['search']>[0]) =>
    (await getDefaultDBClient()).search<T>(options),

  get: async <T extends Record<string, unknown>>(url: string) =>
    (await getDefaultDBClient()).get<T>(url),

  getById: async <T extends Record<string, unknown>>(ns: string, type: string, id: string) =>
    (await getDefaultDBClient()).getById<T>(ns, type, id),

  set: async <T extends Record<string, unknown>>(url: string, data: T) =>
    (await getDefaultDBClient()).set<T>(url, data),

  create: async <T extends Record<string, unknown>>(options: Parameters<DBClient['create']>[0]) =>
    (await getDefaultDBClient()).create<T>(options as Parameters<DBClient['create']>[0]),

  update: async <T extends Record<string, unknown>>(url: string, options: Parameters<DBClient['update']>[1]) =>
    (await getDefaultDBClient()).update<T>(url, options as Parameters<DBClient['update']>[1]),

  upsert: async <T extends Record<string, unknown>>(options: Parameters<DBClient['upsert']>[0]) =>
    (await getDefaultDBClient()).upsert<T>(options as Parameters<DBClient['upsert']>[0]),

  delete: async (url: string) =>
    (await getDefaultDBClient()).delete(url),

  forEach: async <T extends Record<string, unknown>>(
    options: QueryOptions,
    callback: (thing: Parameters<DBClient['forEach']>[1] extends (t: infer U) => unknown ? U : never) => void | Promise<void>
  ) => (await getDefaultDBClient()).forEach<T>(options, callback as Parameters<DBClient['forEach']>[1]),

  relate: async <T extends Record<string, unknown>>(options: Parameters<DBClient['relate']>[0]) =>
    (await getDefaultDBClient()).relate<T>(options as Parameters<DBClient['relate']>[0]),

  unrelate: async (from: string, type: string, to: string) =>
    (await getDefaultDBClient()).unrelate(from, type, to),

  related: async <T extends Record<string, unknown>>(
    url: string,
    relationshipType?: string,
    direction?: 'from' | 'to' | 'both'
  ) => (await getDefaultDBClient()).related<T>(url, relationshipType, direction),

  relationships: async (url: string, type?: string, direction?: 'from' | 'to' | 'both') =>
    (await getDefaultDBClient()).relationships(url, type, direction),

  /** Get an in-memory client for sync testing */
  memory: () => createMemoryDB()
}
