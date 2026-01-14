/**
 * User Tests - RED PHASE
 *
 * Tests for the User type which extends Identity.
 * These tests WILL FAIL until the implementation is complete in GREEN phase.
 */

import { describe, it, expect } from 'vitest'
import {
  User,
  UserSchema,
  isUser,
  createUser,
} from '../src'

describe('User', () => {
  describe('interface shape', () => {
    it('should have required $id field', () => {
      const user: User = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(user.$id).toBe('https://example.com/users/1')
    })

    it('should have required $type field with correct value', () => {
      const user: User = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(user.$type).toBe('https://schema.org.ai/User')
    })

    it('should have required email field', () => {
      const user: User = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(user.email).toBe('test@example.com')
    })

    it('should have required name field', () => {
      const user: User = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(user.name).toBe('Test User')
    })

    it('should support optional profile field', () => {
      const user: User = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: {
          avatar: 'https://example.com/avatar.png',
          bio: 'A test user',
          settings: { theme: 'dark' },
        },
      }
      expect(user.profile).toBeDefined()
      expect(user.profile?.avatar).toBe('https://example.com/avatar.png')
    })

    it('should inherit createdAt and updatedAt from Identity', () => {
      const now = new Date().toISOString()
      const user: User = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: now,
        updatedAt: now,
      }
      expect(user.createdAt).toBe(now)
      expect(user.updatedAt).toBe(now)
    })
  })

  describe('Zod schema validation', () => {
    it('should validate a valid User object', () => {
      const result = UserSchema.safeParse({
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(true)
    })

    it('should validate User with optional profile', () => {
      const result = UserSchema.safeParse({
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: { avatar: 'https://example.com/avatar.png' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject User without email', () => {
      const result = UserSchema.safeParse({
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject User with invalid email format', () => {
      const result = UserSchema.safeParse({
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'not-an-email',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject User without name', () => {
      const result = UserSchema.safeParse({
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject User with wrong $type', () => {
      const result = UserSchema.safeParse({
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/Identity',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject completely invalid data', () => {
      const result = UserSchema.safeParse({ invalid: 'data' })
      expect(result.success).toBe(false)
    })

    it('should reject non-object values', () => {
      expect(UserSchema.safeParse(null).success).toBe(false)
      expect(UserSchema.safeParse(undefined).success).toBe(false)
      expect(UserSchema.safeParse('string').success).toBe(false)
      expect(UserSchema.safeParse(123).success).toBe(false)
    })
  })

  describe('isUser type guard', () => {
    it('should return true for valid User', () => {
      const user = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isUser(user)).toBe(true)
    })

    it('should return true for User with profile', () => {
      const user = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: { avatar: 'https://example.com/avatar.png' },
      }
      expect(isUser(user)).toBe(true)
    })

    it('should return false for invalid data', () => {
      expect(isUser({ invalid: 'data' })).toBe(false)
    })

    it('should return false for null', () => {
      expect(isUser(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isUser(undefined)).toBe(false)
    })

    it('should return false for Identity (base type)', () => {
      const identity = {
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isUser(identity)).toBe(false)
    })

    it('should return false for AgentIdentity', () => {
      const agent = {
        $id: 'https://example.com/agents/1',
        $type: 'https://schema.org.ai/AgentIdentity',
        model: 'claude-3-opus',
        capabilities: ['text'],
        autonomous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isUser(agent)).toBe(false)
    })
  })

  describe('createUser factory', () => {
    it('should create a valid User with required fields', () => {
      const user = createUser({
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(user.$type).toBe('https://schema.org.ai/User')
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
    })

    it('should auto-generate $id', () => {
      const user = createUser({
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(user.$id).toBeDefined()
      expect(user.$id).toMatch(/^https:\/\//)
    })

    it('should auto-generate timestamps', () => {
      const before = new Date().toISOString()
      const user = createUser({
        email: 'test@example.com',
        name: 'Test User',
      })
      const after = new Date().toISOString()
      expect(user.createdAt >= before).toBe(true)
      expect(user.createdAt <= after).toBe(true)
      expect(user.updatedAt >= before).toBe(true)
      expect(user.updatedAt <= after).toBe(true)
    })

    it('should allow custom $id override', () => {
      const customId = 'https://custom.com/users/custom-1'
      const user = createUser({
        $id: customId,
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(user.$id).toBe(customId)
    })

    it('should accept optional profile', () => {
      const user = createUser({
        email: 'test@example.com',
        name: 'Test User',
        profile: { avatar: 'https://example.com/avatar.png' },
      })
      expect(user.profile?.avatar).toBe('https://example.com/avatar.png')
    })

    it('should pass validation after creation', () => {
      const user = createUser({
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(isUser(user)).toBe(true)
      expect(UserSchema.safeParse(user).success).toBe(true)
    })
  })
})
