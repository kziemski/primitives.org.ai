/**
 * Isomorphic Auth API
 *
 * Provides $.user(), $.session(), $.settings() that work in both
 * browser and server environments.
 *
 * - Browser: fetches from /auth/* endpoints
 * - Server: reads from AsyncLocalStorage context (set by middleware)
 */

import type {
  WorkOSUser,
  SessionData,
  SettingsData,
  Theme,
} from './types.js'
import {
  isBrowser,
  hasServerAuthContext,
  getServerUser,
  getServerSession,
  getServerSettings,
  getServerIsAuthenticated,
} from './context.js'

// =============================================================================
// Types
// =============================================================================

export interface LoginOptions {
  /** URL to redirect after login */
  returnTo?: string
  /** SSO provider (e.g., 'GoogleOAuth', 'MicrosoftOAuth') */
  provider?: string
  /** Pre-fill email */
  email?: string
  /** 'sign-in' or 'sign-up' */
  screen?: 'sign-in' | 'sign-up'
  /** Organization ID */
  organizationId?: string
}

export interface LogoutOptions {
  /** URL to redirect after logout */
  returnTo?: string
  /** Use API logout (no redirect, returns promise) */
  api?: boolean
}

export interface UserAPI {
  /** Get current user */
  (): Promise<WorkOSUser | null>
  /** Redirect to login */
  login(options?: LoginOptions): void
  /** Logout */
  logout(options?: LogoutOptions): void | Promise<{ success: boolean }>
  /** Check if authenticated */
  isAuthenticated(): Promise<boolean>
  /** Listen for auth changes (browser only) */
  onChange(callback: (user: WorkOSUser | null) => void): () => void
}

export interface SessionAPI {
  /** Get session data */
  (): Promise<SessionData>
  /** Get session ID */
  readonly id: Promise<string>
  /** Get CSRF token */
  readonly csrf: Promise<string>
}

export interface SettingsAPI {
  /** Get settings, or update if object passed */
  (updates?: Partial<SettingsData>): Promise<SettingsData>
  /** Get theme */
  readonly theme: Promise<Theme | undefined>
  /** Get anonymous ID */
  readonly anonymousId: Promise<string>
  /** Set theme */
  setTheme(theme: Theme): Promise<SettingsData>
}

// =============================================================================
// Configuration
// =============================================================================

export interface AuthAPIConfig {
  /** Base URL for auth endpoints (default: /auth) */
  authUrl?: string
  /** Default redirect after login */
  defaultRedirect?: string
}

let config: AuthAPIConfig = {
  authUrl: '/auth',
  defaultRedirect: '/',
}

/**
 * Configure the auth API
 */
export function configureAuthAPI(options: AuthAPIConfig): void {
  config = { ...config, ...options }
}

// =============================================================================
// Client-side State (browser only)
// =============================================================================

let cachedUser: WorkOSUser | null | undefined = undefined
let cachedSession: SessionData | undefined = undefined
let cachedSettings: SettingsData | undefined = undefined
const authListeners: Array<(user: WorkOSUser | null) => void> = []

function notifyAuthChange(user: WorkOSUser | null): void {
  for (const listener of authListeners) {
    try {
      listener(user)
    } catch (e) {
      console.error('Auth listener error:', e)
    }
  }
}

// =============================================================================
// Fetch Helpers (browser only)
// =============================================================================

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return response.json() as Promise<T>
}

// =============================================================================
// User API Implementation
// =============================================================================

async function getUser(): Promise<WorkOSUser | null> {
  // Server-side: use AsyncLocalStorage context
  if (!isBrowser()) {
    if (hasServerAuthContext()) {
      return getServerUser()
    }
    throw new Error('$.user() called on server without auth context. Ensure authMiddleware is applied.')
  }

  // Browser: fetch from endpoint (with cache)
  if (cachedUser !== undefined) {
    return cachedUser
  }

  const data = await fetchJSON<{ user: WorkOSUser | null }>(`${config.authUrl}/user`)
  cachedUser = data.user
  return cachedUser
}

function login(options: LoginOptions = {}): void {
  if (!isBrowser()) {
    throw new Error('$.user.login() can only be called in the browser')
  }

  const params = new URLSearchParams()
  params.set('return_to', options.returnTo ?? window.location.href)

  if (options.provider) params.set('provider', options.provider)
  if (options.email) params.set('login_hint', options.email)
  if (options.screen) params.set('screen_hint', options.screen)
  if (options.organizationId) params.set('organization_id', options.organizationId)

  window.location.href = `${config.authUrl}/login?${params.toString()}`
}

function logout(options: LogoutOptions = {}): void | Promise<{ success: boolean }> {
  if (!isBrowser()) {
    throw new Error('$.user.logout() can only be called in the browser')
  }

  if (options.api) {
    return fetchJSON<{ success: boolean }>(`${config.authUrl}/logout`, { method: 'POST' })
      .then((result) => {
        cachedUser = null
        notifyAuthChange(null)
        return result
      })
  }

  const params = new URLSearchParams()
  params.set('return_to', options.returnTo ?? config.defaultRedirect ?? '/')

  window.location.href = `${config.authUrl}/logout?${params.toString()}`
}

async function isAuthenticated(): Promise<boolean> {
  // Server-side: use AsyncLocalStorage context
  if (!isBrowser()) {
    if (hasServerAuthContext()) {
      return getServerIsAuthenticated()
    }
    throw new Error('$.user.isAuthenticated() called on server without auth context.')
  }

  // Browser: check via session endpoint
  const session = await getSessionData()
  return session !== null && cachedUser !== null
}

function onChange(callback: (user: WorkOSUser | null) => void): () => void {
  if (!isBrowser()) {
    // Server-side: no-op, return empty unsubscribe
    return () => {}
  }

  authListeners.push(callback)

  // Immediately call with current state
  getUser().then(callback).catch(() => callback(null))

  // Return unsubscribe function
  return () => {
    const idx = authListeners.indexOf(callback)
    if (idx !== -1) authListeners.splice(idx, 1)
  }
}

// Create the user API object
const userFn = getUser as UserAPI
userFn.login = login
userFn.logout = logout
userFn.isAuthenticated = isAuthenticated
userFn.onChange = onChange

export const user: UserAPI = userFn

// =============================================================================
// Session API Implementation
// =============================================================================

async function getSessionData(): Promise<SessionData> {
  // Server-side: use AsyncLocalStorage context
  if (!isBrowser()) {
    if (hasServerAuthContext()) {
      return getServerSession()
    }
    throw new Error('$.session() called on server without auth context.')
  }

  // Browser: fetch from endpoint (with cache)
  if (cachedSession !== undefined) {
    return cachedSession
  }

  const data = await fetchJSON<SessionData>(`${config.authUrl}/session`)
  cachedSession = data
  return cachedSession
}

// Create session API with getters
const sessionFn = getSessionData as SessionAPI

Object.defineProperty(sessionFn, 'id', {
  get: () => getSessionData().then(s => s.sessionId),
})

Object.defineProperty(sessionFn, 'csrf', {
  get: () => getSessionData().then(s => s.csrfToken ?? ''),
})

export const session: SessionAPI = sessionFn

// =============================================================================
// Settings API Implementation
// =============================================================================

async function getOrUpdateSettings(updates?: Partial<SettingsData>): Promise<SettingsData> {
  // Server-side: use AsyncLocalStorage context (read-only)
  if (!isBrowser()) {
    if (updates) {
      throw new Error('$.settings() updates can only be made in the browser')
    }
    if (hasServerAuthContext()) {
      return getServerSettings()
    }
    throw new Error('$.settings() called on server without auth context.')
  }

  // Browser: update if provided
  if (updates) {
    const data = await fetchJSON<{ settings: SettingsData }>(`${config.authUrl}/settings`, {
      method: 'POST',
      body: JSON.stringify(updates),
    })
    cachedSettings = data.settings
    return cachedSettings
  }

  // Browser: fetch from endpoint (with cache)
  if (cachedSettings !== undefined) {
    return cachedSettings
  }

  const data = await fetchJSON<{ settings: SettingsData }>(`${config.authUrl}/settings`)
  cachedSettings = data.settings
  return cachedSettings
}

async function setTheme(theme: Theme): Promise<SettingsData> {
  return getOrUpdateSettings({ theme })
}

// Create settings API with getters
const settingsFn = getOrUpdateSettings as SettingsAPI

Object.defineProperty(settingsFn, 'theme', {
  get: () => getOrUpdateSettings().then(s => s.theme),
})

Object.defineProperty(settingsFn, 'anonymousId', {
  get: () => getOrUpdateSettings().then(s => s.anonymousId),
})

settingsFn.setTheme = setTheme

export const settings: SettingsAPI = settingsFn

// =============================================================================
// Cache Management
// =============================================================================

/**
 * Clear all cached data (browser only)
 */
export function clearCache(): void {
  cachedUser = undefined
  cachedSession = undefined
  cachedSettings = undefined
}

/**
 * Refresh user data from server (browser only)
 */
export async function refreshUser(): Promise<WorkOSUser | null> {
  if (!isBrowser()) {
    throw new Error('refreshUser() can only be called in the browser')
  }
  cachedUser = undefined
  const newUser = await getUser()
  notifyAuthChange(newUser)
  return newUser
}

// =============================================================================
// Convenience Exports
// =============================================================================

/**
 * The $ object with user, session, settings
 */
export const $ = {
  user,
  session,
  settings,
} as const

export default $
