/**
 * ai-database Adapter
 *
 * Wraps a DigitalObjectsProvider to provide the ai-database DBProvider interface.
 * This enables ai-database to use digital-objects as its storage backend.
 */

import type {
  DigitalObjectsProvider,
  Thing,
  Action,
  ListOptions as DOListOptions,
} from './types.js'

// These types match ai-database's DBProvider interface
export interface ListOptions {
  limit?: number
  offset?: number
  where?: Record<string, unknown>
  orderBy?: string
  order?: 'asc' | 'desc'
}

export interface SearchOptions extends ListOptions {
  fields?: string[]
}

export interface SemanticSearchOptions extends SearchOptions {
  embedding?: number[]
  minScore?: number
}

export interface HybridSearchOptions extends SearchOptions {
  semanticWeight?: number
  ftsWeight?: number
  minScore?: number
}

/**
 * ai-database DBProvider interface (simplified)
 */
export interface DBProvider {
  // Entity operations
  get(type: string, id: string): Promise<Record<string, unknown> | null>
  list(type: string, options?: ListOptions): Promise<Record<string, unknown>[]>
  search(type: string, query: string, options?: SearchOptions): Promise<Record<string, unknown>[]>
  create(
    type: string,
    id: string | undefined,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>>
  update(type: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>
  delete(type: string, id: string): Promise<boolean>

  // Relation operations
  related(type: string, id: string, relation: string): Promise<Record<string, unknown>[]>
  relate(
    fromType: string,
    fromId: string,
    relation: string,
    toType: string,
    toId: string,
    metadata?: { matchMode?: 'exact' | 'fuzzy'; similarity?: number; matchedType?: string }
  ): Promise<void>
  unrelate(
    fromType: string,
    fromId: string,
    relation: string,
    toType: string,
    toId: string
  ): Promise<void>
}

/**
 * Convert Thing to entity format (with $id, $type)
 */
function thingToEntity<T>(
  thing: Thing<T>
): Record<string, unknown> & { $id: string; $type: string } {
  return {
    $id: thing.id,
    $type: thing.noun,
    ...thing.data,
  } as Record<string, unknown> & { $id: string; $type: string }
}

/**
 * Extract data from entity (remove $id, $type)
 */
function entityToData(entity: Record<string, unknown>): Record<string, unknown> {
  const { $id, $type, ...data } = entity
  return data
}

/**
 * Create a DBProvider adapter from a DigitalObjectsProvider
 */
export function createDBProviderAdapter(provider: DigitalObjectsProvider): DBProvider {
  return {
    async get(type: string, id: string): Promise<Record<string, unknown> | null> {
      const thing = await provider.get(id)
      if (!thing || thing.noun !== type) return null
      return thingToEntity(thing)
    },

    async list(type: string, options?: ListOptions): Promise<Record<string, unknown>[]> {
      const things = await provider.list(type, options as DOListOptions)
      return things.map(thingToEntity)
    },

    async search(
      type: string,
      query: string,
      options?: SearchOptions
    ): Promise<Record<string, unknown>[]> {
      const things = await provider.search(query, { ...options, where: { ...options?.where } })
      // Filter by type since search is global
      return things.filter((t) => t.noun === type).map(thingToEntity)
    },

    async create(
      type: string,
      id: string | undefined,
      data: Record<string, unknown>
    ): Promise<Record<string, unknown>> {
      // Ensure noun is defined
      const existingNoun = await provider.getNoun(type)
      if (!existingNoun) {
        await provider.defineNoun({ name: type })
      }

      const thing = await provider.create(type, entityToData(data), id)
      return thingToEntity(thing)
    },

    async update(
      type: string,
      id: string,
      data: Record<string, unknown>
    ): Promise<Record<string, unknown>> {
      const thing = await provider.update(id, entityToData(data))
      return thingToEntity(thing)
    },

    async delete(type: string, id: string): Promise<boolean> {
      return provider.delete(id)
    },

    async related(type: string, id: string, relation: string): Promise<Record<string, unknown>[]> {
      // ai-database expects related entities of a specific type via a relation
      // digital-objects uses verb as the relation type
      const things = await provider.related(id, relation, 'both')
      // Filter by expected type
      return things.filter((t) => t.noun === type).map(thingToEntity)
    },

    async relate(
      fromType: string,
      fromId: string,
      relation: string,
      toType: string,
      toId: string,
      metadata?: { matchMode?: 'exact' | 'fuzzy'; similarity?: number; matchedType?: string }
    ): Promise<void> {
      // Ensure verb is defined
      const existingVerb = await provider.getVerb(relation)
      if (!existingVerb) {
        await provider.defineVerb({ name: relation })
      }

      await provider.perform(relation, fromId, toId, metadata)
    },

    async unrelate(
      fromType: string,
      fromId: string,
      relation: string,
      toType: string,
      toId: string
    ): Promise<void> {
      // Find the action(s) matching this relation and delete them
      const actions = await provider.listActions({
        verb: relation,
        subject: fromId,
        object: toId,
      })

      // Delete all matching actions (for GDPR compliance)
      for (const action of actions) {
        await provider.deleteAction(action.id)
      }
    },
  }
}
