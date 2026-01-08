/**
 * Tests for Two-Phase Draft/Resolve Generation Pipeline
 *
 * The two-phase pipeline separates entity generation into:
 * 1. Draft Phase: Generate entities with natural language placeholders for references
 * 2. Resolve Phase: Convert placeholders to actual entity IDs by creating/matching entities
 *
 * This enables:
 * - Streaming draft content to users before relationships are resolved
 * - Batch resolution of multiple references for efficiency
 * - Draft-only mode for preview/editing before final creation
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest'
import { DB } from '../src/schema.js'

describe('Two-Phase Draft/Resolve Generation Pipeline', () => {
  describe('Draft Phase', () => {
    it('should generate entity with natural language placeholders', async () => {
      const { db } = DB({
        Startup: {
          idea: 'What is the core idea? ->Idea',
          customer: 'Who is the customer? ~>Customer',
        },
        Idea: { description: 'string' },
        Customer: { name: 'string' },
      })

      const draft = await db.Startup.draft({ name: 'Acme' })

      expect(draft.$phase).toBe('draft')
      expect(draft.idea).toMatch(/idea|concept|solution/i)
      expect(draft.customer).toMatch(/customer|buyer|user/i)
      expect(draft.$refs).toBeDefined()
    })

    it('should track unresolved references in $refs', async () => {
      const { db } = DB({
        Startup: {
          idea: '->Idea',
          founders: ['->Founder'],
        },
        Idea: { description: 'string' },
        Founder: { name: 'string' },
      })

      const draft = await db.Startup.draft({ name: 'TechCo' })

      expect(draft.$refs).toBeDefined()
      expect(draft.$refs.idea).toBeDefined()
      expect(draft.$refs.idea.type).toBe('Idea')
      expect(draft.$refs.idea.resolved).toBe(false)
      expect(draft.$refs.founders).toBeDefined()
      expect(Array.isArray(draft.$refs.founders)).toBe(true)
    })

    it('should handle fuzzy references with ~> operator', async () => {
      const { db } = DB({
        BlogPost: {
          relatedPosts: ['What posts are related? ~>BlogPost'],
        },
      })

      const draft = await db.BlogPost.draft({ title: 'Intro to AI' })

      expect(draft.$phase).toBe('draft')
      expect(draft.$refs.relatedPosts).toBeDefined()
      expect(draft.$refs.relatedPosts[0]?.matchMode).toBe('fuzzy')
    })

    it('should preserve non-reference fields unchanged', async () => {
      const { db } = DB({
        Article: {
          title: 'string',
          author: '->Author',
          published: 'boolean',
        },
        Author: { name: 'string' },
      })

      const draft = await db.Article.draft({
        title: 'My Article',
        published: false,
      })

      expect(draft.title).toBe('My Article')
      expect(draft.published).toBe(false)
      expect(draft.$phase).toBe('draft')
    })
  })

  describe('Resolve Phase', () => {
    it('should resolve references to actual entity IDs', async () => {
      const { db } = DB({
        Startup: { idea: 'What is the idea? ->Idea' },
        Idea: { description: 'string' },
      })

      const draft = await db.Startup.draft({ name: 'Acme' })
      const resolved = await db.Startup.resolve(draft)

      expect(resolved.$phase).toBe('resolved')
      expect(resolved.idea).toMatch(/^[a-z0-9-]+$/)

      const idea = await db.Idea.get(resolved.idea)
      expect(idea).toBeDefined()
    })

    it('should create referenced entities during resolution', async () => {
      const { db } = DB({
        Project: {
          lead: '->Person',
          sponsor: '->Person',
        },
        Person: { name: 'string', role: 'string' },
      })

      const draft = await db.Project.draft({ name: 'Apollo' })
      const resolved = await db.Project.resolve(draft)

      // Both should be resolved to actual Person entities
      const lead = await db.Person.get(resolved.lead)
      const sponsor = await db.Person.get(resolved.sponsor)

      expect(lead).toBeDefined()
      expect(sponsor).toBeDefined()
      expect(lead.$id).not.toBe(sponsor.$id)
    })

    it('should match existing entities for fuzzy references', async () => {
      const { db } = DB({
        Task: { assignee: 'Find the right person ~>TeamMember' },
        TeamMember: { name: 'string', skills: 'string' },
      })

      // Pre-create a team member
      await db.TeamMember.create({ name: 'Alice', skills: 'engineering' })

      const draft = await db.Task.draft({ title: 'Build API' })
      const resolved = await db.Task.resolve(draft)

      // Should match the existing Alice entity
      const assignee = await db.TeamMember.get(resolved.assignee)
      expect(assignee.name).toBe('Alice')
    })

    it('should batch resolve multiple references efficiently', async () => {
      const { db } = DB({
        Company: {
          ceo: '->Person',
          cto: '->Person',
          cfo: '->Person',
          departments: ['->Department'],
        },
        Person: { name: 'string' },
        Department: { name: 'string' },
      })

      const draft = await db.Company.draft({ name: 'MegaCorp' })
      const resolved = await db.Company.resolve(draft)

      // All references should be resolved
      expect(resolved.ceo).toMatch(/^[a-z0-9-]+$/)
      expect(resolved.cto).toMatch(/^[a-z0-9-]+$/)
      expect(resolved.cfo).toMatch(/^[a-z0-9-]+$/)
      expect(Array.isArray(resolved.departments)).toBe(true)
      expect(resolved.departments.length).toBeGreaterThan(0)
    })

    it('should handle nested reference resolution', async () => {
      const { db } = DB({
        Order: { customer: '->Customer' },
        Customer: { address: '->Address' },
        Address: { city: 'string', country: 'string' },
      })

      const draft = await db.Order.draft({ orderNumber: '12345' })
      const resolved = await db.Order.resolve(draft)

      const customer = await db.Customer.get(resolved.customer)
      expect(customer).toBeDefined()
      // The address field is a thenable reference; await to get the full entity
      const address = await customer.address
      expect(address).toBeDefined()
      expect(address.$id).toMatch(/^[a-z0-9-]+$/)
    })
  })

  describe('Combined create()', () => {
    it('should run both phases by default', async () => {
      const { db } = DB({
        Startup: { idea: '->Idea' },
        Idea: { description: 'string' },
      })

      const startup = await db.Startup.create({ name: 'Acme' })
      expect(startup.$phase).toBeUndefined()

      const idea = await startup.idea
      expect(idea.$type).toBe('Idea')
    })

    it('should support draft-only mode', async () => {
      const { db } = DB({
        Startup: { idea: '->Idea' },
        Idea: {},
      })

      const draft = await db.Startup.create({ name: 'Acme' }, { draftOnly: true })
      expect(draft.$phase).toBe('draft')
    })

    it('should support resolve-later workflow', async () => {
      const { db } = DB({
        Proposal: {
          client: '->Client',
          items: ['->LineItem'],
        },
        Client: { name: 'string' },
        LineItem: { description: 'string', amount: 'number' },
      })

      // Create draft first
      const draft = await db.Proposal.create({ title: 'Q1 Proposal' }, { draftOnly: true })
      expect(draft.$phase).toBe('draft')

      // Later, resolve it
      const resolved = await db.Proposal.resolve(draft)
      expect(resolved.$phase).toBe('resolved')
      expect(resolved.client).toMatch(/^[a-z0-9-]+$/)
    })

    it('should allow editing draft before resolution', async () => {
      const { db } = DB({
        Report: {
          author: '->Analyst',
          reviewer: '->Analyst',
        },
        Analyst: { name: 'string' },
      })

      // Create draft
      const draft = await db.Report.create({ title: 'Q1 Analysis' }, { draftOnly: true })

      // Modify the draft (update natural language description)
      draft.author = 'Senior data analyst with 5+ years experience'
      draft.reviewer = 'Team lead for quality review'

      // Resolve with modifications
      const resolved = await db.Report.resolve(draft)

      const author = await db.Analyst.get(resolved.author)
      const reviewer = await db.Analyst.get(resolved.reviewer)

      expect(author.$id).not.toBe(reviewer.$id)
    })

    it('should emit events for draft and resolve phases', async () => {
      const events: string[] = []

      const { db } = DB({
        Task: { owner: '->User' },
        User: { name: 'string' },
      })

      db.on('draft', (entity) => events.push(`draft:${entity.$type}`))
      db.on('resolve', (entity) => events.push(`resolve:${entity.$type}`))

      await db.Task.create({ title: 'Test Task' })

      expect(events).toContain('draft:Task')
      expect(events).toContain('resolve:Task')
    })
  })

  describe('Error handling', () => {
    it('should throw if resolving non-draft entity', async () => {
      const { db } = DB({
        Item: { ref: '->Other' },
        Other: {},
      })

      const item = await db.Item.create({ name: 'Test' })

      await expect(db.Item.resolve(item)).rejects.toThrow(/not a draft/)
    })

    it('should handle resolution failures gracefully', async () => {
      const { db } = DB({
        Widget: { component: '->Component' },
        Component: { sku: 'string' },
      })

      const draft = await db.Widget.draft({ name: 'Gadget' })

      // Force a resolution failure scenario
      const resolved = await db.Widget.resolve(draft, {
        onError: 'skip',
      })

      expect(resolved.$phase).toBe('resolved')
      expect(resolved.$errors).toBeDefined()
    })

    it('should validate schema references exist', async () => {
      expect(() =>
        DB({
          Invalid: { ref: '->NonExistent' },
        })
      ).toThrow(/NonExistent/)
    })
  })

  describe('Streaming support', () => {
    it('should support streaming draft generation', async () => {
      const { db } = DB({
        Story: {
          plot: 'string',
          characters: ['->Character'],
          setting: '->Location',
        },
        Character: { name: 'string', role: 'string' },
        Location: { name: 'string', description: 'string' },
      })

      const chunks: string[] = []

      const draft = await db.Story.draft(
        { title: 'The Quest' },
        {
          stream: true,
          onChunk: (chunk) => chunks.push(chunk),
        }
      )

      expect(chunks.length).toBeGreaterThan(0)
      expect(draft.$phase).toBe('draft')
    })

    it('should support streaming resolution', async () => {
      const { db } = DB({
        Team: {
          members: ['->Person'],
          projects: ['->Project'],
        },
        Person: { name: 'string' },
        Project: { name: 'string' },
      })

      const draft = await db.Team.draft({ name: 'Alpha Team' })

      const resolvedRefs: string[] = []

      const resolved = await db.Team.resolve(draft, {
        onResolved: (fieldName, entityId) => {
          resolvedRefs.push(`${fieldName}:${entityId}`)
        },
      })

      expect(resolvedRefs.length).toBeGreaterThan(0)
      expect(resolved.$phase).toBe('resolved')
    })
  })
})
