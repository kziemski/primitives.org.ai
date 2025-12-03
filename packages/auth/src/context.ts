/**
 * Server-side Auth Context
 *
 * Uses AsyncLocalStorage to make auth context available
 * anywhere in the request lifecycle without explicit passing.
 *
 * This enables the isomorphic $.user() API to work on the server.
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import type { AuthContext } from './types.js'

// =============================================================================
// AsyncLocalStorage for Request Context
// =============================================================================

export interface RequestContext {
  auth: AuthContext
  /** Base URL for auth endpoints (for server-side fetches if needed) */
  authUrl?: string
}

/**
 * AsyncLocalStorage instance for request-scoped auth context
 */
export const authStorage = new AsyncLocalStorage<RequestContext>()

/**
 * Run a function with auth context available
 */
export function runWithAuth<T>(context: RequestContext, fn: () => T): T {
  return authStorage.run(context, fn)
}

/**
 * Get the current auth context (server-side only)
 * Returns null if not in a request context
 */
export function getServerAuthContext(): RequestContext | undefined {
  return authStorage.getStore()
}

/**
 * Check if we're running on the server with auth context
 */
export function hasServerAuthContext(): boolean {
  return authStorage.getStore() !== undefined
}

// =============================================================================
// Environment Detection
// =============================================================================

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Check if running in server environment
 */
export function isServer(): boolean {
  return !isBrowser()
}

// =============================================================================
// Server-side Auth Getters
// =============================================================================

/**
 * Get current user from server context
 * @throws Error if not in auth context
 */
export function getServerUser() {
  const ctx = getServerAuthContext()
  if (!ctx) {
    throw new Error('$.user() called outside of auth context. Ensure authMiddleware is applied.')
  }
  return ctx.auth.token?.user ?? null
}

/**
 * Get current session from server context
 * @throws Error if not in auth context
 */
export function getServerSession() {
  const ctx = getServerAuthContext()
  if (!ctx) {
    throw new Error('$.session() called outside of auth context. Ensure authMiddleware is applied.')
  }
  return ctx.auth.session
}

/**
 * Get current settings from server context
 * @throws Error if not in auth context
 */
export function getServerSettings() {
  const ctx = getServerAuthContext()
  if (!ctx) {
    throw new Error('$.settings() called outside of auth context. Ensure authMiddleware is applied.')
  }
  return ctx.auth.settings
}

/**
 * Check if authenticated from server context
 * @throws Error if not in auth context
 */
export function getServerIsAuthenticated(): boolean {
  const ctx = getServerAuthContext()
  if (!ctx) {
    throw new Error('$.user.isAuthenticated() called outside of auth context. Ensure authMiddleware is applied.')
  }
  return ctx.auth.isAuthenticated
}
