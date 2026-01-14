/**
 * Session Tests - RED PHASE
 *
 * Tests for the Session type used for authentication sessions.
 * These tests WILL FAIL until the implementation is complete in GREEN phase.
 */

import { describe, it, expect } from 'vitest'
import {
  Session,
  SessionSchema,
  isSession,
  createSession,
} from '../src'

describe('Session', () => {
  describe('interface shape', () => {
    it('should have required $id field', () => {
      const session: Session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }
      expect(session.$id).toBe('https://example.com/sessions/1')
    })

    it('should have required $type field with correct value', () => {
      const session: Session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }
      expect(session.$type).toBe('https://schema.org.ai/Session')
    })

    it('should have required identityId field', () => {
      const session: Session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }
      expect(session.identityId).toBe('https://example.com/users/1')
    })

    it('should have required token field', () => {
      const session: Session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }
      expect(session.token).toBe('session-token-abc123')
    })

    it('should have required expiresAt field', () => {
      const expiresAt = new Date(Date.now() + 3600000).toISOString()
      const session: Session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt,
      }
      expect(session.expiresAt).toBe(expiresAt)
    })

    it('should support optional metadata field', () => {
      const session: Session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          device: 'desktop',
        },
      }
      expect(session.metadata).toBeDefined()
      expect(session.metadata?.userAgent).toBe('Mozilla/5.0')
    })
  })

  describe('Zod schema validation', () => {
    it('should validate a valid Session object', () => {
      const result = SessionSchema.safeParse({
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(result.success).toBe(true)
    })

    it('should validate Session with optional metadata', () => {
      const result = SessionSchema.safeParse({
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: { userAgent: 'Mozilla/5.0' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject Session without $id', () => {
      const result = SessionSchema.safeParse({
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject Session without identityId', () => {
      const result = SessionSchema.safeParse({
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject Session without token', () => {
      const result = SessionSchema.safeParse({
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject Session without expiresAt', () => {
      const result = SessionSchema.safeParse({
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
      })
      expect(result.success).toBe(false)
    })

    it('should reject Session with empty token', () => {
      const result = SessionSchema.safeParse({
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: '',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject Session with wrong $type', () => {
      const result = SessionSchema.safeParse({
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject completely invalid data', () => {
      const result = SessionSchema.safeParse({ invalid: 'data' })
      expect(result.success).toBe(false)
    })

    it('should reject non-object values', () => {
      expect(SessionSchema.safeParse(null).success).toBe(false)
      expect(SessionSchema.safeParse(undefined).success).toBe(false)
      expect(SessionSchema.safeParse('string').success).toBe(false)
      expect(SessionSchema.safeParse(123).success).toBe(false)
    })
  })

  describe('isSession type guard', () => {
    it('should return true for valid Session', () => {
      const session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }
      expect(isSession(session)).toBe(true)
    })

    it('should return true for Session with metadata', () => {
      const session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: { userAgent: 'Mozilla/5.0' },
      }
      expect(isSession(session)).toBe(true)
    })

    it('should return false for invalid data', () => {
      expect(isSession({ invalid: 'data' })).toBe(false)
    })

    it('should return false for null', () => {
      expect(isSession(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isSession(undefined)).toBe(false)
    })

    it('should return false for Credential type', () => {
      const credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      }
      expect(isSession(credential)).toBe(false)
    })

    it('should return false for User type', () => {
      const user = {
        $id: 'https://example.com/users/1',
        $type: 'https://schema.org.ai/User',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(isSession(user)).toBe(false)
    })
  })

  describe('createSession factory', () => {
    it('should create a valid Session with required fields', () => {
      const session = createSession({
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(session.$type).toBe('https://schema.org.ai/Session')
      expect(session.identityId).toBe('https://example.com/users/1')
      expect(session.token).toBe('session-token-abc123')
    })

    it('should auto-generate $id', () => {
      const session = createSession({
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(session.$id).toBeDefined()
      expect(session.$id).toMatch(/^https:\/\//)
    })

    it('should allow custom $id override', () => {
      const customId = 'https://custom.com/sessions/custom-1'
      const session = createSession({
        $id: customId,
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(session.$id).toBe(customId)
    })

    it('should accept optional metadata', () => {
      const session = createSession({
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
        },
      })
      expect(session.metadata?.userAgent).toBe('Mozilla/5.0')
      expect(session.metadata?.ipAddress).toBe('192.168.1.1')
    })

    it('should auto-generate token if not provided', () => {
      const session = createSession({
        identityId: 'https://example.com/users/1',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(session.token).toBeDefined()
      expect(session.token.length).toBeGreaterThan(0)
    })

    it('should support default expiration duration', () => {
      const before = Date.now()
      const session = createSession({
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
      })
      const after = Date.now()

      // Default should be some reasonable duration (e.g., 24 hours)
      const expiresAt = new Date(session.expiresAt).getTime()
      expect(expiresAt).toBeGreaterThan(before)
    })

    it('should create session for agent identity', () => {
      const session = createSession({
        identityId: 'https://example.com/agents/1',
        token: 'agent-session-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(session.identityId).toBe('https://example.com/agents/1')
      expect(isSession(session)).toBe(true)
    })

    it('should pass validation after creation', () => {
      const session = createSession({
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(isSession(session)).toBe(true)
      expect(SessionSchema.safeParse(session).success).toBe(true)
    })
  })

  describe('session expiration', () => {
    it('should support checking if session is expired', () => {
      const expiredSession: Session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      }
      const expiresAt = new Date(expiredSession.expiresAt).getTime()
      expect(expiresAt < Date.now()).toBe(true)
    })

    it('should support checking if session is valid', () => {
      const validSession: Session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      }
      const expiresAt = new Date(validSession.expiresAt).getTime()
      expect(expiresAt > Date.now()).toBe(true)
    })
  })
})
