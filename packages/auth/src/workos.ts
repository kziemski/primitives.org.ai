/**
 * WorkOS Integration
 *
 * Handles authentication with WorkOS:
 * - SSO (Google, Microsoft, SAML, etc.)
 * - AuthKit (hosted login UI)
 * - User management
 * - Session management
 */

import { WorkOS } from '@workos-inc/node'
import type { WorkOSConfig, TokenData, WorkOSUser } from './types.js'

// =============================================================================
// WorkOS Client
// =============================================================================

let workosClient: WorkOS | null = null

/**
 * Get or create the WorkOS client singleton
 */
export function getWorkOS(config: WorkOSConfig): WorkOS {
  if (!workosClient) {
    workosClient = new WorkOS(config.apiKey, {
      // Custom API hostname if configured
      ...(config.authDomain && { apiHostname: config.authDomain }),
    })
  }
  return workosClient
}

// =============================================================================
// Authentication URLs
// =============================================================================

export interface AuthorizationUrlOptions {
  /** Provider for direct SSO (e.g., 'GoogleOAuth', 'MicrosoftOAuth') */
  provider?: string
  /** Connection ID for enterprise SSO */
  connectionId?: string
  /** Organization ID */
  organizationId?: string
  /** Custom state parameter */
  state?: string
  /** Login hint (email) */
  loginHint?: string
  /** Domain hint for SSO */
  domainHint?: string
  /** Screen hint ('sign-up' | 'sign-in') */
  screenHint?: 'sign-up' | 'sign-in'
}

/**
 * Get the authorization URL for OAuth/SSO
 */
export function getAuthorizationUrl(
  config: WorkOSConfig,
  options: AuthorizationUrlOptions = {}
): string {
  const workos = getWorkOS(config)

  return workos.userManagement.getAuthorizationUrl({
    clientId: config.clientId,
    redirectUri: config.callbackUrl,
    provider: options.provider as any,
    connectionId: options.connectionId,
    organizationId: options.organizationId,
    state: options.state,
    loginHint: options.loginHint,
    domainHint: options.domainHint,
    screenHint: options.screenHint,
  })
}

/**
 * Get the AuthKit URL (hosted login UI)
 */
export function getAuthKitUrl(
  config: WorkOSConfig,
  options: AuthorizationUrlOptions = {}
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
  })

  if (options.state) params.set('state', options.state)
  if (options.loginHint) params.set('login_hint', options.loginHint)
  if (options.screenHint) params.set('screen_hint', options.screenHint)
  if (options.organizationId) params.set('organization_id', options.organizationId)

  const domain = config.authKitDomain ?? 'authkit.workos.com'
  return `https://${domain}/?${params.toString()}`
}

// =============================================================================
// Token Exchange
// =============================================================================

export interface AuthenticateResult {
  user: WorkOSUser
  accessToken: string
  refreshToken: string
  expiresIn: number
  organizationId?: string
  impersonator?: {
    email: string
    reason?: string
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function authenticateWithCode(
  config: WorkOSConfig,
  code: string
): Promise<AuthenticateResult> {
  const workos = getWorkOS(config)

  const response = await workos.userManagement.authenticateWithCode({
    clientId: config.clientId,
    code,
  })

  return {
    user: mapWorkOSUser(response.user),
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresIn: 3600, // WorkOS tokens expire in 1 hour
    organizationId: response.organizationId ?? undefined,
    impersonator: response.impersonator ? {
      email: response.impersonator.email,
      reason: response.impersonator.reason ?? undefined,
    } : undefined,
  }
}

/**
 * Refresh an access token
 */
export async function refreshAccessToken(
  config: WorkOSConfig,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const workos = getWorkOS(config)

  const response = await workos.userManagement.authenticateWithRefreshToken({
    clientId: config.clientId,
    refreshToken,
  })

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresIn: 3600,
  }
}

// =============================================================================
// User Management
// =============================================================================

/**
 * Map WorkOS user to our user type
 */
function mapWorkOSUser(workosUser: any): WorkOSUser {
  return {
    id: workosUser.id,
    email: workosUser.email,
    emailVerified: workosUser.emailVerified ?? false,
    firstName: workosUser.firstName ?? undefined,
    lastName: workosUser.lastName ?? undefined,
    profilePictureUrl: workosUser.profilePictureUrl ?? undefined,
    createdAt: workosUser.createdAt,
    updatedAt: workosUser.updatedAt,
  }
}

/**
 * Get user by ID
 */
export async function getUser(config: WorkOSConfig, userId: string): Promise<WorkOSUser | null> {
  const workos = getWorkOS(config)

  try {
    const user = await workos.userManagement.getUser(userId)
    return mapWorkOSUser(user)
  } catch {
    return null
  }
}

/**
 * Get user by access token (introspect)
 */
export async function getUserFromToken(
  config: WorkOSConfig,
  accessToken: string
): Promise<WorkOSUser | null> {
  const workos = getWorkOS(config)

  try {
    // Decode JWT to get user ID (WorkOS tokens are JWTs)
    const parts = accessToken.split('.')
    if (!parts[1]) {
      return null
    }
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    )
    const userId = payload.sub
    return getUser(config, userId)
  } catch {
    return null
  }
}

// =============================================================================
// Session Management
// =============================================================================

/**
 * Revoke a session (logout)
 */
export async function revokeSession(
  config: WorkOSConfig,
  sessionId: string
): Promise<void> {
  // WorkOS doesn't have direct session revocation in User Management
  // Sessions are managed via token expiration
  // This is a placeholder for future implementation
}

/**
 * Create token data from authentication result
 */
export function createTokenData(result: AuthenticateResult): TokenData {
  return {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: Date.now() + (result.expiresIn * 1000),
    organizationId: result.organizationId,
    impersonator: result.impersonator,
  }
}

/**
 * Check if token is expired or will expire soon
 */
export function isTokenExpired(token: TokenData, bufferMs = 60000): boolean {
  return Date.now() + bufferMs >= token.expiresAt
}

/**
 * Refresh token if needed
 */
export async function refreshTokenIfNeeded(
  config: WorkOSConfig,
  token: TokenData
): Promise<TokenData | null> {
  if (!isTokenExpired(token)) {
    return token
  }

  try {
    const refreshed = await refreshAccessToken(config, token.refreshToken)
    return {
      ...token,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: Date.now() + (refreshed.expiresIn * 1000),
    }
  } catch {
    // Refresh failed, token is invalid
    return null
  }
}

// =============================================================================
// Logout URL
// =============================================================================

/**
 * Get the logout URL
 */
export function getLogoutUrl(config: WorkOSConfig, returnTo?: string): string {
  const params = new URLSearchParams()

  if (returnTo) {
    params.set('return_to', returnTo)
  }

  // WorkOS logout endpoint
  const domain = config.authDomain ?? 'api.workos.com'
  return `https://${domain}/user_management/sessions/logout?${params.toString()}`
}
