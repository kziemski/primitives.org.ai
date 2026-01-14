/**
 * Identity Tests - RED PHASE
 *
 * Tests for the base Identity interface that all identity types extend.
 * These tests WILL FAIL until the implementation is complete in GREEN phase.
 */

import { describe, it, expect } from 'vitest'
import {
  Identity,
  IdentitySchema,
  isIdentity,
  createIdentity,
} from '../src'

describe('Identity', () => {
  describe('interface shape', () => {
    it('should have required $id field', () => {
      const identity: Identity = {
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(identity.$id).toBe('https://example.com/identities/1')
    })

    it('should have required $type field with correct value', () => {
      const identity: Identity = {
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(identity.$type).toBe('https://schema.org.ai/Identity')
    })

    it('should have required createdAt timestamp', () => {
      const now = new Date().toISOString()
      const identity: Identity = {
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        createdAt: now,
        updatedAt: now,
      }
      expect(identity.createdAt).toBe(now)
    })

    it('should have required updatedAt timestamp', () => {
      const now = new Date().toISOString()
      const identity: Identity = {
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        createdAt: now,
        updatedAt: now,
      }
      expect(identity.updatedAt).toBe(now)
    })
  })

  describe('Zod schema validation', () => {
    it('should validate a valid Identity object', () => {
      const result = IdentitySchema.safeParse({
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(true)
    })

    it('should reject Identity without $id', () => {
      const result = IdentitySchema.safeParse({
        $type: 'https://schema.org.ai/Identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject Identity with wrong $type', () => {
      const result = IdentitySchema.safeParse({
        $id: 'https://example.com/identities/1',
        $type: 'https://wrong.type/Identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject Identity without createdAt', () => {
      const result = IdentitySchema.safeParse({
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        updatedAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject Identity without updatedAt', () => {
      const result = IdentitySchema.safeParse({
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        createdAt: new Date().toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject completely invalid data', () => {
      const result = IdentitySchema.safeParse({ invalid: 'data' })
      expect(result.success).toBe(false)
    })

    it('should reject non-object values', () => {
      expect(IdentitySchema.safeParse(null).success).toBe(false)
      expect(IdentitySchema.safeParse(undefined).success).toBe(false)
      expect(IdentitySchema.safeParse('string').success).toBe(false)
      expect(IdentitySchema.safeParse(123).success).toBe(false)
    })
  })

  describe('isIdentity type guard', () => {
    it('should return true for valid Identity', () => {
      const identity = {
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/Identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isIdentity(identity)).toBe(true)
    })

    it('should return false for invalid data', () => {
      expect(isIdentity({ invalid: 'data' })).toBe(false)
    })

    it('should return false for null', () => {
      expect(isIdentity(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isIdentity(undefined)).toBe(false)
    })

    it('should return false for primitives', () => {
      expect(isIdentity('string')).toBe(false)
      expect(isIdentity(123)).toBe(false)
      expect(isIdentity(true)).toBe(false)
    })

    it('should return false for objects with wrong $type', () => {
      const notIdentity = {
        $id: 'https://example.com/identities/1',
        $type: 'https://schema.org.ai/User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isIdentity(notIdentity)).toBe(false)
    })
  })

  describe('createIdentity factory', () => {
    it('should create a valid Identity with auto-generated $id', () => {
      const identity = createIdentity()
      expect(identity.$id).toBeDefined()
      expect(identity.$id).toMatch(/^https:\/\//)
    })

    it('should create Identity with correct $type', () => {
      const identity = createIdentity()
      expect(identity.$type).toBe('https://schema.org.ai/Identity')
    })

    it('should auto-generate createdAt timestamp', () => {
      const before = new Date().toISOString()
      const identity = createIdentity()
      const after = new Date().toISOString()
      expect(identity.createdAt >= before).toBe(true)
      expect(identity.createdAt <= after).toBe(true)
    })

    it('should auto-generate updatedAt timestamp', () => {
      const before = new Date().toISOString()
      const identity = createIdentity()
      const after = new Date().toISOString()
      expect(identity.updatedAt >= before).toBe(true)
      expect(identity.updatedAt <= after).toBe(true)
    })

    it('should allow custom $id override', () => {
      const customId = 'https://custom.com/identities/custom-1'
      const identity = createIdentity({ $id: customId })
      expect(identity.$id).toBe(customId)
    })

    it('should pass validation after creation', () => {
      const identity = createIdentity()
      expect(isIdentity(identity)).toBe(true)
      expect(IdentitySchema.safeParse(identity).success).toBe(true)
    })
  })
})
