import { describe, it, expect, beforeEach } from 'vitest'
import type { DigitalObjectsProvider, Noun, Verb, Thing, Action } from './types'
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
  })
})
