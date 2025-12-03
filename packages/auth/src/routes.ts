/**
 * Auth Routes for Hono
 *
 * Provides:
 * - GET /auth/login - Redirect to AuthKit/SSO
 * - GET /auth/callback - OAuth callback handler
 * - GET /auth/logout - Logout and clear session
 * - GET /auth/user - Get current user (API)
 * - GET /auth/session - Get session info (API)
 */

import { Hono } from 'hono'
import type { AuthConfig } from './types.js'
import { getCookieManager, getAuth } from './middleware.js'
import {
  getAuthKitUrl,
  getAuthorizationUrl,
  authenticateWithCode,
  createTokenData,
  getLogoutUrl,
} from './workos.js'

export interface AuthRoutesOptions {
  /** Auth configuration */
  config: AuthConfig
  /** Base path for auth routes (default: /auth) */
  basePath?: string
  /** Default redirect after login */
  defaultRedirect?: string
  /** Default redirect after logout */
  logoutRedirect?: string
  /** Custom login page path (if not using AuthKit) */
  loginPage?: string
}

/**
 * Create auth routes
 */
export function createAuthRoutes(options: AuthRoutesOptions) {
  const {
    config,
    basePath = '/auth',
    defaultRedirect = '/',
    logoutRedirect = '/',
  } = options

  const app = new Hono()

  // ---------------------------------------------------------------------------
  // GET /auth/login - Redirect to login
  // ---------------------------------------------------------------------------
  app.get('/login', (c) => {
    const query = c.req.query()

    // Store return URL in state
    const returnTo = query.return_to ?? query.redirect ?? defaultRedirect
    const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64url')

    // Build authorization URL
    const url = getAuthKitUrl(config.workos, {
      state,
      provider: query.provider,
      connectionId: query.connection_id,
      organizationId: query.organization_id,
      loginHint: query.login_hint ?? query.email,
      screenHint: query.screen_hint as 'sign-up' | 'sign-in' | undefined,
    })

    return c.redirect(url)
  })

  // ---------------------------------------------------------------------------
  // GET /auth/signup - Redirect to signup
  // ---------------------------------------------------------------------------
  app.get('/signup', (c) => {
    const query = c.req.query()
    const returnTo = query.return_to ?? query.redirect ?? defaultRedirect
    const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64url')

    const url = getAuthKitUrl(config.workos, {
      state,
      screenHint: 'sign-up',
      loginHint: query.email,
    })

    return c.redirect(url)
  })

  // ---------------------------------------------------------------------------
  // GET /auth/callback - OAuth callback
  // ---------------------------------------------------------------------------
  app.get('/callback', async (c) => {
    const query = c.req.query()
    const { code, state, error, error_description } = query

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description)
      return c.redirect(`${logoutRedirect}?error=${encodeURIComponent(error)}`)
    }

    // Validate code
    if (!code) {
      return c.redirect(`${logoutRedirect}?error=missing_code`)
    }

    // Parse state to get return URL
    let returnTo = defaultRedirect
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
        returnTo = decoded.returnTo ?? defaultRedirect
      } catch {
        // Invalid state, use default
      }
    }

    try {
      // Exchange code for tokens
      const result = await authenticateWithCode(config.workos, code)

      // Create token data
      const tokenData = createTokenData(result)

      // Get cookie manager and set token
      const cookieManager = getCookieManager(c)
      await cookieManager.setToken(tokenData)

      // Update settings with user info for correlation
      const settings = await cookieManager.getSettings()
      // Keep anonymousId for correlation but could add userId here
      await cookieManager.setSettings(settings)

      // Commit cookies
      const setCookies = await cookieManager.commit()
      for (const cookie of setCookies) {
        c.header('Set-Cookie', cookie, { append: true })
      }

      // Redirect to return URL
      return c.redirect(returnTo)
    } catch (err) {
      console.error('Authentication error:', err)
      return c.redirect(`${logoutRedirect}?error=auth_failed`)
    }
  })

  // ---------------------------------------------------------------------------
  // GET /auth/logout - Logout
  // ---------------------------------------------------------------------------
  app.get('/logout', async (c) => {
    const query = c.req.query()
    const returnTo = query.return_to ?? query.redirect ?? logoutRedirect

    // Clear token cookie
    const cookieManager = getCookieManager(c)
    cookieManager.clearToken()

    // Commit cookies
    const setCookies = await cookieManager.commit()
    for (const cookie of setCookies) {
      c.header('Set-Cookie', cookie, { append: true })
    }

    // Redirect to WorkOS logout (to clear their session too)
    // Then they'll redirect back to returnTo
    const logoutUrl = getLogoutUrl(config.workos, returnTo)
    return c.redirect(logoutUrl)
  })

  // ---------------------------------------------------------------------------
  // POST /auth/logout - Logout (for API calls)
  // ---------------------------------------------------------------------------
  app.post('/logout', async (c) => {
    const cookieManager = getCookieManager(c)
    cookieManager.clearToken()

    const setCookies = await cookieManager.commit()
    for (const cookie of setCookies) {
      c.header('Set-Cookie', cookie, { append: true })
    }

    return c.json({ success: true })
  })

  // ---------------------------------------------------------------------------
  // GET /auth/user - Get current user
  // ---------------------------------------------------------------------------
  app.get('/user', (c) => {
    const auth = getAuth(c)

    if (!auth.isAuthenticated || !auth.token) {
      return c.json({ user: null })
    }

    return c.json({
      user: {
        id: auth.token.user.id,
        email: auth.token.user.email,
        firstName: auth.token.user.firstName,
        lastName: auth.token.user.lastName,
        profilePictureUrl: auth.token.user.profilePictureUrl,
        emailVerified: auth.token.user.emailVerified,
      },
      organizationId: auth.token.organizationId,
      impersonator: auth.token.impersonator,
    })
  })

  // ---------------------------------------------------------------------------
  // GET /auth/session - Get session info
  // ---------------------------------------------------------------------------
  app.get('/session', (c) => {
    const auth = getAuth(c)

    // Return session data with isAuthenticated for client compatibility
    return c.json({
      ...auth.session,
      isAuthenticated: auth.isAuthenticated,
      anonymousId: auth.settings.anonymousId,
    })
  })

  // ---------------------------------------------------------------------------
  // GET /auth/settings - Get/update settings
  // ---------------------------------------------------------------------------
  app.get('/settings', (c) => {
    const auth = getAuth(c)

    // Return full settings wrapped for client API compatibility
    return c.json({ settings: auth.settings })
  })

  app.post('/settings', async (c) => {
    const body = await c.req.json()
    const cookieManager = getCookieManager(c)

    const settings = await cookieManager.getSettings()
    const updated = await cookieManager.updateSettings({
      ...settings,
      theme: body.theme ?? settings.theme,
      locale: body.locale ?? settings.locale,
      timezone: body.timezone ?? settings.timezone,
      consent: body.consent ?? settings.consent,
      custom: body.custom ?? settings.custom,
    })

    const setCookies = await cookieManager.commit()
    for (const cookie of setCookies) {
      c.header('Set-Cookie', cookie, { append: true })
    }

    return c.json({ success: true, settings: updated })
  })

  return app
}

/**
 * Mount auth routes on a Hono app
 */
export function mountAuthRoutes(
  app: Hono,
  options: AuthRoutesOptions
): void {
  const basePath = options.basePath ?? '/auth'
  const routes = createAuthRoutes(options)
  app.route(basePath, routes)
}
