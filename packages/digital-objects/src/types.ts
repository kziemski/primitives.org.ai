/**
 * Core types for Digital Objects
 *
 * A unified nouns/verbs/things/actions model that provides:
 * - Linguistic consistency (singular/plural, conjugations)
 * - Entity definitions (Nouns) and instances (Things)
 * - Action definitions (Verbs) and instances (Actions)
 * - Graph relationships through Actions
 * - Event sourcing and audit trails
 */

/**
 * Noun - Entity type definition with linguistic forms
 */
export interface Noun {
  name: string // 'Post', 'Author'
  singular: string // 'post', 'author'
  plural: string // 'posts', 'authors'
  slug: string // URL-safe: 'post', 'author'
  description?: string
  schema?: Record<string, FieldDefinition>
  createdAt: Date
}

export interface NounDefinition {
  name: string
  singular?: string // Auto-derived if not provided
  plural?: string // Auto-derived if not provided
  description?: string
  schema?: Record<string, FieldDefinition>
}

/**
 * Verb - Action definition with all conjugations
 */
export interface Verb {
  name: string // 'create', 'publish'
  action: string // 'create' (imperative)
  act: string // 'creates' (3rd person)
  activity: string // 'creating' (gerund)
  event: string // 'created' (past participle)
  reverseBy?: string // 'createdBy'
  reverseAt?: string // 'createdAt'
  reverseIn?: string // 'createdIn'
  inverse?: string // 'delete'
  description?: string
  createdAt: Date
}

export interface VerbDefinition {
  name: string
  // All forms auto-derived if not provided
  action?: string
  act?: string
  activity?: string
  event?: string
  reverseBy?: string
  reverseAt?: string
  inverse?: string
  description?: string
}

/**
 * Thing - Entity instance
 */
export interface Thing<T = Record<string, unknown>> {
  id: string
  noun: string // References noun.name
  data: T
  createdAt: Date
  updatedAt: Date
}

/**
 * Action - Events + Relationships + Audit Trail (unified!)
 *
 * An action represents:
 * - A graph edge (subject --verb--> object)
 * - An event (something happened)
 * - An audit record (who did what when)
 */
export interface Action<T = Record<string, unknown>> {
  id: string
  verb: string // References verb.name
  subject?: string // Thing ID (actor/from)
  object?: string // Thing ID (target/to)
  data?: T // Payload/metadata
  status: ActionStatus
  createdAt: Date
  completedAt?: Date
}

export type ActionStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'

/**
 * Field definition for schemas
 */
export type FieldDefinition =
  | PrimitiveType
  | `${string}.${string}` // Relation: 'Author.posts'
  | `[${string}.${string}]` // Array relation: '[Tag.posts]'
  | `${PrimitiveType}?` // Optional

export type PrimitiveType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'json'
  | 'markdown'
  | 'url'

/**
 * List options for queries
 */
export interface ListOptions {
  limit?: number
  offset?: number
  where?: Record<string, unknown>
  orderBy?: string
  order?: 'asc' | 'desc'
}

/**
 * Action query options
 */
export interface ActionOptions extends ListOptions {
  verb?: string
  subject?: string
  object?: string
  status?: ActionStatus | ActionStatus[]
}

/**
 * DigitalObjectsProvider - Core storage interface
 *
 * Implementations: MemoryProvider, NS (DurableObject)
 */
export interface DigitalObjectsProvider {
  // Nouns
  defineNoun(def: NounDefinition): Promise<Noun>
  getNoun(name: string): Promise<Noun | null>
  listNouns(): Promise<Noun[]>

  // Verbs
  defineVerb(def: VerbDefinition): Promise<Verb>
  getVerb(name: string): Promise<Verb | null>
  listVerbs(): Promise<Verb[]>

  // Things
  create<T>(noun: string, data: T, id?: string): Promise<Thing<T>>
  get<T>(id: string): Promise<Thing<T> | null>
  list<T>(noun: string, options?: ListOptions): Promise<Thing<T>[]>
  find<T>(noun: string, where: Partial<T>): Promise<Thing<T>[]>
  update<T>(id: string, data: Partial<T>): Promise<Thing<T>>
  delete(id: string): Promise<boolean>
  search<T>(query: string, options?: ListOptions): Promise<Thing<T>[]>

  // Actions (events + edges)
  perform<T>(verb: string, subject?: string, object?: string, data?: T): Promise<Action<T>>
  getAction<T>(id: string): Promise<Action<T> | null>
  listActions<T>(options?: ActionOptions): Promise<Action<T>[]>

  // Graph traversal (via actions)
  related<T>(id: string, verb?: string, direction?: 'out' | 'in' | 'both'): Promise<Thing<T>[]>
  edges<T>(id: string, verb?: string, direction?: 'out' | 'in' | 'both'): Promise<Action<T>[]>

  // Lifecycle
  close?(): Promise<void>
}
