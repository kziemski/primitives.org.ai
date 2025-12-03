/**
 * Hono Authentication Middleware
 *
 * Provides:
 * - Cookie management (token, settings, session)
 * - Automatic token refresh
 * - Geo/device enrichment from Cloudflare headers
 * - Auth context on every request
 */

import type { Context, Next, MiddlewareHandler } from 'hono'
import { createCookieManager, type CookieManager } from './cookies.js'
import { refreshTokenIfNeeded, isTokenExpired } from './workos.js'
import { runWithAuth } from './context.js'
import type {
  AuthConfig,
  AuthContext,
  TokenData,
  SettingsData,
  SessionData,
  RequestData,
  GeoData,
  ASNData,
  DeviceData,
} from './types.js'

// =============================================================================
// Context Keys
// =============================================================================

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext
    cookieManager: CookieManager
  }
}

// =============================================================================
// Cloudflare Header Parsing
// =============================================================================

/**
 * Extract geo data from Cloudflare headers
 */
function extractGeoData(c: Context): GeoData {
  return {
    country: c.req.header('cf-ipcountry') ?? undefined,
    region: c.req.header('cf-region') ?? undefined,
    city: c.req.header('cf-ipcity') ?? undefined,
    postalCode: c.req.header('cf-postal-code') ?? undefined,
    latitude: c.req.header('cf-iplat') ?? undefined,
    longitude: c.req.header('cf-iplon') ?? undefined,
    timezone: c.req.header('cf-timezone') ?? undefined,
    continent: c.req.header('cf-ipcontinent') ?? undefined,
    isEU: c.req.header('cf-is-eu') === '1',
  }
}

/**
 * Extract ASN data from Cloudflare headers
 */
function extractASNData(c: Context): ASNData {
  const asn = c.req.header('cf-asn')
  return {
    asn: asn ? parseInt(asn, 10) : undefined,
    asOrg: c.req.header('cf-asorg') ?? undefined,
    connectionType: c.req.header('cf-connection-type') ?? undefined,
  }
}

/**
 * Parse user agent to extract device info
 */
function parseUserAgent(ua: string): DeviceData {
  const data: DeviceData = {
    userAgent: ua,
    deviceType: 'unknown',
    isBot: false,
  }

  // Detect bots
  const botPatterns = /bot|crawler|spider|scraper|curl|wget|python|java|go-http|headless/i
  if (botPatterns.test(ua)) {
    data.isBot = true
    data.deviceType = 'bot'
    return data
  }

  // Detect device type
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) {
      data.deviceType = 'tablet'
    } else {
      data.deviceType = 'mobile'
    }
  } else {
    data.deviceType = 'desktop'
  }

  // Extract browser
  if (/firefox/i.test(ua)) {
    data.browser = 'Firefox'
    const match = ua.match(/firefox\/([\d.]+)/i)
    if (match) data.browserVersion = match[1]
  } else if (/edg/i.test(ua)) {
    data.browser = 'Edge'
    const match = ua.match(/edg\/([\d.]+)/i)
    if (match) data.browserVersion = match[1]
  } else if (/chrome/i.test(ua)) {
    data.browser = 'Chrome'
    const match = ua.match(/chrome\/([\d.]+)/i)
    if (match) data.browserVersion = match[1]
  } else if (/safari/i.test(ua)) {
    data.browser = 'Safari'
    const match = ua.match(/version\/([\d.]+)/i)
    if (match) data.browserVersion = match[1]
  }

  // Extract OS (check iOS/Android before macOS since iOS UA contains "Mac OS X")
  if (/iphone|ipad|ipod/i.test(ua)) {
    data.os = 'iOS'
    const match = ua.match(/os ([\d_]+)/i)
    if (match?.[1]) data.osVersion = match[1].replace(/_/g, '.')
  } else if (/android/i.test(ua)) {
    data.os = 'Android'
    const match = ua.match(/android ([\d.]+)/i)
    if (match) data.osVersion = match[1]
  } else if (/windows/i.test(ua)) {
    data.os = 'Windows'
    const match = ua.match(/windows nt ([\d.]+)/i)
    if (match) data.osVersion = match[1]
  } else if (/mac os x/i.test(ua)) {
    data.os = 'macOS'
    const match = ua.match(/mac os x ([\d._]+)/i)
    if (match?.[1]) data.osVersion = match[1].replace(/_/g, '.')
  } else if (/linux/i.test(ua)) {
    data.os = 'Linux'
  }

  return data
}

/**
 * Extract UTM parameters from URL
 */
function extractUTM(url: URL): RequestData['utm'] | undefined {
  const utm: RequestData['utm'] = {}
  let hasUTM = false

  const params = ['source', 'medium', 'campaign', 'term', 'content'] as const
  for (const param of params) {
    const value = url.searchParams.get(`utm_${param}`)
    if (value) {
      utm[param] = value
      hasUTM = true
    }
  }

  return hasUTM ? utm : undefined
}

// =============================================================================
// Auth Middleware
// =============================================================================

export interface AuthMiddlewareOptions {
  /** Auth configuration */
  config: AuthConfig
  /** Paths to exclude from auth (e.g., health checks) */
  excludePaths?: string[]
  /** Require authentication (401 if not authenticated) */
  requireAuth?: boolean
  /** Auto-refresh tokens */
  autoRefresh?: boolean
}

/**
 * Create auth middleware
 */
export function authMiddleware(options: AuthMiddlewareOptions): MiddlewareHandler {
  const { config, excludePaths = [], requireAuth = false, autoRefresh = true } = options

  return async (c: Context, next: Next): Promise<Response | void> => {
    // Check excluded paths
    const path = new URL(c.req.url).pathname
    if (excludePaths.some(p => path.startsWith(p))) {
      await next()
      return
    }

    // Create cookie manager
    const cookieManager = createCookieManager(
      config.cookies,
      c.req.header('cookie') ?? null
    )

    // Get token (may be null if not authenticated)
    let token = await cookieManager.getToken()

    // Auto-refresh token if needed
    if (token && autoRefresh && isTokenExpired(token)) {
      const refreshed = await refreshTokenIfNeeded(config.workos, token)
      if (refreshed) {
        token = refreshed
        await cookieManager.setToken(token)
      } else {
        // Token refresh failed, clear it
        cookieManager.clearToken()
        token = null
      }
    }

    // Get settings (always available)
    const settings = await cookieManager.getSettings()

    // Get session and enrich with request data
    const url = new URL(c.req.url)
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]
    const userAgent = c.req.header('user-agent') ?? ''
    const referrer = c.req.header('referer') ?? undefined

    const session = await cookieManager.enrichSessionFromRequest({
      ip,
      geo: extractGeoData(c),
      asn: extractASNData(c),
      device: parseUserAgent(userAgent),
      referrer,
      url: url.pathname,
      utm: extractUTM(url),
    })

    // Build auth context
    const auth: AuthContext = {
      isAuthenticated: token !== null,
      token: token ?? undefined,
      settings,
      session,
    }

    // Check if auth is required
    if (requireAuth && !auth.isAuthenticated) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Set context variables
    c.set('auth', auth)
    c.set('cookieManager', cookieManager)

    // Continue to next middleware/handler with AsyncLocalStorage context
    // This makes $.user(), $.session(), etc. work on the server
    await runWithAuth({ auth }, async () => {
      await next()
    })

    // Commit cookies to response
    const setCookies = await cookieManager.commit()
    for (const cookie of setCookies) {
      c.header('Set-Cookie', cookie, { append: true })
    }
  }
}

// =============================================================================
// Auth Helpers
// =============================================================================

/**
 * Get auth context from Hono context
 */
export function getAuth(c: Context): AuthContext {
  return c.get('auth')
}

/**
 * Get cookie manager from Hono context
 */
export function getCookieManager(c: Context): CookieManager {
  return c.get('cookieManager')
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(c: Context): boolean {
  return c.get('auth').isAuthenticated
}

/**
 * Get current user (throws if not authenticated)
 */
export function getUser(c: Context) {
  const auth = c.get('auth')
  if (!auth.isAuthenticated || !auth.token) {
    throw new Error('Not authenticated')
  }
  return auth.token.user
}

/**
 * Get anonymous ID
 */
export function getAnonymousId(c: Context): string {
  return c.get('auth').settings.anonymousId
}

/**
 * Get session ID
 */
export function getSessionId(c: Context): string {
  return c.get('auth').session.sessionId
}

/**
 * Require authentication (middleware)
 */
export function requireAuthentication(): MiddlewareHandler {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const auth = c.get('auth')
    if (!auth?.isAuthenticated) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    await next()
  }
}

// =============================================================================
// CSRF Protection
// =============================================================================

/**
 * CSRF protection middleware
 */
export function csrfProtection(): MiddlewareHandler {
  return async (c: Context, next: Next): Promise<Response | void> => {
    // Skip for GET, HEAD, OPTIONS
    const method = c.req.method.toUpperCase()
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      await next()
      return
    }

    const auth = c.get('auth')
    if (!auth) {
      return c.json({ error: 'CSRF validation failed' }, 403)
    }

    // Check CSRF token
    const token = c.req.header('x-csrf-token') ?? (await c.req.parseBody())['_csrf']
    if (token !== auth.session.csrfToken) {
      return c.json({ error: 'CSRF validation failed' }, 403)
    }

    await next()
  }
}
