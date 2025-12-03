/**
 * Server-side Context Tests
 *
 * Tests for AsyncLocalStorage-based auth context
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  authStorage,
  runWithAuth,
  getServerAuthContext,
  hasServerAuthContext,
  getServerUser,
  getServerSession,
  getServerSettings,
  getServerIsAuthenticated,
  isBrowser,
  isServer,
} from '../src/context.js'
import type { AuthContext, SessionData, SettingsData, WorkOSUser } from '../src/types.js'

// =============================================================================
// Test Fixtures
// =============================================================================

const mockUser: WorkOSUser = {
  id: 'user_123',
  email: 'test@example.com',
  emailVerified: true,
  firstName: 'Test',
  lastName: 'User',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockSession: SessionData = {
  sessionId: 'sess_abc123',
  startedAt: Date.now(),
  lastActivityAt: Date.now(),
  csrfToken: 'csrf_token_123',
}

const mockSettings: SettingsData = {
  anonymousId: 'anon_xyz789',
  anonymousIdCreatedAt: Date.now(),
  theme: 'dark',
}

const mockAuthContext: AuthContext = {
  isAuthenticated: true,
  token: {
    accessToken: 'access_token_123',
    refreshToken: 'refresh_token_456',
    expiresAt: Date.now() + 3600000,
    user: mockUser,
  },
  session: mockSession,
  settings: mockSettings,
}

const mockUnauthenticatedContext: AuthContext = {
  isAuthenticated: false,
  session: mockSession,
  settings: mockSettings,
}

// =============================================================================
// Environment Detection Tests
// =============================================================================

describe('Environment Detection', () => {
  it('should detect server environment', () => {
    expect(isServer()).toBe(true)
    expect(isBrowser()).toBe(false)
  })
})

// =============================================================================
// AsyncLocalStorage Tests
// =============================================================================

describe('AsyncLocalStorage Context', () => {
  it('should have no context outside of runWithAuth', () => {
    expect(getServerAuthContext()).toBeUndefined()
    expect(hasServerAuthContext()).toBe(false)
  })

  it('should provide context inside runWithAuth', () => {
    runWithAuth({ auth: mockAuthContext }, () => {
      expect(hasServerAuthContext()).toBe(true)
      const ctx = getServerAuthContext()
      expect(ctx).toBeDefined()
      expect(ctx?.auth).toEqual(mockAuthContext)
    })
  })

  it('should clear context after runWithAuth completes', () => {
    runWithAuth({ auth: mockAuthContext }, () => {
      expect(hasServerAuthContext()).toBe(true)
    })
    expect(hasServerAuthContext()).toBe(false)
  })

  it('should support nested runWithAuth calls', () => {
    runWithAuth({ auth: mockAuthContext }, () => {
      expect(getServerAuthContext()?.auth.isAuthenticated).toBe(true)

      runWithAuth({ auth: mockUnauthenticatedContext }, () => {
        expect(getServerAuthContext()?.auth.isAuthenticated).toBe(false)
      })

      // Back to outer context
      expect(getServerAuthContext()?.auth.isAuthenticated).toBe(true)
    })
  })

  it('should work with async functions', async () => {
    const result = await runWithAuth({ auth: mockAuthContext }, async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(hasServerAuthContext()).toBe(true)
      return getServerAuthContext()?.auth.token?.user.email
    })
    expect(result).toBe('test@example.com')
  })
})

// =============================================================================
// Server Getter Tests
// =============================================================================

describe('Server Getters', () => {
  describe('getServerUser', () => {
    it('should return user when authenticated', () => {
      runWithAuth({ auth: mockAuthContext }, () => {
        const user = getServerUser()
        expect(user).toEqual(mockUser)
      })
    })

    it('should return null when not authenticated', () => {
      runWithAuth({ auth: mockUnauthenticatedContext }, () => {
        const user = getServerUser()
        expect(user).toBeNull()
      })
    })

    it('should throw outside auth context', () => {
      expect(() => getServerUser()).toThrow('outside of auth context')
    })
  })

  describe('getServerSession', () => {
    it('should return session data', () => {
      runWithAuth({ auth: mockAuthContext }, () => {
        const session = getServerSession()
        expect(session).toEqual(mockSession)
      })
    })

    it('should throw outside auth context', () => {
      expect(() => getServerSession()).toThrow('outside of auth context')
    })
  })

  describe('getServerSettings', () => {
    it('should return settings data', () => {
      runWithAuth({ auth: mockAuthContext }, () => {
        const settings = getServerSettings()
        expect(settings).toEqual(mockSettings)
      })
    })

    it('should throw outside auth context', () => {
      expect(() => getServerSettings()).toThrow('outside of auth context')
    })
  })

  describe('getServerIsAuthenticated', () => {
    it('should return true when authenticated', () => {
      runWithAuth({ auth: mockAuthContext }, () => {
        expect(getServerIsAuthenticated()).toBe(true)
      })
    })

    it('should return false when not authenticated', () => {
      runWithAuth({ auth: mockUnauthenticatedContext }, () => {
        expect(getServerIsAuthenticated()).toBe(false)
      })
    })

    it('should throw outside auth context', () => {
      expect(() => getServerIsAuthenticated()).toThrow('outside of auth context')
    })
  })
})

// =============================================================================
// Context Isolation Tests
// =============================================================================

describe('Context Isolation', () => {
  it('should isolate context between concurrent requests', async () => {
    const results: string[] = []

    const request1 = runWithAuth({ auth: mockAuthContext }, async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      results.push(`request1: ${getServerUser()?.email}`)
    })

    const request2 = runWithAuth({ auth: mockUnauthenticatedContext }, async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      results.push(`request2: ${getServerUser()}`)
    })

    await Promise.all([request1, request2])

    expect(results).toContain('request1: test@example.com')
    expect(results).toContain('request2: null')
  })
})
