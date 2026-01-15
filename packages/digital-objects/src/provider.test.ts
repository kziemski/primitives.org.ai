import { describe, it, expect, beforeEach } from 'vitest'
import type { DigitalObjectsProvider, Noun, Verb, Thing, Action } from './types'
import { DEFAULT_LIMIT, MAX_LIMIT } from './types'
import { createMemoryProvider } from './memory-provider'

const createProvider = createMemoryProvider

describe('DigitalObjectsProvider Contract', () => {
  let provider: DigitalObjectsProvider

  beforeEach(() => {
    provider = createProvider()
  })

  describe('Nouns', () => {
    it('should define a noun with auto-derived forms', async () => {
      const noun = await provider.defineNoun({ name: 'Post' })

      expect(noun.name).toBe('Post')
      expect(noun.singular).toBe('post')
      expect(noun.plural).toBe('posts')
      expect(noun.slug).toBe('post')
      expect(noun.createdAt).toBeInstanceOf(Date)
    })

    it('should define a noun with explicit forms', async () => {
      const noun = await provider.defineNoun({
        name: 'Person',
        singular: 'person',
        plural: 'people',
        description: 'A human being',
      })

      expect(noun.plural).toBe('people')
      expect(noun.description).toBe('A human being')
    })

    it('should get a noun by name', async () => {
      await provider.defineNoun({ name: 'Author' })
      const noun = await provider.getNoun('Author')

      expect(noun).not.toBeNull()
      expect(noun!.name).toBe('Author')
    })

    it('should return null for unknown noun', async () => {
      const noun = await provider.getNoun('Unknown')
      expect(noun).toBeNull()
    })

    it('should list all nouns', async () => {
      await provider.defineNoun({ name: 'Post' })
      await provider.defineNoun({ name: 'Author' })

      const nouns = await provider.listNouns()
      expect(nouns).toHaveLength(2)
    })
  })

  describe('Verbs', () => {
    it('should define a verb with auto-derived conjugations', async () => {
      const verb = await provider.defineVerb({ name: 'create' })

      expect(verb.name).toBe('create')
      expect(verb.action).toBe('create')
      expect(verb.act).toBe('creates')
      expect(verb.activity).toBe('creating')
      expect(verb.event).toBe('created')
      expect(verb.reverseBy).toBe('createdBy')
      expect(verb.reverseAt).toBe('createdAt')
    })

    it('should define a verb with inverse', async () => {
      const verb = await provider.defineVerb({
        name: 'publish',
        inverse: 'unpublish',
      })

      expect(verb.inverse).toBe('unpublish')
    })

    it('should handle irregular verbs', async () => {
      const verb = await provider.defineVerb({
        name: 'write',
        event: 'written', // Irregular past participle
      })

      expect(verb.event).toBe('written')
    })
  })

  describe('Things', () => {
    beforeEach(async () => {
      await provider.defineNoun({ name: 'Post' })
    })

    it('should create a thing', async () => {
      const thing = await provider.create('Post', { title: 'Hello World' })

      expect(thing.id).toBeDefined()
      expect(thing.noun).toBe('Post')
      expect(thing.data.title).toBe('Hello World')
      expect(thing.createdAt).toBeInstanceOf(Date)
    })

    it('should create a thing with custom ID', async () => {
      const thing = await provider.create('Post', { title: 'Custom' }, 'custom-id')
      expect(thing.id).toBe('custom-id')
    })

    it('should get a thing by ID', async () => {
      const created = await provider.create('Post', { title: 'Test' })
      const thing = await provider.get(created.id)

      expect(thing).not.toBeNull()
      expect(thing!.data.title).toBe('Test')
    })

    it('should list things by noun', async () => {
      await provider.create('Post', { title: 'First' })
      await provider.create('Post', { title: 'Second' })

      const posts = await provider.list('Post')
      expect(posts).toHaveLength(2)
    })

    it('should update a thing', async () => {
      const created = await provider.create('Post', { title: 'Original' })
      const updated = await provider.update(created.id, { title: 'Updated' })

      expect(updated.data.title).toBe('Updated')
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.createdAt.getTime())
    })

    it('should delete a thing', async () => {
      const created = await provider.create('Post', { title: 'ToDelete' })
      const deleted = await provider.delete(created.id)

      expect(deleted).toBe(true)
      expect(await provider.get(created.id)).toBeNull()
    })

    it('should find things by criteria', async () => {
      await provider.create('Post', { title: 'Draft', status: 'draft' })
      await provider.create('Post', { title: 'Published', status: 'published' })

      const drafts = await provider.find('Post', { status: 'draft' })
      expect(drafts).toHaveLength(1)
      expect(drafts[0].data.title).toBe('Draft')
    })
  })

  describe('Actions (Events + Edges)', () => {
    beforeEach(async () => {
      await provider.defineNoun({ name: 'Author' })
      await provider.defineNoun({ name: 'Post' })
      await provider.defineVerb({ name: 'write' })
      await provider.defineVerb({ name: 'publish' })
    })

    it('should perform an action (create edge)', async () => {
      const author = await provider.create('Author', { name: 'Alice' })
      const post = await provider.create('Post', { title: 'My Post' })

      const action = await provider.perform('write', author.id, post.id)

      expect(action.id).toBeDefined()
      expect(action.verb).toBe('write')
      expect(action.subject).toBe(author.id)
      expect(action.object).toBe(post.id)
      expect(action.status).toBe('completed')
    })

    it('should perform an action with data', async () => {
      const post = await provider.create('Post', { title: 'Draft' })

      const action = await provider.perform('publish', undefined, post.id, {
        publishedAt: new Date(),
        publishedBy: 'admin',
      })

      expect(action.data?.publishedBy).toBe('admin')
    })

    it('should traverse graph via related()', async () => {
      const author = await provider.create('Author', { name: 'Bob' })
      const post1 = await provider.create('Post', { title: 'Post 1' })
      const post2 = await provider.create('Post', { title: 'Post 2' })

      await provider.perform('write', author.id, post1.id)
      await provider.perform('write', author.id, post2.id)

      // Outbound: what did author write?
      const written = await provider.related(author.id, 'write', 'out')
      expect(written).toHaveLength(2)

      // Inbound: who wrote this post?
      const authors = await provider.related(post1.id, 'write', 'in')
      expect(authors).toHaveLength(1)
      expect(authors[0].data.name).toBe('Bob')
    })

    it('should list actions with filters', async () => {
      const author = await provider.create('Author', { name: 'Carol' })
      const post = await provider.create('Post', { title: 'Test' })

      await provider.perform('write', author.id, post.id)
      await provider.perform('publish', undefined, post.id)

      const writeActions = await provider.listActions({ verb: 'write' })
      expect(writeActions).toHaveLength(1)
    })

    it('should get edges for a thing', async () => {
      const author = await provider.create('Author', { name: 'Dan' })
      const post = await provider.create('Post', { title: 'Test' })

      await provider.perform('write', author.id, post.id)

      const outEdges = await provider.edges(author.id, undefined, 'out')
      expect(outEdges).toHaveLength(1)
      expect(outEdges[0].verb).toBe('write')
    })

    it('should delete an action (GDPR compliance)', async () => {
      const author = await provider.create('Author', { name: 'Eve' })
      const post = await provider.create('Post', { title: 'Test' })

      const action = await provider.perform('write', author.id, post.id)

      // Verify action exists
      expect(await provider.getAction(action.id)).not.toBeNull()

      // Delete the action
      const deleted = await provider.deleteAction(action.id)
      expect(deleted).toBe(true)

      // Verify action is gone
      expect(await provider.getAction(action.id)).toBeNull()
    })

    it('should return false when deleting non-existent action', async () => {
      const deleted = await provider.deleteAction('non-existent-id')
      expect(deleted).toBe(false)
    })

    it('should remove edge from graph after deleteAction', async () => {
      const author = await provider.create('Author', { name: 'Frank' })
      const post = await provider.create('Post', { title: 'Test' })

      const action = await provider.perform('write', author.id, post.id)

      // Verify edge exists
      const edgesBefore = await provider.edges(author.id, 'write', 'out')
      expect(edgesBefore).toHaveLength(1)

      // Delete the action
      await provider.deleteAction(action.id)

      // Verify edge is gone
      const edgesAfter = await provider.edges(author.id, 'write', 'out')
      expect(edgesAfter).toHaveLength(0)
    })

    it('should remove relation after deleteAction', async () => {
      const author = await provider.create('Author', { name: 'Grace' })
      const post = await provider.create('Post', { title: 'Test' })

      const action = await provider.perform('write', author.id, post.id)

      // Verify relation exists
      const relatedBefore = await provider.related(author.id, 'write', 'out')
      expect(relatedBefore).toHaveLength(1)

      // Delete the action
      await provider.deleteAction(action.id)

      // Verify relation is gone
      const relatedAfter = await provider.related(author.id, 'write', 'out')
      expect(relatedAfter).toHaveLength(0)
    })
  })

  describe('Query Limits', () => {
    beforeEach(async () => {
      await provider.defineNoun({ name: 'Item' })
      await provider.defineVerb({ name: 'connect' })
    })

    it('should apply DEFAULT_LIMIT when no limit specified for list()', async () => {
      // Create more items than DEFAULT_LIMIT
      const itemCount = DEFAULT_LIMIT + 50
      for (let i = 0; i < itemCount; i++) {
        await provider.create('Item', { index: i })
      }

      const items = await provider.list('Item')
      expect(items).toHaveLength(DEFAULT_LIMIT)
    })

    it('should enforce MAX_LIMIT for list() even when higher limit requested', async () => {
      // Create more items than MAX_LIMIT
      const itemCount = MAX_LIMIT + 50
      for (let i = 0; i < itemCount; i++) {
        await provider.create('Item', { index: i })
      }

      const items = await provider.list('Item', { limit: MAX_LIMIT + 500 })
      expect(items).toHaveLength(MAX_LIMIT)
    })

    it('should respect user limit when below MAX_LIMIT for list()', async () => {
      for (let i = 0; i < 50; i++) {
        await provider.create('Item', { index: i })
      }

      const items = await provider.list('Item', { limit: 10 })
      expect(items).toHaveLength(10)
    })

    it('should apply DEFAULT_LIMIT when no limit specified for search()', async () => {
      const itemCount = DEFAULT_LIMIT + 50
      for (let i = 0; i < itemCount; i++) {
        await provider.create('Item', { name: `searchable-${i}` })
      }

      const results = await provider.search('searchable')
      expect(results).toHaveLength(DEFAULT_LIMIT)
    })

    it('should enforce MAX_LIMIT for search() even when higher limit requested', async () => {
      const itemCount = MAX_LIMIT + 50
      for (let i = 0; i < itemCount; i++) {
        await provider.create('Item', { name: `searchable-${i}` })
      }

      const results = await provider.search('searchable', { limit: MAX_LIMIT + 500 })
      expect(results).toHaveLength(MAX_LIMIT)
    })

    it('should apply DEFAULT_LIMIT when no limit specified for listActions()', async () => {
      const item = await provider.create('Item', { name: 'target' })
      const actionCount = DEFAULT_LIMIT + 50
      for (let i = 0; i < actionCount; i++) {
        await provider.perform('connect', undefined, item.id, { index: i })
      }

      const actions = await provider.listActions()
      expect(actions).toHaveLength(DEFAULT_LIMIT)
    })

    it('should enforce MAX_LIMIT for listActions() even when higher limit requested', async () => {
      const item = await provider.create('Item', { name: 'target' })
      const actionCount = MAX_LIMIT + 50
      for (let i = 0; i < actionCount; i++) {
        await provider.perform('connect', undefined, item.id, { index: i })
      }

      const actions = await provider.listActions({ limit: MAX_LIMIT + 500 })
      expect(actions).toHaveLength(MAX_LIMIT)
    })

    it('should apply DEFAULT_LIMIT when no limit specified for edges()', async () => {
      const source = await provider.create('Item', { name: 'source' })
      const edgeCount = DEFAULT_LIMIT + 50
      for (let i = 0; i < edgeCount; i++) {
        const target = await provider.create('Item', { name: `target-${i}` })
        await provider.perform('connect', source.id, target.id)
      }

      const edges = await provider.edges(source.id, 'connect', 'out')
      expect(edges).toHaveLength(DEFAULT_LIMIT)
    })

    it('should apply DEFAULT_LIMIT when no limit specified for related()', async () => {
      const source = await provider.create('Item', { name: 'source' })
      const relatedCount = DEFAULT_LIMIT + 50
      for (let i = 0; i < relatedCount; i++) {
        const target = await provider.create('Item', { name: `target-${i}` })
        await provider.perform('connect', source.id, target.id)
      }

      const related = await provider.related(source.id, 'connect', 'out')
      expect(related).toHaveLength(DEFAULT_LIMIT)
    })

    it('should export DEFAULT_LIMIT and MAX_LIMIT constants', () => {
      expect(DEFAULT_LIMIT).toBe(100)
      expect(MAX_LIMIT).toBe(1000)
    })
  })
})
