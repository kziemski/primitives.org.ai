/**
 * Middleware Tests
 *
 * Tests for Hono auth middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import {
  authMiddleware,
  getAuth,
  getCookieManager,
  isAuthenticated,
  getUser,
  getAnonymousId,
  getSessionId,
  requireAuthentication,
  csrfProtection,
} from '../src/middleware.js'
import { seal } from '../src/cookies.js'
import type { AuthConfig, TokenData, WorkOSUser } from '../src/types.js'

// Mock WorkOS refresh
vi.mock('../src/workos.js', () => ({
  refreshTokenIfNeeded: vi.fn().mockResolvedValue(null),
  isTokenExpired: vi.fn().mockReturnValue(false),
}))

// =============================================================================
// Test Fixtures
// =============================================================================

const testSecret = 'test-secret-key-that-is-at-least-32-chars-long'

const testConfig: AuthConfig = {
  workos: {
    apiKey: 'test_api_key',
    clientId: 'test_client_id',
    callbackUrl: 'https://example.com/auth/callback',
  },
  cookies: {
    secret: testSecret,
    secure: false, // For testing
    sameSite: 'lax',
  },
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
// Helper to create test app
// =============================================================================

function createTestApp(options: { requireAuth?: boolean; excludePaths?: string[] } = {}) {
  const app = new Hono()

  app.use('*', authMiddleware({
    config: testConfig,
    requireAuth: options.requireAuth ?? false,
    excludePaths: options.excludePaths ?? [],
  }))

  app.get('/', (c) => {
    const auth = getAuth(c)
    return c.json({
      isAuthenticated: auth.isAuthenticated,
      user: auth.token?.user ?? null,
      sessionId: auth.session.sessionId,
      anonymousId: auth.settings.anonymousId,
    })
  })

  app.get('/protected', requireAuthentication(), (c) => {
    return c.json({ message: 'Protected content', user: getUser(c) })
  })

  app.post('/action', csrfProtection(), (c) => {
    return c.json({ success: true })
  })

  app.get('/health', (c) => c.json({ status: 'ok' }))

  return app
}

// =============================================================================
// Middleware Tests
// =============================================================================

describe('authMiddleware', () => {
  it('should create auth context for unauthenticated request', async () => {
    const app = createTestApp()
    const res = await app.request('/')

    expect(res.status).toBe(200)
    const data = await res.json()

    expect(data.isAuthenticated).toBe(false)
    expect(data.user).toBeNull()
    expect(data.sessionId).toMatch(/^sess_/)
    expect(data.anonymousId).toMatch(/^[a-f0-9]{8}-/)
  })

  it('should authenticate request with valid token cookie', async () => {
    const app = createTestApp()
    const sealedToken = await seal(mockTokenData, testSecret)

    const res = await app.request('/', {
      headers: {
        Cookie: `__token=${encodeURIComponent(sealedToken)}`,
      },
    })

    expect(res.status).toBe(200)
    const data = await res.json()

    expect(data.isAuthenticated).toBe(true)
    expect(data.user.email).toBe('test@example.com')
  })

  it('should set cookies in response', async () => {
    const app = createTestApp()
    const res = await app.request('/')

    const setCookies = res.headers.getSetCookie()
    expect(setCookies.length).toBeGreaterThan(0)

    // Should have settings and session cookies
    expect(setCookies.some(c => c.includes('__settings='))).toBe(true)
    expect(setCookies.some(c => c.includes('__session='))).toBe(true)
  })

  it('should exclude specified paths', async () => {
    const app = createTestApp({ excludePaths: ['/health'] })

    // Excluded path should not set cookies
    const res = await app.request('/health')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('ok')
  })

  it('should require auth when configured', async () => {
    const app = createTestApp({ requireAuth: true })
    const res = await app.request('/')

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should allow authenticated requests when requireAuth is true', async () => {
    const app = createTestApp({ requireAuth: true })
    const sealedToken = await seal(mockTokenData, testSecret)

    const res = await app.request('/', {
      headers: {
        Cookie: `__token=${encodeURIComponent(sealedToken)}`,
      },
    })

    expect(res.status).toBe(200)
  })
})

// =============================================================================
// Cloudflare Header Parsing Tests
// =============================================================================

describe('Cloudflare Header Parsing', () => {
  it('should parse geo headers', async () => {
    const app = new Hono()
    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      const auth = getAuth(c)
      return c.json({ geo: auth.session.geo })
    })

    const res = await app.request('/', {
      headers: {
        'cf-ipcountry': 'US',
        'cf-region': 'CA',
        'cf-ipcity': 'San Francisco',
        'cf-postal-code': '94102',
        'cf-is-eu': '0',
      },
    })

    const data = await res.json()
    expect(data.geo.country).toBe('US')
    expect(data.geo.region).toBe('CA')
    expect(data.geo.city).toBe('San Francisco')
    expect(data.geo.postalCode).toBe('94102')
    expect(data.geo.isEU).toBe(false)
  })

  it('should parse ASN headers', async () => {
    const app = new Hono()
    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      const auth = getAuth(c)
      return c.json({ asn: auth.session.asn })
    })

    const res = await app.request('/', {
      headers: {
        'cf-asn': '15169',
        'cf-asorg': 'Google LLC',
      },
    })

    const data = await res.json()
    expect(data.asn.asn).toBe(15169)
    expect(data.asn.asOrg).toBe('Google LLC')
  })

  it('should parse user agent', async () => {
    const app = new Hono()
    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      const auth = getAuth(c)
      return c.json({ device: auth.session.device })
    })

    const res = await app.request('/', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    const data = await res.json()
    expect(data.device.deviceType).toBe('desktop')
    expect(data.device.browser).toBe('Chrome')
    expect(data.device.os).toBe('macOS')
  })

  it('should detect mobile devices', async () => {
    const app = new Hono()
    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      const auth = getAuth(c)
      return c.json({ device: auth.session.device })
    })

    const res = await app.request('/', {
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    })

    const data = await res.json()
    expect(data.device.deviceType).toBe('mobile')
    expect(data.device.os).toBe('iOS')
  })

  it('should detect bots', async () => {
    const app = new Hono()
    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      const auth = getAuth(c)
      return c.json({ device: auth.session.device })
    })

    const res = await app.request('/', {
      headers: {
        'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      },
    })

    const data = await res.json()
    expect(data.device.deviceType).toBe('bot')
    expect(data.device.isBot).toBe(true)
  })
})

// =============================================================================
// Helper Functions Tests
// =============================================================================

describe('Helper Functions', () => {
  it('getAuth should return auth context', async () => {
    const app = new Hono()
    let auth: any

    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      auth = getAuth(c)
      return c.text('ok')
    })

    await app.request('/')

    expect(auth).toBeDefined()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.session).toBeDefined()
    expect(auth.settings).toBeDefined()
  })

  it('getCookieManager should return cookie manager', async () => {
    const app = new Hono()
    let cookieManager: any

    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      cookieManager = getCookieManager(c)
      return c.text('ok')
    })

    await app.request('/')

    expect(cookieManager).toBeDefined()
    expect(typeof cookieManager.getToken).toBe('function')
    expect(typeof cookieManager.setToken).toBe('function')
  })

  it('isAuthenticated should return boolean', async () => {
    const app = new Hono()
    let result: boolean

    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      result = isAuthenticated(c)
      return c.text('ok')
    })

    await app.request('/')
    expect(result!).toBe(false)
  })

  it('getUser should throw when not authenticated', async () => {
    const app = new Hono()

    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      try {
        getUser(c)
        return c.text('should not reach here')
      } catch (e: any) {
        return c.text(e.message)
      }
    })

    const res = await app.request('/')
    const text = await res.text()
    expect(text).toBe('Not authenticated')
  })

  it('getAnonymousId should return anonymousId', async () => {
    const app = new Hono()
    let anonId: string

    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      anonId = getAnonymousId(c)
      return c.text('ok')
    })

    await app.request('/')
    expect(anonId!).toMatch(/^[a-f0-9]{8}-/)
  })

  it('getSessionId should return sessionId', async () => {
    const app = new Hono()
    let sessionId: string

    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      sessionId = getSessionId(c)
      return c.text('ok')
    })

    await app.request('/')
    expect(sessionId!).toMatch(/^sess_/)
  })
})

// =============================================================================
// requireAuthentication Middleware Tests
// =============================================================================

describe('requireAuthentication', () => {
  it('should return 401 when not authenticated', async () => {
    const app = createTestApp()
    const res = await app.request('/protected')

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should allow request when authenticated', async () => {
    const app = createTestApp()
    const sealedToken = await seal(mockTokenData, testSecret)

    const res = await app.request('/protected', {
      headers: {
        Cookie: `__token=${encodeURIComponent(sealedToken)}`,
      },
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toBe('Protected content')
    expect(data.user.email).toBe('test@example.com')
  })
})

// =============================================================================
// CSRF Protection Tests
// =============================================================================

describe('csrfProtection', () => {
  it('should allow GET requests without CSRF token', async () => {
    const app = new Hono()
    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/action', csrfProtection(), (c) => c.json({ success: true }))

    const res = await app.request('/action')
    expect(res.status).toBe(200)
  })

  it('should reject POST requests without CSRF token', async () => {
    const app = createTestApp()
    const res = await app.request('/action', { method: 'POST' })

    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('CSRF validation failed')
  })

  it('should accept POST requests with valid CSRF token', async () => {
    // Create session with known CSRF token
    const app = new Hono()
    app.use('*', authMiddleware({ config: testConfig }))

    let csrfToken: string

    app.get('/csrf', (c) => {
      csrfToken = getAuth(c).session.csrfToken!
      return c.json({ csrfToken })
    })

    app.post('/action', csrfProtection(), (c) => c.json({ success: true }))

    // First, get CSRF token from session
    const getRes = await app.request('/csrf')
    const sessionCookie = getRes.headers.getSetCookie().find(c => c.includes('__session='))

    const { csrfToken: token } = await getRes.json()

    // Then make POST with CSRF token
    const postRes = await app.request('/action', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': token,
        Cookie: sessionCookie?.split(';')[0] ?? '',
      },
    })

    expect(postRes.status).toBe(200)
  })
})

// =============================================================================
// UTM Parameter Tests
// =============================================================================

describe('UTM Parameters', () => {
  it('should capture UTM parameters from URL', async () => {
    const app = new Hono()
    app.use('*', authMiddleware({ config: testConfig }))
    app.get('/', (c) => {
      const auth = getAuth(c)
      return c.json({ utm: auth.session.requests?.utm })
    })

    const res = await app.request('/?utm_source=google&utm_medium=cpc&utm_campaign=test')
    const data = await res.json()

    expect(data.utm.source).toBe('google')
    expect(data.utm.medium).toBe('cpc')
    expect(data.utm.campaign).toBe('test')
  })
})
