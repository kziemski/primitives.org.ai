/**
 * AgentIdentity Tests - RED PHASE
 *
 * Tests for the AgentIdentity type which extends Identity for AI agents.
 * These tests WILL FAIL until the implementation is complete in GREEN phase.
 */

import { describe, it, expect } from 'vitest'
import {
  AgentIdentity,
  AgentIdentitySchema,
  isAgentIdentity,
  createAgentIdentity,
} from '../src'

describe('AgentIdentity', () => {
  describe('interface shape', () => {
    it('should have required $id field', () => {
      const agent: AgentIdentity = {
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text', 'code'],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(agent.$id).toBe('https://example.com/agents/1')
    })

    it('should have required $type field with correct value', () => {
      const agent: AgentIdentity = {
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(agent.$type).toBe('https://schema.org.ai/AgentIdentity')
    })

    it('should have required model field', () => {
      const agent: AgentIdentity = {
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(agent.model).toBe('claude-3-opus')
    })

    it('should have required capabilities array', () => {
      const agent: AgentIdentity = {
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text', 'code', 'vision'],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(agent.capabilities).toEqual(['text', 'code', 'vision'])
    })

    it('should have required autonomous boolean', () => {
      const agent: AgentIdentity = {
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(agent.autonomous).toBe(true)
    })

    it('should inherit createdAt and updatedAt from Identity', () => {
      const now = new Date().toISOString()
      const agent: AgentIdentity = {
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: false,
        createdAt: now,
        updatedAt: now,
      }
      expect(agent.createdAt).toBe(now)
      expect(agent.updatedAt).toBe(now)
    })
  })

  describe('Zod schema validation', () => {
    it('should validate a valid AgentIdentity object', () => {
      const result = AgentIdentitySchema.safeParse({
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text', 'code'],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(true)
    })

    it('should validate AgentIdentity with empty capabilities', () => {
      const result = AgentIdentitySchema.safeParse({
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'gpt-4',
        capabilities: [],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(true)
    })

    it('should reject AgentIdentity without model', () => {
      const result = AgentIdentitySchema.safeParse({
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        capabilities: ['text'],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject AgentIdentity without capabilities', () => {
      const result = AgentIdentitySchema.safeParse({
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject AgentIdentity with non-array capabilities', () => {
      const result = AgentIdentitySchema.safeParse({
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: 'text',
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject AgentIdentity without autonomous', () => {
      const result = AgentIdentitySchema.safeParse({
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject AgentIdentity with non-boolean autonomous', () => {
      const result = AgentIdentitySchema.safeParse({
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: 'yes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject AgentIdentity with wrong $type', () => {
      const result = AgentIdentitySchema.safeParse({
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/User',
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject completely invalid data', () => {
      const result = AgentIdentitySchema.safeParse({ invalid: 'data' })
      expect(result.success).toBe(false)
    })

    it('should reject non-object values', () => {
      expect(AgentIdentitySchema.safeParse(null).success).toBe(false)
      expect(AgentIdentitySchema.safeParse(undefined).success).toBe(false)
      expect(AgentIdentitySchema.safeParse('string').success).toBe(false)
      expect(AgentIdentitySchema.safeParse(123).success).toBe(false)
    })
  })

  describe('isAgentIdentity type guard', () => {
    it('should return true for valid AgentIdentity', () => {
      const agent = {
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text', 'code'],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isAgentIdentity(agent)).toBe(true)
    })

    it('should return true for autonomous AgentIdentity', () => {
      const agent = {
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isAgentIdentity(agent)).toBe(true)
    })

    it('should return false for invalid data', () => {
      expect(isAgentIdentity({ invalid: 'data' })).toBe(false)
    })

    it('should return false for null', () => {
      expect(isAgentIdentity(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isAgentIdentity(undefined)).toBe(false)
    })

    it('should return false for Identity (base type)', () => {
      const identity = {
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isAgentIdentity(identity)).toBe(false)
    })

    it('should return false for User', () => {
      const user = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isAgentIdentity(user)).toBe(false)
    })
  })

  describe('createAgentIdentity factory', () => {
    it('should create a valid AgentIdentity with required fields', () => {
      const agent = createAgentIdentity({
        model: 'claude-3-opus',
        capabilities: ['text', 'code'],
        autonomous: false,
      })
      expect(agent.$type).toBe('https://schema.org.ai/AgentIdentity')
      expect(agent.model).toBe('claude-3-opus')
      expect(agent.capabilities).toEqual(['text', 'code'])
      expect(agent.autonomous).toBe(false)
    })

    it('should auto-generate $id', () => {
      const agent = createAgentIdentity({
        model: 'gpt-4',
        capabilities: ['text'],
        autonomous: true,
      })
      expect(agent.$id).toBeDefined()
      expect(agent.$id).toMatch(/^https:\/\//)
    })

    it('should auto-generate timestamps', () => {
      const before = new Date().toISOString()
      const agent = createAgentIdentity({
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: false,
      })
      const after = new Date().toISOString()
      expect(agent.createdAt >= before).toBe(true)
      expect(agent.createdAt <= after).toBe(true)
      expect(agent.updatedAt >= before).toBe(true)
      expect(agent.updatedAt <= after).toBe(true)
    })

    it('should allow custom $id override', () => {
      const customId = 'https://custom.com/agents/custom-1'
      const agent = createAgentIdentity({
        $id: customId,
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: false,
      })
      expect(agent.$id).toBe(customId)
    })

    it('should create autonomous agent when specified', () => {
      const agent = createAgentIdentity({
        model: 'claude-3-opus',
        capabilities: ['text', 'code', 'execute'],
        autonomous: true,
      })
      expect(agent.autonomous).toBe(true)
    })

    it('should pass validation after creation', () => {
      const agent = createAgentIdentity({
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: false,
      })
      expect(isAgentIdentity(agent)).toBe(true)
      expect(AgentIdentitySchema.safeParse(agent).success).toBe(true)
    })

    it('should support various model names', () => {
      const models = ['claude-3-opus', 'claude-3-sonnet', 'gpt-4', 'gpt-4-turbo', 'gemini-pro']
      for (const model of models) {
        const agent = createAgentIdentity({
          model,
          capabilities: ['text'],
          autonomous: false,
        })
        expect(agent.model).toBe(model)
        expect(isAgentIdentity(agent)).toBe(true)
      }
    })
  })
})
