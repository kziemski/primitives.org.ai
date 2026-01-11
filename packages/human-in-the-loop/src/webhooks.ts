/**
 * Event-driven human response webhooks
 *
 * This module provides webhook registration, delivery, and management
 * for real-time status updates on human requests.
 */

import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Webhook event types for human requests
 */
export type WebhookEventType =
  | 'request.created'
  | 'request.in_progress'
  | 'request.completed'
  | 'request.rejected'
  | 'request.escalated'
  | 'request.timeout'
  | 'request.cancelled'

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  /** Unique webhook ID */
  id?: string
  /** Webhook endpoint URL */
  url: string
  /** Events to subscribe to */
  events: WebhookEventType[]
  /** Secret for signing payloads */
  secret: string
  /** Whether webhook is enabled */
  enabled: boolean
  /** Optional description */
  description?: string
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Webhook event payload
 */
export interface WebhookEvent<TData = Record<string, unknown>> {
  /** Unique event ID */
  id: string
  /** Event type */
  type: WebhookEventType
  /** Event timestamp */
  timestamp: Date
  /** Event data */
  data: TData
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Result of webhook delivery attempt
 */
export interface DeliveryResult {
  /** Whether delivery was successful */
  success: boolean
  /** HTTP status code (if available) */
  statusCode?: number
  /** Error message (if failed) */
  error?: string
  /** Number of attempts made */
  attempts?: number
  /** Webhook ID */
  webhookId?: string
  /** Event ID */
  eventId?: string
}

/**
 * Retry options for webhook delivery
 */
export interface RetryOptions {
  /** Maximum number of retries */
  maxRetries: number
  /** Initial delay in milliseconds */
  initialDelayMs: number
  /** Maximum delay in milliseconds */
  maxDelayMs: number
}

/**
 * Dead letter queue item
 */
export interface DeadLetterItem {
  /** Webhook ID */
  webhookId: string
  /** The event that failed */
  event: WebhookEvent
  /** Error message */
  error: string
  /** Number of failed attempts */
  attempts: number
  /** When the item was added to DLQ */
  addedAt: Date
}

/**
 * Webhook registry options
 */
export interface WebhookRegistryOptions {
  /** Enable event batching */
  batchingEnabled?: boolean
  /** Batch window in milliseconds */
  batchWindowMs?: number
  /** Maximum batch size */
  maxBatchSize?: number
  /** Maximum dead letter queue size */
  maxDeadLetterQueueSize?: number
}

/**
 * Batch state for a webhook
 */
interface BatchState {
  events: WebhookEvent[]
  timer: ReturnType<typeof setTimeout> | null
}

/**
 * Webhook registry interface
 */
export interface WebhookRegistry {
  /** Register a new webhook */
  register(config: Omit<WebhookConfig, 'id'> & { id?: string }): WebhookConfig & { id: string }

  /** Get a webhook by ID */
  get(id: string): (WebhookConfig & { id: string }) | undefined

  /** List all webhooks */
  list(): (WebhookConfig & { id: string })[]

  /** Unregister a webhook */
  unregister(id: string): boolean

  /** Enable a webhook */
  enable(id: string): void

  /** Disable a webhook */
  disable(id: string): void

  /** Get webhooks subscribed to an event */
  getByEvent(eventType: WebhookEventType): (WebhookConfig & { id: string })[]

  /** Deliver an event to a webhook */
  deliver(webhookId: string, event: WebhookEvent): Promise<DeliveryResult>

  /** Deliver with retry logic */
  deliverWithRetry(
    webhookId: string,
    event: WebhookEvent,
    options: RetryOptions
  ): Promise<DeliveryResult>

  /** Emit an event to all subscribed webhooks */
  emit(eventType: WebhookEventType, data: Record<string, unknown>): Promise<DeliveryResult[]>

  /** Flush batched events */
  flush(): Promise<void>

  /** Get dead letter queue items */
  getDeadLetterQueue(): DeadLetterItem[]

  /** Retry dead letter queue items */
  retryDeadLetterQueue(): Promise<DeliveryResult[]>

  /** Clear dead letter queue */
  clearDeadLetterQueue(): void
}

/**
 * Sign a payload using HMAC-SHA256
 */
export function signPayload(
  payload: unknown,
  secret: string,
  timestamp: number
): string {
  const stringPayload = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const signatureBase = `${timestamp}.${stringPayload}`
  const hmac = createHmac('sha256', secret)
  hmac.update(signatureBase)
  return `sha256=${hmac.digest('hex')}`
}

/**
 * Verify a webhook signature
 */
export function verifySignature(
  payload: unknown,
  secret: string,
  timestamp: number,
  signature: string
): boolean {
  const expectedSignature = signPayload(payload, secret, timestamp)

  // Use timing-safe comparison to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (sigBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(sigBuffer, expectedBuffer)
  } catch {
    return false
  }
}

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Check if a status code is retryable
 */
function isRetryableError(statusCode?: number): boolean {
  if (!statusCode) return true // Network errors are retryable
  // 4xx errors are not retryable (client errors)
  // 5xx errors and network errors are retryable
  return statusCode >= 500 || statusCode === undefined
}

/**
 * Create a webhook registry
 */
export function createWebhookRegistry(options: WebhookRegistryOptions = {}): WebhookRegistry {
  const webhooks = new Map<string, WebhookConfig & { id: string }>()
  const deadLetterQueue: DeadLetterItem[] = []
  const batchStates = new Map<string, BatchState>()

  const {
    batchingEnabled = false,
    batchWindowMs = 100,
    maxBatchSize = 100,
    maxDeadLetterQueueSize = 1000,
  } = options

  /**
   * Validate URL format
   */
  function validateUrl(url: string): void {
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Invalid URL protocol: ${parsed.protocol}`)
      }
    } catch (e) {
      throw new Error(`Invalid webhook URL: ${url}`)
    }
  }

  /**
   * Add item to dead letter queue
   */
  function addToDeadLetterQueue(item: DeadLetterItem): void {
    deadLetterQueue.push(item)
    // Remove oldest items if queue exceeds max size
    while (deadLetterQueue.length > maxDeadLetterQueueSize) {
      deadLetterQueue.shift()
    }
  }

  /**
   * Deliver a batch of events
   */
  async function deliverBatch(
    webhookId: string,
    events: WebhookEvent[]
  ): Promise<DeliveryResult> {
    const webhook = webhooks.get(webhookId)
    if (!webhook) {
      return {
        success: false,
        error: `Webhook not found: ${webhookId}`,
        webhookId,
      }
    }

    const timestamp = Date.now()
    const batchPayload = {
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.timestamp.toISOString(),
        data: e.data,
        metadata: e.metadata,
      })),
    }

    const signature = signPayload(batchPayload, webhook.secret, timestamp)

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': webhookId,
          'X-Batch': 'true',
          'X-Signature': signature,
          'X-Timestamp': String(timestamp),
        },
        body: JSON.stringify(batchPayload),
      })

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          webhookId,
        }
      }

      return {
        success: false,
        statusCode: response.status,
        error: response.statusText,
        webhookId,
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e)
      return {
        success: false,
        error,
        webhookId,
      }
    }
  }

  /**
   * Flush batch for a specific webhook
   */
  async function flushWebhookBatch(webhookId: string): Promise<void> {
    const state = batchStates.get(webhookId)
    if (!state || state.events.length === 0) return

    const events = [...state.events]
    state.events = []
    if (state.timer) {
      clearTimeout(state.timer)
      state.timer = null
    }

    await deliverBatch(webhookId, events)
  }

  const registry: WebhookRegistry = {
    register(config) {
      validateUrl(config.url)

      if (!config.events || config.events.length === 0) {
        throw new Error('Webhook must subscribe to at least one event type')
      }

      const id = config.id || generateId('wh')
      const webhook = { ...config, id }
      webhooks.set(id, webhook)
      return webhook
    },

    get(id) {
      return webhooks.get(id)
    },

    list() {
      return Array.from(webhooks.values())
    },

    unregister(id) {
      return webhooks.delete(id)
    },

    enable(id) {
      const webhook = webhooks.get(id)
      if (webhook) {
        webhook.enabled = true
      }
    },

    disable(id) {
      const webhook = webhooks.get(id)
      if (webhook) {
        webhook.enabled = false
      }
    },

    getByEvent(eventType) {
      return Array.from(webhooks.values()).filter(
        (w) => w.enabled && w.events.includes(eventType)
      )
    },

    async deliver(webhookId, event) {
      const webhook = webhooks.get(webhookId)
      if (!webhook) {
        return {
          success: false,
          error: `Webhook not found: ${webhookId}`,
          webhookId,
          eventId: event.id,
        }
      }

      const timestamp = Date.now()
      const payload = {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
        metadata: event.metadata,
      }

      const signature = signPayload(payload, webhook.secret, timestamp)

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-ID': webhookId,
            'X-Event-Type': event.type,
            'X-Event-ID': event.id,
            'X-Signature': signature,
            'X-Timestamp': String(timestamp),
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          return {
            success: true,
            statusCode: response.status,
            webhookId,
            eventId: event.id,
          }
        }

        return {
          success: false,
          statusCode: response.status,
          error: response.statusText,
          webhookId,
          eventId: event.id,
        }
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e)
        return {
          success: false,
          error,
          webhookId,
          eventId: event.id,
        }
      }
    },

    async deliverWithRetry(webhookId, event, options) {
      const { maxRetries, initialDelayMs, maxDelayMs } = options
      let attempts = 0
      let lastResult: DeliveryResult = {
        success: false,
        error: 'No attempts made',
        webhookId,
        eventId: event.id,
      }

      while (attempts <= maxRetries) {
        attempts++
        lastResult = await registry.deliver(webhookId, event)

        if (lastResult.success) {
          return { ...lastResult, attempts }
        }

        // Don't retry on 4xx client errors
        if (lastResult.statusCode && !isRetryableError(lastResult.statusCode)) {
          return { ...lastResult, attempts }
        }

        // If we've exhausted retries, break
        if (attempts > maxRetries) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelayMs * Math.pow(2, attempts - 1),
          maxDelayMs
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      // Add to dead letter queue after exhausting retries
      addToDeadLetterQueue({
        webhookId,
        event,
        error: lastResult.error || 'Max retries exceeded',
        attempts,
        addedAt: new Date(),
      })

      return {
        ...lastResult,
        attempts,
        error: `Max retries exceeded: ${lastResult.error}`,
      }
    },

    async emit(eventType, data) {
      const event: WebhookEvent = {
        id: generateId('evt'),
        type: eventType,
        timestamp: new Date(),
        data,
      }

      const subscribedWebhooks = registry.getByEvent(eventType)
      const results: DeliveryResult[] = []

      for (const webhook of subscribedWebhooks) {
        if (batchingEnabled) {
          // Add to batch
          let state = batchStates.get(webhook.id)
          if (!state) {
            state = { events: [], timer: null }
            batchStates.set(webhook.id, state)
          }

          state.events.push(event)

          // Check if we should flush immediately due to max batch size
          if (state.events.length >= maxBatchSize) {
            await flushWebhookBatch(webhook.id)
          } else if (!state.timer) {
            // Set timer to flush after window
            state.timer = setTimeout(() => {
              flushWebhookBatch(webhook.id)
            }, batchWindowMs)
          }
        } else {
          // Immediate delivery
          const result = await registry.deliver(webhook.id, event)
          results.push(result)
        }
      }

      return results
    },

    async flush() {
      const flushPromises: Promise<void>[] = []
      const webhookIds = Array.from(batchStates.keys())
      for (const webhookId of webhookIds) {
        flushPromises.push(flushWebhookBatch(webhookId))
      }
      await Promise.all(flushPromises)
    },

    getDeadLetterQueue() {
      return [...deadLetterQueue]
    },

    async retryDeadLetterQueue() {
      const results: DeliveryResult[] = []
      const itemsToRemove: number[] = []

      for (let i = 0; i < deadLetterQueue.length; i++) {
        const item = deadLetterQueue[i]
        if (!item) continue

        const result = await registry.deliver(item.webhookId, item.event)
        results.push(result)

        if (result.success) {
          itemsToRemove.push(i)
        }
      }

      // Remove successful items (in reverse order to maintain indices)
      for (const index of itemsToRemove.reverse()) {
        deadLetterQueue.splice(index, 1)
      }

      return results
    },

    clearDeadLetterQueue() {
      deadLetterQueue.length = 0
    },
  }

  return registry
}

/**
 * Default webhook registry instance
 */
let defaultRegistry: WebhookRegistry | null = null

/**
 * Get or create the default webhook registry
 */
export function getDefaultWebhookRegistry(): WebhookRegistry {
  if (!defaultRegistry) {
    defaultRegistry = createWebhookRegistry()
  }
  return defaultRegistry
}
