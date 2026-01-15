/**
 * NS Client - HTTP client wrapper for NS Durable Object
 *
 * Allows using NS like a regular DigitalObjectsProvider via HTTP.
 */

import type {
  DigitalObjectsProvider,
  Noun,
  NounDefinition,
  Verb,
  VerbDefinition,
  Thing,
  Action,
  ListOptions,
  ActionOptions,
} from './types.js'

export interface NSClientOptions {
  /** Base URL of the NS worker */
  baseUrl: string
  /** Namespace ID */
  namespace?: string
  /** Custom fetch function (useful for Workers Service Bindings) */
  fetch?: typeof fetch
}

/**
 * NSClient - Class-based HTTP client for NS Durable Object
 *
 * Provides a DigitalObjectsProvider interface over HTTP, allowing
 * Workers to communicate with NS Durable Objects via fetch.
 *
 * @example
 * ```ts
 * // From a Cloudflare Worker
 * const client = new NSClient({
 *   baseUrl: 'https://ns.example.com',
 *   namespace: 'my-tenant',
 * })
 *
 * const post = await client.create('Post', { title: 'Hello' })
 * ```
 *
 * @example
 * ```ts
 * // With Service Binding
 * const client = new NSClient({
 *   baseUrl: 'http://ns', // Service binding name
 *   namespace: 'my-tenant',
 *   fetch: env.NS.fetch.bind(env.NS), // Service binding fetch
 * })
 * ```
 */
export class NSClient implements DigitalObjectsProvider {
  private readonly baseUrl: string
  private readonly namespace: string
  private readonly fetchFn: typeof fetch

  constructor(options: NSClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.namespace = options.namespace ?? 'default'
    this.fetchFn = options.fetch ?? fetch
  }

  private url(path: string, extraParams?: URLSearchParams): string {
    const params = new URLSearchParams()
    params.set('ns', this.namespace)
    if (extraParams) {
      extraParams.forEach((value, key) => params.set(key, value))
    }
    return `${this.baseUrl}${path}?${params}`
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
    extraParams?: URLSearchParams
  ): Promise<T> {
    const res = await this.fetchFn(this.url(path, extraParams), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`NS request failed: ${res.status} ${text}`)
    }

    return res.json() as Promise<T>
  }

  // ==================== Nouns ====================

  async defineNoun(def: NounDefinition): Promise<Noun> {
    return this.request('/nouns', {
      method: 'POST',
      body: JSON.stringify(def),
    })
  }

  async getNoun(name: string): Promise<Noun | null> {
    try {
      return await this.request(`/nouns/${encodeURIComponent(name)}`)
    } catch {
      return null
    }
  }

  async listNouns(): Promise<Noun[]> {
    return this.request('/nouns')
  }

  // ==================== Verbs ====================

  async defineVerb(def: VerbDefinition): Promise<Verb> {
    return this.request('/verbs', {
      method: 'POST',
      body: JSON.stringify(def),
    })
  }

  async getVerb(name: string): Promise<Verb | null> {
    try {
      return await this.request(`/verbs/${encodeURIComponent(name)}`)
    } catch {
      return null
    }
  }

  async listVerbs(): Promise<Verb[]> {
    return this.request('/verbs')
  }

  // ==================== Things ====================

  async create<T>(noun: string, data: T, id?: string): Promise<Thing<T>> {
    return this.request('/things', {
      method: 'POST',
      body: JSON.stringify({ noun, data, id }),
    })
  }

  async get<T>(id: string): Promise<Thing<T> | null> {
    try {
      return await this.request(`/things/${encodeURIComponent(id)}`)
    } catch {
      return null
    }
  }

  async list<T>(noun: string, options?: ListOptions): Promise<Thing<T>[]> {
    const params = new URLSearchParams({ noun })
    if (options?.limit) params.set('limit', String(options.limit))
    if (options?.offset) params.set('offset', String(options.offset))
    if (options?.orderBy) params.set('orderBy', options.orderBy)
    if (options?.order) params.set('order', options.order)

    const results = await this.request<Thing<T>[]>('/things', undefined, params)

    // Apply where filter client-side (NS server doesn't support where in URL)
    if (options?.where) {
      return results.filter((thing) => {
        for (const [key, value] of Object.entries(options.where!)) {
          if ((thing.data as Record<string, unknown>)[key] !== value) {
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
    return this.request(`/things/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.request<{ deleted: boolean }>(`/things/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    return result.deleted
  }

  async search<T>(query: string, options?: ListOptions): Promise<Thing<T>[]> {
    const params = new URLSearchParams({ q: query })
    if (options?.limit) params.set('limit', String(options.limit))
    return this.request('/search', undefined, params)
  }

  // ==================== Actions ====================

  async perform<T>(verb: string, subject?: string, object?: string, data?: T): Promise<Action<T>> {
    return this.request('/actions', {
      method: 'POST',
      body: JSON.stringify({ verb, subject, object, data }),
    })
  }

  async getAction<T>(id: string): Promise<Action<T> | null> {
    try {
      return await this.request(`/actions/${encodeURIComponent(id)}`)
    } catch {
      return null
    }
  }

  async listActions<T>(options?: ActionOptions): Promise<Action<T>[]> {
    const params = new URLSearchParams()
    if (options?.verb) params.set('verb', options.verb)
    if (options?.subject) params.set('subject', options.subject)
    if (options?.object) params.set('object', options.object)
    if (options?.limit) params.set('limit', String(options.limit))
    if (options?.status) {
      const status = Array.isArray(options.status) ? options.status[0] : options.status
      if (status) params.set('status', status)
    }
    return this.request('/actions', undefined, params)
  }

  // ==================== Graph Traversal ====================

  async related<T>(
    id: string,
    verb?: string,
    direction?: 'out' | 'in' | 'both'
  ): Promise<Thing<T>[]> {
    const params = new URLSearchParams()
    if (verb) params.set('verb', verb)
    if (direction) params.set('direction', direction)
    return this.request(`/related/${encodeURIComponent(id)}`, undefined, params)
  }

  async edges<T>(
    id: string,
    verb?: string,
    direction?: 'out' | 'in' | 'both'
  ): Promise<Action<T>[]> {
    const params = new URLSearchParams()
    if (verb) params.set('verb', verb)
    if (direction) params.set('direction', direction)
    return this.request(`/edges/${encodeURIComponent(id)}`, undefined, params)
  }

  // ==================== Lifecycle ====================

  async close(): Promise<void> {
    // No-op for HTTP client
  }
}

/**
 * Create an NS client that talks to the Durable Object via HTTP
 *
 * @deprecated Use `new NSClient(options)` instead for better TypeScript support
 */
export function createNSClient(options: NSClientOptions): DigitalObjectsProvider {
  return new NSClient(options)
}
