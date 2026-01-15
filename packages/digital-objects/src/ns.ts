/**
 * NS - Namespace Durable Object
 *
 * SQLite-based implementation of DigitalObjectsProvider for Cloudflare Workers.
 * Each NS instance represents a namespace (tenant) with isolated data.
 */

/// <reference types="@cloudflare/workers-types" />

import type {
  DigitalObjectsProvider,
  Noun,
  NounDefinition,
  Verb,
  VerbDefinition,
  Thing,
  Action,
  ActionStatus,
  ListOptions,
  ActionOptions,
} from './types.js'
import { deriveNoun, deriveVerb } from './linguistic.js'

// Environment bindings
export interface Env {
  NS: DurableObjectNamespace
  STORAGE?: R2Bucket
}

/**
 * NS - Namespace Durable Object
 */
export class NS implements DigitalObjectsProvider {
  private sql: SqlStorage
  private initialized = false
  private ctx: DurableObjectState
  private env: Env

  constructor(ctx: DurableObjectState, env: Env) {
    this.ctx = ctx
    this.env = env
    this.sql = ctx.storage.sql
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return

    // Create tables
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS nouns (
        name TEXT PRIMARY KEY,
        singular TEXT NOT NULL,
        plural TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        schema TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS verbs (
        name TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        act TEXT NOT NULL,
        activity TEXT NOT NULL,
        event TEXT NOT NULL,
        reverse_by TEXT,
        reverse_at TEXT,
        reverse_in TEXT,
        inverse TEXT,
        description TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS things (
        id TEXT PRIMARY KEY,
        noun TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_things_noun ON things(noun);

      CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        verb TEXT NOT NULL,
        subject TEXT,
        object TEXT,
        data TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_actions_verb ON actions(verb);
      CREATE INDEX IF NOT EXISTS idx_actions_subject ON actions(subject);
      CREATE INDEX IF NOT EXISTS idx_actions_object ON actions(object);
    `)

    this.initialized = true
  }

  // HTTP API handler
  async fetch(request: Request): Promise<Response> {
    await this.ensureInitialized()

    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    try {
      // Route to appropriate handler
      if (path === '/nouns' && method === 'POST') {
        const body = (await request.json()) as NounDefinition
        const noun = await this.defineNoun(body)
        return Response.json(noun)
      }

      if (path.startsWith('/nouns/') && method === 'GET') {
        const name = decodeURIComponent(path.slice('/nouns/'.length))
        const noun = await this.getNoun(name)
        return noun ? Response.json(noun) : new Response('Not found', { status: 404 })
      }

      if (path === '/nouns' && method === 'GET') {
        const nouns = await this.listNouns()
        return Response.json(nouns)
      }

      if (path === '/verbs' && method === 'POST') {
        const body = (await request.json()) as VerbDefinition
        const verb = await this.defineVerb(body)
        return Response.json(verb)
      }

      if (path.startsWith('/verbs/') && method === 'GET') {
        const name = decodeURIComponent(path.slice('/verbs/'.length))
        const verb = await this.getVerb(name)
        return verb ? Response.json(verb) : new Response('Not found', { status: 404 })
      }

      if (path === '/verbs' && method === 'GET') {
        const verbs = await this.listVerbs()
        return Response.json(verbs)
      }

      if (path === '/things' && method === 'POST') {
        const { noun, data, id } = (await request.json()) as {
          noun: string
          data: unknown
          id?: string
        }
        const thing = await this.create(noun, data, id)
        return Response.json(thing)
      }

      if (path.startsWith('/things/') && method === 'GET') {
        const id = decodeURIComponent(path.slice('/things/'.length))
        const thing = await this.get(id)
        return thing ? Response.json(thing) : new Response('Not found', { status: 404 })
      }

      if (path.startsWith('/things/') && method === 'PATCH') {
        const id = decodeURIComponent(path.slice('/things/'.length))
        const data = await request.json()
        const thing = await this.update(id, data as Record<string, unknown>)
        return Response.json(thing)
      }

      if (path.startsWith('/things/') && method === 'DELETE') {
        const id = decodeURIComponent(path.slice('/things/'.length))
        const deleted = await this.delete(id)
        return Response.json({ deleted })
      }

      if (path === '/things' && method === 'GET') {
        const noun = url.searchParams.get('noun')
        if (!noun) {
          return new Response('noun parameter required', { status: 400 })
        }
        const options: ListOptions = {}
        const limit = url.searchParams.get('limit')
        const offset = url.searchParams.get('offset')
        const orderBy = url.searchParams.get('orderBy')
        const order = url.searchParams.get('order')
        if (limit) options.limit = parseInt(limit, 10)
        if (offset) options.offset = parseInt(offset, 10)
        if (orderBy) options.orderBy = orderBy
        if (order === 'asc' || order === 'desc') options.order = order
        const things = await this.list(noun, options)
        return Response.json(things)
      }

      if (path === '/search' && method === 'GET') {
        const query = url.searchParams.get('q') ?? ''
        const options: ListOptions = {}
        const limit = url.searchParams.get('limit')
        if (limit) options.limit = parseInt(limit, 10)
        const things = await this.search(query, options)
        return Response.json(things)
      }

      if (path === '/actions' && method === 'POST') {
        const { verb, subject, object, data } = (await request.json()) as {
          verb: string
          subject?: string
          object?: string
          data?: unknown
        }
        const action = await this.perform(verb, subject, object, data)
        return Response.json(action)
      }

      if (path.startsWith('/actions/') && method === 'GET') {
        const id = decodeURIComponent(path.slice('/actions/'.length))
        const action = await this.getAction(id)
        return action ? Response.json(action) : new Response('Not found', { status: 404 })
      }

      if (path === '/actions' && method === 'GET') {
        const options: ActionOptions = {}
        const verb = url.searchParams.get('verb')
        const subject = url.searchParams.get('subject')
        const object = url.searchParams.get('object')
        const limit = url.searchParams.get('limit')
        const status = url.searchParams.get('status')
        if (verb) options.verb = verb
        if (subject) options.subject = subject
        if (object) options.object = object
        if (limit) options.limit = parseInt(limit, 10)
        if (status) options.status = status as ActionStatus
        const actions = await this.listActions(options)
        return Response.json(actions)
      }

      if (path.startsWith('/edges/') && method === 'GET') {
        const id = decodeURIComponent(path.slice('/edges/'.length))
        const verb = url.searchParams.get('verb') ?? undefined
        const direction = (url.searchParams.get('direction') ?? 'out') as 'out' | 'in' | 'both'
        const edges = await this.edges(id, verb, direction)
        return Response.json(edges)
      }

      if (path.startsWith('/related/') && method === 'GET') {
        const id = decodeURIComponent(path.slice('/related/'.length))
        const verb = url.searchParams.get('verb') ?? undefined
        const direction = (url.searchParams.get('direction') ?? 'out') as 'out' | 'in' | 'both'
        const things = await this.related(id, verb, direction)
        return Response.json(things)
      }

      return new Response('Not found', { status: 404 })
    } catch (error) {
      return new Response(String(error), { status: 500 })
    }
  }

  // ==================== Nouns ====================

  async defineNoun(def: NounDefinition): Promise<Noun> {
    await this.ensureInitialized()

    const derived = deriveNoun(def.name)
    const now = Date.now()

    this.sql.exec(
      `INSERT OR REPLACE INTO nouns (name, singular, plural, slug, description, schema, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      def.name,
      def.singular ?? derived.singular,
      def.plural ?? derived.plural,
      derived.slug,
      def.description ?? null,
      def.schema ? JSON.stringify(def.schema) : null,
      now
    )

    return {
      name: def.name,
      singular: def.singular ?? derived.singular,
      plural: def.plural ?? derived.plural,
      slug: derived.slug,
      description: def.description,
      schema: def.schema,
      createdAt: new Date(now),
    }
  }

  async getNoun(name: string): Promise<Noun | null> {
    await this.ensureInitialized()

    const rows = [...this.sql.exec('SELECT * FROM nouns WHERE name = ?', name)]
    if (rows.length === 0) return null

    const row = rows[0] as Record<string, unknown>
    return {
      name: row.name as string,
      singular: row.singular as string,
      plural: row.plural as string,
      slug: row.slug as string,
      description: row.description as string | undefined,
      schema: row.schema ? JSON.parse(row.schema as string) : undefined,
      createdAt: new Date(row.created_at as number),
    }
  }

  async listNouns(): Promise<Noun[]> {
    await this.ensureInitialized()

    const rows = [...this.sql.exec('SELECT * FROM nouns')]
    return rows.map((row) => {
      const r = row as Record<string, unknown>
      return {
        name: r.name as string,
        singular: r.singular as string,
        plural: r.plural as string,
        slug: r.slug as string,
        description: r.description as string | undefined,
        schema: r.schema ? JSON.parse(r.schema as string) : undefined,
        createdAt: new Date(r.created_at as number),
      }
    })
  }

  // ==================== Verbs ====================

  async defineVerb(def: VerbDefinition): Promise<Verb> {
    await this.ensureInitialized()

    const derived = deriveVerb(def.name)
    const now = Date.now()

    this.sql.exec(
      `INSERT OR REPLACE INTO verbs
       (name, action, act, activity, event, reverse_by, reverse_at, inverse, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      def.name,
      def.action ?? derived.action,
      def.act ?? derived.act,
      def.activity ?? derived.activity,
      def.event ?? derived.event,
      def.reverseBy ?? derived.reverseBy,
      derived.reverseAt,
      def.inverse ?? null,
      def.description ?? null,
      now
    )

    return {
      name: def.name,
      action: def.action ?? derived.action,
      act: def.act ?? derived.act,
      activity: def.activity ?? derived.activity,
      event: def.event ?? derived.event,
      reverseBy: def.reverseBy ?? derived.reverseBy,
      reverseAt: derived.reverseAt,
      inverse: def.inverse,
      description: def.description,
      createdAt: new Date(now),
    }
  }

  async getVerb(name: string): Promise<Verb | null> {
    await this.ensureInitialized()

    const rows = [...this.sql.exec('SELECT * FROM verbs WHERE name = ?', name)]
    if (rows.length === 0) return null

    const row = rows[0] as Record<string, unknown>
    return {
      name: row.name as string,
      action: row.action as string,
      act: row.act as string,
      activity: row.activity as string,
      event: row.event as string,
      reverseBy: row.reverse_by as string | undefined,
      reverseAt: row.reverse_at as string | undefined,
      inverse: row.inverse as string | undefined,
      description: row.description as string | undefined,
      createdAt: new Date(row.created_at as number),
    }
  }

  async listVerbs(): Promise<Verb[]> {
    await this.ensureInitialized()

    const rows = [...this.sql.exec('SELECT * FROM verbs')]
    return rows.map((row) => {
      const r = row as Record<string, unknown>
      return {
        name: r.name as string,
        action: r.action as string,
        act: r.act as string,
        activity: r.activity as string,
        event: r.event as string,
        reverseBy: r.reverse_by as string | undefined,
        reverseAt: r.reverse_at as string | undefined,
        inverse: r.inverse as string | undefined,
        description: r.description as string | undefined,
        createdAt: new Date(r.created_at as number),
      }
    })
  }

  // ==================== Things ====================

  async create<T>(noun: string, data: T, id?: string): Promise<Thing<T>> {
    await this.ensureInitialized()

    const thingId = id ?? crypto.randomUUID()
    const now = Date.now()

    this.sql.exec(
      `INSERT INTO things (id, noun, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      thingId,
      noun,
      JSON.stringify(data),
      now,
      now
    )

    return {
      id: thingId,
      noun,
      data,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }
  }

  async get<T>(id: string): Promise<Thing<T> | null> {
    await this.ensureInitialized()

    const rows = [...this.sql.exec('SELECT * FROM things WHERE id = ?', id)]
    if (rows.length === 0) return null

    const row = rows[0] as Record<string, unknown>
    return {
      id: row.id as string,
      noun: row.noun as string,
      data: JSON.parse(row.data as string) as T,
      createdAt: new Date(row.created_at as number),
      updatedAt: new Date(row.updated_at as number),
    }
  }

  async list<T>(noun: string, options?: ListOptions): Promise<Thing<T>[]> {
    await this.ensureInitialized()

    let sql = 'SELECT * FROM things WHERE noun = ?'
    const params: unknown[] = [noun]

    if (options?.orderBy) {
      // Note: SQLite can't parameterize column names, but we're ordering by JSON field
      sql += ` ORDER BY json_extract(data, '$.${options.orderBy}')`
      sql += options.order === 'desc' ? ' DESC' : ' ASC'
    }

    if (options?.limit) {
      sql += ` LIMIT ?`
      params.push(options.limit)
    }

    if (options?.offset) {
      sql += ` OFFSET ?`
      params.push(options.offset)
    }

    const rows = [...this.sql.exec(sql, ...params)]
    let results = rows.map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: r.id as string,
        noun: r.noun as string,
        data: JSON.parse(r.data as string) as T,
        createdAt: new Date(r.created_at as number),
        updatedAt: new Date(r.updated_at as number),
      }
    })

    // Apply where filter in JS (for JSON field matching)
    if (options?.where) {
      results = results.filter((t) => {
        for (const [key, value] of Object.entries(options.where!)) {
          if ((t.data as Record<string, unknown>)[key] !== value) {
            return false
          }
        }
        return true
      })
    }

    return results
  }

  async find<T>(noun: string, where: Partial<T>): Promise<Thing<T>[]> {
    return this.list<T>(noun, { where: where as Record<string, unknown> })
  }

  async update<T>(id: string, data: Partial<T>): Promise<Thing<T>> {
    await this.ensureInitialized()

    const existing = await this.get<T>(id)
    if (!existing) throw new Error(`Thing not found: ${id}`)

    const updated = { ...existing.data, ...data } as T
    const now = Date.now()

    this.sql.exec(
      `UPDATE things SET data = ?, updated_at = ? WHERE id = ?`,
      JSON.stringify(updated),
      now,
      id
    )

    return {
      ...existing,
      data: updated,
      updatedAt: new Date(now),
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized()

    const result = this.sql.exec('DELETE FROM things WHERE id = ?', id)
    return result.rowsWritten > 0
  }

  async search<T>(query: string, options?: ListOptions): Promise<Thing<T>[]> {
    await this.ensureInitialized()

    const q = `%${query.toLowerCase()}%`
    let sql = `SELECT * FROM things WHERE LOWER(data) LIKE ?`
    const params: unknown[] = [q]

    if (options?.limit) {
      sql += ` LIMIT ?`
      params.push(options.limit)
    }

    const rows = [...this.sql.exec(sql, ...params)]
    return rows.map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: r.id as string,
        noun: r.noun as string,
        data: JSON.parse(r.data as string) as T,
        createdAt: new Date(r.created_at as number),
        updatedAt: new Date(r.updated_at as number),
      }
    })
  }

  // ==================== Actions ====================

  async perform<T>(verb: string, subject?: string, object?: string, data?: T): Promise<Action<T>> {
    await this.ensureInitialized()

    const id = crypto.randomUUID()
    const now = Date.now()

    this.sql.exec(
      `INSERT INTO actions (id, verb, subject, object, data, status, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      verb,
      subject ?? null,
      object ?? null,
      data ? JSON.stringify(data) : null,
      'completed',
      now,
      now
    )

    return {
      id,
      verb,
      subject,
      object,
      data,
      status: 'completed',
      createdAt: new Date(now),
      completedAt: new Date(now),
    }
  }

  async getAction<T>(id: string): Promise<Action<T> | null> {
    await this.ensureInitialized()

    const rows = [...this.sql.exec('SELECT * FROM actions WHERE id = ?', id)]
    if (rows.length === 0) return null

    const row = rows[0] as Record<string, unknown>
    return {
      id: row.id as string,
      verb: row.verb as string,
      subject: row.subject as string | undefined,
      object: row.object as string | undefined,
      data: row.data ? (JSON.parse(row.data as string) as T) : undefined,
      status: row.status as ActionStatus,
      createdAt: new Date(row.created_at as number),
      completedAt: row.completed_at ? new Date(row.completed_at as number) : undefined,
    }
  }

  async listActions<T>(options?: ActionOptions): Promise<Action<T>[]> {
    await this.ensureInitialized()

    let sql = 'SELECT * FROM actions WHERE 1=1'
    const params: unknown[] = []

    if (options?.verb) {
      sql += ' AND verb = ?'
      params.push(options.verb)
    }

    if (options?.subject) {
      sql += ' AND subject = ?'
      params.push(options.subject)
    }

    if (options?.object) {
      sql += ' AND object = ?'
      params.push(options.object)
    }

    if (options?.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status]
      sql += ` AND status IN (${statuses.map(() => '?').join(', ')})`
      params.push(...statuses)
    }

    if (options?.limit) {
      sql += ' LIMIT ?'
      params.push(options.limit)
    }

    const rows = [...this.sql.exec(sql, ...params)]
    return rows.map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: r.id as string,
        verb: r.verb as string,
        subject: r.subject as string | undefined,
        object: r.object as string | undefined,
        data: r.data ? (JSON.parse(r.data as string) as T) : undefined,
        status: r.status as ActionStatus,
        createdAt: new Date(r.created_at as number),
        completedAt: r.completed_at ? new Date(r.completed_at as number) : undefined,
      }
    })
  }

  // ==================== Graph Traversal ====================

  async related<T>(
    id: string,
    verb?: string,
    direction: 'out' | 'in' | 'both' = 'out'
  ): Promise<Thing<T>[]> {
    const edgesList = await this.edges(id, verb, direction)
    const relatedIds = new Set<string>()

    for (const edge of edgesList) {
      if (direction === 'out' || direction === 'both') {
        if (edge.subject === id && edge.object) {
          relatedIds.add(edge.object)
        }
      }
      if (direction === 'in' || direction === 'both') {
        if (edge.object === id && edge.subject) {
          relatedIds.add(edge.subject)
        }
      }
    }

    const results: Thing<T>[] = []
    for (const relatedId of relatedIds) {
      const thing = await this.get<T>(relatedId)
      if (thing) results.push(thing)
    }

    return results
  }

  async edges<T>(
    id: string,
    verb?: string,
    direction: 'out' | 'in' | 'both' = 'out'
  ): Promise<Action<T>[]> {
    await this.ensureInitialized()

    let sql: string
    const params: unknown[] = []

    if (direction === 'out') {
      sql = 'SELECT * FROM actions WHERE subject = ?'
      params.push(id)
    } else if (direction === 'in') {
      sql = 'SELECT * FROM actions WHERE object = ?'
      params.push(id)
    } else {
      sql = 'SELECT * FROM actions WHERE subject = ? OR object = ?'
      params.push(id, id)
    }

    if (verb) {
      sql += ' AND verb = ?'
      params.push(verb)
    }

    const rows = [...this.sql.exec(sql, ...params)]
    return rows.map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: r.id as string,
        verb: r.verb as string,
        subject: r.subject as string | undefined,
        object: r.object as string | undefined,
        data: r.data ? (JSON.parse(r.data as string) as T) : undefined,
        status: r.status as ActionStatus,
        createdAt: new Date(r.created_at as number),
        completedAt: r.completed_at ? new Date(r.completed_at as number) : undefined,
      }
    })
  }

  async close(): Promise<void> {
    // No-op for Durable Objects (SQLite persists automatically)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const namespaceId = url.searchParams.get('ns') ?? 'default'

    const id = env.NS.idFromName(namespaceId)
    const stub = env.NS.get(id)

    return stub.fetch(request)
  },
}
