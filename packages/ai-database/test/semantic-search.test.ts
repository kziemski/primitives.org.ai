/**
 * Tests for Semantic Search Infrastructure
 *
 * RED phase: These tests define the expected behavior for semantic search:
 * - Automatic embedding generation on entity create
 * - semanticSearch() method for similarity search
 * - hybridSearch() combining FTS and semantic search with RRF scoring
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DB, setProvider, createMemoryProvider } from '../src/index.js'
import type { DatabaseSchema } from '../src/index.js'

describe('semantic search infrastructure', () => {
  beforeEach(() => {
    setProvider(createMemoryProvider())
  })

  describe('embedding generation on create', () => {
    const schema = {
      Article: {
        title: 'string',
        content: 'markdown',
        summary: 'string?',
      },
    } as const satisfies DatabaseSchema

    it('generates embedding artifact when entity is created', async () => {
      const { db, artifacts } = DB(schema)

      // Create an article with content that should be embedded
      const article = await db.Article.create('article-1', {
        title: 'Introduction to Machine Learning',
        content: 'Machine learning is a subset of artificial intelligence that enables systems to learn from data.',
      })

      // The embedding should be stored as an artifact
      const embedding = await artifacts.get(`Article/${article.$id}`, 'embedding')

      expect(embedding).not.toBeNull()
      expect(embedding?.type).toBe('embedding')
      expect(embedding?.content).toBeDefined()
      // Embeddings are typically float arrays
      expect(Array.isArray(embedding?.content)).toBe(true)
      expect((embedding?.content as number[]).length).toBeGreaterThan(0)
    })

    it('generates embedding from text fields', async () => {
      const { db, artifacts } = DB(schema)

      const article = await db.Article.create('article-2', {
        title: 'Deep Learning Fundamentals',
        content: '# Neural Networks\n\nDeep learning uses neural networks with multiple layers.',
        summary: 'A brief overview of deep learning concepts.',
      })

      const embedding = await artifacts.get(`Article/${article.$id}`, 'embedding')

      expect(embedding).not.toBeNull()
      // The embedding should have metadata about which fields were embedded
      expect(embedding?.metadata?.fields).toContain('title')
      expect(embedding?.metadata?.fields).toContain('content')
    })

    it('regenerates embedding when entity is updated', async () => {
      const { db, artifacts } = DB(schema)

      const article = await db.Article.create('article-3', {
        title: 'Original Title',
        content: 'Original content about databases.',
      })

      const originalEmbedding = await artifacts.get(`Article/${article.$id}`, 'embedding')
      const originalHash = originalEmbedding?.sourceHash

      // Update the content
      await db.Article.update('article-3', {
        title: 'Updated Title',
        content: 'Completely different content about semantic search.',
      })

      const updatedEmbedding = await artifacts.get(`Article/${article.$id}`, 'embedding')

      // The embedding should be regenerated with a new hash
      expect(updatedEmbedding?.sourceHash).not.toBe(originalHash)
    })

    it('stores embedding vector dimensions in metadata', async () => {
      const { db, artifacts } = DB(schema)

      await db.Article.create('article-4', {
        title: 'Test Article',
        content: 'Content for testing vector dimensions.',
      })

      const embedding = await artifacts.get('Article/article-4', 'embedding')

      expect(embedding?.metadata?.dimensions).toBeDefined()
      expect(typeof embedding?.metadata?.dimensions).toBe('number')
      // Common embedding dimensions: 384, 768, 1024, 1536
      expect([384, 768, 1024, 1536]).toContain(embedding?.metadata?.dimensions)
    })
  })

  describe('semanticSearch() method', () => {
    const schema = {
      Document: {
        title: 'string',
        content: 'markdown',
        category: 'string?',
      },
    } as const satisfies DatabaseSchema

    it('finds semantically similar documents', async () => {
      const { db } = DB(schema)

      // Create documents with varying semantic similarity
      await db.Document.create('doc-ml', {
        title: 'Machine Learning Guide',
        content: 'A comprehensive guide to machine learning algorithms and techniques.',
        category: 'tech',
      })

      await db.Document.create('doc-ai', {
        title: 'Artificial Intelligence Overview',
        content: 'An introduction to AI systems and their applications.',
        category: 'tech',
      })

      await db.Document.create('doc-cooking', {
        title: 'Italian Cooking Recipes',
        content: 'Traditional recipes from Italy including pasta and pizza.',
        category: 'food',
      })

      // Search for documents semantically similar to "deep learning neural networks"
      const results = await db.Document.semanticSearch('deep learning neural networks')

      // AI/ML documents should rank higher than cooking
      expect(results.length).toBeGreaterThan(0)
      expect(results[0]?.$id).toMatch(/doc-(ml|ai)/)
      // Results should have a $score field
      expect(results[0]?.$score).toBeDefined()
      expect(typeof results[0]?.$score).toBe('number')
    })

    it('returns entities with $score field', async () => {
      const { db } = DB(schema)

      await db.Document.create('doc-1', {
        title: 'TypeScript Handbook',
        content: 'Learn TypeScript from basics to advanced.',
      })

      const results = await db.Document.semanticSearch('programming languages')

      results.forEach(result => {
        expect(result).toHaveProperty('$score')
        expect(result.$score).toBeGreaterThanOrEqual(0)
        expect(result.$score).toBeLessThanOrEqual(1)
      })
    })

    it('respects similarity threshold', async () => {
      const { db } = DB(schema)

      await db.Document.create('doc-relevant', {
        title: 'Database Optimization',
        content: 'Tips for optimizing database queries and indexes.',
      })

      await db.Document.create('doc-irrelevant', {
        title: 'Garden Design',
        content: 'How to design a beautiful garden with flowers.',
      })

      // Search with high similarity threshold
      const results = await db.Document.semanticSearch('SQL query performance', {
        minScore: 0.7,
      })

      // Only highly relevant documents should be returned
      results.forEach(result => {
        expect(result.$score).toBeGreaterThanOrEqual(0.7)
      })
    })

    it('limits number of results', async () => {
      const { db } = DB(schema)

      // Create many documents
      for (let i = 0; i < 20; i++) {
        await db.Document.create(`doc-${i}`, {
          title: `Programming Tutorial ${i}`,
          content: `Learn about software development and coding patterns.`,
        })
      }

      const results = await db.Document.semanticSearch('software development', {
        limit: 5,
      })

      expect(results.length).toBeLessThanOrEqual(5)
    })

    it('sorts results by similarity score descending', async () => {
      const { db } = DB(schema)

      await db.Document.create('doc-a', {
        title: 'Python Programming',
        content: 'Learn Python programming language basics.',
      })

      await db.Document.create('doc-b', {
        title: 'JavaScript Fundamentals',
        content: 'Understanding JavaScript for web development.',
      })

      await db.Document.create('doc-c', {
        title: 'Advanced Python',
        content: 'Advanced Python programming techniques and best practices.',
      })

      const results = await db.Document.semanticSearch('Python coding')

      // Results should be sorted by score (highest first)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1]!.$score).toBeGreaterThanOrEqual(results[i]!.$score)
      }
    })
  })

  describe('hybridSearch() method', () => {
    const schema = {
      Post: {
        title: 'string',
        body: 'markdown',
        tags: 'string[]',
      },
    } as const satisfies DatabaseSchema

    it('combines FTS and semantic search results', async () => {
      const { db } = DB(schema)

      await db.Post.create('post-1', {
        title: 'React Hooks Tutorial',
        body: 'Learn how to use React hooks like useState and useEffect.',
        tags: ['react', 'hooks', 'frontend'],
      })

      await db.Post.create('post-2', {
        title: 'Vue Composition API',
        body: 'Understanding the Vue 3 Composition API for reactive programming.',
        tags: ['vue', 'frontend'],
      })

      await db.Post.create('post-3', {
        title: 'State Management Patterns',
        body: 'Different patterns for managing application state in modern web apps.',
        tags: ['architecture', 'frontend'],
      })

      // Hybrid search should find both exact matches and semantic matches
      const results = await db.Post.hybridSearch('React useState')

      expect(results.length).toBeGreaterThan(0)
      // Post-1 should rank high (exact keyword match + semantic relevance)
      expect(results.some(r => r.$id === 'post-1')).toBe(true)
    })

    it('returns entities with $rrfScore field', async () => {
      const { db } = DB(schema)

      await db.Post.create('post-a', {
        title: 'GraphQL Introduction',
        body: 'A guide to GraphQL APIs and query language.',
        tags: ['graphql', 'api'],
      })

      const results = await db.Post.hybridSearch('GraphQL queries')

      results.forEach(result => {
        expect(result).toHaveProperty('$rrfScore')
        expect(typeof result.$rrfScore).toBe('number')
        expect(result.$rrfScore).toBeGreaterThan(0)
      })
    })

    it('calculates RRF score correctly', async () => {
      const { db } = DB(schema)

      // Create posts with known relevance patterns
      await db.Post.create('exact-match', {
        title: 'Kubernetes Deployment',
        body: 'How to deploy applications on Kubernetes cluster.',
        tags: ['kubernetes', 'devops'],
      })

      await db.Post.create('semantic-match', {
        title: 'Container Orchestration',
        body: 'Managing Docker containers at scale with orchestration platforms.',
        tags: ['docker', 'containers'],
      })

      const results = await db.Post.hybridSearch('Kubernetes container deployment')

      // RRF formula: score = sum(1 / (k + rank)) where k is typically 60
      // Both FTS and semantic ranks should contribute
      expect(results[0]?.$rrfScore).toBeGreaterThan(0)

      // The result should also have the component scores
      expect(results[0]).toHaveProperty('$ftsRank')
      expect(results[0]).toHaveProperty('$semanticRank')
    })

    it('allows configuring RRF k parameter', async () => {
      const { db } = DB(schema)

      await db.Post.create('post-x', {
        title: 'Testing Best Practices',
        body: 'Unit testing and integration testing strategies.',
        tags: ['testing'],
      })

      // Different k values should affect scoring
      const resultsDefault = await db.Post.hybridSearch('unit tests')
      const resultsHighK = await db.Post.hybridSearch('unit tests', { rrfK: 100 })

      // With higher k, score differences between ranks are smaller
      expect(resultsHighK[0]?.$rrfScore).not.toBe(resultsDefault[0]?.$rrfScore)
    })

    it('allows weighting FTS vs semantic results', async () => {
      const { db } = DB(schema)

      await db.Post.create('post-fts', {
        title: 'Exact Match Title',
        body: 'This post contains the exact search terms.',
        tags: ['exact'],
      })

      await db.Post.create('post-semantic', {
        title: 'Related Concept',
        body: 'This is semantically related but uses different words.',
        tags: ['related'],
      })

      // Weight towards FTS
      const ftsWeighted = await db.Post.hybridSearch('exact search terms', {
        ftsWeight: 0.8,
        semanticWeight: 0.2,
      })

      // Weight towards semantic
      const semanticWeighted = await db.Post.hybridSearch('exact search terms', {
        ftsWeight: 0.2,
        semanticWeight: 0.8,
      })

      // Results should differ based on weighting
      expect(ftsWeighted[0]?.$id).not.toBe(semanticWeighted[0]?.$id)
    })

    it('respects limit and offset options', async () => {
      const { db } = DB(schema)

      // Create many posts
      for (let i = 0; i < 15; i++) {
        await db.Post.create(`post-${i}`, {
          title: `Tech Post ${i}`,
          body: `Technology content about software and development.`,
          tags: ['tech'],
        })
      }

      const page1 = await db.Post.hybridSearch('technology', { limit: 5, offset: 0 })
      const page2 = await db.Post.hybridSearch('technology', { limit: 5, offset: 5 })

      expect(page1.length).toBe(5)
      expect(page2.length).toBe(5)
      // Pages should have different results
      expect(page1[0]?.$id).not.toBe(page2[0]?.$id)
    })
  })

  describe('global semantic search', () => {
    const schema = {
      Article: {
        title: 'string',
        content: 'markdown',
      },
      Comment: {
        body: 'string',
        author: 'string',
      },
    } as const satisfies DatabaseSchema

    it('searches across all entity types', async () => {
      const { db } = DB(schema)

      await db.Article.create('article-1', {
        title: 'Machine Learning Basics',
        content: 'Introduction to ML concepts.',
      })

      await db.Comment.create('comment-1', {
        body: 'Great article about neural networks!',
        author: 'user1',
      })

      // Global semantic search should find matches across types
      const results = await db.semanticSearch('artificial intelligence')

      expect(results.length).toBeGreaterThan(0)
      // Should include results from both types
      const types = new Set(results.map(r => r.$type))
      expect(types.size).toBeGreaterThan(0)
    })

    it('returns results with type information', async () => {
      const { db } = DB(schema)

      await db.Article.create('art-1', {
        title: 'TypeScript Guide',
        content: 'Learn TypeScript programming.',
      })

      await db.Comment.create('com-1', {
        body: 'TypeScript is amazing!',
        author: 'dev',
      })

      const results = await db.semanticSearch('TypeScript')

      results.forEach(result => {
        expect(result.$type).toBeDefined()
        expect(['Article', 'Comment']).toContain(result.$type)
      })
    })
  })

  describe('embedding configuration', () => {
    it('allows configuring which fields to embed', async () => {
      const schema = {
        Product: {
          name: 'string',
          description: 'string',
          sku: 'string',
          price: 'number',
        },
      } as const satisfies DatabaseSchema

      // Configure to only embed name and description, not SKU or price
      const { db, artifacts } = DB(schema, {
        embeddings: {
          Product: {
            fields: ['name', 'description'],
          },
        },
      })

      await db.Product.create('prod-1', {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse for everyday use.',
        sku: 'WM-001',
        price: 29.99,
      })

      const embedding = await artifacts.get('Product/prod-1', 'embedding')

      expect(embedding?.metadata?.fields).toEqual(['name', 'description'])
      expect(embedding?.metadata?.fields).not.toContain('sku')
      expect(embedding?.metadata?.fields).not.toContain('price')
    })

    it('allows disabling embedding for specific types', async () => {
      const schema = {
        Article: {
          title: 'string',
          content: 'markdown',
        },
        AuditLog: {
          action: 'string',
          timestamp: 'datetime',
        },
      } as const satisfies DatabaseSchema

      // Disable embeddings for AuditLog
      const { db, artifacts } = DB(schema, {
        embeddings: {
          AuditLog: false,
        },
      })

      await db.Article.create('art-1', {
        title: 'Test Article',
        content: 'Article content to embed.',
      })

      await db.AuditLog.create('log-1', {
        action: 'user.login',
        timestamp: new Date(),
      })

      const articleEmbedding = await artifacts.get('Article/art-1', 'embedding')
      const logEmbedding = await artifacts.get('AuditLog/log-1', 'embedding')

      expect(articleEmbedding).not.toBeNull()
      expect(logEmbedding).toBeNull()
    })
  })
})
