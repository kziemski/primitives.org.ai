/**
 * Search Utilities
 *
 * Shared utilities for semantic search across union types.
 * Extracted from duplicated logic in:
 * - semantic.ts (lines 242-297, 342-397)
 * - resolve.ts (lines 288-337)
 *
 * @packageDocumentation
 */

import type { ParsedSchema } from '../types.js'
import type { DBProviderExtended, SemanticSearchResult } from './provider.js'

// =============================================================================
// Types
// =============================================================================

/**
 * Provider with semantic search capability (subset of DBProviderExtended)
 */
export type SemanticSearchProvider = Pick<DBProviderExtended, 'semanticSearch'>

/**
 * Result from findBestMatchAcrossTypes
 */
export interface BestMatchResult {
  /** The matched entity with score */
  match: SemanticSearchResult
  /** The type that matched */
  type: string
}

/**
 * Options for findBestMatchAcrossTypes
 */
export interface FindBestMatchOptions {
  /** Minimum similarity score threshold (0-1) */
  threshold: number
  /** Max results to fetch per type */
  limit: number
  /** IDs to exclude from results (already used) */
  excludeIds?: Set<string>
  /** Parsed schema for type validation */
  schema: ParsedSchema
  /** Database provider with semantic search capability */
  provider: SemanticSearchProvider
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Searches across multiple union types and returns the best match by score.
 *
 * This utility centralizes the common pattern of:
 * 1. Iterating through types to search
 * 2. Skipping types not in schema
 * 3. Calling semanticSearch on each type
 * 4. Tracking the best match by score
 * 5. Respecting excludeIds if provided
 * 6. Returning the best match or null
 *
 * @param typesToSearch - Array of type names to search across
 * @param query - The search query string
 * @param options - Search options including threshold, limit, excludeIds
 * @returns Best match result or null if no matches above threshold
 *
 * @example
 * ```ts
 * const result = await findBestMatchAcrossTypes(
 *   ['Technology', 'Tool', 'Framework'],
 *   'development tool',
 *   {
 *     threshold: 0.75,
 *     limit: 10,
 *     excludeIds: usedEntityIds,
 *     schema,
 *     provider,
 *   }
 * )
 * if (result) {
 *   console.log(`Best match: ${result.match.$id} (${result.type}) with score ${result.match.$score}`)
 * }
 * ```
 */
export async function findBestMatchAcrossTypes(
  typesToSearch: string[],
  query: string,
  options: FindBestMatchOptions
): Promise<BestMatchResult | null> {
  const { threshold, limit, excludeIds, schema, provider } = options

  let bestMatch: SemanticSearchResult | undefined
  let bestMatchType: string | undefined

  for (const searchType of typesToSearch) {
    // Only search types that exist in the schema
    if (!schema.entities.has(searchType)) continue

    const matches: SemanticSearchResult[] | undefined = await provider.semanticSearch(
      searchType,
      query,
      { minScore: threshold, limit }
    )

    // Handle providers that might return undefined/null
    if (!matches) continue

    // Find the best match that:
    // 1. Meets the threshold
    // 2. Hasn't been excluded (if excludeIds provided)
    for (const match of matches) {
      const matchId = match.$id

      // Skip if below threshold
      if (match.$score < threshold) continue

      // Skip if excluded
      if (excludeIds?.has(matchId)) continue

      // Track the best match across all types
      if (!bestMatch || match.$score > bestMatch.$score) {
        bestMatch = match
        bestMatchType = searchType
      }
    }
  }

  if (bestMatch && bestMatchType) {
    return {
      match: bestMatch,
      type: bestMatchType,
    }
  }

  return null
}
