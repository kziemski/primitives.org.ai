/**
 * Isomorphic API Tests
 *
 * Tests for $.user(), $.session(), $.settings() on server-side
 * (browser tests would require jsdom environment)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runWithAuth } from '../src/context.js'
import { user, session, settings, $, clearCache, configureAuthAPI } from '../src/api.js'
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
  geo: { country: 'US', city: 'San Francisco' },
}

const mockSettings: SettingsData = {
  anonymousId: 'anon_xyz789',
  anonymousIdCreatedAt: Date.now(),
  theme: 'dark',
  locale: 'en-US',
}

const mockAuthenticatedContext: AuthContext = {
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
// Server-side User API Tests
// =============================================================================

describe('Server-side $.user()', () => {
  it('should return user when authenticated', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const result = await user()
      expect(result).toEqual(mockUser)
    })
  })

  it('should return null when not authenticated', async () => {
    await runWithAuth({ auth: mockUnauthenticatedContext }, async () => {
      const result = await user()
      expect(result).toBeNull()
    })
  })

  it('should throw outside auth context', async () => {
    await expect(user()).rejects.toThrow('without auth context')
  })

  it('should work via $ object', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const result = await $.user()
      expect(result).toEqual(mockUser)
    })
  })
})

describe('Server-side $.user.isAuthenticated()', () => {
  it('should return true when authenticated', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const result = await user.isAuthenticated()
      expect(result).toBe(true)
    })
  })

  it('should return false when not authenticated', async () => {
    await runWithAuth({ auth: mockUnauthenticatedContext }, async () => {
      const result = await user.isAuthenticated()
      expect(result).toBe(false)
    })
  })
})

describe('Server-side $.user.login()', () => {
  it('should throw on server (browser only)', () => {
    expect(() => user.login()).toThrow('only be called in the browser')
  })

  it('should throw with options', () => {
    expect(() => user.login({ provider: 'google' })).toThrow('only be called in the browser')
  })
})

describe('Server-side $.user.logout()', () => {
  it('should throw on server (browser only)', () => {
    expect(() => user.logout()).toThrow('only be called in the browser')
  })
})

describe('Server-side $.user.onChange()', () => {
  it('should return no-op unsubscribe on server', () => {
    const callback = () => {}
    const unsubscribe = user.onChange(callback)
    expect(typeof unsubscribe).toBe('function')
    // Should not throw
    unsubscribe()
  })
})

// =============================================================================
// Server-side Session API Tests
// =============================================================================

describe('Server-side $.session()', () => {
  it('should return session data', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const result = await session()
      expect(result).toEqual(mockSession)
    })
  })

  it('should throw outside auth context', async () => {
    await expect(session()).rejects.toThrow('without auth context')
  })

  it('should work via $ object', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const result = await $.session()
      expect(result).toEqual(mockSession)
    })
  })
})

describe('Server-side $.session.id', () => {
  it('should return session ID', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const id = await session.id
      expect(id).toBe('sess_abc123')
    })
  })
})

describe('Server-side $.session.csrf', () => {
  it('should return CSRF token', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const csrf = await session.csrf
      expect(csrf).toBe('csrf_token_123')
    })
  })
})

// =============================================================================
// Server-side Settings API Tests
// =============================================================================

describe('Server-side $.settings()', () => {
  it('should return settings data', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const result = await settings()
      expect(result).toEqual(mockSettings)
    })
  })

  it('should throw outside auth context', async () => {
    await expect(settings()).rejects.toThrow('without auth context')
  })

  it('should throw when trying to update on server', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      await expect(settings({ theme: 'light' })).rejects.toThrow('only be made in the browser')
    })
  })

  it('should work via $ object', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const result = await $.settings()
      expect(result).toEqual(mockSettings)
    })
  })
})

describe('Server-side $.settings.theme', () => {
  it('should return theme', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const theme = await settings.theme
      expect(theme).toBe('dark')
    })
  })
})

describe('Server-side $.settings.anonymousId', () => {
  it('should return anonymous ID', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      const anonId = await settings.anonymousId
      expect(anonId).toBe('anon_xyz789')
    })
  })
})

describe('Server-side $.settings.setTheme()', () => {
  it('should throw on server (browser only)', async () => {
    await runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      await expect(settings.setTheme('light')).rejects.toThrow('only be made in the browser')
    })
  })
})

// =============================================================================
// Configuration Tests
// =============================================================================

describe('configureAuthAPI', () => {
  afterEach(() => {
    // Reset config
    configureAuthAPI({ authUrl: '/auth', defaultRedirect: '/' })
  })

  it('should update authUrl', () => {
    configureAuthAPI({ authUrl: '/custom-auth' })
    // The config is used internally, we can verify it doesn't throw
    expect(() => configureAuthAPI({ authUrl: '/custom-auth' })).not.toThrow()
  })

  it('should update defaultRedirect', () => {
    configureAuthAPI({ defaultRedirect: '/dashboard' })
    expect(() => configureAuthAPI({ defaultRedirect: '/dashboard' })).not.toThrow()
  })
})

// =============================================================================
// $ Object Tests
// =============================================================================

describe('$ Object', () => {
  it('should have user, session, settings properties', () => {
    expect($).toHaveProperty('user')
    expect($).toHaveProperty('session')
    expect($).toHaveProperty('settings')
  })

  it('should have all required methods', () => {
    expect(typeof $.user).toBe('function')
    expect(typeof $.session).toBe('function')
    expect(typeof $.settings).toBe('function')
  })
})

// =============================================================================
// Concurrent Request Isolation Tests
// =============================================================================

describe('Concurrent Request Isolation', () => {
  it('should isolate user data between concurrent requests', async () => {
    const results: Array<{ user: WorkOSUser | null; sessionId: string }> = []

    const authenticatedRequest = runWithAuth({ auth: mockAuthenticatedContext }, async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      return {
        user: await user(),
        sessionId: (await session()).sessionId,
      }
    })

    const unauthenticatedRequest = runWithAuth({ auth: mockUnauthenticatedContext }, async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      return {
        user: await user(),
        sessionId: (await session()).sessionId,
      }
    })

    const [result1, result2] = await Promise.all([authenticatedRequest, unauthenticatedRequest])

    expect(result1.user).toEqual(mockUser)
    expect(result2.user).toBeNull()
    expect(result1.sessionId).toBe(mockSession.sessionId)
    expect(result2.sessionId).toBe(mockSession.sessionId)
  })
})
