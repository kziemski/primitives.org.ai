/**
 * Core types for ai-database
 *
 * Follows mdxld conventions:
 * - Everything has a URL (linked data style)
 * - Items have ns (namespace) + type + id
 * - URL defaults to https://{ns}/{type}/{id} or https://{ns}/{id}
 *
 * Based on a simple Things + Relationships model:
 * - Things: Objects with ns, type, id, url, and arbitrary properties
 * - Relationships: Edges between things with a type and optional properties
 */

import type { RpcPromise } from 'capnweb'

/**
 * Base identifier for all entities
 */
export interface EntityId {
  /** Namespace (e.g., 'example.com', 'api.mdx.org.ai') */
  ns: string
  /** Type of the entity (e.g., 'user', 'post', 'comment') */
  type: string
  /** Unique identifier within the namespace and type */
  id: string
  /**
   * Full URL for the entity
   * Defaults to https://{ns}/{type}/{id}
   * Can be overridden for custom URL patterns
   */
  url?: string
}

/**
 * Resolve the URL for an entity
 */
export function resolveUrl(entity: EntityId): string {
  if (entity.url) return entity.url
  return `https://${entity.ns}/${entity.type}/${entity.id}`
}

/**
 * Resolve URL with just ns/id (no type in path)
 */
export function resolveShortUrl(entity: Pick<EntityId, 'ns' | 'id'>): string {
  return `https://${entity.ns}/${entity.id}`
}

/**
 * Parse a URL into EntityId components
 */
export function parseUrl(url: string): EntityId {
  const parsed = new URL(url)
  const parts = parsed.pathname.split('/').filter(Boolean)

  if (parts.length === 1) {
    // ns/id format
    return {
      ns: parsed.host,
      type: '',
      id: parts[0],
      url
    }
  }

  if (parts.length >= 2) {
    // ns/type/id format (or ns/type/.../id)
    return {
      ns: parsed.host,
      type: parts[0],
      id: parts.slice(1).join('/'),
      url
    }
  }

  throw new Error(`Invalid entity URL: ${url}`)
}

/**
 * A Thing is a node in the database (linked data style)
 */
export interface Thing<T extends Record<string, unknown> = Record<string, unknown>> extends EntityId {
  /** When the thing was created */
  createdAt: Date
  /** When the thing was last updated */
  updatedAt: Date
  /** Arbitrary properties */
  data: T
  /** JSON-LD context (optional) */
  '@context'?: string | Record<string, unknown>
}

/**
 * A Relationship is an edge between two things
 */
export interface Relationship<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique identifier for the relationship */
  id: string
  /** Type of relationship (e.g., 'owns', 'follows', 'likes') */
  type: string
  /** Source thing URL or EntityId */
  from: string
  /** Target thing URL or EntityId */
  to: string
  /** When the relationship was created */
  createdAt: Date
  /** Optional properties on the relationship */
  data?: T
}

/**
 * Query options for listing/finding things
 */
export interface QueryOptions {
  /** Filter by namespace */
  ns?: string
  /** Filter by type */
  type?: string
  /** Filter by properties (exact match) */
  where?: Record<string, unknown>
  /** Order by field */
  orderBy?: string
  /** Order direction */
  order?: 'asc' | 'desc'
  /** Limit results */
  limit?: number
  /** Skip results (for pagination) */
  offset?: number
}

/**
 * Search options for semantic/text search
 */
export interface SearchOptions extends QueryOptions {
  /** The search query */
  query: string
  /** Fields to search in */
  fields?: string[]
  /** Minimum relevance score (0-1) */
  minScore?: number
}

/**
 * Options for creating a thing
 */
export interface CreateOptions<T extends Record<string, unknown>> {
  /** Namespace */
  ns: string
  /** Type of the thing */
  type: string
  /** ID (auto-generated if not provided) */
  id?: string
  /** Custom URL (auto-generated if not provided) */
  url?: string
  /** Initial data */
  data: T
  /** JSON-LD context */
  '@context'?: string | Record<string, unknown>
}

/**
 * Options for updating a thing
 */
export interface UpdateOptions<T extends Record<string, unknown>> {
  /** Partial data to merge */
  data: Partial<T>
}

/**
 * Options for creating a relationship
 */
export interface RelateOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Type of relationship */
  type: string
  /** Source thing URL */
  from: string
  /** Target thing URL */
  to: string
  /** Optional relationship data */
  data?: T
}

/**
 * Database client interface - all methods return RpcPromise for pipelining
 */
export interface DBClient {
  // Thing operations
  list<T extends Record<string, unknown> = Record<string, unknown>>(
    options?: QueryOptions
  ): RpcPromise<Thing<T>[]>

  find<T extends Record<string, unknown> = Record<string, unknown>>(
    options: QueryOptions
  ): RpcPromise<Thing<T>[]>

  search<T extends Record<string, unknown> = Record<string, unknown>>(
    options: SearchOptions
  ): RpcPromise<Thing<T>[]>

  get<T extends Record<string, unknown> = Record<string, unknown>>(
    url: string
  ): RpcPromise<Thing<T> | null>

  getById<T extends Record<string, unknown> = Record<string, unknown>>(
    ns: string,
    type: string,
    id: string
  ): RpcPromise<Thing<T> | null>

  set<T extends Record<string, unknown>>(
    url: string,
    data: T
  ): RpcPromise<Thing<T>>

  create<T extends Record<string, unknown>>(
    options: CreateOptions<T>
  ): RpcPromise<Thing<T>>

  update<T extends Record<string, unknown>>(
    url: string,
    options: UpdateOptions<T>
  ): RpcPromise<Thing<T>>

  upsert<T extends Record<string, unknown>>(
    options: CreateOptions<T>
  ): RpcPromise<Thing<T>>

  delete(url: string): RpcPromise<boolean>

  // Iteration
  forEach<T extends Record<string, unknown> = Record<string, unknown>>(
    options: QueryOptions,
    callback: (thing: Thing<T>) => void | Promise<void>
  ): RpcPromise<void>

  // Relationship operations
  relate<T extends Record<string, unknown> = Record<string, unknown>>(
    options: RelateOptions<T>
  ): RpcPromise<Relationship<T>>

  unrelate(from: string, type: string, to: string): RpcPromise<boolean>

  related<T extends Record<string, unknown> = Record<string, unknown>>(
    url: string,
    relationshipType?: string,
    direction?: 'from' | 'to' | 'both'
  ): RpcPromise<Thing<T>[]>

  relationships(
    url: string,
    type?: string,
    direction?: 'from' | 'to' | 'both'
  ): RpcPromise<Relationship[]>
}
