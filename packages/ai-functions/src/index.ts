/**
 * ai-functions - Core AI primitives for building intelligent applications
 *
 * This is the foundational package that all other primitives depend on.
 * It provides:
 * - RPC primitives via rpc.do
 * - AI function types and interfaces
 * - Core AI() and ai() constructors
 * - Embedding utilities from AI SDK
 * - Cloudflare Workers AI provider (default for embeddings)
 * - Tagged template literal support for all functions
 * - Async iterator support for list/extract
 *
 * @packageDocumentation
 */

// TODO: Re-enable RPC exports when rpc.do is published
// export * from 'rpc.do'

// Export AI function types and interfaces
export * from './types.js'
export * from './ai.js'

// Export embedding utilities
export * from './embeddings.js'

// Export generation functions with smart model routing
export { generateObject, generateText, streamObject, streamText } from './generate.js'

// Export simplified schema helper
export { schema, type SimpleSchema } from './schema.js'

// Export providers
export * from './providers/index.js'

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
  ai as aiPrompt, // Renamed to avoid conflict with AIProxy from ai.ts
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

// Export batch processing
export {
  BatchQueue,
  createBatch,
  withBatch as withBatchQueue,
  registerBatchAdapter,
  getBatchAdapter,
  isBatchMode,
  deferToBatch,
  BATCH_MODE_SYMBOL,
  type BatchMode as BatchQueueMode,
  type BatchProvider,
  type BatchStatus,
  type BatchItem,
  type BatchJob,
  type BatchResult,
  type BatchSubmitResult,
  type BatchAdapter,
  type BatchQueueOptions,
  type DeferredOptions,
} from './batch-queue.js'

// Export batch map for automatic batching
export {
  BatchMapPromise,
  createBatchMap,
  isBatchMapPromise,
  BATCH_MAP_SYMBOL,
  type CapturedOperation,
  type BatchMapOptions,
} from './batch-map.js'

// Export execution context
export {
  configure,
  getContext,
  withContext,
  getGlobalContext,
  resetContext,
  getModel,
  getProvider,
  getBatchMode,
  getBatchThreshold,
  shouldUseBatchAPI,
  type ExecutionContext,
  type BatchMode,
  type ContextBudgetConfig,
} from './context.js'

// Export budget tracking and request tracing
export {
  BudgetTracker,
  TokenCounter,
  RequestContext,
  BudgetExceededError,
  createRequestContext,
  withBudget,
  type BudgetConfig,
  type BudgetAlert,
  type BudgetSnapshot,
  type TokenUsage,
  type RequestInfo,
  type RequestContextOptions,
  type ModelPricing,
  type WithBudgetOptions,
  type RemainingBudget,
  type CheckBudgetOptions,
} from './budget.js'

// Export agentic tool orchestration
export {
  // Core classes
  AgenticLoop,
  ToolRouter,
  ToolValidator,

  // Tool composition utilities
  createTool,
  createToolset,
  wrapTool,
  cachedTool,
  rateLimitedTool,
  timeoutTool,
  createAgenticLoop,

  // Types
  type Tool,
  type ToolCall,
  type ToolResult,
  type FormattedToolResult,
  type ValidationResult,
  type ModelResponse,
  type Message,
  type StepInfo,
  type LoopOptions,
  type RunOptions,
  type ToolCallResult,
  type SDKToolResult,
  type LoopResult,
  type LoopStreamEvent,
} from './tool-orchestration.js'

// Export caching layer for embeddings and generations
export {
  // Core cache storage
  MemoryCache,

  // Specialized caches
  EmbeddingCache,
  GenerationCache,

  // Cache wrapper
  withCache,

  // Utilities
  hashKey,
  createCacheKey,

  // Types
  type CacheStorage,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
  type MemoryCacheOptions,
  type CacheKeyType,
  type EmbeddingCacheOptions,
  type BatchEmbeddingResult,
  type GenerationParams,
  type GenerationCacheGetOptions,
  type WithCacheOptions,
  type CachedFunction,
} from './cache.js'

// Export retry/fallback patterns with exponential backoff
export {
  // Error types and classification
  RetryableError,
  NonRetryableError,
  NetworkError,
  RateLimitError,
  CircuitOpenError,
  ErrorCategory,
  classifyError,

  // Backoff calculation
  calculateBackoff,

  // Retry policy
  RetryPolicy,

  // Circuit breaker
  CircuitBreaker,

  // Fallback chain
  FallbackChain,

  // Convenience helper
  withRetry,

  // Types
  type JitterStrategy,
  type BackoffOptions,
  type RetryOptions,
  type RetryInfo,
  type BatchItemResult,
  type CircuitState,
  type CircuitBreakerOptions,
  type CircuitBreakerMetrics,
  type FallbackModel,
  type FallbackOptions,
  type FallbackMetrics,
} from './retry.js'
