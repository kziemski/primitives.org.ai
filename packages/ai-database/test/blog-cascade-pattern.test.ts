/**
 * Quick test to verify db4.ai Blog cascade pattern works in ai-database
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DB, setProvider, createMemoryProvider, configureAIGeneration } from '../src/index.js'

// Mock ai-functions to avoid real API calls
vi.mock('ai-functions', () => ({
  generateObject: vi.fn().mockImplementation(async ({ schema }) => {
    // Generate mock data based on schema
    const obj: Record<string, unknown> = {}
    for (const [key, desc] of Object.entries(schema as Record<string, string>)) {
      if (key === 'name') obj[key] = 'MockTopic'
      else if (key === 'title') obj[key] = 'Mock Post Title'
      else if (key === 'description') obj[key] = 'Mock description'
      else if (key === 'synopsis') obj[key] = 'Mock synopsis'
      else if (key === 'content') obj[key] = '# Mock content'
      else if (key === 'problem') obj[key] = 'Generated problem'
      else if (key === 'solution') obj[key] = 'Generated solution'
      else obj[key] = `Generated ${key}`
    }
    return { object: obj }
  }),
}))

describe('Blog Cascade Pattern (db4.ai style)', () => {
  beforeEach(() => {
    setProvider(createMemoryProvider())
    configureAIGeneration({ enabled: true, model: 'sonnet' })
    vi.clearAllMocks()
  })

  it('should support prompt-driven forward exact generation (->Type)', async () => {
    const { generateObject } = await import('ai-functions')

    const { db } = DB({
      Startup: {
        name: 'string',
        idea: 'What problem does this solve? ->Idea',
      },
      Idea: {
        problem: 'string',
        solution: 'string',
      },
    })

    const startup = await db.Startup.create({ name: 'TestStartup' })

    // generateObject should be called for the Idea
    expect(generateObject).toHaveBeenCalled()

    // Access the idea
    const idea = await startup.idea
    expect(idea).toBeDefined()
    expect(idea.$type).toBe('Idea')
    expect(idea.problem).toBe('Generated problem')
    expect(idea.solution).toBe('Generated solution')
  })

  it('should handle Company -> Product cascade', async () => {
    const { generateObject } = await import('ai-functions')

    const { db } = DB({
      Company: {
        name: 'string',
        product: 'Generate a product for this company ->Product',
      },
      Product: {
        name: 'string',
        description: 'string',
      },
    })

    const company = await db.Company.create({ name: 'Acme Corp' })

    expect(company).toBeDefined()
    expect(company.$type).toBe('Company')
    expect(company.name).toBe('Acme Corp')

    // Access the product (should be generated via forward exact)
    const product = await company.product
    expect(product).toBeDefined()
    expect(product.$type).toBe('Product')

    // Verify generateObject was called
    expect(generateObject).toHaveBeenCalled()
  })

  it('should cascade through multiple levels', async () => {
    const { generateObject } = await import('ai-functions')
    vi.clearAllMocks()

    const { db } = DB({
      Blog: {
        title: 'string',
        topic: 'Generate the main topic ->Topic',
      },
      Topic: {
        name: 'string',
        post: 'Write a blog post about this topic ->Post',
      },
      Post: {
        title: 'string',
        content: 'string',
      },
    })

    const blog = await db.Blog.create({ title: 'AI Services Blog' })

    expect(blog).toBeDefined()
    expect(blog.title).toBe('AI Services Blog')

    // Access topic (level 1 cascade)
    const topic = await blog.topic
    expect(topic).toBeDefined()
    expect(topic.$type).toBe('Topic')

    // Access post (level 2 cascade)
    const post = await topic.post
    expect(post).toBeDefined()
    expect(post.$type).toBe('Post')

    // Verify generateObject was called for both Topic and Post
    expect(generateObject).toHaveBeenCalled()
  })

  it('should include context in generation prompt', async () => {
    const { generateObject } = await import('ai-functions')
    vi.clearAllMocks()

    const { db } = DB({
      Company: {
        $instructions: 'This is a B2B SaaS company',
        name: 'string',
        industry: 'string',
        product: 'Generate a product suited for this company ->Product',
      },
      Product: {
        name: 'string',
        description: 'string',
      },
    })

    await db.Company.create({
      name: 'TechCorp',
      industry: 'Enterprise Software',
    })

    // Check that generateObject was called with context
    expect(generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('TechCorp'),
      })
    )
  })

  it('should handle backward references (<-Type)', async () => {
    const { db } = DB({
      Author: {
        name: 'string',
        posts: ['<-Post.author'], // Posts that reference this author
      },
      Post: {
        title: 'string',
        author: '->Author',
      },
    })

    // Create an author
    const author = await db.Author.create({ name: 'Jane Doe' })

    // Create posts that reference the author
    await db.Post.create({ title: 'First Post', author: author.$id })
    await db.Post.create({ title: 'Second Post', author: author.$id })

    // Get the author's posts via backward reference
    const authorWithPosts = await db.Author.get(author.$id)
    const posts = await authorWithPosts?.posts

    expect(Array.isArray(posts)).toBe(true)
    expect(posts.length).toBe(2)
    expect(posts.map((p: { title: string }) => p.title)).toContain('First Post')
    expect(posts.map((p: { title: string }) => p.title)).toContain('Second Post')
  })
})
