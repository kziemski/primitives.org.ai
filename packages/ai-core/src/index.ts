/**
 * ai-core - Core AI primitives for building intelligent applications
 *
 * This is the foundational package providing:
 * - Core generate() primitive
 * - AIPromise for promise pipelining
 * - Template literal support
 * - Context management
 * - Core generative functions (ai, write, list, is, etc.)
 *
 * For batch processing, retry/resilience, caching, and tool orchestration,
 * use the full ai-functions package.
 *
 * @packageDocumentation
 */

// Export core types
export * from './types.js'

// Export generation functions with smart model routing
export { generateObject, generateText, streamObject, streamText } from './generate.js'

// Export simplified schema helper
export { schema, type SimpleSchema } from './schema.js'

// Export template utilities
export {
  parseTemplate,
  createTemplateFunction,
  createChainablePromise,
  createStreamableList,
  withBatch,
  type FunctionOptions,
  type TemplateFunction,
  type BatchableFunction,
  type StreamableList,
  type ChainablePromise,
} from './template.js'

// Export AIPromise utilities for promise pipelining
export {
  AIPromise,
  isAIPromise,
  getRawPromise,
  createTextPromise,
  createObjectPromise,
  createListPromise,
  createListsPromise,
  createBooleanPromise,
  createExtractPromise,
  createAITemplateFunction,
  parseTemplateWithDependencies,
  AI_PROMISE_SYMBOL,
  RAW_PROMISE_SYMBOL,
  type AIPromiseOptions,
  type StreamingAIPromise,
  type StreamOptions,
} from './ai-promise.js'

// Export AI primitives
export {
  // Core generate primitive
  generate,
  type GenerateType,
  type GenerateOptions,

  // Generative functions
  ai,
  write,
  code,
  list,
  lists,
  extract,
  summarize,
  is,
  diagram,
  slides,
  image,
  video,

  // Agentic functions
  do,
  research,

  // Web functions
  read,
  browse,

  // Decision functions
  decide,

  // Human-in-the-loop functions
  ask,
  approve,
  review,
  type HumanOptions,
  type HumanResult,
} from './primitives.js'

// Export execution context (core version without batch/budget)
export {
  configure,
  getContext,
  withContext,
  getGlobalContext,
  resetContext,
  getModel,
  getProvider,
  type ExecutionContext,
} from './context.js'
