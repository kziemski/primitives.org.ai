/**
 * JSX Hooks for Hono JSX DOM
 *
 * Provides React-like hooks for auth state in Hono JSX applications.
 * Works with both SSR and client-side hydration.
 *
 * @example
 * ```tsx
 * import { AuthProvider, useUser, useSession } from '@mdxe/auth/jsx'
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Profile />
 *     </AuthProvider>
 *   )
 * }
 *
 * function Profile() {
 *   const { user, isAuthenticated, login, logout } = useUser()
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={() => login()}>Sign In</button>
 *   }
 *
 *   return <div>Hello {user?.firstName}</div>
 * }
 * ```
 */

import { createContext, useContext, useState, useEffect } from 'hono/jsx'
import type { Child } from 'hono/jsx'
import type { WorkOSUser, SessionData, SettingsData, AuthContext as AuthContextType } from './types.js'
import { user as userAPI, session as sessionAPI, settings as settingsAPI } from './api.js'
import type { LoginOptions, LogoutOptions } from './api.js'

// =============================================================================
// Context
// =============================================================================

export interface AuthState {
  /** Is user authenticated */
  isAuthenticated: boolean
  /** Current user (null if not authenticated) */
  user: WorkOSUser | null
  /** Session data */
  session: SessionData | null
  /** Settings data */
  settings: SettingsData | null
  /** Is loading initial auth state */
  isLoading: boolean
  /** Error if auth fetch failed */
  error: Error | null
}

export interface AuthActions {
  /** Redirect to login */
  login: (options?: LoginOptions) => void
  /** Logout */
  logout: (options?: LogoutOptions) => void | Promise<{ success: boolean }>
  /** Refresh auth state */
  refresh: () => Promise<void>
}

export type AuthContextValue = AuthState & AuthActions

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  session: null,
  settings: null,
  isLoading: true,
  error: null,
}

const AuthContext = createContext<AuthContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

export interface AuthProviderProps {
  /** Initial auth state from SSR (avoids loading flash) */
  initialAuth?: Partial<AuthContextType>
  /** Base URL for auth endpoints */
  authUrl?: string
  /** Children */
  children?: Child
}

/**
 * Auth provider component
 *
 * Wrap your app with this to enable auth hooks.
 * Pass initialAuth from SSR to avoid loading flash.
 */
export function AuthProvider({
  initialAuth,
  children,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => {
    // Initialize from SSR data if available
    if (initialAuth) {
      return {
        isAuthenticated: initialAuth.isAuthenticated ?? false,
        user: initialAuth.token?.user ?? null,
        session: initialAuth.session ?? null,
        settings: initialAuth.settings ?? null,
        isLoading: false,
        error: null,
      }
    }
    return defaultAuthState
  })

  // Fetch auth state on mount (client-side)
  useEffect(() => {
    // Skip if we have initial auth from SSR
    if (initialAuth) return

    let mounted = true

    async function fetchAuthState() {
      try {
        const [user, session, settings] = await Promise.all([
          userAPI(),
          sessionAPI(),
          settingsAPI(),
        ])

        if (mounted) {
          setState({
            isAuthenticated: user !== null,
            user,
            session,
            settings,
            isLoading: false,
            error: null,
          })
        }
      } catch (err) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err : new Error('Failed to fetch auth state'),
          }))
        }
      }
    }

    fetchAuthState()

    return () => {
      mounted = false
    }
  }, [initialAuth])

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = userAPI.onChange((user) => {
      setState(prev => ({
        ...prev,
        isAuthenticated: user !== null,
        user,
      }))
    })

    return unsubscribe
  }, [])

  const refresh = async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const [user, session, settings] = await Promise.all([
        userAPI(),
        sessionAPI(),
        settingsAPI(),
      ])

      setState({
        isAuthenticated: user !== null,
        user,
        session,
        settings,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Failed to refresh auth state'),
      }))
    }
  }

  const value: AuthContextValue = {
    ...state,
    login: userAPI.login,
    logout: userAPI.logout,
    refresh,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Get the full auth context
 * @throws Error if not inside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Get user-related auth state and actions
 */
export function useUser() {
  const { user, isAuthenticated, isLoading, error, login, logout, refresh } = useAuth()

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refresh,
  }
}

/**
 * Get session data
 */
export function useSession() {
  const { session, isLoading, error } = useAuth()
  return { session, isLoading, error }
}

/**
 * Get settings data with update capability
 */
export function useSettings() {
  const { settings, isLoading, error, refresh } = useAuth()
  const [updating, setUpdating] = useState(false)

  const updateSettings = async (updates: Partial<SettingsData>) => {
    setUpdating(true)
    try {
      await settingsAPI(updates)
      await refresh()
    } finally {
      setUpdating(false)
    }
  }

  const setTheme = (theme: SettingsData['theme']) => updateSettings({ theme })

  return {
    settings,
    isLoading: isLoading || updating,
    error,
    updateSettings,
    setTheme,
  }
}

/**
 * Get anonymous ID (always available, even when not authenticated)
 */
export function useAnonymousId(): string | null {
  const { settings } = useAuth()
  return settings?.anonymousId ?? null
}

/**
 * Get CSRF token for form submissions
 */
export function useCsrfToken(): string | null {
  const { session } = useAuth()
  return session?.csrfToken ?? null
}

/**
 * Check if user is authenticated (convenience hook)
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

// =============================================================================
// Utility Components
// =============================================================================

export interface AuthenticatedProps {
  /** Content to show when authenticated */
  children: Child
  /** Content to show when not authenticated */
  fallback?: Child
  /** Content to show while loading */
  loading?: Child
}

/**
 * Render children only when authenticated
 */
export function Authenticated({
  children,
  fallback = null,
  loading = null,
}: AuthenticatedProps): Child {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return loading
  if (!isAuthenticated) return fallback
  return children
}

export interface UnauthenticatedProps {
  /** Content to show when not authenticated */
  children: Child
  /** Content to show while loading */
  loading?: Child
}

/**
 * Render children only when NOT authenticated
 */
export function Unauthenticated({
  children,
  loading = null,
}: UnauthenticatedProps): Child {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return loading
  if (isAuthenticated) return null
  return children
}
