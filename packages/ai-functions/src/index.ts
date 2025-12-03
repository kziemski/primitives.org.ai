/**
 * ai-functions - Core AI primitives for building intelligent applications
 *
 * This is the foundational package that all other primitives depend on.
 * It provides:
 * - RPC primitives with capnweb promise pipelining
 * - AI function types and interfaces
 * - Core AI() and ai() constructors
 *
 * @packageDocumentation
 */

// Re-export RPC primitives
export * from './rpc/index.js'

// Export AI function types and interfaces
export * from './types.js'
export * from './ai.js'
