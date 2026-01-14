/**
 * Credential Tests - RED PHASE
 *
 * Tests for the Credential type used for authentication credentials.
 * These tests WILL FAIL until the implementation is complete in GREEN phase.
 */

import { describe, it, expect } from 'vitest'
import {
  Credential,
  CredentialSchema,
  isCredential,
  createCredential,
  CredentialType,
} from '../src'

describe('Credential', () => {
  describe('interface shape', () => {
    it('should have required $id field', () => {
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      }
      expect(credential.$id).toBe('https://example.com/credentials/1')
    })

    it('should have required $type field with correct value', () => {
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      }
      expect(credential.$type).toBe('https://schema.org.ai/Credential')
    })

    it('should have required identityId field', () => {
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      }
      expect(credential.identityId).toBe('https://example.com/users/1')
    })

    it('should have required credentialType field', () => {
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'oauth',
      }
      expect(credential.credentialType).toBe('oauth')
    })

    it('should support optional provider field', () => {
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'oauth',
        provider: 'google',
      }
      expect(credential.provider).toBe('google')
    })

    it('should support optional expiresAt field', () => {
      const expiresAt = new Date(Date.now() + 3600000).toISOString()
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'api_key',
        expiresAt,
      }
      expect(credential.expiresAt).toBe(expiresAt)
    })
  })

  describe('CredentialType enum', () => {
    it('should include password type', () => {
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      }
      expect(credential.credentialType).toBe('password')
    })

    it('should include oauth type', () => {
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'oauth',
        provider: 'github',
      }
      expect(credential.credentialType).toBe('oauth')
    })

    it('should include api_key type', () => {
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/agents/1',
        credentialType: 'api_key',
      }
      expect(credential.credentialType).toBe('api_key')
    })

    it('should include sso type', () => {
      const credential: Credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'sso',
        provider: 'okta',
      }
      expect(credential.credentialType).toBe('sso')
    })
  })

  describe('Zod schema validation', () => {
    it('should validate a valid Credential object', () => {
      const result = CredentialSchema.safeParse({
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      })
      expect(result.success).toBe(true)
    })

    it('should validate Credential with all optional fields', () => {
      const result = CredentialSchema.safeParse({
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'oauth',
        provider: 'google',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      expect(result.success).toBe(true)
    })

    it('should reject Credential without $id', () => {
      const result = CredentialSchema.safeParse({
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      })
      expect(result.success).toBe(false)
    })

    it('should reject Credential without identityId', () => {
      const result = CredentialSchema.safeParse({
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        credentialType: 'password',
      })
      expect(result.success).toBe(false)
    })

    it('should reject Credential without credentialType', () => {
      const result = CredentialSchema.safeParse({
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
      })
      expect(result.success).toBe(false)
    })

    it('should reject Credential with invalid credentialType', () => {
      const result = CredentialSchema.safeParse({
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'invalid_type',
      })
      expect(result.success).toBe(false)
    })

    it('should reject Credential with wrong $type', () => {
      const result = CredentialSchema.safeParse({
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      })
      expect(result.success).toBe(false)
    })

    it('should reject completely invalid data', () => {
      const result = CredentialSchema.safeParse({ invalid: 'data' })
      expect(result.success).toBe(false)
    })

    it('should reject non-object values', () => {
      expect(CredentialSchema.safeParse(null).success).toBe(false)
      expect(CredentialSchema.safeParse(undefined).success).toBe(false)
      expect(CredentialSchema.safeParse('string').success).toBe(false)
      expect(CredentialSchema.safeParse(123).success).toBe(false)
    })
  })

  describe('isCredential type guard', () => {
    it('should return true for valid Credential', () => {
      const credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      }
      expect(isCredential(credential)).toBe(true)
    })

    it('should return true for Credential with provider', () => {
      const credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'oauth',
        provider: 'github',
      }
      expect(isCredential(credential)).toBe(true)
    })

    it('should return true for Credential with expiresAt', () => {
      const credential = {
        $id: 'https://example.com/credentials/1',
        $type: 'https://schema.org.ai/Credential',
        identityId: 'https://example.com/users/1',
        credentialType: 'api_key',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }
      expect(isCredential(credential)).toBe(true)
    })

    it('should return false for invalid data', () => {
      expect(isCredential({ invalid: 'data' })).toBe(false)
    })

    it('should return false for null', () => {
      expect(isCredential(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isCredential(undefined)).toBe(false)
    })

    it('should return false for Session type', () => {
      const session = {
        $id: 'https://example.com/sessions/1',
        $type: 'https://schema.org.ai/Session',
        identityId: 'https://example.com/users/1',
        token: 'abc123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }
      expect(isCredential(session)).toBe(false)
    })
  })

  describe('createCredential factory', () => {
    it('should create a valid Credential with required fields', () => {
      const credential = createCredential({
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      })
      expect(credential.$type).toBe('https://schema.org.ai/Credential')
      expect(credential.identityId).toBe('https://example.com/users/1')
      expect(credential.credentialType).toBe('password')
    })

    it('should auto-generate $id', () => {
      const credential = createCredential({
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      })
      expect(credential.$id).toBeDefined()
      expect(credential.$id).toMatch(/^https:\/\//)
    })

    it('should allow custom $id override', () => {
      const customId = 'https://custom.com/credentials/custom-1'
      const credential = createCredential({
        $id: customId,
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      })
      expect(credential.$id).toBe(customId)
    })

    it('should accept optional provider', () => {
      const credential = createCredential({
        identityId: 'https://example.com/users/1',
        credentialType: 'oauth',
        provider: 'google',
      })
      expect(credential.provider).toBe('google')
    })

    it('should accept optional expiresAt', () => {
      const expiresAt = new Date(Date.now() + 3600000).toISOString()
      const credential = createCredential({
        identityId: 'https://example.com/users/1',
        credentialType: 'api_key',
        expiresAt,
      })
      expect(credential.expiresAt).toBe(expiresAt)
    })

    it('should create credentials for all credential types', () => {
      const types: CredentialType[] = ['password', 'oauth', 'api_key', 'sso']
      for (const credType of types) {
        const credential = createCredential({
          identityId: 'https://example.com/users/1',
          credentialType: credType,
        })
        expect(credential.credentialType).toBe(credType)
        expect(isCredential(credential)).toBe(true)
      }
    })

    it('should pass validation after creation', () => {
      const credential = createCredential({
        identityId: 'https://example.com/users/1',
        credentialType: 'password',
      })
      expect(isCredential(credential)).toBe(true)
      expect(CredentialSchema.safeParse(credential).success).toBe(true)
    })
  })
})
