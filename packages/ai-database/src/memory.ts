/**
 * In-memory implementation of ai-database
 *
 * Simple Things + Relationships storage following mdxld conventions.
 * Useful for testing, development, and client-side caching.
 */

import { RpcTarget } from 'capnweb'
import type { RpcPromise } from 'capnweb'
import {
  type Thing,
  type Relationship,
  type QueryOptions,
  type SearchOptions,
  type CreateOptions,
  type UpdateOptions,
  type RelateOptions,
  type DBClient,
  resolveUrl
} from './types.js'

/**
 * Generate a unique ID
 */
function generateId(): string {
  return crypto.randomUUID()
}

/**
 * In-memory database implementation
 */
export class MemoryDB extends RpcTarget implements DBClient {
  private things = new Map<string, Thing>()
  private relationships = new Map<string, Relationship>()

  // Index: url -> thing
  private byUrl = new Map<string, Thing>()
  // Index: ns/type -> Set<url>
  private byNsType = new Map<string, Set<string>>()
  // Index: from -> Set<relationship id>
  private relFrom = new Map<string, Set<string>>()
  // Index: to -> Set<relationship id>
  private relTo = new Map<string, Set<string>>()

  private indexThing(thing: Thing): void {
    const url = resolveUrl(thing)
    this.byUrl.set(url, thing)

    const nsTypeKey = `${thing.ns}/${thing.type}`
    if (!this.byNsType.has(nsTypeKey)) {
      this.byNsType.set(nsTypeKey, new Set())
    }
    this.byNsType.get(nsTypeKey)!.add(url)
  }

  private unindexThing(thing: Thing): void {
    const url = resolveUrl(thing)
    this.byUrl.delete(url)

    const nsTypeKey = `${thing.ns}/${thing.type}`
    this.byNsType.get(nsTypeKey)?.delete(url)
  }

  private indexRelationship(rel: Relationship): void {
    if (!this.relFrom.has(rel.from)) {
      this.relFrom.set(rel.from, new Set())
    }
    this.relFrom.get(rel.from)!.add(rel.id)

    if (!this.relTo.has(rel.to)) {
      this.relTo.set(rel.to, new Set())
    }
    this.relTo.get(rel.to)!.add(rel.id)
  }

  private unindexRelationship(rel: Relationship): void {
    this.relFrom.get(rel.from)?.delete(rel.id)
    this.relTo.get(rel.to)?.delete(rel.id)
  }

  private matchesQuery(thing: Thing, options: QueryOptions): boolean {
    if (options.ns && thing.ns !== options.ns) return false
    if (options.type && thing.type !== options.type) return false

    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (thing.data[key] !== value) return false
      }
    }

    return true
  }

  private applyQueryOptions<T>(items: T[], options: QueryOptions): T[] {
    let result = [...items]

    // Sort
    if (options.orderBy) {
      const field = options.orderBy
      const dir = options.order === 'desc' ? -1 : 1
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[field]
        const bVal = (b as Record<string, unknown>)[field]
        if (aVal < bVal) return -dir
        if (aVal > bVal) return dir
        return 0
      })
    }

    // Paginate
    if (options.offset) {
      result = result.slice(options.offset)
    }
    if (options.limit) {
      result = result.slice(0, options.limit)
    }

    return result
  }

  // Thing operations

  list<T extends Record<string, unknown> = Record<string, unknown>>(
    options: QueryOptions = {}
  ): RpcPromise<Thing<T>[]> {
    const results: Thing<T>[] = []

    for (const thing of this.things.values()) {
      if (this.matchesQuery(thing, options)) {
        results.push(thing as Thing<T>)
      }
    }

    return Promise.resolve(this.applyQueryOptions(results, options)) as RpcPromise<Thing<T>[]>
  }

  find<T extends Record<string, unknown> = Record<string, unknown>>(
    options: QueryOptions
  ): RpcPromise<Thing<T>[]> {
    return this.list<T>(options)
  }

  search<T extends Record<string, unknown> = Record<string, unknown>>(
    options: SearchOptions
  ): RpcPromise<Thing<T>[]> {
    const { query, fields = ['data'], minScore = 0, ...queryOptions } = options
    const queryLower = query.toLowerCase()
    const results: Array<{ thing: Thing<T>; score: number }> = []

    for (const thing of this.things.values()) {
      if (!this.matchesQuery(thing, queryOptions)) continue

      // Simple text search (in production, use proper full-text search)
      let score = 0
      const searchIn = fields.includes('data')
        ? JSON.stringify(thing.data).toLowerCase()
        : fields.map(f => String((thing as Record<string, unknown>)[f] || '')).join(' ').toLowerCase()

      if (searchIn.includes(queryLower)) {
        // Simple scoring: earlier match = higher score
        const index = searchIn.indexOf(queryLower)
        score = 1 - (index / searchIn.length)
      }

      if (score >= minScore) {
        results.push({ thing: thing as Thing<T>, score })
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score)

    return Promise.resolve(
      this.applyQueryOptions(results.map(r => r.thing), queryOptions)
    ) as RpcPromise<Thing<T>[]>
  }

  get<T extends Record<string, unknown> = Record<string, unknown>>(
    url: string
  ): RpcPromise<Thing<T> | null> {
    const thing = this.byUrl.get(url) as Thing<T> | undefined
    return Promise.resolve(thing || null) as RpcPromise<Thing<T> | null>
  }

  getById<T extends Record<string, unknown> = Record<string, unknown>>(
    ns: string,
    type: string,
    id: string
  ): RpcPromise<Thing<T> | null> {
    const url = `https://${ns}/${type}/${id}`
    return this.get<T>(url)
  }

  set<T extends Record<string, unknown>>(
    url: string,
    data: T
  ): RpcPromise<Thing<T>> {
    const existing = this.byUrl.get(url)
    if (existing) {
      existing.data = data as Record<string, unknown>
      existing.updatedAt = new Date()
      return Promise.resolve(existing as Thing<T>) as RpcPromise<Thing<T>>
    }

    // Parse URL to create new thing
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)

    const thing: Thing<T> = {
      ns: parsed.host,
      type: parts[0] || '',
      id: parts.slice(1).join('/') || generateId(),
      url,
      createdAt: new Date(),
      updatedAt: new Date(),
      data
    }

    this.things.set(url, thing as Thing)
    this.indexThing(thing as Thing)

    return Promise.resolve(thing) as RpcPromise<Thing<T>>
  }

  create<T extends Record<string, unknown>>(
    options: CreateOptions<T>
  ): RpcPromise<Thing<T>> {
    const id = options.id || generateId()
    const thing: Thing<T> = {
      ns: options.ns,
      type: options.type,
      id,
      url: options.url,
      createdAt: new Date(),
      updatedAt: new Date(),
      data: options.data,
      '@context': options['@context']
    }

    const url = resolveUrl(thing)
    thing.url = url

    if (this.byUrl.has(url)) {
      return Promise.reject(new Error(`Thing already exists: ${url}`)) as RpcPromise<Thing<T>>
    }

    this.things.set(url, thing as Thing)
    this.indexThing(thing as Thing)

    return Promise.resolve(thing) as RpcPromise<Thing<T>>
  }

  update<T extends Record<string, unknown>>(
    url: string,
    options: UpdateOptions<T>
  ): RpcPromise<Thing<T>> {
    const existing = this.byUrl.get(url)
    if (!existing) {
      return Promise.reject(new Error(`Thing not found: ${url}`)) as RpcPromise<Thing<T>>
    }

    existing.data = { ...existing.data, ...options.data }
    existing.updatedAt = new Date()

    return Promise.resolve(existing as Thing<T>) as RpcPromise<Thing<T>>
  }

  upsert<T extends Record<string, unknown>>(
    options: CreateOptions<T>
  ): RpcPromise<Thing<T>> {
    const id = options.id || generateId()
    const url = options.url || `https://${options.ns}/${options.type}/${id}`

    const existing = this.byUrl.get(url)
    if (existing) {
      return this.update<T>(url, { data: options.data })
    }

    return this.create<T>({ ...options, id, url })
  }

  delete(url: string): RpcPromise<boolean> {
    const thing = this.byUrl.get(url)
    if (!thing) {
      return Promise.resolve(false) as RpcPromise<boolean>
    }

    this.unindexThing(thing)
    this.things.delete(url)

    // Also delete related relationships
    const relIds = new Set([
      ...(this.relFrom.get(url) || []),
      ...(this.relTo.get(url) || [])
    ])
    for (const relId of relIds) {
      const rel = this.relationships.get(relId)
      if (rel) {
        this.unindexRelationship(rel)
        this.relationships.delete(relId)
      }
    }

    return Promise.resolve(true) as RpcPromise<boolean>
  }

  forEach<T extends Record<string, unknown> = Record<string, unknown>>(
    options: QueryOptions,
    callback: (thing: Thing<T>) => void | Promise<void>
  ): RpcPromise<void> {
    return this.list<T>(options).then(async (things) => {
      for (const thing of things) {
        await callback(thing)
      }
    }) as RpcPromise<void>
  }

  // Relationship operations

  relate<T extends Record<string, unknown> = Record<string, unknown>>(
    options: RelateOptions<T>
  ): RpcPromise<Relationship<T>> {
    const rel: Relationship<T> = {
      id: generateId(),
      type: options.type,
      from: options.from,
      to: options.to,
      createdAt: new Date(),
      data: options.data
    }

    this.relationships.set(rel.id, rel as Relationship)
    this.indexRelationship(rel as Relationship)

    return Promise.resolve(rel) as RpcPromise<Relationship<T>>
  }

  unrelate(from: string, type: string, to: string): RpcPromise<boolean> {
    const fromRels = this.relFrom.get(from)
    if (!fromRels) {
      return Promise.resolve(false) as RpcPromise<boolean>
    }

    for (const relId of fromRels) {
      const rel = this.relationships.get(relId)
      if (rel && rel.type === type && rel.to === to) {
        this.unindexRelationship(rel)
        this.relationships.delete(relId)
        return Promise.resolve(true) as RpcPromise<boolean>
      }
    }

    return Promise.resolve(false) as RpcPromise<boolean>
  }

  related<T extends Record<string, unknown> = Record<string, unknown>>(
    url: string,
    relationshipType?: string,
    direction: 'from' | 'to' | 'both' = 'both'
  ): RpcPromise<Thing<T>[]> {
    const relatedUrls = new Set<string>()

    // Get things this url points to
    if (direction === 'from' || direction === 'both') {
      const fromRels = this.relFrom.get(url)
      if (fromRels) {
        for (const relId of fromRels) {
          const rel = this.relationships.get(relId)
          if (rel && (!relationshipType || rel.type === relationshipType)) {
            relatedUrls.add(rel.to)
          }
        }
      }
    }

    // Get things that point to this url
    if (direction === 'to' || direction === 'both') {
      const toRels = this.relTo.get(url)
      if (toRels) {
        for (const relId of toRels) {
          const rel = this.relationships.get(relId)
          if (rel && (!relationshipType || rel.type === relationshipType)) {
            relatedUrls.add(rel.from)
          }
        }
      }
    }

    const results: Thing<T>[] = []
    for (const relatedUrl of relatedUrls) {
      const thing = this.byUrl.get(relatedUrl)
      if (thing) {
        results.push(thing as Thing<T>)
      }
    }

    return Promise.resolve(results) as RpcPromise<Thing<T>[]>
  }

  relationships(
    url: string,
    type?: string,
    direction: 'from' | 'to' | 'both' = 'both'
  ): RpcPromise<Relationship[]> {
    const results: Relationship[] = []

    if (direction === 'from' || direction === 'both') {
      const fromRels = this.relFrom.get(url)
      if (fromRels) {
        for (const relId of fromRels) {
          const rel = this.relationships.get(relId)
          if (rel && (!type || rel.type === type)) {
            results.push(rel)
          }
        }
      }
    }

    if (direction === 'to' || direction === 'both') {
      const toRels = this.relTo.get(url)
      if (toRels) {
        for (const relId of toRels) {
          const rel = this.relationships.get(relId)
          if (rel && (!type || rel.type === type)) {
            results.push(rel)
          }
        }
      }
    }

    return Promise.resolve(results) as RpcPromise<Relationship[]>
  }

  // Utility methods

  /**
   * Clear all data
   */
  clear(): void {
    this.things.clear()
    this.relationships.clear()
    this.byUrl.clear()
    this.byNsType.clear()
    this.relFrom.clear()
    this.relTo.clear()
  }

  /**
   * Get statistics about the database
   */
  stats(): { things: number; relationships: number } {
    return {
      things: this.things.size,
      relationships: this.relationships.size
    }
  }
}

/**
 * Create an in-memory database instance
 */
export function createMemoryDB(): MemoryDB {
  return new MemoryDB()
}
