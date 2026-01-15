/**
 * In-memory implementation of DigitalObjectsProvider
 *
 * Used for testing and development. All data is stored in Maps.
 */

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

function generateId(): string {
  return crypto.randomUUID()
}

export class MemoryProvider implements DigitalObjectsProvider {
  private nouns = new Map<string, Noun>()
  private verbs = new Map<string, Verb>()
  private things = new Map<string, Thing>()
  private actions = new Map<string, Action>()

  // ==================== Nouns ====================

  async defineNoun(def: NounDefinition): Promise<Noun> {
    const derived = deriveNoun(def.name)
    const noun: Noun = {
      name: def.name,
      singular: def.singular ?? derived.singular,
      plural: def.plural ?? derived.plural,
      slug: derived.slug,
      description: def.description,
      schema: def.schema,
      createdAt: new Date(),
    }
    this.nouns.set(noun.name, noun)
    return noun
  }

  async getNoun(name: string): Promise<Noun | null> {
    return this.nouns.get(name) ?? null
  }

  async listNouns(): Promise<Noun[]> {
    return Array.from(this.nouns.values())
  }

  // ==================== Verbs ====================

  async defineVerb(def: VerbDefinition): Promise<Verb> {
    const derived = deriveVerb(def.name)
    const verb: Verb = {
      name: def.name,
      action: def.action ?? derived.action,
      act: def.act ?? derived.act,
      activity: def.activity ?? derived.activity,
      event: def.event ?? derived.event,
      reverseBy: def.reverseBy ?? derived.reverseBy,
      reverseAt: derived.reverseAt,
      inverse: def.inverse,
      description: def.description,
      createdAt: new Date(),
    }
    this.verbs.set(verb.name, verb)
    return verb
  }

  async getVerb(name: string): Promise<Verb | null> {
    return this.verbs.get(name) ?? null
  }

  async listVerbs(): Promise<Verb[]> {
    return Array.from(this.verbs.values())
  }

  // ==================== Things ====================

  async create<T>(noun: string, data: T, id?: string): Promise<Thing<T>> {
    const thing: Thing<T> = {
      id: id ?? generateId(),
      noun,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.things.set(thing.id, thing as Thing)
    return thing
  }

  async get<T>(id: string): Promise<Thing<T> | null> {
    return (this.things.get(id) as Thing<T>) ?? null
  }

  async list<T>(noun: string, options?: ListOptions): Promise<Thing<T>[]> {
    let results = Array.from(this.things.values()).filter((t) => t.noun === noun) as Thing<T>[]

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

    if (options?.orderBy) {
      const key = options.orderBy
      const dir = options.order === 'desc' ? -1 : 1
      results.sort((a, b) => {
        const aVal = (a.data as Record<string, unknown>)[key] as
          | string
          | number
          | boolean
          | null
          | undefined
        const bVal = (b.data as Record<string, unknown>)[key] as
          | string
          | number
          | boolean
          | null
          | undefined
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return 1 * dir
        if (bVal == null) return -1 * dir
        if (aVal < bVal) return -1 * dir
        if (aVal > bVal) return 1 * dir
        return 0
      })
    }

    if (options?.offset) {
      results = results.slice(options.offset)
    }

    if (options?.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  async find<T>(noun: string, where: Partial<T>): Promise<Thing<T>[]> {
    return this.list<T>(noun, { where: where as Record<string, unknown> })
  }

  async update<T>(id: string, data: Partial<T>): Promise<Thing<T>> {
    const existing = this.things.get(id)
    if (!existing) {
      throw new Error(`Thing not found: ${id}`)
    }

    // Ensure updatedAt is always strictly newer than createdAt
    const now = new Date()
    const updatedAt =
      now.getTime() <= existing.createdAt.getTime()
        ? new Date(existing.createdAt.getTime() + 1)
        : now

    const updated: Thing<T> = {
      ...existing,
      data: { ...existing.data, ...data } as T,
      updatedAt,
    }
    this.things.set(id, updated as Thing)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.things.delete(id)
  }

  async search<T>(query: string, options?: ListOptions): Promise<Thing<T>[]> {
    const q = query.toLowerCase()
    let results = Array.from(this.things.values()).filter((t) =>
      JSON.stringify(t.data).toLowerCase().includes(q)
    ) as Thing<T>[]

    if (options?.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  // ==================== Actions ====================

  async perform<T>(verb: string, subject?: string, object?: string, data?: T): Promise<Action<T>> {
    const action: Action<T> = {
      id: generateId(),
      verb,
      subject,
      object,
      data,
      status: 'completed' as ActionStatus,
      createdAt: new Date(),
      completedAt: new Date(),
    }
    this.actions.set(action.id, action as Action)
    return action
  }

  async getAction<T>(id: string): Promise<Action<T> | null> {
    return (this.actions.get(id) as Action<T>) ?? null
  }

  async listActions<T>(options?: ActionOptions): Promise<Action<T>[]> {
    let results = Array.from(this.actions.values()) as Action<T>[]

    if (options?.verb) {
      results = results.filter((a) => a.verb === options.verb)
    }

    if (options?.subject) {
      results = results.filter((a) => a.subject === options.subject)
    }

    if (options?.object) {
      results = results.filter((a) => a.object === options.object)
    }

    if (options?.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status]
      results = results.filter((a) => statuses.includes(a.status))
    }

    if (options?.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  // ==================== Graph Traversal ====================

  async related<T>(
    id: string,
    verb?: string,
    direction: 'out' | 'in' | 'both' = 'out'
  ): Promise<Thing<T>[]> {
    const edges = await this.edges(id, verb, direction)
    const relatedIds = new Set<string>()

    for (const edge of edges) {
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
    let results = Array.from(this.actions.values()) as Action<T>[]

    if (verb) {
      results = results.filter((a) => a.verb === verb)
    }

    results = results.filter((a) => {
      if (direction === 'out') return a.subject === id
      if (direction === 'in') return a.object === id
      return a.subject === id || a.object === id
    })

    return results
  }

  // ==================== Lifecycle ====================

  async close(): Promise<void> {
    this.nouns.clear()
    this.verbs.clear()
    this.things.clear()
    this.actions.clear()
  }
}

export function createMemoryProvider(): DigitalObjectsProvider {
  return new MemoryProvider()
}
