/**
 * ai-database - Schema-first database with promise pipelining
 *
 * Supports both direct and destructured usage:
 *
 * @example Direct usage - everything on one object
 * ```ts
 * const { db } = DB({
 *   Lead: {
 *     name: 'string',
 *     company: 'Company.leads',
 *   },
 *   Company: {
 *     name: 'string',
 *   }
 * })
 *
 * // Chain without await
 * const leads = db.Lead.list()
 * const qualified = await leads.filter(l => l.score > 80)
 *
 * // Batch relationship loading
 * const withCompanies = await leads.map(l => ({
 *   name: l.name,
 *   company: l.company,  // Batch loaded!
 * }))
 *
 * // Natural language queries
 * const results = await db.Lead`who closed deals this month?`
 * ```
 *
 * Provider is resolved transparently from environment (DATABASE_URL).
 *
 * @packageDocumentation
 */
export { DB } from './schema.js';
export { 
// Thing conversion utilities
toExpanded, toFlat, 
// Configuration
setProvider, setNLQueryGenerator, 
// Schema parsing
parseSchema, 
// Schema Definition
defineNoun, defineVerb, nounToSchema, Verbs, 
// AI Inference
conjugate, pluralize, singularize, inferNoun, Type, 
// URL utilities
resolveUrl, resolveShortUrl, parseUrl, } from './schema.js';
export { MemoryProvider, createMemoryProvider, Semaphore, } from './memory-provider.js';
// Promise pipelining exports
export { DBPromise, isDBPromise, getRawDBPromise, createListPromise, createEntityPromise, createSearchPromise, wrapEntityOperations, DB_PROMISE_SYMBOL, RAW_DB_PROMISE_SYMBOL, } from './ai-promise-db.js';
export { 
// Standard definitions
StandardHierarchies, StandardPermissions, CRUDPermissions, createStandardRoles, 
// Verb-scoped permissions
verbPermission, nounPermissions, matchesPermission, 
// Helper functions
parseSubject, formatSubject, parseResource, formatResource, subjectMatches, resourceMatches, 
// Schema integration
authorizeNoun, linkBusinessRole, 
// In-memory engine
InMemoryAuthorizationEngine, 
// Nouns
RoleNoun, AssignmentNoun, PermissionNoun, AuthorizationNouns, } from './authorization.js';
// =============================================================================
// Durable Promise - Time-agnostic execution
// =============================================================================
// Core durable promise exports
export { DurablePromise, isDurablePromise, durable, DURABLE_PROMISE_SYMBOL, 
// Context management
getCurrentContext, withContext, setDefaultContext, 
// Batch scheduler
getBatchScheduler, setBatchScheduler, } from './durable-promise.js';
// Execution queue for priority-based scheduling
export { ExecutionQueue, createExecutionQueue, getDefaultQueue, setDefaultQueue, } from './execution-queue.js';
// ClickHouse-backed durable provider
export { ClickHouseDurableProvider, createClickHouseDurableProvider, } from './durable-clickhouse.js';
