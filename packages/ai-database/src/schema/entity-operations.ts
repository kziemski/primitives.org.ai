/**
 * Entity Operations Factory
 *
 * Contains the createEntityOperations<T>() function that creates typed CRUD operations
 * for database entities. This includes get, list, find, create, update, upsert, delete,
 * search, forEach, draft, and resolve operations.
 *
 * @packageDocumentation
 */

import type { ParsedEntity, ParsedSchema } from '../types.js'

import type {
  DraftOptions,
  ResolveOptions,
  ListOptions,
  SearchOptions,
  SemanticSearchOptions,
  HybridSearchOptions,
  ReferenceSpec,
  Draft,
  Resolved,
} from './types.js'

import type { DBProvider, SemanticSearchResult, HybridSearchResult } from './provider.js'
import { resolveProvider, hasSemanticSearch, hasHybridSearch } from './provider.js'
import { hydrateEntity, resolveReferenceSpec } from './resolve.js'
import {
  resolveForwardExact,
  generateAIFields,
  generateContextAwareValue,
  generateNaturalLanguageContent,
  generateEntity,
} from './cascade.js'
import { resolveBackwardFuzzy, resolveForwardFuzzy, getFuzzyThreshold } from './semantic.js'

// =============================================================================
// Entity Operations Configuration Type
// =============================================================================

/**
 * Configuration for creating entity operations
 */
export interface EntityOperationsConfig {
  /** The type name for the entity */
  typeName: string
  /** The parsed entity definition */
  entity: ParsedEntity
  /** The full parsed schema */
  schema: ParsedSchema
}

// =============================================================================
// Entity Operations Interface
// =============================================================================

/**
 * Operations available on each entity type
 */
export interface EntityOperations<T> {
  get(id: string): Promise<T | null>
  list(options?: ListOptions): Promise<T[]>
  find(where: Partial<T>): Promise<T[]>
  search(query: string, options?: SearchOptions): Promise<T[]>
  create(data: Omit<T, '$id' | '$type'>): Promise<T>
  create(id: string, data: Omit<T, '$id' | '$type'>): Promise<T>
  update(id: string, data: Partial<Omit<T, '$id' | '$type'>>): Promise<T>
  upsert(id: string, data: Omit<T, '$id' | '$type'>): Promise<T>
  delete(id: string): Promise<boolean>
  forEach(callback: (entity: T) => void | Promise<void>): Promise<void>
  forEach(options: ListOptions, callback: (entity: T) => void | Promise<void>): Promise<void>
  semanticSearch?(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<Array<T & { $score: number }>>
  hybridSearch?(
    query: string,
    options?: HybridSearchOptions
  ): Promise<
    Array<T & { $rrfScore: number; $ftsRank: number; $semanticRank: number; $score: number }>
  >
  draft?(data: Partial<Omit<T, '$id' | '$type'>>, options?: DraftOptions): Promise<Draft<T>>
  resolve?(draft: Draft<T>, options?: ResolveOptions): Promise<Resolved<T>>
}

// =============================================================================
// Entity Operations Factory
// =============================================================================

/**
 * Create typed CRUD operations for a database entity
 *
 * This function creates the full set of operations for working with a specific
 * entity type in the database, including:
 * - get/list/find for reading
 * - create/update/upsert/delete for writing
 * - search/semanticSearch/hybridSearch for querying
 * - forEach for iteration
 * - draft/resolve for two-phase entity creation
 *
 * @param typeName - The type name for the entity
 * @param entity - The parsed entity definition
 * @param schema - The full parsed schema
 * @returns EntityOperations<T> with all available methods
 */
export function createEntityOperations<T>(
  typeName: string,
  entity: ParsedEntity,
  schema: ParsedSchema
): EntityOperations<T> {
  return {
    async get(id: string): Promise<T | null> {
      const provider = await resolveProvider()
      const result = await provider.get(typeName, id)
      if (!result) return null
      return hydrateEntity(result, entity, schema, resolveProvider) as T
    },

    async list(options?: ListOptions): Promise<T[]> {
      const provider = await resolveProvider()
      const results = await provider.list(typeName, options)
      return Promise.all(results.map((r) => hydrateEntity(r, entity, schema, resolveProvider) as T))
    },

    async find(where: Partial<T>): Promise<T[]> {
      const provider = await resolveProvider()
      const results = await provider.list(typeName, {
        where: where as Record<string, unknown>,
      })
      return Promise.all(results.map((r) => hydrateEntity(r, entity, schema, resolveProvider) as T))
    },

    async search(query: string, options?: SearchOptions): Promise<T[]> {
      const provider = await resolveProvider()
      const results = await provider.search(typeName, query, options)
      return Promise.all(results.map((r) => hydrateEntity(r, entity, schema, resolveProvider) as T))
    },

    async create(
      idOrData: string | Omit<T, '$id' | '$type'>,
      maybeData?: Omit<T, '$id' | '$type'>
    ): Promise<T> {
      const provider = await resolveProvider()
      const providedId = typeof idOrData === 'string' ? idOrData : undefined
      const data =
        typeof idOrData === 'string'
          ? (maybeData as Record<string, unknown>)
          : (idOrData as Record<string, unknown>)

      const entityId = providedId || crypto.randomUUID()

      const { data: resolvedData, pendingRelations } = await resolveForwardExact(
        typeName,
        data,
        entity,
        schema,
        provider,
        entityId
      )

      const { data: fuzzyResolvedData, pendingRelations: fuzzyPendingRelations } =
        await resolveForwardFuzzy(typeName, resolvedData, entity, schema, provider, entityId)

      const backwardResolvedData = await resolveBackwardFuzzy(
        typeName,
        fuzzyResolvedData,
        entity,
        schema,
        provider
      )

      const finalData = await generateAIFields(
        backwardResolvedData,
        typeName,
        entity,
        schema,
        provider
      )

      const result = await provider.create(typeName, entityId, finalData)

      for (const rel of pendingRelations) {
        await provider.relate(typeName, entityId, rel.fieldName, rel.targetType, rel.targetId)
      }

      const createdEdgeIds = new Set<string>()
      for (const rel of fuzzyPendingRelations) {
        await provider.relate(typeName, entityId, rel.fieldName, rel.targetType, rel.targetId, {
          matchMode: 'fuzzy',
          similarity: rel.similarity,
          matchedType: rel.matchedType,
        })

        const edgeId = `${typeName}_${rel.fieldName}_${entityId}_${rel.targetId}`
        if (!createdEdgeIds.has(edgeId)) {
          createdEdgeIds.add(edgeId)
          try {
            await provider.create('Edge', edgeId, {
              from: typeName,
              name: rel.fieldName,
              to: rel.targetType,
              direction: 'forward',
              matchMode: 'fuzzy',
              similarity: rel.similarity,
              matchedType: rel.matchedType,
              fromId: entityId,
              toId: rel.targetId,
            })
          } catch {
            // Edge already exists
          }
        }
      }

      return hydrateEntity(result, entity, schema, resolveProvider) as T
    },

    async update(id: string, data: Partial<Omit<T, '$id' | '$type'>>): Promise<T> {
      const provider = await resolveProvider()
      const result = await provider.update(typeName, id, data as Record<string, unknown>)
      return hydrateEntity(result, entity, schema, resolveProvider) as T
    },

    async upsert(id: string, data: Omit<T, '$id' | '$type'>): Promise<T> {
      const provider = await resolveProvider()
      const existing = await provider.get(typeName, id)
      if (existing) {
        const result = await provider.update(typeName, id, data as Record<string, unknown>)
        return hydrateEntity(result, entity, schema, resolveProvider) as T
      }
      const result = await provider.create(typeName, id, data as Record<string, unknown>)
      return hydrateEntity(result, entity, schema, resolveProvider) as T
    },

    async delete(id: string): Promise<boolean> {
      const provider = await resolveProvider()
      return provider.delete(typeName, id)
    },

    async forEach(
      optionsOrCallback: ListOptions | ((entity: T) => void | Promise<void>),
      maybeCallback?: (entity: T) => void | Promise<void>
    ): Promise<void> {
      const options = typeof optionsOrCallback === 'function' ? undefined : optionsOrCallback
      const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback!

      const items = await this.list(options)
      for (const item of items) {
        await callback(item)
      }
    },

    async semanticSearch(
      query: string,
      options?: SemanticSearchOptions
    ): Promise<Array<T & { $score: number }>> {
      const provider = await resolveProvider()
      if (hasSemanticSearch(provider)) {
        const results: SemanticSearchResult[] = await provider.semanticSearch(
          typeName,
          query,
          options
        )
        return Promise.all(
          results.map(
            (r: SemanticSearchResult) =>
              ({
                ...hydrateEntity(r, entity, schema, resolveProvider),
                $score: r.$score,
              } as T & { $score: number })
          )
        )
      }
      return []
    },

    async hybridSearch(
      query: string,
      options?: HybridSearchOptions
    ): Promise<
      Array<T & { $rrfScore: number; $ftsRank: number; $semanticRank: number; $score: number }>
    > {
      const provider = await resolveProvider()
      if (hasHybridSearch(provider)) {
        const results: HybridSearchResult[] = await provider.hybridSearch(typeName, query, options)
        return Promise.all(
          results.map(
            (r: HybridSearchResult) =>
              ({
                ...hydrateEntity(r, entity, schema, resolveProvider),
                $rrfScore: r.$rrfScore,
                $ftsRank: r.$ftsRank,
                $semanticRank: r.$semanticRank,
                $score: r.$score,
              } as T & {
                $rrfScore: number
                $ftsRank: number
                $semanticRank: number
                $score: number
              })
          )
        )
      }
      return []
    },

    async draft(
      data: Partial<Omit<T, '$id' | '$type'>>,
      options?: DraftOptions
    ): Promise<Draft<T>> {
      const draftData: Record<string, unknown> = { ...data, $phase: 'draft' }
      const refs: Record<string, ReferenceSpec | ReferenceSpec[]> = {}

      // Get the raw schema to detect prompt fields and source instructions
      const rawSchema = entity.schema || {}
      const sourceInstructions = rawSchema.$instructions as string | undefined
      const hasContextDependencies =
        Array.isArray(rawSchema.$context) && rawSchema.$context.length > 0

      for (const [fieldName, field] of entity.fields) {
        if (draftData[fieldName] !== undefined && draftData[fieldName] !== null) {
          continue
        }

        if (field.operator && field.relatedType) {
          // Skip optional relation fields - they shouldn't auto-generate
          if (field.isOptional) continue

          // Skip backward references - they're resolved lazily via hydrateEntity
          // Backward refs find entities that reference US, not entities we create
          if (field.operator === '<-' || field.operator === '<~') continue

          // Relationship field with operator
          const matchMode = field.matchMode ?? (field.operator.includes('~') ? 'fuzzy' : 'exact')

          if (field.isArray) {
            // Get hint value for array fuzzy matching (e.g., categoriesHint for categories field)
            const hintKey = `${fieldName}Hint`
            const hintValue = (data as Record<string, unknown>)[hintKey]

            // Get fuzzy threshold from entity schema
            const threshold = field.threshold ?? getFuzzyThreshold(entity)

            // If hint is an array, create one ref spec per hint item
            const hints = Array.isArray(hintValue)
              ? hintValue
              : hintValue
              ? [hintValue]
              : [
                  generateNaturalLanguageContent(
                    fieldName,
                    field.prompt,
                    field.relatedType,
                    data as Record<string, unknown>
                  ),
                ]

            const refSpecs: ReferenceSpec[] = hints.map((hint: unknown) => {
              const generatedText = String(hint)
              return {
                field: fieldName,
                operator: field.operator!,
                type: field.relatedType!,
                unionTypes: field.unionTypes,
                matchMode,
                resolved: false,
                prompt: field.prompt,
                generatedText,
                sourceInstructions,
                threshold,
              }
            })

            // Store the combined generated text for the draft display
            draftData[fieldName] = hints.map(String).join(', ')
            refs[fieldName] = refSpecs

            if (options?.stream && options.onChunk) {
              for (const spec of refSpecs) {
                options.onChunk(spec.generatedText!)
              }
            }
          } else {
            // Get hint value for fuzzy matching (e.g., contentHint for content field)
            const hintKey = `${fieldName}Hint`
            const hintValue = (data as Record<string, unknown>)[hintKey] as string | undefined

            // Get fuzzy threshold from entity schema
            const threshold = field.threshold ?? getFuzzyThreshold(entity)

            // Use hint if available, otherwise generate natural language content
            const generatedText =
              hintValue ||
              generateNaturalLanguageContent(
                fieldName,
                field.prompt,
                field.relatedType,
                data as Record<string, unknown>
              )
            draftData[fieldName] = generatedText

            refs[fieldName] = {
              field: fieldName,
              operator: field.operator,
              type: field.relatedType,
              unionTypes: field.unionTypes,
              matchMode,
              resolved: false,
              prompt: field.prompt,
              generatedText, // This now uses the hint if provided
              sourceInstructions,
              threshold,
            }

            if (options?.stream && options.onChunk) {
              options.onChunk(generatedText)
            }
          }
        } else if (!field.isRelation) {
          // Non-relationship field - check if it's a prompt field
          // Prompt fields have a type that contains spaces, slashes, or question marks
          const isPromptField =
            field.type.includes(' ') || field.type.includes('/') || field.type.includes('?')

          if (isPromptField && !hasContextDependencies) {
            // Generate content for prompt field using the type as the prompt
            // NOTE: Skip generation when entity has $context dependencies, as those fields
            // need the pre-fetched context to generate properly (done in generateAIFields)
            const generatedText = generateContextAwareValue(
              fieldName,
              typeName,
              field.type,
              field.type,
              data as Record<string, unknown>
            )
            draftData[fieldName] = generatedText

            if (options?.stream && options.onChunk) {
              options.onChunk(generatedText)
            }
          }
        }
      }

      draftData.$refs = refs
      return draftData as Draft<T>
    },

    async resolve(draft: Draft<T>, options?: ResolveOptions): Promise<Resolved<T>> {
      // Draft<T> interface requires $phase: 'draft', so we can access it directly
      if (draft.$phase !== 'draft') {
        throw new Error('Cannot resolve entity: not a draft (missing $phase: "draft")')
      }

      const provider = await resolveProvider()
      const resolved: Record<string, unknown> = { ...draft }
      const errors: Array<{ field: string; error: string }> = []

      delete resolved.$refs
      resolved.$phase = 'resolved'

      const refs = draft.$refs

      for (const [fieldName, refSpec] of Object.entries(refs)) {
        try {
          if (Array.isArray(refSpec)) {
            const resolvedIds: string[] = []
            for (const spec of refSpec) {
              const resolvedId = await resolveReferenceSpec(
                spec,
                resolved,
                schema,
                provider,
                generateContextAwareValue,
                generateEntity
              )
              if (resolvedId) {
                resolvedIds.push(resolvedId)
                options?.onResolved?.(fieldName, resolvedId)
              }
            }
            resolved[fieldName] = resolvedIds
          } else {
            const resolvedId = await resolveReferenceSpec(
              refSpec,
              resolved,
              schema,
              provider,
              generateContextAwareValue,
              generateEntity
            )
            if (resolvedId) {
              resolved[fieldName] = resolvedId
              options?.onResolved?.(fieldName, resolvedId)
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          if (options?.onError === 'skip') {
            errors.push({ field: fieldName, error: errorMsg })
          } else {
            throw err
          }
        }
      }

      if (errors.length > 0 || options?.onError === 'skip') {
        // resolved is typed as Record<string, unknown>, so we can assign $errors directly
        resolved.$errors = errors
      }

      return resolved as Resolved<T>
    },
  }
}

// =============================================================================
// Edge Entity Operations Factory
// =============================================================================

/**
 * Create specialized operations for the Edge entity type
 *
 * Edge entities are auto-generated from schema relationships and have
 * restricted write operations (no manual create/update/delete).
 *
 * @param schemaEdgeRecords - Edge records derived from the schema
 * @param getProvider - Function to get the database provider
 * @returns EntityOperations for Edge type
 */
export function createEdgeEntityOperations(
  schemaEdgeRecords: Array<Record<string, unknown>>,
  getProvider: () => Promise<DBProvider>
): EntityOperations<Record<string, unknown>> {
  async function getRuntimeEdges(): Promise<Array<Record<string, unknown>>> {
    try {
      const provider = await getProvider()
      const runtimeEdges = await provider.list('Edge')
      return runtimeEdges
    } catch {
      return []
    }
  }

  async function getAllEdges(): Promise<Array<Record<string, unknown>>> {
    const runtimeEdges = await getRuntimeEdges()
    const runtimeEdgeKeys = new Set(runtimeEdges.map((e) => `${e.from}:${e.name}`))

    const filteredSchemaEdges = schemaEdgeRecords.filter((e) => {
      const key = `${e.from}:${e.name}`
      const hasRuntimeVersion = runtimeEdgeKeys.has(key)
      if (hasRuntimeVersion && e.matchMode === 'fuzzy') {
        return false
      }
      return !hasRuntimeVersion
    })

    return [...filteredSchemaEdges, ...runtimeEdges]
  }

  return {
    async get(id: string) {
      const runtimeEdges = await getRuntimeEdges()
      const runtimeMatch = runtimeEdges.find((e) => e.$id === id || `${e.from}:${e.name}` === id)
      if (runtimeMatch) return { ...runtimeMatch, $type: 'Edge' }
      return schemaEdgeRecords.find((e) => `${e.from}:${e.name}` === id) ?? null
    },

    async list(options?: ListOptions) {
      let results = await getAllEdges()
      if (options?.where) {
        for (const [key, value] of Object.entries(options.where)) {
          results = results.filter((e) => e[key] === value)
        }
      }
      return results.map((e) => ({
        ...e,
        $id: e.$id || `${e.from}:${e.name}`,
        $type: 'Edge',
      }))
    },

    async find(where: Record<string, unknown>) {
      let results = await getAllEdges()
      for (const [key, value] of Object.entries(where)) {
        results = results.filter((e) => e[key] === value)
      }
      return results.map((e) => ({
        ...e,
        $id: e.$id || `${e.from}:${e.name}`,
        $type: 'Edge',
      }))
    },

    async search(query: string) {
      const allEdges = await getAllEdges()
      const queryLower = query.toLowerCase()
      return allEdges
        .filter(
          (e) =>
            String(e.from).toLowerCase().includes(queryLower) ||
            String(e.name).toLowerCase().includes(queryLower) ||
            String(e.to).toLowerCase().includes(queryLower)
        )
        .map((e) => ({
          ...e,
          $id: e.$id || `${e.from}:${e.name}`,
          $type: 'Edge',
        }))
    },

    async create() {
      throw new Error('Cannot manually create Edge records - they are auto-generated')
    },

    async update() {
      throw new Error('Cannot manually update Edge records - they are auto-generated')
    },

    async upsert() {
      throw new Error('Cannot manually upsert Edge records - they are auto-generated')
    },

    async delete() {
      throw new Error('Cannot manually delete Edge records - they are auto-generated')
    },

    async forEach(
      optionsOrCallback: ListOptions | ((entity: Record<string, unknown>) => void | Promise<void>),
      maybeCallback?: (entity: Record<string, unknown>) => void | Promise<void>
    ) {
      const options = typeof optionsOrCallback === 'function' ? undefined : optionsOrCallback
      const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback!
      const items = await this.list(options)
      for (const item of items) {
        await callback(item)
      }
    },

    async semanticSearch() {
      return []
    },

    async hybridSearch() {
      return []
    },
  }
}
