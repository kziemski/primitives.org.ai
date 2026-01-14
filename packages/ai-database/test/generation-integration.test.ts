/**
 * Tests for ai-functions generateObject integration
 *
 * Verifies that ai-database uses generateObject from ai-functions
 * for AI-powered entity field generation instead of placeholder values.
 *
 * IMPORTANT: These tests use REAL AI calls through Cloudflare AI Gateway.
 * No mocks are used - all AI generation happens with actual LLM calls.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DB, setProvider, createMemoryProvider, configureAIGeneration } from '../src/index.js'

describe('ai-functions Generation Integration', () => {
  beforeEach(() => {
    setProvider(createMemoryProvider())
    // Enable AI generation with real AI calls
    configureAIGeneration({ enabled: true, model: 'sonnet' })
  })

  describe('Forward Exact (->) with generateObject', () => {
    it('should generate forward exact fields with AI', async () => {
      const { db } = DB({
        Startup: {
          name: 'string',
          idea: 'What problem does this solve? ->Idea',
        },
        Idea: { problem: 'string', solution: 'string' },
      })

      const startup = await db.Startup.create({ name: 'DevFlow' })
      const idea = await startup.idea

      // Verify the Idea was generated with proper structure
      expect(idea).toBeDefined()
      expect(idea.$type).toBe('Idea')
      expect(idea.$id).toBeTruthy()

      // AI-generated fields should be non-empty strings
      expect(typeof idea.problem).toBe('string')
      expect(idea.problem.length).toBeGreaterThan(0)
      expect(typeof idea.solution).toBe('string')
      expect(idea.solution.length).toBeGreaterThan(0)
    }, 30000)

    it('should pass target entity schema to AI generation', async () => {
      const { db } = DB({
        Startup: {
          name: 'string',
          idea: 'Generate a startup idea ->Idea',
        },
        Idea: { problem: 'string', solution: 'string' },
      })

      const startup = await db.Startup.create({ name: 'TechCorp' })
      const idea = await startup.idea

      // Verify generated entity has correct structure matching schema
      expect(idea.$type).toBe('Idea')
      expect('problem' in idea).toBe(true)
      expect('solution' in idea).toBe(true)
      expect(typeof idea.problem).toBe('string')
      expect(typeof idea.solution).toBe('string')
    }, 30000)

    it('should use AI-generated values for entity creation', async () => {
      const { db } = DB({
        Startup: {
          name: 'string',
          idea: 'What problem? ->Idea',
        },
        Idea: { problem: 'string', solution: 'string' },
      })

      const startup = await db.Startup.create({ name: 'AIStartup' })
      const idea = await startup.idea

      // The generated values should be meaningful strings (not placeholders)
      expect(idea.problem).toBeTruthy()
      expect(idea.solution).toBeTruthy()

      // AI-generated content should have substance (more than just field names)
      expect(idea.problem.length).toBeGreaterThan(5)
      expect(idea.solution.length).toBeGreaterThan(5)
    }, 30000)

    it('should generate entities for minimal arrow syntax', async () => {
      const { db } = DB({
        Startup: {
          name: 'string',
          idea: '->Idea',
        },
        Idea: { description: 'string' },
      })

      const startup = await db.Startup.create({ name: 'TestCo' })
      const idea = await startup.idea

      // Even with minimal prompt, should generate valid entity
      expect(idea).toBeDefined()
      expect(idea.$type).toBe('Idea')
      expect(typeof idea.description).toBe('string')
      expect(idea.description.length).toBeGreaterThan(0)
    }, 30000)
  })

  describe('Context-aware generation', () => {
    it('should include parent entity data in generation context', async () => {
      const { db } = DB({
        Company: {
          name: 'string',
          industry: 'string',
          product: 'What product suits this company? ->Product',
        },
        Product: { name: 'string', description: 'string' },
      })

      const company = await db.Company.create({ name: 'HealthTech', industry: 'Healthcare' })
      const product = await company.product

      // Product should be generated with proper structure
      expect(product).toBeDefined()
      expect(product.$type).toBe('Product')
      expect(typeof product.name).toBe('string')
      expect(typeof product.description).toBe('string')

      // The AI should incorporate parent context (healthcare/healthtech theme)
      // We can't assert exact content, but we can verify non-empty meaningful output
      expect(product.name.length).toBeGreaterThan(0)
      expect(product.description.length).toBeGreaterThan(0)
    }, 30000)

    it('should include $instructions in generation context', async () => {
      const { db } = DB({
        Startup: {
          $instructions: 'This is a B2B SaaS startup targeting enterprise customers',
          name: 'string',
          pitch: 'Generate a pitch ->Pitch',
        },
        Pitch: { headline: 'string', value_prop: 'string' },
      })

      const startup = await db.Startup.create({ name: 'EnterpriseCo' })
      const pitch = await startup.pitch

      // Pitch should be generated with proper structure
      expect(pitch).toBeDefined()
      expect(pitch.$type).toBe('Pitch')
      expect(typeof pitch.headline).toBe('string')
      expect(typeof pitch.value_prop).toBe('string')

      // AI should generate meaningful content influenced by $instructions
      expect(pitch.headline.length).toBeGreaterThan(0)
      expect(pitch.value_prop.length).toBeGreaterThan(0)
    }, 30000)
  })

  describe('Prompt field generation', () => {
    // NOTE: Direct prompt fields (e.g., description: 'Write a description')
    // are not supported in the current schema parser. AI generation for
    // non-relationship fields is handled via $instructions context.
    // This test verifies that pattern works through forward exact relations.

    it('should use $instructions context for generation', async () => {
      const { db } = DB({
        Product: {
          $instructions: 'This is a premium B2B SaaS product',
          name: 'string',
          details: '->ProductDetails',
        },
        ProductDetails: { headline: 'string', content: 'string' },
      })

      const product = await db.Product.create({ name: 'SuperWidget' })
      const details = await product.details

      // ProductDetails should be generated with AI
      expect(details).toBeDefined()
      expect(details.$type).toBe('ProductDetails')
      expect(typeof details.headline).toBe('string')
      expect(typeof details.content).toBe('string')
      expect(details.headline.length).toBeGreaterThan(0)
      expect(details.content.length).toBeGreaterThan(0)
    }, 30000)
  })

  describe('Value provided behavior', () => {
    it('should not generate AI content when value is provided', async () => {
      const { db } = DB({
        Startup: {
          name: 'string',
          idea: 'What problem? ->Idea',
        },
        Idea: { problem: 'string', solution: 'string' },
      })

      // Create an idea manually first
      const existingIdea = await db.Idea.create({
        problem: 'Manual problem text',
        solution: 'Manual solution text',
      })

      // Create startup with the existing idea
      const startup = await db.Startup.create({
        name: 'ManualCo',
        idea: existingIdea.$id,
      })

      const idea = await startup.idea

      // The manually created values should be preserved
      expect(idea.problem).toBe('Manual problem text')
      expect(idea.solution).toBe('Manual solution text')
    }, 30000)
  })

  describe('Complex schema generation', () => {
    it('should generate entities with multiple AI-generated fields', async () => {
      const { db } = DB({
        Company: {
          name: 'string',
          profile: 'Generate a company profile ->Profile',
        },
        Profile: {
          mission: 'string',
          vision: 'string',
          values: 'string',
          tagline: 'string',
        },
      })

      const company = await db.Company.create({ name: 'InnovateTech' })
      const profile = await company.profile

      // All fields should be generated with proper types
      expect(profile.$type).toBe('Profile')
      expect(typeof profile.mission).toBe('string')
      expect(typeof profile.vision).toBe('string')
      expect(typeof profile.values).toBe('string')
      expect(typeof profile.tagline).toBe('string')

      // All fields should have content
      expect(profile.mission.length).toBeGreaterThan(0)
      expect(profile.vision.length).toBeGreaterThan(0)
      expect(profile.values.length).toBeGreaterThan(0)
      expect(profile.tagline.length).toBeGreaterThan(0)
    }, 30000)
  })
})
