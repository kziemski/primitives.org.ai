/**
 * Tests for findBestMatchAcrossTypes Utility
 *
 * RED phase: These tests define the expected behavior for a shared semantic search
 * utility that will replace duplicated logic found in:
 * - semantic.ts (lines 242-297, 342-397)
 * - resolve.ts (lines 288-337)
 *
 * The utility should:
 * 1. Search across multiple union types and return the best score match
 * 2. Filter results based on a similarity threshold
 * 3. Exclude already-used entity IDs to prevent duplicates
 * 4. Return null when no matches found above threshold
 * 5. Respect the limit parameter when searching
 *
 * Expected interface (not yet implemented):
 *
 * ```typescript
 * interface BestMatchResult {
 *   match: SemanticSearchResult
 *   type: string
 * }
 *
 * async function findBestMatchAcrossTypes(
 *   typesToSearch: string[],
 *   query: string,
 *   options: {
 *     threshold: number
 *     limit: number
 *     excludeIds?: Set<string>
 *     schema: ParsedSchema
 *     provider: DBProviderExtended
 *   }
 * ): Promise<BestMatchResult | null>
 * ```
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { findBestMatchAcrossTypes, type BestMatchResult } from '../src/schema/search-utils.js'
import type { ParsedSchema } from '../src/types.js'
import type { DBProviderExtended, SemanticSearchResult } from '../src/schema/provider.js'

describe('findBestMatchAcrossTypes utility', () => {
  // Mock provider with semantic search
  let mockProvider: DBProviderExtended
  let mockSchema: ParsedSchema

  beforeEach(() => {
    // Reset mocks before each test
    mockProvider = {
      semanticSearch: vi.fn(),
      // Minimal provider implementation
      get: vi.fn(),
      list: vi.fn(),
      search: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      related: vi.fn(),
      relate: vi.fn(),
      unrelate: vi.fn(),
      setEmbeddingsConfig: vi.fn(),
      hybridSearch: vi.fn(),
      on: vi.fn(),
      emit: vi.fn(),
      listEvents: vi.fn(),
      replayEvents: vi.fn(),
    } as unknown as DBProviderExtended

    // Mock schema with multiple entity types
    mockSchema = {
      entities: new Map([
        ['Technology', { name: 'Technology', fields: new Map() }],
        ['Tool', { name: 'Tool', fields: new Map() }],
        ['Framework', { name: 'Framework', fields: new Map() }],
      ]),
    } as unknown as ParsedSchema
  })

  describe('searching across union types returns best score match', () => {
    it('should return the match with highest score across all types', async () => {
      // Setup: Technology has a 0.75 match, Tool has a 0.92 match
      vi.mocked(mockProvider.semanticSearch).mockImplementation(
        async (type: string): Promise<SemanticSearchResult[]> => {
          if (type === 'Technology') {
            return [{ $id: 'tech-1', $type: 'Technology', $score: 0.75, name: 'React' }]
          }
          if (type === 'Tool') {
            return [{ $id: 'tool-1', $type: 'Tool', $score: 0.92, name: 'VS Code' }]
          }
          return []
        }
      )

      const result = await findBestMatchAcrossTypes(['Technology', 'Tool'], 'development tool', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).not.toBeNull()
      expect(result!.match.$id).toBe('tool-1')
      expect(result!.match.$score).toBe(0.92)
      expect(result!.type).toBe('Tool')
    })

    it('should search all provided types even if first has a match', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([
        { $id: 'match-1', $type: 'Technology', $score: 0.8 },
      ])

      await findBestMatchAcrossTypes(['Technology', 'Tool', 'Framework'], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      // Should have searched all three types
      expect(mockProvider.semanticSearch).toHaveBeenCalledTimes(3)
      expect(mockProvider.semanticSearch).toHaveBeenCalledWith('Technology', 'query', {
        minScore: 0.7,
        limit: 5,
      })
      expect(mockProvider.semanticSearch).toHaveBeenCalledWith('Tool', 'query', {
        minScore: 0.7,
        limit: 5,
      })
      expect(mockProvider.semanticSearch).toHaveBeenCalledWith('Framework', 'query', {
        minScore: 0.7,
        limit: 5,
      })
    })

    it('should skip types that do not exist in schema', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([
        { $id: 'match-1', $type: 'Technology', $score: 0.85 },
      ])

      const result = await findBestMatchAcrossTypes(
        ['Technology', 'NonExistentType', 'Tool'],
        'query',
        {
          threshold: 0.7,
          limit: 5,
          schema: mockSchema,
          provider: mockProvider,
        }
      )

      // Should only search existing types
      expect(mockProvider.semanticSearch).toHaveBeenCalledTimes(2)
      expect(mockProvider.semanticSearch).not.toHaveBeenCalledWith(
        'NonExistentType',
        expect.anything(),
        expect.anything()
      )
    })
  })

  describe('threshold filtering rejects low-score matches', () => {
    it('should reject matches below the threshold', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([
        { $id: 'low-score', $type: 'Technology', $score: 0.65 },
      ])

      const result = await findBestMatchAcrossTypes(['Technology'], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).toBeNull()
    })

    it('should accept matches at exactly the threshold', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([
        { $id: 'exact-threshold', $type: 'Technology', $score: 0.7 },
      ])

      const result = await findBestMatchAcrossTypes(['Technology'], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).not.toBeNull()
      expect(result!.match.$id).toBe('exact-threshold')
    })

    it('should filter within results when some are below threshold', async () => {
      vi.mocked(mockProvider.semanticSearch).mockImplementation(
        async (type: string): Promise<SemanticSearchResult[]> => {
          if (type === 'Technology') {
            return [
              { $id: 'below', $type: 'Technology', $score: 0.65 },
              { $id: 'above', $type: 'Technology', $score: 0.75 },
            ]
          }
          return []
        }
      )

      const result = await findBestMatchAcrossTypes(['Technology'], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      // Should return the one above threshold
      expect(result).not.toBeNull()
      expect(result!.match.$id).toBe('above')
    })
  })

  describe('excluding already-used entity IDs works', () => {
    it('should exclude IDs in the excludeIds set', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([
        { $id: 'used-id', $type: 'Technology', $score: 0.95 },
        { $id: 'unused-id', $type: 'Technology', $score: 0.85 },
      ])

      const excludeIds = new Set(['used-id'])

      const result = await findBestMatchAcrossTypes(['Technology'], 'query', {
        threshold: 0.7,
        limit: 5,
        excludeIds,
        schema: mockSchema,
        provider: mockProvider,
      })

      // Should skip the used ID and return the unused one
      expect(result).not.toBeNull()
      expect(result!.match.$id).toBe('unused-id')
      expect(result!.match.$score).toBe(0.85)
    })

    it('should return null when all matches are excluded', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([
        { $id: 'used-1', $type: 'Technology', $score: 0.95 },
        { $id: 'used-2', $type: 'Technology', $score: 0.85 },
      ])

      const excludeIds = new Set(['used-1', 'used-2'])

      const result = await findBestMatchAcrossTypes(['Technology'], 'query', {
        threshold: 0.7,
        limit: 5,
        excludeIds,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).toBeNull()
    })

    it('should find best match across types when best in one type is excluded', async () => {
      vi.mocked(mockProvider.semanticSearch).mockImplementation(
        async (type: string): Promise<SemanticSearchResult[]> => {
          if (type === 'Technology') {
            return [{ $id: 'excluded-best', $type: 'Technology', $score: 0.98 }]
          }
          if (type === 'Tool') {
            return [{ $id: 'available-second-best', $type: 'Tool', $score: 0.9 }]
          }
          return []
        }
      )

      const excludeIds = new Set(['excluded-best'])

      const result = await findBestMatchAcrossTypes(['Technology', 'Tool'], 'query', {
        threshold: 0.7,
        limit: 5,
        excludeIds,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).not.toBeNull()
      expect(result!.match.$id).toBe('available-second-best')
      expect(result!.type).toBe('Tool')
    })

    it('should work correctly when excludeIds is not provided', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([
        { $id: 'match-1', $type: 'Technology', $score: 0.85 },
      ])

      const result = await findBestMatchAcrossTypes(['Technology'], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).not.toBeNull()
      expect(result!.match.$id).toBe('match-1')
    })
  })

  describe('fallback behavior when no matches found', () => {
    it('should return null when no matches are found', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([])

      const result = await findBestMatchAcrossTypes(['Technology', 'Tool'], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).toBeNull()
    })

    it('should return null when types list is empty', async () => {
      const result = await findBestMatchAcrossTypes([], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).toBeNull()
      // Should not have called semanticSearch at all
      expect(mockProvider.semanticSearch).not.toHaveBeenCalled()
    })

    it('should return null when all types do not exist in schema', async () => {
      const result = await findBestMatchAcrossTypes(['NonExistent1', 'NonExistent2'], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).toBeNull()
      // Should not have called semanticSearch since no types exist
      expect(mockProvider.semanticSearch).not.toHaveBeenCalled()
    })
  })

  describe('limit parameter is respected', () => {
    it('should pass limit to semanticSearch for each type', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([])

      await findBestMatchAcrossTypes(['Technology', 'Tool'], 'query', {
        threshold: 0.7,
        limit: 10,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(mockProvider.semanticSearch).toHaveBeenCalledWith('Technology', 'query', {
        minScore: 0.7,
        limit: 10,
      })
      expect(mockProvider.semanticSearch).toHaveBeenCalledWith('Tool', 'query', {
        minScore: 0.7,
        limit: 10,
      })
    })

    it('should use different limits for different searches', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([])

      await findBestMatchAcrossTypes(['Technology'], 'query1', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      await findBestMatchAcrossTypes(['Technology'], 'query2', {
        threshold: 0.8,
        limit: 20,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(mockProvider.semanticSearch).toHaveBeenCalledWith('Technology', 'query1', {
        minScore: 0.7,
        limit: 5,
      })
      expect(mockProvider.semanticSearch).toHaveBeenCalledWith('Technology', 'query2', {
        minScore: 0.8,
        limit: 20,
      })
    })
  })

  describe('edge cases', () => {
    it('should handle provider returning undefined or null gracefully', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue(
        undefined as unknown as SemanticSearchResult[]
      )

      const result = await findBestMatchAcrossTypes(['Technology'], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).toBeNull()
    })

    it('should handle empty query string', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([
        { $id: 'match-1', $type: 'Technology', $score: 0.8 },
      ])

      const result = await findBestMatchAcrossTypes(['Technology'], '', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      // Should still call semanticSearch with empty string
      expect(mockProvider.semanticSearch).toHaveBeenCalledWith('Technology', '', {
        minScore: 0.7,
        limit: 5,
      })
    })

    it('should preserve all fields from the matched result', async () => {
      vi.mocked(mockProvider.semanticSearch).mockResolvedValue([
        {
          $id: 'rich-match',
          $type: 'Technology',
          $score: 0.9,
          name: 'TypeScript',
          category: 'Language',
          customField: 'custom value',
        },
      ])

      const result = await findBestMatchAcrossTypes(['Technology'], 'query', {
        threshold: 0.7,
        limit: 5,
        schema: mockSchema,
        provider: mockProvider,
      })

      expect(result).not.toBeNull()
      expect(result!.match).toEqual({
        $id: 'rich-match',
        $type: 'Technology',
        $score: 0.9,
        name: 'TypeScript',
        category: 'Language',
        customField: 'custom value',
      })
    })
  })
})
