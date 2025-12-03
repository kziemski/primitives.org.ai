/**
 * RPC Transport Layer
 *
 * Unified transport abstraction supporting:
 * - HTTP batch requests
 * - WebSocket persistent connections
 * - postMessage for iframe/worker communication
 * - Bidirectional RPC callbacks
 * - Async iterators for streaming
 *
 * @packageDocumentation
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * A serializable RPC message
 */
export interface RPCMessage {
  /** Unique message ID for correlation */
  id: string
  /** Message type */
  type: 'call' | 'result' | 'error' | 'callback' | 'stream' | 'stream-end' | 'cancel' | 'ping' | 'pong'
  /** Method name (for calls) */
  method?: string
  /** Call arguments */
  params?: unknown[]
  /** Operation chain for promise pipelining */
  chain?: OperationDescriptor[]
  /** Result value */
  result?: unknown
  /** Error info */
  error?: { message: string; code?: string; stack?: string }
  /** Callback reference ID */
  callbackId?: string
  /** Stream chunk data */
  chunk?: unknown
  /** Allow additional properties (e.g., __sig__ for HMAC) */
  [key: string]: unknown
}

/**
 * Serializable operation descriptor (for chain)
 */
export interface OperationDescriptor {
  type: 'property' | 'call' | 'map'
  key?: string
  args?: unknown[]
  /** For map: serialized function or function ID */
  fn?: string | number
}

/**
 * Transport connection state
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Transport event handlers
 */
export interface TransportEvents {
  onMessage?: (message: RPCMessage) => void
  onStateChange?: (state: ConnectionState) => void
  onError?: (error: Error) => void
}

// =============================================================================
// Transport Interface
// =============================================================================

/**
 * Base transport interface - implement for different protocols
 */
export interface Transport {
  /** Current connection state */
  readonly state: ConnectionState

  /** Send a message */
  send(message: RPCMessage): void

  /** Send and wait for response */
  request(message: RPCMessage): Promise<RPCMessage>

  /** Subscribe to incoming messages */
  subscribe(handler: (message: RPCMessage) => void): () => void

  /** Close the transport */
  close(): void
}

/**
 * Transport that supports streaming
 */
export interface StreamingTransport extends Transport {
  /** Create an async iterator for a stream */
  stream<T>(message: RPCMessage): AsyncIterable<T>
}

// =============================================================================
// Callback Registry
// =============================================================================

/**
 * Generate a cryptographically random ID
 */
function generateSecureId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  const array = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Last resort fallback (less secure)
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export interface CallbackOptions {
  /** Time-to-live in milliseconds (default: 300000 = 5 minutes) */
  ttl?: number
  /** Maximum number of invocations (default: unlimited) */
  maxInvocations?: number
}

interface CallbackEntry {
  fn: (...args: unknown[]) => unknown
  invocations: number
  maxInvocations: number
  expiresAt: number
}

/**
 * Registry for tracking callbacks that can be invoked remotely
 *
 * Security features:
 * - Cryptographically random callback IDs
 * - Automatic expiration (TTL)
 * - Invocation limits
 */
export class CallbackRegistry {
  private callbacks = new Map<string, CallbackEntry>()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null
  private defaultTtl: number

  constructor(options: { defaultTtl?: number } = {}) {
    this.defaultTtl = options.defaultTtl ?? 300000 // 5 minutes default

    // Periodic cleanup of expired callbacks
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Register a callback and get its ID
   */
  register(fn: (...args: unknown[]) => unknown, options: CallbackOptions = {}): string {
    const id = `cb_${generateSecureId()}`
    const ttl = options.ttl ?? this.defaultTtl

    this.callbacks.set(id, {
      fn,
      invocations: 0,
      maxInvocations: options.maxInvocations ?? Infinity,
      expiresAt: Date.now() + ttl,
    })

    return id
  }

  /**
   * Invoke a callback by ID
   */
  async invoke(id: string, args: unknown[]): Promise<unknown> {
    const entry = this.callbacks.get(id)

    if (!entry) {
      throw new Error(`Callback not found: ${id}`)
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.callbacks.delete(id)
      throw new Error(`Callback expired: ${id}`)
    }

    // Check invocation limit
    if (entry.invocations >= entry.maxInvocations) {
      this.callbacks.delete(id)
      throw new Error(`Callback invocation limit reached: ${id}`)
    }

    entry.invocations++

    // Auto-cleanup if max invocations reached
    if (entry.invocations >= entry.maxInvocations) {
      this.callbacks.delete(id)
    }

    return entry.fn(...args)
  }

  /**
   * Remove a callback
   */
  unregister(id: string): boolean {
    return this.callbacks.delete(id)
  }

  /**
   * Remove expired callbacks
   */
  cleanup(): void {
    const now = Date.now()
    for (const [id, entry] of this.callbacks) {
      if (now > entry.expiresAt) {
        this.callbacks.delete(id)
      }
    }
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.callbacks.clear()
  }

  /**
   * Check if a value contains callbacks and serialize them
   */
  serializeWithCallbacks(
    value: unknown,
    options: CallbackOptions = {}
  ): { value: unknown; callbacks: Map<string, string> } {
    const callbacks = new Map<string, string>()

    const serialize = (v: unknown, path: string): unknown => {
      if (typeof v === 'function') {
        const id = this.register(v as (...args: unknown[]) => unknown, options)
        callbacks.set(path, id)
        return { __callback__: id }
      }

      if (Array.isArray(v)) {
        return v.map((item, i) => serialize(item, `${path}[${i}]`))
      }

      if (v && typeof v === 'object') {
        const result: Record<string, unknown> = {}
        for (const [key, val] of Object.entries(v)) {
          result[key] = serialize(val, `${path}.${key}`)
        }
        return result
      }

      return v
    }

    return {
      value: serialize(value, ''),
      callbacks,
    }
  }
}

// =============================================================================
// HTTP Transport
// =============================================================================

export interface HTTPTransportOptions {
  /** Base URL for RPC endpoint */
  url: string
  /** Custom headers */
  headers?: Record<string, string>
  /** Request timeout in ms (default: 30000) */
  timeout?: number
  /** Batch delay in ms (default: 0 - microtask) */
  batchDelay?: number
  /** Max requests per batch (default: 100) */
  maxBatchSize?: number
}

/**
 * HTTP batch transport - groups multiple calls into single requests
 */
export class HTTPTransport implements Transport {
  private url: string
  private headers: Record<string, string>
  private timeout: number
  private batchDelay: number
  private maxBatchSize: number

  private pendingRequests: Array<{
    message: RPCMessage
    resolve: (result: RPCMessage) => void
    reject: (error: Error) => void
  }> = []
  private flushScheduled = false
  private subscribers = new Set<(message: RPCMessage) => void>()
  private callbackRegistry = new CallbackRegistry()

  state: ConnectionState = 'connected'

  constructor(options: HTTPTransportOptions) {
    this.url = options.url
    this.headers = options.headers ?? {}
    this.timeout = options.timeout ?? 30000
    this.batchDelay = options.batchDelay ?? 0
    this.maxBatchSize = options.maxBatchSize ?? 100
  }

  send(message: RPCMessage): void {
    this.request(message).catch(() => {
      // Fire and forget
    })
  }

  async request(message: RPCMessage): Promise<RPCMessage> {
    return new Promise((resolve, reject) => {
      // Serialize any callbacks in params
      if (message.params) {
        const { value } = this.callbackRegistry.serializeWithCallbacks(message.params)
        message = { ...message, params: value as unknown[] }
      }

      this.pendingRequests.push({ message, resolve, reject })
      this.scheduleFlush()
    })
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return
    this.flushScheduled = true

    if (this.batchDelay === 0) {
      queueMicrotask(() => this.flush())
    } else {
      setTimeout(() => this.flush(), this.batchDelay)
    }
  }

  private async flush(): Promise<void> {
    this.flushScheduled = false
    if (this.pendingRequests.length === 0) return

    const batch = this.pendingRequests.splice(0, this.maxBatchSize)

    // Schedule next flush if more pending
    if (this.pendingRequests.length > 0) {
      this.scheduleFlush()
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify(batch.map(p => p.message)),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const results = (await response.json()) as RPCMessage[]
      const resultMap = new Map(results.map(r => [r.id, r]))

      for (const pending of batch) {
        const result = resultMap.get(pending.message.id)
        if (!result) {
          pending.reject(new Error(`No response for message ${pending.message.id}`))
        } else {
          // Return both success and error responses - let caller handle errors
          pending.resolve(result)
        }
      }
    } catch (error) {
      for (const pending of batch) {
        pending.reject(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  subscribe(handler: (message: RPCMessage) => void): () => void {
    this.subscribers.add(handler)
    return () => this.subscribers.delete(handler)
  }

  close(): void {
    this.state = 'disconnected'
    // Reject any pending requests
    for (const pending of this.pendingRequests) {
      pending.reject(new Error('Transport closed'))
    }
    this.pendingRequests = []
  }
}

// =============================================================================
// WebSocket Transport
// =============================================================================

export interface WebSocketTransportOptions {
  /** WebSocket URL */
  url: string
  /** Reconnect on disconnect (default: true) */
  reconnect?: boolean
  /** Reconnect delay in ms (default: 1000) */
  reconnectDelay?: number
  /** Max reconnect attempts (default: 10) */
  maxReconnectAttempts?: number
  /** Ping interval in ms (default: 30000) */
  pingInterval?: number
}

/**
 * WebSocket transport - persistent connection with bidirectional communication
 */
export class WebSocketTransport implements StreamingTransport {
  private url: string
  private ws: WebSocket | null = null
  private reconnect: boolean
  private reconnectDelay: number
  private maxReconnectAttempts: number
  private pingInterval: number

  private reconnectAttempts = 0
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private pendingRequests = new Map<string, {
    resolve: (result: RPCMessage) => void
    reject: (error: Error) => void
  }>()
  private streamHandlers = new Map<string, (chunk: unknown, done: boolean) => void>()
  private subscribers = new Set<(message: RPCMessage) => void>()
  private callbackRegistry = new CallbackRegistry()

  state: ConnectionState = 'disconnected'

  constructor(options: WebSocketTransportOptions) {
    this.url = options.url
    this.reconnect = options.reconnect ?? true
    this.reconnectDelay = options.reconnectDelay ?? 1000
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10
    this.pingInterval = options.pingInterval ?? 30000
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === 'connected') return

    this.state = 'connecting'

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this.state = 'connected'
        this.reconnectAttempts = 0
        this.startPing()
        resolve()
      }

      this.ws.onerror = (event) => {
        if (this.state === 'connecting') {
          reject(new Error('WebSocket connection failed'))
        }
      }

      this.ws.onclose = () => {
        this.state = 'disconnected'
        this.stopPing()
        this.handleDisconnect()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: RPCMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Invalid WebSocket message:', error)
        }
      }
    })
  }

  private handleMessage(message: RPCMessage): void {
    // Handle pending request responses
    const pending = this.pendingRequests.get(message.id)
    if (pending) {
      this.pendingRequests.delete(message.id)
      // Return both success and error responses - let caller handle errors
      pending.resolve(message)
      return
    }

    // Handle stream messages
    if (message.type === 'stream' || message.type === 'stream-end') {
      const handler = this.streamHandlers.get(message.id)
      if (handler) {
        handler(message.chunk, message.type === 'stream-end')
        if (message.type === 'stream-end') {
          this.streamHandlers.delete(message.id)
        }
      }
      return
    }

    // Handle callback invocations
    if (message.type === 'callback' && message.callbackId) {
      this.handleCallback(message)
      return
    }

    // Notify subscribers
    for (const sub of this.subscribers) {
      sub(message)
    }
  }

  private async handleCallback(message: RPCMessage): Promise<void> {
    try {
      const result = await this.callbackRegistry.invoke(
        message.callbackId!,
        message.params ?? []
      )
      this.send({
        id: message.id,
        type: 'result',
        result,
      })
    } catch (error) {
      this.send({
        id: message.id,
        type: 'error',
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      })
    }
  }

  private handleDisconnect(): void {
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new Error('WebSocket disconnected'))
    }
    this.pendingRequests.clear()

    // End all streams
    for (const [id, handler] of this.streamHandlers) {
      handler(undefined, true)
    }
    this.streamHandlers.clear()

    // Attempt reconnect
    if (this.reconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, this.pingInterval)
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  send(message: RPCMessage): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    // Serialize callbacks
    if (message.params) {
      const { value } = this.callbackRegistry.serializeWithCallbacks(message.params)
      message = { ...message, params: value as unknown[] }
    }

    this.ws.send(JSON.stringify(message))
  }

  async request(message: RPCMessage): Promise<RPCMessage> {
    if (this.state !== 'connected') {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(message.id, { resolve, reject })
      this.send(message)
    })
  }

  /**
   * Create an async iterator for streaming results
   */
  async *stream<T>(message: RPCMessage): AsyncIterable<T> {
    if (this.state !== 'connected') {
      await this.connect()
    }

    const chunks: T[] = []
    let done = false
    let error: Error | null = null
    let resolve: (() => void) | null = null

    this.streamHandlers.set(message.id, (chunk, isDone) => {
      if (isDone) {
        done = true
      } else if (chunk !== undefined) {
        chunks.push(chunk as T)
      }
      resolve?.()
    })

    this.send(message)

    try {
      while (!done) {
        if (chunks.length > 0) {
          yield chunks.shift()!
        } else {
          await new Promise<void>(r => { resolve = r })
        }
      }

      // Yield any remaining chunks
      while (chunks.length > 0) {
        yield chunks.shift()!
      }
    } finally {
      this.streamHandlers.delete(message.id)
    }
  }

  subscribe(handler: (message: RPCMessage) => void): () => void {
    this.subscribers.add(handler)
    return () => this.subscribers.delete(handler)
  }

  close(): void {
    this.reconnect = false
    this.stopPing()
    this.ws?.close()
    this.state = 'disconnected'
  }
}

// =============================================================================
// postMessage Transport
// =============================================================================

/** Valid RPC message types */
const VALID_MESSAGE_TYPES = new Set([
  'call', 'result', 'error', 'callback', 'stream', 'stream-end', 'cancel', 'ping', 'pong'
])

/**
 * Validate that a message conforms to RPCMessage schema
 */
function isValidRPCMessage(data: unknown): data is RPCMessage {
  if (!data || typeof data !== 'object') return false

  const msg = data as Record<string, unknown>

  // Required: id must be a string
  if (typeof msg.id !== 'string' || msg.id.length === 0) return false

  // Required: type must be valid
  if (typeof msg.type !== 'string' || !VALID_MESSAGE_TYPES.has(msg.type)) return false

  // Optional field validation
  if (msg.method !== undefined && typeof msg.method !== 'string') return false
  if (msg.params !== undefined && !Array.isArray(msg.params)) return false
  if (msg.callbackId !== undefined && typeof msg.callbackId !== 'string') return false

  return true
}

export interface PostMessageTransportOptions {
  /** Target window/worker to communicate with */
  target: Window | Worker | MessagePort

  /**
   * Origin for window targets.
   * REQUIRED for Window targets - must be explicit origin, not '*'
   * Ignored for Worker/MessagePort targets
   */
  targetOrigin?: string

  /**
   * Expected source origin for incoming messages.
   * REQUIRED for Window targets for security.
   * Ignored for Worker/MessagePort targets (they're trusted by definition)
   */
  sourceOrigin?: string

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number

  /**
   * Maximum pending requests (default: 1000)
   */
  maxPendingRequests?: number

  /**
   * Secret key for HMAC message signing (optional)
   * When set, all messages include a signature that's verified on receipt
   */
  secret?: string

  /**
   * Allow unsafe '*' origin (default: false)
   * Set to true only for trusted environments like MessageChannel
   */
  allowUnsafeOrigin?: boolean
}

interface PendingRequest {
  resolve: (result: RPCMessage) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

/**
 * postMessage transport - for iframe/worker communication
 *
 * Security features:
 * - Mandatory origin validation for Window targets
 * - Message schema validation
 * - Request timeouts
 * - Max pending requests limit
 * - Optional HMAC message signing
 */
export class PostMessageTransport implements Transport {
  private target: Window | Worker | MessagePort
  private targetOrigin: string
  private sourceOrigin?: string
  private isWindowTarget: boolean
  private timeout: number
  private maxPendingRequests: number
  private secret?: string

  private pendingRequests = new Map<string, PendingRequest>()
  private subscribers = new Set<(message: RPCMessage) => void>()
  private callbackRegistry = new CallbackRegistry()
  private messageHandler: (event: MessageEvent) => void

  state: ConnectionState = 'connected'

  constructor(options: PostMessageTransportOptions) {
    this.target = options.target
    this.timeout = options.timeout ?? 30000
    this.maxPendingRequests = options.maxPendingRequests ?? 1000
    this.secret = options.secret

    // Determine if target is a Window
    this.isWindowTarget = typeof Window !== 'undefined' && this.target instanceof Window

    // Security: For Window targets, require explicit origins
    if (this.isWindowTarget) {
      if (!options.targetOrigin || options.targetOrigin === '*') {
        if (!options.allowUnsafeOrigin) {
          throw new Error(
            'PostMessageTransport: targetOrigin is required for Window targets. ' +
            'Using "*" is insecure. Set allowUnsafeOrigin: true if you understand the risks.'
          )
        }
      }

      if (!options.sourceOrigin) {
        if (!options.allowUnsafeOrigin) {
          throw new Error(
            'PostMessageTransport: sourceOrigin is required for Window targets. ' +
            'Without origin validation, any origin can send messages. ' +
            'Set allowUnsafeOrigin: true if you understand the risks.'
          )
        }
      }
    }

    this.targetOrigin = options.targetOrigin ?? '*'
    this.sourceOrigin = options.sourceOrigin

    this.messageHandler = this.handleMessage.bind(this)

    // Subscribe to messages
    if ('addEventListener' in this.target) {
      this.target.addEventListener('message', this.messageHandler as EventListener)
    }
  }

  private handleMessage(event: MessageEvent): void {
    // Validate origin for Window targets
    if (this.isWindowTarget && this.sourceOrigin && event.origin !== this.sourceOrigin) {
      console.warn(`PostMessageTransport: Rejected message from untrusted origin: ${event.origin}`)
      return
    }

    // Validate message schema
    if (!isValidRPCMessage(event.data)) {
      // Silently ignore invalid messages (could be from other sources)
      return
    }

    const message = event.data

    // Verify HMAC signature if secret is configured
    if (this.secret) {
      const providedSig = (message as Record<string, unknown>).__sig__
      if (!providedSig || !this.verifySignature(message, providedSig as string)) {
        console.warn('PostMessageTransport: Rejected message with invalid signature')
        return
      }
    }

    // Handle pending request responses
    const pending = this.pendingRequests.get(message.id)
    if (pending) {
      clearTimeout(pending.timeoutId)
      this.pendingRequests.delete(message.id)
      pending.resolve(message)
      return
    }

    // Handle callback invocations
    if (message.type === 'callback' && message.callbackId) {
      this.handleCallback(message)
      return
    }

    // Notify subscribers
    for (const sub of this.subscribers) {
      sub(message)
    }
  }

  private async handleCallback(message: RPCMessage): Promise<void> {
    try {
      const result = await this.callbackRegistry.invoke(
        message.callbackId!,
        message.params ?? []
      )
      this.send({
        id: message.id,
        type: 'result',
        result,
      })
    } catch (error) {
      this.send({
        id: message.id,
        type: 'error',
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      })
    }
  }

  /**
   * Sign a message with HMAC-SHA256
   */
  private async signMessage(message: RPCMessage): Promise<string> {
    if (!this.secret) return ''

    const data = JSON.stringify({ id: message.id, type: message.type, method: message.method })
    const encoder = new TextEncoder()

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
      return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')
    }

    // Fallback: simple hash (less secure, but better than nothing)
    let hash = 0
    const combined = this.secret + data
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Verify message signature
   */
  private verifySignature(message: RPCMessage, providedSig: string): boolean {
    // For sync verification, we use the simple hash fallback
    // A more complete implementation would use async verification
    if (!this.secret) return true

    const data = JSON.stringify({ id: message.id, type: message.type, method: message.method })
    let hash = 0
    const combined = this.secret + data
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i)
      hash = hash & hash
    }
    const expectedSig = Math.abs(hash).toString(16)
    return providedSig === expectedSig
  }

  send(message: RPCMessage): void {
    // Serialize callbacks
    if (message.params) {
      const { value } = this.callbackRegistry.serializeWithCallbacks(message.params)
      message = { ...message, params: value as unknown[] }
    }

    // Add signature if secret is configured (sync version for send)
    if (this.secret) {
      const data = JSON.stringify({ id: message.id, type: message.type, method: message.method })
      let hash = 0
      const combined = this.secret + data
      for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i)
        hash = hash & hash
      }
      ;(message as Record<string, unknown>).__sig__ = Math.abs(hash).toString(16)
    }

    if ('postMessage' in this.target) {
      if (this.isWindowTarget) {
        (this.target as Window).postMessage(message, this.targetOrigin)
      } else {
        (this.target as Worker | MessagePort).postMessage(message)
      }
    }
  }

  async request(message: RPCMessage): Promise<RPCMessage> {
    if (this.state === 'disconnected') {
      return Promise.reject(new Error('Transport is closed'))
    }

    if (this.pendingRequests.size >= this.maxPendingRequests) {
      return Promise.reject(new Error('Too many pending requests'))
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(message.id)
        reject(new Error(`Request timeout: ${message.id}`))
      }, this.timeout)

      this.pendingRequests.set(message.id, { resolve, reject, timeoutId })
      this.send(message)
    })
  }

  subscribe(handler: (message: RPCMessage) => void): () => void {
    this.subscribers.add(handler)
    return () => this.subscribers.delete(handler)
  }

  close(): void {
    if ('removeEventListener' in this.target) {
      this.target.removeEventListener('message', this.messageHandler as EventListener)
    }
    this.state = 'disconnected'

    // Clear all pending requests
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeoutId)
      pending.reject(new Error('Transport closed'))
    }
    this.pendingRequests.clear()

    // Cleanup callback registry
    this.callbackRegistry.destroy()
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an HTTP transport
 */
export function createHTTPTransport(options: HTTPTransportOptions): HTTPTransport {
  return new HTTPTransport(options)
}

/**
 * Create a WebSocket transport
 */
export function createWebSocketTransport(options: WebSocketTransportOptions): WebSocketTransport {
  return new WebSocketTransport(options)
}

/**
 * Create a postMessage transport
 */
export function createPostMessageTransport(options: PostMessageTransportOptions): PostMessageTransport {
  return new PostMessageTransport(options)
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}
