/**
 * @mdxe/auth - Authentication for MDX applications
 *
 * Features:
 * - WorkOS integration (SSO, AuthKit, User Management)
 * - Iron-session encrypted cookies
 * - Three cookie types:
 *   - token: Secure, HttpOnly (auth credentials)
 *   - settings: JS accessible (anonymousId, preferences)
 *   - session: Request tracking (geo, device, etc)
 * - Hono middleware
 * - Client-side helpers for $.js
 *
 * @example
 * ```typescript
 * import { authMiddleware, mountAuthRoutes } from '@mdxe/auth'
 *
 * const app = new Hono()
 *
 * // Add auth middleware
 * app.use('*', authMiddleware({
 *   config: {
 *     workos: {
 *       apiKey: process.env.WORKOS_API_KEY,
 *       clientId: process.env.WORKOS_CLIENT_ID,
 *       callbackUrl: 'https://apis.do/auth/callback',
 *       authDomain: 'auth.apis.do',
 *       authKitDomain: 'login.oauth.do',
 *     },
 *     cookies: {
 *       secret: process.env.COOKIE_SECRET,
 *       domain: '.apis.do',
 *     },
 *   },
 * }))
 *
 * // Mount auth routes
 * mountAuthRoutes(app, { config })
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  TokenData,
  SettingsData,
  SessionData,
  AuthContext,
  AuthConfig,
  WorkOSConfig,
  CookieConfig,
  WorkOSUser,
  Theme,
  GeoData,
  ASNData,
  DeviceData,
  RequestData,
} from './types.js'

export {
  DEFAULT_COOKIE_NAMES,
  DEFAULT_COOKIE_MAX_AGE,
} from './types.js'

// Cookies
export {
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
} from './cookies.js'

export type {
  CookieOptions,
  CookieManagerOptions,
} from './cookies.js'

// WorkOS
export {
  getWorkOS,
  getAuthorizationUrl,
  getAuthKitUrl,
  authenticateWithCode,
  refreshAccessToken,
  getUser,
  getUserFromToken,
  createTokenData,
  isTokenExpired,
  refreshTokenIfNeeded,
  getLogoutUrl,
} from './workos.js'

export type {
  AuthorizationUrlOptions,
  AuthenticateResult,
} from './workos.js'

// Middleware
export {
  authMiddleware,
  getAuth,
  getCookieManager,
  isAuthenticated,
  getUser as getCurrentUser,
  getAnonymousId,
  getSessionId,
  requireAuthentication,
  csrfProtection,
} from './middleware.js'

export type {
  AuthMiddlewareOptions,
} from './middleware.js'

// Routes
export {
  createAuthRoutes,
  mountAuthRoutes,
} from './routes.js'

export type {
  AuthRoutesOptions,
} from './routes.js'

// Client (legacy script generation)
export {
  generateAuthScript,
  generateMinimalAuthScript,
} from './client.js'

export type {
  ClientAuthConfig,
} from './client.js'

// Isomorphic API ($.user, $.session, $.settings)
export {
  $,
  user,
  session,
  settings,
  configureAuthAPI,
  clearCache,
  refreshUser,
} from './api.js'

export type {
  UserAPI,
  SessionAPI,
  SettingsAPI,
  LoginOptions,
  LogoutOptions,
  AuthAPIConfig,
} from './api.js'

// Server Context
export {
  runWithAuth,
  getServerAuthContext,
  hasServerAuthContext,
  authStorage,
} from './context.js'

// =============================================================================
// Convenience: Create full auth setup
// =============================================================================

import type { Hono } from 'hono'
import type { AuthConfig } from './types.js'
import { authMiddleware } from './middleware.js'
import { mountAuthRoutes } from './routes.js'

export interface SetupAuthOptions {
  /** Hono app instance */
  app: Hono
  /** Auth configuration */
  config: AuthConfig
  /** Base path for auth routes (default: /auth) */
  basePath?: string
  /** Paths to exclude from auth middleware */
  excludePaths?: string[]
  /** Default redirect after login */
  defaultRedirect?: string
  /** Default redirect after logout */
  logoutRedirect?: string
}

/**
 * Set up auth middleware and routes in one call
 */
export function setupAuth(options: SetupAuthOptions): void {
  const {
    app,
    config,
    basePath = '/auth',
    excludePaths = [],
    defaultRedirect = '/',
    logoutRedirect = '/',
  } = options

  // Add auth middleware
  app.use('*', authMiddleware({
    config,
    excludePaths: [
      ...excludePaths,
      '/health',
      '/favicon.ico',
      '/robots.txt',
    ],
  }))

  // Mount auth routes
  mountAuthRoutes(app, {
    config,
    basePath,
    defaultRedirect,
    logoutRedirect,
  })
}

// =============================================================================
// Environment helpers
// =============================================================================

/**
 * Create auth config from environment variables
 */
export function createAuthConfigFromEnv(overrides: Partial<AuthConfig> = {}): AuthConfig {
  const env = typeof process !== 'undefined' ? process.env : {}

  return {
    workos: {
      apiKey: env.WORKOS_API_KEY ?? '',
      clientId: env.WORKOS_CLIENT_ID ?? '',
      callbackUrl: env.WORKOS_CALLBACK_URL ?? env.AUTH_CALLBACK_URL ?? 'https://apis.do/auth/callback',
      authDomain: env.WORKOS_AUTH_DOMAIN ?? 'auth.apis.do',
      authKitDomain: env.WORKOS_AUTHKIT_DOMAIN ?? 'login.oauth.do',
      defaultRedirect: env.AUTH_DEFAULT_REDIRECT ?? '/',
      ...overrides.workos,
    },
    cookies: {
      secret: env.COOKIE_SECRET ?? env.SESSION_SECRET ?? '',
      domain: env.COOKIE_DOMAIN ?? undefined,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...overrides.cookies,
    },
  }
}
