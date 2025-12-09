/**
 * BatchQueue - Deferred execution queue for batch processing
 *
 * Collects AI operations and submits them to provider batch APIs
 * for cost-effective processing (typically 50% discount, 24hr turnaround).
 *
 * @example
 * ```ts
 * // Create a batch queue
 * const batch = createBatch({ provider: 'openai' })
 *
 * // Add items to the batch (these are deferred, not executed)
 * const titles = await list`10 blog post titles about startups`
 * const posts = titles.map(title => batch.add(write`blog post about ${title}`))
 *
 * // Submit the batch - returns job info
 * const job = await batch.submit()
 * console.log(job.id) // batch_abc123
 *
 * // Poll for results or use webhook
 * const results = await batch.wait()
 * ```
 *
 * @packageDocumentation
 */

import type { FunctionOptions } from './template.js'
import type { SimpleSchema } from './schema.js'

// ============================================================================
// Types
// ============================================================================

/** Batch processing mode */
export type BatchMode = 'sync' | 'async' | 'background'

/** Supported batch providers */
export type BatchProvider = 'openai' | 'anthropic' | 'google' | 'bedrock' | 'cloudflare'

/** Status of a batch job */
export type BatchStatus =
  | 'pending'
  | 'validating'
  | 'in_progress'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelling'
  | 'cancelled'

/** Individual item in a batch */
export interface BatchItem<T = unknown> {
  /** Unique ID for this item */
  id: string
  /** The prompt to process */
  prompt: string
  /** Schema for structured output */
  schema?: SimpleSchema
  /** Generation options */
  options?: FunctionOptions
  /** Custom metadata */
  metadata?: Record<string, unknown>
  /** Resolved value (after completion) */
  result?: T
  /** Error if failed */
  error?: string
  /** Status of this item */
  status: 'pending' | 'completed' | 'failed'
}

/** Batch job information */
export interface BatchJob {
  /** Unique batch ID */
  id: string
  /** Provider this batch was submitted to */
  provider: BatchProvider
  /** Current status */
  status: BatchStatus
  /** Number of items in the batch */
  totalItems: number
  /** Number of completed items */
  completedItems: number
  /** Number of failed items */
  failedItems: number
  /** When the batch was created */
  createdAt: Date
  /** When the batch started processing */
  startedAt?: Date
  /** When the batch completed */
  completedAt?: Date
  /** Expected completion time */
  expiresAt?: Date
  /** Webhook URL for completion notification */
  webhookUrl?: string
  /** Input file ID (for OpenAI) */
  inputFileId?: string
  /** Output file ID (for OpenAI) */
  outputFileId?: string
  /** Error file ID (for OpenAI) */
  errorFileId?: string
}

/** Result of a batch submission */
export interface BatchSubmitResult {
  job: BatchJob
  /** Promise that resolves when batch is complete */
  completion: Promise<BatchResult[]>
}

/** Result of a single item in the batch */
export interface BatchResult<T = unknown> {
  /** Item ID */
  id: string
  /** Custom ID if provided */
  customId?: string
  /** Status */
  status: 'completed' | 'failed'
  /** The result (if successful) */
  result?: T
  /** Error message (if failed) */
  error?: string
  /** Token usage */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/** Options for creating a batch queue */
export interface BatchQueueOptions {
  /** Provider to use for batch processing */
  provider?: BatchProvider
  /** Model to use */
  model?: string
  /** Webhook URL for completion notification */
  webhookUrl?: string
  /** Custom metadata for the batch */
  metadata?: Record<string, unknown>
  /** Maximum items per batch (provider-specific limits) */
  maxItems?: number
  /** Auto-submit when queue reaches maxItems */
  autoSubmit?: boolean
}

// ============================================================================
// BatchQueue Implementation
// ============================================================================

/**
 * BatchQueue collects AI operations for deferred batch execution
 */
export class BatchQueue {
  private items: BatchItem[] = []
  private options: BatchQueueOptions
  private idCounter = 0
  private submitted = false
  private job: BatchJob | null = null

  constructor(options: BatchQueueOptions = {}) {
    this.options = {
      provider: 'openai',
      maxItems: 50000, // OpenAI's limit
      autoSubmit: false,
      ...options,
    }
  }

  /**
   * Add an item to the batch queue
   * Returns a placeholder that will be resolved after batch completion
   */
  add<T = unknown>(
    prompt: string,
    options?: {
      schema?: SimpleSchema
      options?: FunctionOptions
      customId?: string
      metadata?: Record<string, unknown>
    }
  ): BatchItem<T> {
    if (this.submitted) {
      throw new Error('Cannot add items to a submitted batch')
    }

    const item: BatchItem<T> = {
      id: options?.customId || `item_${++this.idCounter}`,
      prompt,
      schema: options?.schema,
      options: options?.options,
      metadata: options?.metadata,
      status: 'pending',
    }

    this.items.push(item as BatchItem)

    // Auto-submit if we hit the limit
    if (this.options.autoSubmit && this.items.length >= (this.options.maxItems || 50000)) {
      // Fire and forget - user can await the completion promise
      this.submit().catch(console.error)
    }

    return item
  }

  /**
   * Get all items in the queue
   */
  getItems(): BatchItem[] {
    return [...this.items]
  }

  /**
   * Get the number of items in the queue
   */
  get size(): number {
    return this.items.length
  }

  /**
   * Check if the batch has been submitted
   */
  get isSubmitted(): boolean {
    return this.submitted
  }

  /**
   * Get the batch job info (after submission)
   */
  getJob(): BatchJob | null {
    return this.job
  }

  /**
   * Submit the batch to the provider
   */
  async submit(): Promise<BatchSubmitResult> {
    if (this.submitted) {
      throw new Error('Batch has already been submitted')
    }

    if (this.items.length === 0) {
      throw new Error('Cannot submit empty batch')
    }

    this.submitted = true

    // Get the appropriate batch adapter
    const adapter = getBatchAdapter(this.options.provider || 'openai')

    // Submit the batch
    const result = await adapter.submit(this.items, this.options)
    this.job = result.job

    // When completion resolves, update item statuses
    result.completion.then((results) => {
      for (const r of results) {
        const item = this.items.find((i) => i.id === r.id)
        if (item) {
          item.status = r.status
          item.result = r.result
          item.error = r.error
        }
      }
    })

    return result
  }

  /**
   * Cancel the batch (if supported by provider)
   */
  async cancel(): Promise<void> {
    if (!this.job) {
      throw new Error('Batch has not been submitted')
    }

    const adapter = getBatchAdapter(this.options.provider || 'openai')
    await adapter.cancel(this.job.id)
    this.job.status = 'cancelling'
  }

  /**
   * Get the current status of the batch
   */
  async getStatus(): Promise<BatchJob> {
    if (!this.job) {
      throw new Error('Batch has not been submitted')
    }

    const adapter = getBatchAdapter(this.options.provider || 'openai')
    this.job = await adapter.getStatus(this.job.id)
    return this.job
  }

  /**
   * Wait for the batch to complete and return results
   */
  async wait(pollInterval = 5000): Promise<BatchResult[]> {
    if (!this.job) {
      throw new Error('Batch has not been submitted')
    }

    const adapter = getBatchAdapter(this.options.provider || 'openai')
    return adapter.waitForCompletion(this.job.id, pollInterval)
  }
}

// ============================================================================
// Batch Adapters
// ============================================================================

/**
 * Interface for provider-specific batch implementations
 */
export interface BatchAdapter {
  /** Submit a batch to the provider */
  submit(items: BatchItem[], options: BatchQueueOptions): Promise<BatchSubmitResult>
  /** Get the status of a batch */
  getStatus(batchId: string): Promise<BatchJob>
  /** Cancel a batch */
  cancel(batchId: string): Promise<void>
  /** Get results of a completed batch */
  getResults(batchId: string): Promise<BatchResult[]>
  /** Wait for batch completion */
  waitForCompletion(batchId: string, pollInterval?: number): Promise<BatchResult[]>
}

/**
 * Interface for flex processing (faster than batch, ~50% discount)
 * Available for OpenAI and AWS Bedrock
 */
export interface FlexAdapter {
  /**
   * Submit items for flex processing
   * Flex is faster than batch (minutes vs hours) but has same discount
   *
   * @param items - Items to process
   * @param options - Processing options
   * @returns Results (resolves when all items complete)
   */
  submitFlex(items: BatchItem[], options: { model?: string }): Promise<BatchResult[]>
}

// Adapter registry
const adapters: Record<BatchProvider, BatchAdapter | null> = {
  openai: null,
  anthropic: null,
  google: null,
  bedrock: null,
  cloudflare: null,
}

// Flex adapter registry (only OpenAI and Bedrock support flex)
const flexAdapters: Record<BatchProvider, FlexAdapter | null> = {
  openai: null,
  anthropic: null,
  google: null,
  bedrock: null,
  cloudflare: null,
}

/**
 * Register a batch adapter for a provider
 */
export function registerBatchAdapter(provider: BatchProvider, adapter: BatchAdapter): void {
  adapters[provider] = adapter
}

/**
 * Register a flex adapter for a provider
 */
export function registerFlexAdapter(provider: BatchProvider, adapter: FlexAdapter): void {
  flexAdapters[provider] = adapter
}

/**
 * Get the batch adapter for a provider
 */
export function getBatchAdapter(provider: BatchProvider): BatchAdapter {
  const adapter = adapters[provider]
  if (!adapter) {
    throw new Error(
      `No batch adapter registered for provider: ${provider}. ` +
        `Import the adapter: import 'ai-functions/batch/${provider}'`
    )
  }
  return adapter
}

/**
 * Get the flex adapter for a provider
 */
export function getFlexAdapter(provider: BatchProvider): FlexAdapter {
  const adapter = flexAdapters[provider]
  if (!adapter) {
    throw new Error(
      `No flex adapter registered for provider: ${provider}. ` +
        `Flex processing is only available for OpenAI and AWS Bedrock.`
    )
  }
  return adapter
}

/**
 * Check if flex is available for a provider
 */
export function hasFlexAdapter(provider: BatchProvider): boolean {
  return flexAdapters[provider] !== null
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new batch queue
 *
 * @example
 * ```ts
 * const batch = createBatch({ provider: 'openai' })
 * batch.add('Write a poem about cats')
 * batch.add('Write a poem about dogs')
 * const { job } = await batch.submit()
 * const results = await batch.wait()
 * ```
 */
export function createBatch(options?: BatchQueueOptions): BatchQueue {
  return new BatchQueue(options)
}

/**
 * Execute operations in batch mode
 *
 * @example
 * ```ts
 * const results = await withBatch(async (batch) => {
 *   const titles = ['TypeScript', 'React', 'Next.js']
 *   return titles.map(title => batch.add(`Write a blog post about ${title}`))
 * })
 * ```
 */
export async function withBatch<T>(
  fn: (batch: BatchQueue) => T[] | Promise<T[]>,
  options?: BatchQueueOptions
): Promise<BatchResult<T>[]> {
  const batch = createBatch(options)
  const items = await fn(batch)
  if (batch.size === 0) {
    return []
  }
  const { completion } = await batch.submit()
  return completion as Promise<BatchResult<T>[]>
}

// ============================================================================
// Deferred Execution Support
// ============================================================================

/** Symbol to mark an AIPromise as batched/deferred */
export const BATCH_MODE_SYMBOL = Symbol.for('ai-batch-mode')

/** Options for deferred execution */
export interface DeferredOptions extends FunctionOptions {
  /** Batch queue to add to */
  batch?: BatchQueue
  /** Custom ID for this item in the batch */
  customId?: string
}

/**
 * Check if we're in batch mode
 */
export function isBatchMode(options?: DeferredOptions): boolean {
  return !!options?.batch
}

/**
 * Add an operation to the batch queue instead of executing immediately
 */
export function deferToBatch<T>(
  batch: BatchQueue,
  prompt: string,
  schema: SimpleSchema | undefined,
  options?: FunctionOptions & { customId?: string }
): BatchItem<T> {
  return batch.add<T>(prompt, {
    schema,
    options,
    customId: options?.customId,
  })
}
