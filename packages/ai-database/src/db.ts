/**
 * DB() and db - Database client constructors
 *
 * Provides the main entry points for database operations,
 * with full RPC promise pipelining support via capnweb.
 */

import { createRPCSession, type RPCSessionOptions } from 'ai-functions/rpc'
import type { DBClient, QueryOptions } from './types.js'
import { createMemoryDB, MemoryDB } from './memory.js'

/**
 * Options for creating a DB instance
 */
export interface DBOptions extends Partial<RPCSessionOptions> {
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
 * // Connect to remote database service
 * const db = DB({ wsUrl: 'wss://db.example.com/rpc', ns: 'example.com' })
 *
 * // Use promise pipelining - single round trip!
 * const user = db.get('https://example.com/users/123')
 * const posts = user.map(u => db.find({ ns: 'example.com', type: 'posts', where: { authorId: u.id } }))
 * console.log(await posts)
 *
 * // In-memory for testing
 * const testDb = DB({ memory: true, ns: 'test.local' })
 * ```
 */
export function DB(options: DBOptions = {}): DBClient {
  const { ns, memory, ...sessionOptions } = options

  // Use in-memory storage
  if (memory || (!sessionOptions.wsUrl && !sessionOptions.httpUrl)) {
    return createMemoryDB()
  }

  // Create RPC session to database service
  return createRPCSession<DBClient>(sessionOptions as RPCSessionOptions)
}

// Default client management
let defaultClient: DBClient | null = null
let defaultNs: string | null = null

/**
 * Configure the default database client
 */
export function configureDB(options: DBOptions): void {
  defaultClient = DB(options)
  defaultNs = options.ns || null
}

/**
 * Get the default database client
 */
function getDefaultDBClient(): DBClient {
  if (!defaultClient) {
    // Try to auto-configure from environment
    const wsUrl = typeof process !== 'undefined' ? process.env?.DB_WS_URL : undefined
    const httpUrl = typeof process !== 'undefined' ? process.env?.DB_HTTP_URL : undefined
    const ns = typeof process !== 'undefined' ? process.env?.DB_NS : undefined

    if (wsUrl || httpUrl) {
      defaultClient = DB({ wsUrl, httpUrl, ns })
      defaultNs = ns || null
    } else {
      // Fall back to in-memory
      defaultClient = createMemoryDB()
    }
  }
  return defaultClient
}

/**
 * Shorthand database operations using default client
 */
export const db = {
  list: <T extends Record<string, unknown>>(options?: QueryOptions) =>
    getDefaultDBClient().list<T>(options),

  find: <T extends Record<string, unknown>>(options: QueryOptions) =>
    getDefaultDBClient().find<T>(options),

  search: <T extends Record<string, unknown>>(options: Parameters<DBClient['search']>[0]) =>
    getDefaultDBClient().search<T>(options),

  get: <T extends Record<string, unknown>>(url: string) =>
    getDefaultDBClient().get<T>(url),

  getById: <T extends Record<string, unknown>>(ns: string, type: string, id: string) =>
    getDefaultDBClient().getById<T>(ns, type, id),

  set: <T extends Record<string, unknown>>(url: string, data: T) =>
    getDefaultDBClient().set<T>(url, data),

  create: <T extends Record<string, unknown>>(options: Parameters<DBClient['create']>[0]) =>
    getDefaultDBClient().create<T>(options as Parameters<DBClient['create']>[0]),

  update: <T extends Record<string, unknown>>(url: string, options: Parameters<DBClient['update']>[1]) =>
    getDefaultDBClient().update<T>(url, options as Parameters<DBClient['update']>[1]),

  upsert: <T extends Record<string, unknown>>(options: Parameters<DBClient['upsert']>[0]) =>
    getDefaultDBClient().upsert<T>(options as Parameters<DBClient['upsert']>[0]),

  delete: (url: string) =>
    getDefaultDBClient().delete(url),

  forEach: <T extends Record<string, unknown>>(
    options: QueryOptions,
    callback: (thing: Parameters<DBClient['forEach']>[1] extends (t: infer U) => unknown ? U : never) => void | Promise<void>
  ) => getDefaultDBClient().forEach<T>(options, callback as Parameters<DBClient['forEach']>[1]),

  relate: <T extends Record<string, unknown>>(options: Parameters<DBClient['relate']>[0]) =>
    getDefaultDBClient().relate<T>(options as Parameters<DBClient['relate']>[0]),

  unrelate: (from: string, type: string, to: string) =>
    getDefaultDBClient().unrelate(from, type, to),

  related: <T extends Record<string, unknown>>(
    url: string,
    relationshipType?: string,
    direction?: 'from' | 'to' | 'both'
  ) => getDefaultDBClient().related<T>(url, relationshipType, direction),

  relationships: (url: string, type?: string, direction?: 'from' | 'to' | 'both') =>
    getDefaultDBClient().relationships(url, type, direction)
}
