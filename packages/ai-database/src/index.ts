/**
 * ai-database - AI-powered database interface primitives
 *
 * Follows mdxld conventions:
 * - Everything has a URL (linked data style)
 * - Items have ns (namespace) + type + id
 * - URL defaults to https://{ns}/{type}/{id}
 *
 * @packageDocumentation
 */

// Export types
export * from './types.js'

// Export DB constructors
export { DB, db, configureDB, type DBOptions } from './db.js'

// Export in-memory implementation
export { MemoryDB, createMemoryDB } from './memory.js'
