/**
 * Authentication Types
 *
 * Three cookie types:
 * 1. token - Secure, HttpOnly, contains auth credentials
 * 2. settings - Not secure (JS accessible), encrypted contents with anonymousId etc
 * 3. session - Request-level data like geo, referrer, etc
 */

// =============================================================================
// Token Cookie (Secure, HttpOnly)
// =============================================================================

/**
 * WorkOS user profile
 */
export interface WorkOSUser {
  id: string
  email: string
  emailVerified: boolean
  firstName?: string
  lastName?: string
  profilePictureUrl?: string
  createdAt: string
  updatedAt: string
}

/**
 * Token cookie data - secure, HttpOnly
 * Contains authentication credentials
 */
export interface TokenData {
  /** WorkOS access token */
  accessToken: string
  /** WorkOS refresh token */
  refreshToken: string
  /** Token expiration timestamp (ms) */
  expiresAt: number
  /** WorkOS user profile */
  user: WorkOSUser
  /** Organization ID if authenticated via org */
  organizationId?: string
  /** Impersonation info if admin is impersonating */
  impersonator?: {
    email: string
    reason?: string
  }
}

// =============================================================================
// Settings Cookie (JS accessible, encrypted contents)
// =============================================================================

/**
 * Theme preference
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * Settings cookie data - JS accessible but encrypted
 * Contains user preferences and anonymous tracking
 */
export interface SettingsData {
  /** Anonymous ID for tracking (persists across sessions) */
  anonymousId: string
  /** When the anonymous ID was created */
  anonymousIdCreatedAt: number
  /** Theme preference */
  theme?: Theme
  /** Locale preference */
  locale?: string
  /** Timezone */
  timezone?: string
  /** Feature flags */
  features?: Record<string, boolean>
  /** Custom settings */
  custom?: Record<string, unknown>
  /** Consent flags */
  consent?: {
    analytics?: boolean
    marketing?: boolean
    personalization?: boolean
    consentedAt?: number
  }
}

// =============================================================================
// Session Cookie (Request-level data)
// =============================================================================

/**
 * Geolocation data from Cloudflare headers
 */
export interface GeoData {
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string
  /** Region/state code */
  region?: string
  /** City name */
  city?: string
  /** Postal code */
  postalCode?: string
  /** Latitude */
  latitude?: string
  /** Longitude */
  longitude?: string
  /** Timezone */
  timezone?: string
  /** Continent */
  continent?: string
  /** Is EU country */
  isEU?: boolean
}

/**
 * ASN (Autonomous System Number) data
 */
export interface ASNData {
  /** ASN number */
  asn?: number
  /** AS Organization name */
  asOrg?: string
  /** Connection type (e.g., 'corporate', 'residential', 'mobile') */
  connectionType?: string
}

/**
 * Device/client data
 */
export interface DeviceData {
  /** User agent string */
  userAgent?: string
  /** Parsed browser name */
  browser?: string
  /** Parsed browser version */
  browserVersion?: string
  /** Parsed OS name */
  os?: string
  /** Parsed OS version */
  osVersion?: string
  /** Device type */
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown'
  /** Is known bot */
  isBot?: boolean
}

/**
 * Request tracking data
 */
export interface RequestData {
  /** Number of requests in this session */
  requestCount: number
  /** First request timestamp */
  firstRequestAt: number
  /** Last request timestamp */
  lastRequestAt: number
  /** First page URL */
  landingPage?: string
  /** Referrer URL */
  referrer?: string
  /** Referrer domain */
  referrerDomain?: string
  /** UTM parameters */
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
}

/**
 * Session cookie data - request-level tracking
 */
export interface SessionData {
  /** Session ID */
  sessionId: string
  /** Session start timestamp */
  startedAt: number
  /** Last activity timestamp */
  lastActivityAt: number
  /** Client IP address (hashed for privacy) */
  ipHash?: string
  /** Geolocation data */
  geo?: GeoData
  /** ASN data */
  asn?: ASNData
  /** Device data */
  device?: DeviceData
  /** Request tracking */
  requests?: RequestData
  /** CSRF token for form submissions */
  csrfToken?: string
}

// =============================================================================
// Combined Auth Context
// =============================================================================

/**
 * Full authentication context available in request handlers
 */
export interface AuthContext {
  /** Is user authenticated */
  isAuthenticated: boolean
  /** Token data (if authenticated) */
  token?: TokenData
  /** Settings data (always available) */
  settings: SettingsData
  /** Session data (always available) */
  session: SessionData
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * WorkOS configuration
 */
export interface WorkOSConfig {
  /** WorkOS API key */
  apiKey: string
  /** WorkOS client ID */
  clientId: string
  /** Authentication API domain */
  authDomain?: string
  /** AuthKit domain */
  authKitDomain?: string
  /** OAuth callback URL */
  callbackUrl: string
  /** Default redirect after login */
  defaultRedirect?: string
}

/**
 * Cookie configuration
 */
export interface CookieConfig {
  /** Secret for iron-session encryption (32+ chars) */
  secret: string
  /** Cookie domain (e.g., '.apis.do' for all subdomains) */
  domain?: string
  /** Secure flag (HTTPS only) - default true in production */
  secure?: boolean
  /** SameSite attribute */
  sameSite?: 'strict' | 'lax' | 'none'
  /** Token cookie name */
  tokenCookieName?: string
  /** Settings cookie name */
  settingsCookieName?: string
  /** Session cookie name */
  sessionCookieName?: string
  /** Token cookie max age (default: 7 days) */
  tokenMaxAge?: number
  /** Settings cookie max age (default: 1 year) */
  settingsMaxAge?: number
  /** Session cookie max age (default: 30 minutes sliding) */
  sessionMaxAge?: number
}

/**
 * Full auth configuration
 */
export interface AuthConfig {
  workos: WorkOSConfig
  cookies: CookieConfig
}

// =============================================================================
// Cookie Names (defaults)
// =============================================================================

export const DEFAULT_COOKIE_NAMES = {
  token: '__token',
  settings: '__settings',
  session: '__session',
} as const

export const DEFAULT_COOKIE_MAX_AGE = {
  token: 7 * 24 * 60 * 60, // 7 days
  settings: 365 * 24 * 60 * 60, // 1 year
  session: 30 * 60, // 30 minutes (sliding)
} as const
