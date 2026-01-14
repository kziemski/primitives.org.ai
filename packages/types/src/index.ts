// @primitives/types - Shared type definitions for AI primitives packages

// Runtime markers (for testing that exports exist)
export const AIFunction = Symbol('AIFunction')
export const EventHandler = Symbol('EventHandler')
export const WorkflowContext = Symbol('WorkflowContext')
export const RelationshipOperator = Symbol('RelationshipOperator')
export const ParsedField = Symbol('ParsedField')

// Actual types (compile-time only)

/**
 * Generic AI function type
 * @template TOutput - The output type of the function
 * @template TInput - The input type (defaults to unknown)
 * @template TConfig - Optional configuration type (defaults to unknown)
 */
export type AIFunctionType<TOutput, TInput = unknown, TConfig = unknown> = {
  (input: TInput, config?: TConfig): Promise<TOutput>
}

/**
 * Event handler type for workflow events
 * @template TOutput - The return type of the handler (defaults to unknown)
 * @template TInput - The event data type (defaults to unknown)
 */
export type EventHandlerType<TOutput = unknown, TInput = unknown> = (
  data: TInput,
  ctx: WorkflowContextType
) => TOutput | void | Promise<TOutput | void>

/**
 * Workflow execution context interface
 * Provides methods for event handling, scheduling, and state management.
 * This is a base interface that packages can extend with more specific types.
 *
 * Execution semantics:
 *
 *               |  Fire & Forget  |   Durable
 * --------------|-----------------|---------------
 *    Event      |  track() -> void|  send() -> EventId
 * --------------|-----------------|---------------
 *    Action     |  try() -> T     |  do() -> T
 */
export interface WorkflowContextType {
  /**
   * Track an event (fire and forget)
   * Best effort, no confirmation, swallows errors silently
   * Use for telemetry, analytics, non-critical logging
   */
  track: (event: string, data: unknown) => void

  /**
   * Send an event (durable)
   * Guaranteed delivery with retries, returns trackable EventId
   * Use for important domain events that must not be lost
   */
  send: <T = unknown>(event: string, data: T) => string  // Returns EventId

  /**
   * Try an action (fire and forget)
   * Single attempt, use .catch() for error handling
   * No retries, no persistence
   */
  try: <TResult = unknown, TInput = unknown>(action: string, data: TInput) => Promise<TResult>

  /**
   * Do an action (durable)
   * Retries on failure, guaranteed completion
   * Stores result durably, can await receipt confirmation
   */
  do: <TResult = unknown, TInput = unknown>(action: string, data: TInput) => Promise<TResult>

  /** Event handler registry - $.on.Noun.verb(handler) */
  on: Record<string, Record<string, (handler: EventHandlerType) => void>>

  /** Scheduling registry - $.every.monday.at('9am')(handler) */
  every: Record<string, unknown>

  /** State storage */
  state: Record<string, unknown>

  /** Set a value in state */
  set: <T>(key: string, value: T) => void

  /** Get a value from state */
  get: <T>(key: string) => T | undefined
}

/**
 * Relationship operators for defining relationships between types
 * - '->' : Direct relationship (has one)
 * - '~>' : Fuzzy/semantic relationship
 * - '<-' : Inverse relationship (belongs to)
 * - '<~' : Inverse fuzzy relationship
 */
export type RelationshipOperatorType = '->' | '~>' | '<-' | '<~'

/**
 * Base parsed field interface for schema field definitions.
 * Provides common fields shared across packages.
 * Packages can extend this with additional fields as needed.
 */
export interface ParsedFieldType {
  /** Field name */
  name: string
  /** Field type (string, number, etc.) */
  type: string
  /** Whether the field is required (inverse of isOptional) */
  required?: boolean
  /** Whether the field is optional (inverse of required) */
  isOptional?: boolean
  /** Whether the field is an array */
  isArray?: boolean
  /** Optional description of the field */
  description?: string
  /** Relationship operator if this is a relationship field */
  operator?: RelationshipOperatorType
  /** Related type name for relationship fields */
  relatedType?: string
  /** Threshold for fuzzy relationships */
  threshold?: number
  /** Union types if this is a union field */
  unionTypes?: string[]
  /** Back-reference field name for inverse relationships */
  backref?: string
}

// ============================================================================
// Thing Types (do-jth)
// ============================================================================

/**
 * Base entity with URL-based identity
 */
export interface Thing {
  /** Fully qualified URL (unique identity) */
  $id: string
  /** Noun URL (schema reference) */
  $type: string
  /** Optional human-readable name */
  name?: string
  /** Arbitrary data payload */
  data?: Record<string, unknown>
  /** Visibility level */
  visibility?: 'public' | 'unlisted' | 'org' | 'user'
  /** Outbound relationships */
  relationships?: Record<string, Thing | Thing[]>
  /** Inbound references */
  references?: Record<string, Thing | Thing[]>
  /** Timestamps */
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

/**
 * Thing that IS a Durable Object namespace
 */
export interface ThingDO extends Thing {
  /** Marker that this Thing is a DO */
  isDO: true
  /** Git integration */
  $git?: {
    repo?: string
    branch?: string
    commit?: string
    syncMode?: 'push' | 'pull' | 'sync'
  }
  /** Parent DO */
  $parent?: ThingDO
  /** Child DOs */
  $children?: ThingDO[]
}

// ============================================================================
// Noun and Verb Types (do-xe4)
// ============================================================================

/**
 * Type/schema registry entry
 */
export interface Noun {
  /** Type name, e.g. 'Customer' */
  noun: string
  /** Plural form, e.g. 'Customers' */
  plural?: string
  /** Schema definition */
  schema?: Record<string, string | ParsedFieldType>
  /** Cloudflare DO class binding name */
  doClass?: string
  /** Description */
  description?: string
}

/**
 * Action/event predicate
 */
export interface Verb {
  /** Base verb form, e.g. 'create' */
  verb: string
  /** Gerund form, e.g. 'creating' */
  activity?: string
  /** Past participle, e.g. 'created' */
  event?: string
  /** Opposite verb, e.g. 'delete' */
  inverse?: string
  /** Description */
  description?: string
}

/** Standard verbs for common operations */
export const StandardVerbs = [
  'create', 'update', 'delete', 'get', 'list', 'find',
  'assign', 'unassign', 'publish', 'unpublish',
  'archive', 'restore', 'approve', 'reject',
  'start', 'stop', 'complete', 'cancel',
  'send', 'receive', 'notify', 'subscribe', 'unsubscribe',
] as const

export type StandardVerb = typeof StandardVerbs[number]

// ============================================================================
// Things Collection Types (do-p9q)
// ============================================================================

/**
 * Homogeneous typed collection of Things
 */
export interface Things<T extends Thing = Thing> {
  /** Collection URL */
  $id: string
  /** Always 'https://schema.org.ai/Things' */
  $type: 'https://schema.org.ai/Things'
  /** Type of items in collection */
  itemType: string
  /** Total count */
  count?: number
}

/**
 * Collection that IS a Durable Object
 */
export interface ThingsDO<T extends Thing = Thing> extends Things<T> {
  isDO: true
}

/**
 * Generic collection container
 */
export interface Collection<T extends Thing = Thing> {
  $id: string
  $type: 'https://schema.org.ai/Collection'
  /** Logical namespace */
  ns: string
  /** Type of contained items */
  itemType: string
}

export const THINGS_TYPE = 'https://schema.org.ai/Things'
export const COLLECTION_TYPE = 'https://schema.org.ai/Collection'

// ============================================================================
// Event Schema - 5W+H (do-jbe)
// ============================================================================

/**
 * Event with 5W+H dimensions
 */
export interface Event {
  /** Event ID */
  $id: string
  /** Event type URL */
  $type: string
  /** What happened */
  what: EventWhat
  /** Who did it */
  who: EventWho
  /** When it happened */
  when: EventWhen
  /** Where it happened */
  where?: EventWhere
  /** Why it happened */
  why?: EventWhy
  /** How it happened */
  how?: EventHow
}

export interface EventWhat {
  /** Action performed */
  action: string
  /** Verb used */
  verb?: string
  /** Subject of the action */
  subject?: Thing
  /** Object of the action */
  object?: Thing
}

export interface EventWho {
  /** Actor ID */
  id: string
  /** Actor type */
  type: 'user' | 'system' | 'agent' | 'service'
  /** Actor name */
  name?: string
}

export interface EventWhen {
  /** Timestamp */
  timestamp: Date
  /** Duration in ms */
  duration?: number
  /** Sequence number */
  sequence?: number
}

export interface EventWhere {
  /** Namespace/context */
  ns?: string
  /** URL context */
  url?: string
  /** Geographic location */
  location?: { lat: number; lng: number }
}

export interface EventWhy {
  /** Reason/intent */
  reason?: string
  /** Trigger event */
  trigger?: string
  /** Parent event ID */
  parent?: string
}

export interface EventHow {
  /** Method used */
  method?: string
  /** Tool/agent used */
  tool?: string
  /** Additional details */
  details?: Record<string, unknown>
}

// ============================================================================
// Field Type Definitions (do-5ob)
// ============================================================================

/**
 * Supported field types
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'markdown'
  | 'json'
  | 'url'
  | 'email'
  | 'blob'

/**
 * Field constraint modifiers
 */
export interface FieldConstraints {
  required?: boolean
  optional?: boolean
  array?: boolean
  unique?: boolean
  indexed?: boolean
  default?: unknown
  min?: number
  max?: number
  pattern?: string
}

/**
 * Complete field definition
 */
export interface FieldDefinition extends FieldConstraints {
  type: FieldType
  description?: string
  /** For relationship fields */
  operator?: RelationshipOperatorType
  relatedType?: string
  threshold?: number
}

// ============================================================================
// Branded ID Types (do-5ob)
// ============================================================================

/** Brand helper for nominal typing */
declare const __brand: unique symbol
type Brand<T, B> = T & { [__brand]: B }

/** Branded ID types */
export type ThingId = Brand<string, 'ThingId'>
export type NounId = Brand<string, 'NounId'>
export type VerbId = Brand<string, 'VerbId'>
export type ActionId = Brand<string, 'ActionId'>
export type EventId = Brand<string, 'EventId'>

/** Type guards */
export const isThingId = (v: string): v is ThingId => v.includes('/')
export const isActionId = (v: string): v is ActionId => v.startsWith('act_')
export const isEventId = (v: string): v is EventId => v.startsWith('evt_')
