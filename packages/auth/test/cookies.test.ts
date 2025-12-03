/**
 * Cookie Management Tests
 *
 * Tests for iron-session encrypted cookies
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  CookieManager,
  createCookieManager,
  seal,
  unseal,
  generateAnonymousId,
  generateSessionId,
  generateCSRFToken,
  hashIP,
  serializeCookie,
  parseCookies,
} from '../src/cookies.js'
import type { CookieConfig, TokenData, SettingsData, SessionData, WorkOSUser } from '../src/types.js'

// =============================================================================
// Test Fixtures
// =============================================================================

const testSecret = 'test-secret-key-that-is-at-least-32-chars-long'

const testCookieConfig: CookieConfig = {
  secret: testSecret,
  domain: '.example.com',
  secure: true,
  sameSite: 'lax',
}

const mockUser: WorkOSUser = {
  id: 'user_123',
  email: 'test@example.com',
  emailVerified: true,
  firstName: 'Test',
  lastName: 'User',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockTokenData: TokenData = {
  accessToken: 'access_token_123',
  refreshToken: 'refresh_token_456',
  expiresAt: Date.now() + 3600000,
  user: mockUser,
}

// =============================================================================
// Encryption Tests
// =============================================================================

describe('Seal/Unseal', () => {
  it('should seal and unseal data correctly', async () => {
    const data = { foo: 'bar', num: 123 }
    const sealed = await seal(data, testSecret)

    expect(typeof sealed).toBe('string')
    expect(sealed.length).toBeGreaterThan(0)

    const unsealed = await unseal<typeof data>(sealed, testSecret)
    expect(unsealed).toEqual(data)
  })

  it('should return null for invalid sealed data', async () => {
    const result = await unseal('invalid-data', testSecret)
    expect(result).toBeNull()
  })

  it('should return null for wrong secret', async () => {
    const data = { test: 'data' }
    const sealed = await seal(data, testSecret)
    const result = await unseal(sealed, 'wrong-secret-key-that-is-also-long-enough')
    expect(result).toBeNull()
  })

  it('should handle complex nested objects', async () => {
    const data = {
      user: mockUser,
      settings: { theme: 'dark', nested: { deep: true } },
      array: [1, 2, 3],
    }
    const sealed = await seal(data, testSecret)
    const unsealed = await unseal<typeof data>(sealed, testSecret)
    expect(unsealed).toEqual(data)
  })
})

// =============================================================================
// ID Generation Tests
// =============================================================================

describe('ID Generation', () => {
  describe('generateAnonymousId', () => {
    it('should generate UUID-like strings', () => {
      const id = generateAnonymousId()
      expect(id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateAnonymousId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('generateSessionId', () => {
    it('should generate session IDs with prefix', () => {
      const id = generateSessionId()
      expect(id).toMatch(/^sess_[a-f0-9]{32}$/)
    })

    it('should generate unique session IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateSessionId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('generateCSRFToken', () => {
    it('should generate 64-character hex strings', () => {
      const token = generateCSRFToken()
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set(Array.from({ length: 100 }, () => generateCSRFToken()))
      expect(tokens.size).toBe(100)
    })
  })

  describe('hashIP', () => {
    it('should hash IP addresses', async () => {
      const hash = await hashIP('192.168.1.1', testSecret)
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should produce same hash for same IP', async () => {
      const hash1 = await hashIP('192.168.1.1', testSecret)
      const hash2 = await hashIP('192.168.1.1', testSecret)
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different IPs', async () => {
      const hash1 = await hashIP('192.168.1.1', testSecret)
      const hash2 = await hashIP('192.168.1.2', testSecret)
      expect(hash1).not.toBe(hash2)
    })

    it('should produce different hashes with different secrets', async () => {
      const hash1 = await hashIP('192.168.1.1', testSecret)
      const hash2 = await hashIP('192.168.1.1', 'different-secret-key-long-enough')
      expect(hash1).not.toBe(hash2)
    })
  })
})

// =============================================================================
// Cookie Serialization Tests
// =============================================================================

describe('Cookie Serialization', () => {
  describe('serializeCookie', () => {
    it('should serialize basic cookie', () => {
      const result = serializeCookie({
        name: 'test',
        value: 'value',
        maxAge: 3600,
      })
      expect(result).toContain('test=value')
      expect(result).toContain('Max-Age=3600')
      expect(result).toContain('Path=/')
    })

    it('should include all options', () => {
      const result = serializeCookie({
        name: 'test',
        value: 'value',
        maxAge: 3600,
        path: '/custom',
        domain: '.example.com',
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
      })
      expect(result).toContain('test=value')
      expect(result).toContain('Max-Age=3600')
      expect(result).toContain('Path=/custom')
      expect(result).toContain('Domain=.example.com')
      expect(result).toContain('Secure')
      expect(result).toContain('HttpOnly')
      expect(result).toContain('SameSite=Strict')
    })

    it('should encode special characters in value', () => {
      const result = serializeCookie({
        name: 'test',
        value: 'value with spaces & special=chars',
        maxAge: 3600,
      })
      expect(result).toContain('test=value%20with%20spaces%20%26%20special%3Dchars')
    })
  })

  describe('parseCookies', () => {
    it('should parse cookie header', () => {
      const cookies = parseCookies('name1=value1; name2=value2')
      expect(cookies).toEqual({
        name1: 'value1',
        name2: 'value2',
      })
    })

    it('should handle empty string', () => {
      const cookies = parseCookies('')
      expect(cookies).toEqual({})
    })

    it('should handle null', () => {
      const cookies = parseCookies(null)
      expect(cookies).toEqual({})
    })

    it('should decode URI-encoded values', () => {
      const cookies = parseCookies('test=value%20with%20spaces')
      expect(cookies.test).toBe('value with spaces')
    })

    it('should handle values with equals signs', () => {
      const cookies = parseCookies('test=value=with=equals')
      expect(cookies.test).toBe('value=with=equals')
    })
  })
})

// =============================================================================
// CookieManager Tests
// =============================================================================

describe('CookieManager', () => {
  let manager: CookieManager

  beforeEach(() => {
    manager = createCookieManager(testCookieConfig, null)
  })

  describe('Token Cookie', () => {
    it('should return null for missing token', async () => {
      const token = await manager.getToken()
      expect(token).toBeNull()
    })

    it('should set and get token', async () => {
      await manager.setToken(mockTokenData)
      const token = await manager.getToken()
      expect(token).toEqual(mockTokenData)
    })

    it('should clear token', async () => {
      await manager.setToken(mockTokenData)
      manager.clearToken()
      const token = await manager.getToken()
      expect(token).toBeNull()
    })

    it('should generate Set-Cookie header on setToken', async () => {
      await manager.setToken(mockTokenData)
      const headers = manager.getSetCookieHeaders()
      expect(headers.length).toBeGreaterThan(0)
      expect(headers[0]).toContain('__token=')
      expect(headers[0]).toContain('HttpOnly')
      expect(headers[0]).toContain('Secure')
    })

    it('should read token from cookie header', async () => {
      // Create a sealed token
      const sealed = await seal(mockTokenData, testSecret)
      const cookieHeader = `__token=${encodeURIComponent(sealed)}`

      const managerWithCookie = createCookieManager(testCookieConfig, cookieHeader)
      const token = await managerWithCookie.getToken()
      expect(token).toEqual(mockTokenData)
    })
  })

  describe('Settings Cookie', () => {
    it('should create default settings with new anonymousId', async () => {
      const settings = await manager.getSettings()
      expect(settings.anonymousId).toBeDefined()
      expect(settings.anonymousId).toMatch(/^[a-f0-9]{8}-/)
      expect(settings.anonymousIdCreatedAt).toBeDefined()
    })

    it('should set and get settings', async () => {
      const customSettings: SettingsData = {
        anonymousId: 'custom_id',
        anonymousIdCreatedAt: Date.now(),
        theme: 'dark',
        locale: 'en-US',
      }
      await manager.setSettings(customSettings)
      const settings = await manager.getSettings()
      expect(settings).toEqual(customSettings)
    })

    it('should update settings partially', async () => {
      const initial = await manager.getSettings()
      const updated = await manager.updateSettings({ theme: 'light' })
      expect(updated.anonymousId).toBe(initial.anonymousId)
      expect(updated.theme).toBe('light')
    })

    it('should generate Set-Cookie without HttpOnly', async () => {
      await manager.setSettings({
        anonymousId: 'test',
        anonymousIdCreatedAt: Date.now(),
      })
      const headers = manager.getSetCookieHeaders()
      const settingsCookie = headers.find(h => h.includes('__settings='))
      expect(settingsCookie).toBeDefined()
      expect(settingsCookie).not.toContain('HttpOnly')
    })
  })

  describe('Session Cookie', () => {
    it('should create new session with CSRF token', async () => {
      const session = await manager.getSession()
      expect(session.sessionId).toMatch(/^sess_/)
      expect(session.csrfToken).toBeDefined()
      expect(session.startedAt).toBeDefined()
      expect(session.lastActivityAt).toBeDefined()
      expect(session.requests?.requestCount).toBe(1)
    })

    it('should increment request count on subsequent gets', async () => {
      // First get creates session
      const session1 = await manager.getSession()
      expect(session1.requests?.requestCount).toBe(1)

      // Create new manager with existing session cookie
      const sealed = await seal(session1, testSecret)
      const cookieHeader = `__session=${encodeURIComponent(sealed)}`
      const manager2 = createCookieManager(testCookieConfig, cookieHeader)

      const session2 = await manager2.getSession()
      expect(session2.sessionId).toBe(session1.sessionId)
      expect(session2.requests?.requestCount).toBe(2)
    })

    it('should update session with request data', async () => {
      const session = await manager.enrichSessionFromRequest({
        ip: '192.168.1.1',
        geo: { country: 'US', city: 'New York' },
        device: { browser: 'Chrome', deviceType: 'desktop' },
        referrer: 'https://google.com',
        url: '/landing-page',
        utm: { source: 'google', medium: 'cpc' },
      })

      expect(session.ipHash).toBeDefined()
      expect(session.geo?.country).toBe('US')
      expect(session.device?.browser).toBe('Chrome')
      expect(session.requests?.referrer).toBe('https://google.com')
      expect(session.requests?.landingPage).toBe('/landing-page')
      expect(session.requests?.utm?.source).toBe('google')
    })

    it('should only set first request data once', async () => {
      await manager.enrichSessionFromRequest({
        referrer: 'https://first-referrer.com',
        url: '/first-page',
      })

      // Second request with different data
      const session = await manager.enrichSessionFromRequest({
        referrer: 'https://second-referrer.com',
        url: '/second-page',
      })

      // Should keep first values
      expect(session.requests?.referrer).toBe('https://first-referrer.com')
      expect(session.requests?.landingPage).toBe('/first-page')
    })
  })

  describe('Commit', () => {
    it('should return all Set-Cookie headers', async () => {
      await manager.getSettings() // Creates default settings
      await manager.getSession() // Creates session
      await manager.setToken(mockTokenData) // Sets token

      const headers = await manager.commit()
      expect(headers.length).toBeGreaterThanOrEqual(3)
    })

    it('should include settings and session cookies on commit', async () => {
      await manager.getSettings()
      await manager.getSession()

      const headers = await manager.commit()
      expect(headers.some(h => h.includes('__settings='))).toBe(true)
      expect(headers.some(h => h.includes('__session='))).toBe(true)
    })
  })
})

// =============================================================================
// Cache Behavior Tests
// =============================================================================

describe('CookieManager Caching', () => {
  it('should cache token after first get', async () => {
    const sealed = await seal(mockTokenData, testSecret)
    const manager = createCookieManager(testCookieConfig, `__token=${encodeURIComponent(sealed)}`)

    const token1 = await manager.getToken()
    const token2 = await manager.getToken()

    expect(token1).toBe(token2) // Same reference (cached)
  })

  it('should cache settings after first get', async () => {
    const manager = createCookieManager(testCookieConfig, null)

    const settings1 = await manager.getSettings()
    const settings2 = await manager.getSettings()

    expect(settings1).toBe(settings2) // Same reference (cached)
  })
})
