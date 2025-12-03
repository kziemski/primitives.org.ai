/**
 * Cookie Management with iron-session
 *
 * Three encrypted cookies:
 * 1. token - Secure, HttpOnly (auth credentials)
 * 2. settings - JS accessible (anonymousId, preferences)
 * 3. session - Request tracking (geo, device, etc)
 */

import { sealData, unsealData } from 'iron-session'
import type {
  TokenData,
  SettingsData,
  SessionData,
  RequestData,
  CookieConfig,
  GeoData,
  ASNData,
  DeviceData,
} from './types.js'
import {
  DEFAULT_COOKIE_NAMES,
  DEFAULT_COOKIE_MAX_AGE,
} from './types.js'

// =============================================================================
// Cookie Encryption/Decryption
// =============================================================================

/**
 * Seal (encrypt) data for cookie storage
 */
export async function seal<T>(data: T, secret: string, ttl?: number): Promise<string> {
  return sealData(data, {
    password: secret,
    ttl: ttl ?? 0, // 0 = no expiration in seal, rely on cookie expiry
  })
}

/**
 * Unseal (decrypt) data from cookie
 */
export async function unseal<T>(sealed: string, secret: string): Promise<T | null> {
  try {
    const result = await unsealData<T>(sealed, {
      password: secret,
    })
    // Handle empty object returned by iron-session for invalid data
    if (result === null || result === undefined || (typeof result === 'object' && Object.keys(result as object).length === 0)) {
      return null
    }
    return result
  } catch {
    return null
  }
}

// =============================================================================
// Anonymous ID Generation
// =============================================================================

/**
 * Generate a random anonymous ID
 */
export function generateAnonymousId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback
  const array = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  // Format as UUID-like string
  const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `sess_${generateAnonymousId().replace(/-/g, '')}`
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash an IP address for privacy
 */
export async function hashIP(ip: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + secret)

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash).slice(0, 8), b => b.toString(16).padStart(2, '0')).join('')
  }

  // Simple fallback hash
  let hash = 0
  const str = ip + secret
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}

// =============================================================================
// Cookie Serialization
// =============================================================================

export interface CookieOptions {
  name: string
  value: string
  maxAge: number
  path?: string
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

/**
 * Serialize a cookie to a Set-Cookie header value
 */
export function serializeCookie(options: CookieOptions): string {
  const parts = [
    `${options.name}=${encodeURIComponent(options.value)}`,
    `Max-Age=${options.maxAge}`,
    `Path=${options.path ?? '/'}`,
  ]

  if (options.domain) {
    parts.push(`Domain=${options.domain}`)
  }

  if (options.secure) {
    parts.push('Secure')
  }

  if (options.httpOnly) {
    parts.push('HttpOnly')
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`)
  }

  return parts.join('; ')
}

/**
 * Parse cookies from a Cookie header
 */
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}

  const cookies: Record<string, string> = {}
  const pairs = cookieHeader.split(';')

  for (const pair of pairs) {
    const [name, ...valueParts] = pair.trim().split('=')
    if (name) {
      cookies[name] = decodeURIComponent(valueParts.join('='))
    }
  }

  return cookies
}

// =============================================================================
// Cookie Manager
// =============================================================================

export interface CookieManagerOptions {
  config: CookieConfig
  cookieHeader: string | null
}

/**
 * Cookie manager for handling all three cookie types
 */
export class CookieManager {
  private config: CookieConfig
  private cookies: Record<string, string>
  private setCookies: string[] = []

  // Cached data
  private tokenData: TokenData | null | undefined = undefined
  private settingsData: SettingsData | null | undefined = undefined
  private sessionData: SessionData | null | undefined = undefined

  constructor(options: CookieManagerOptions) {
    this.config = options.config
    this.cookies = parseCookies(options.cookieHeader)
  }

  // ---------------------------------------------------------------------------
  // Cookie Names
  // ---------------------------------------------------------------------------

  private get tokenCookieName(): string {
    return this.config.tokenCookieName ?? DEFAULT_COOKIE_NAMES.token
  }

  private get settingsCookieName(): string {
    return this.config.settingsCookieName ?? DEFAULT_COOKIE_NAMES.settings
  }

  private get sessionCookieName(): string {
    return this.config.sessionCookieName ?? DEFAULT_COOKIE_NAMES.session
  }

  // ---------------------------------------------------------------------------
  // Token Cookie (Secure, HttpOnly)
  // ---------------------------------------------------------------------------

  async getToken(): Promise<TokenData | null> {
    if (this.tokenData !== undefined) {
      return this.tokenData
    }

    const sealed = this.cookies[this.tokenCookieName]
    if (!sealed) {
      this.tokenData = null
      return null
    }

    this.tokenData = await unseal<TokenData>(sealed, this.config.secret)
    return this.tokenData
  }

  async setToken(data: TokenData): Promise<void> {
    this.tokenData = data
    const sealed = await seal(data, this.config.secret)

    this.setCookies.push(serializeCookie({
      name: this.tokenCookieName,
      value: sealed,
      maxAge: this.config.tokenMaxAge ?? DEFAULT_COOKIE_MAX_AGE.token,
      domain: this.config.domain,
      secure: this.config.secure ?? true,
      httpOnly: true,
      sameSite: this.config.sameSite ?? 'lax',
    }))
  }

  clearToken(): void {
    this.tokenData = null
    this.setCookies.push(serializeCookie({
      name: this.tokenCookieName,
      value: '',
      maxAge: 0,
      domain: this.config.domain,
      secure: this.config.secure ?? true,
      httpOnly: true,
      sameSite: this.config.sameSite ?? 'lax',
    }))
  }

  // ---------------------------------------------------------------------------
  // Settings Cookie (JS accessible, encrypted)
  // ---------------------------------------------------------------------------

  async getSettings(): Promise<SettingsData> {
    if (this.settingsData !== undefined && this.settingsData !== null) {
      return this.settingsData
    }

    const sealed = this.cookies[this.settingsCookieName]
    if (sealed) {
      const data = await unseal<SettingsData>(sealed, this.config.secret)
      if (data) {
        this.settingsData = data
        return data
      }
    }

    // Create default settings with new anonymous ID
    this.settingsData = {
      anonymousId: generateAnonymousId(),
      anonymousIdCreatedAt: Date.now(),
    }

    return this.settingsData
  }

  async setSettings(data: SettingsData): Promise<void> {
    this.settingsData = data
    const sealed = await seal(data, this.config.secret)

    this.setCookies.push(serializeCookie({
      name: this.settingsCookieName,
      value: sealed,
      maxAge: this.config.settingsMaxAge ?? DEFAULT_COOKIE_MAX_AGE.settings,
      domain: this.config.domain,
      secure: this.config.secure ?? true,
      httpOnly: false, // JS accessible
      sameSite: this.config.sameSite ?? 'lax',
    }))
  }

  async updateSettings(updates: Partial<SettingsData>): Promise<SettingsData> {
    const current = await this.getSettings()
    const updated = { ...current, ...updates }
    await this.setSettings(updated)
    return updated
  }

  // ---------------------------------------------------------------------------
  // Session Cookie (Request tracking)
  // ---------------------------------------------------------------------------

  async getSession(): Promise<SessionData> {
    if (this.sessionData !== undefined && this.sessionData !== null) {
      return this.sessionData
    }

    const sealed = this.cookies[this.sessionCookieName]
    if (sealed) {
      const data = await unseal<SessionData>(sealed, this.config.secret)
      if (data) {
        // Update last activity
        data.lastActivityAt = Date.now()
        if (data.requests) {
          data.requests.requestCount++
          data.requests.lastRequestAt = Date.now()
        }
        this.sessionData = data
        return data
      }
    }

    // Create new session
    const now = Date.now()
    this.sessionData = {
      sessionId: generateSessionId(),
      startedAt: now,
      lastActivityAt: now,
      csrfToken: generateCSRFToken(),
      requests: {
        requestCount: 1,
        firstRequestAt: now,
        lastRequestAt: now,
      },
    }

    return this.sessionData
  }

  async setSession(data: SessionData): Promise<void> {
    this.sessionData = data
    const sealed = await seal(data, this.config.secret)

    this.setCookies.push(serializeCookie({
      name: this.sessionCookieName,
      value: sealed,
      maxAge: this.config.sessionMaxAge ?? DEFAULT_COOKIE_MAX_AGE.session,
      domain: this.config.domain,
      secure: this.config.secure ?? true,
      httpOnly: true,
      sameSite: this.config.sameSite ?? 'lax',
    }))
  }

  async updateSession(updates: Partial<SessionData>): Promise<SessionData> {
    const current = await this.getSession()
    const updated = { ...current, ...updates }
    await this.setSession(updated)
    return updated
  }

  // ---------------------------------------------------------------------------
  // Enrich Session with Request Data
  // ---------------------------------------------------------------------------

  async enrichSessionFromRequest(options: {
    ip?: string
    geo?: GeoData
    asn?: ASNData
    device?: DeviceData
    referrer?: string
    url?: string
    utm?: RequestData['utm']
  }): Promise<SessionData> {
    const session = await this.getSession()

    // Hash IP for privacy
    if (options.ip && !session.ipHash) {
      session.ipHash = await hashIP(options.ip, this.config.secret)
    }

    // Set geo data (only on first request)
    if (options.geo && !session.geo) {
      session.geo = options.geo
    }

    // Set ASN data (only on first request)
    if (options.asn && !session.asn) {
      session.asn = options.asn
    }

    // Set device data (only on first request)
    if (options.device && !session.device) {
      session.device = options.device
    }

    // Update request tracking
    if (session.requests) {
      if (options.referrer && !session.requests.referrer) {
        session.requests.referrer = options.referrer
        try {
          session.requests.referrerDomain = new URL(options.referrer).hostname
        } catch {
          // Invalid URL
        }
      }

      if (options.url && !session.requests.landingPage) {
        session.requests.landingPage = options.url
      }

      if (options.utm && !session.requests.utm) {
        session.requests.utm = options.utm
      }
    }

    await this.setSession(session)
    return session
  }

  // ---------------------------------------------------------------------------
  // Get Set-Cookie Headers
  // ---------------------------------------------------------------------------

  getSetCookieHeaders(): string[] {
    return this.setCookies
  }

  /**
   * Commit all pending cookie changes
   * Call this after all cookie operations to get the Set-Cookie headers
   */
  async commit(): Promise<string[]> {
    // Ensure settings are saved if modified
    if (this.settingsData !== undefined && this.settingsData !== null) {
      await this.setSettings(this.settingsData)
    }

    // Ensure session is saved if modified
    if (this.sessionData !== undefined && this.sessionData !== null) {
      await this.setSession(this.sessionData)
    }

    return this.setCookies
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a cookie manager from a request
 */
export function createCookieManager(
  config: CookieConfig,
  cookieHeader: string | null
): CookieManager {
  return new CookieManager({ config, cookieHeader })
}
