# ai-database Integration Analysis for digital-objects

**Date**: 2026-01-15
**Purpose**: Detailed analysis for integrating ai-database with digital-objects package

## Executive Summary

This document analyzes the integration points between `ai-database` and `digital-objects` packages. The existing `ai-database-adapter.ts` provides a basic adapter, but significant gaps exist between the two provider interfaces. This analysis identifies type mappings, method mappings, migration strategies, and breaking changes to consider.

---

## 1. Package Overview

### ai-database (`packages/ai-database`)

A schema-first database with promise pipelining, featuring:
- **DBProvider interface**: Core storage abstraction
- **DBProviderExtended interface**: Extended with semantic search, events, actions, artifacts
- **MemoryProvider**: Full-featured in-memory implementation (2100+ lines)
- **Schema parsing**: Parses relationship operators (`->`, `~>`, `<-`, `<~`)
- **Promise pipelining**: DBPromise for chained operations
- **Semantic search**: Embeddings, cosine similarity, hybrid search with RRF scoring

### digital-objects (`packages/digital-objects`)

A unified nouns/verbs/things/actions model:
- **DigitalObjectsProvider interface**: Core storage abstraction
- **MemoryProvider**: Simple in-memory implementation (~300 lines)
- **Linguistic utilities**: Auto-derivation of noun/verb forms
- **Actions as edges**: Graph traversal through actions
- **NS (Durable Object)**: SQLite-backed for Cloudflare Workers

---

## 2. Type Mapping Analysis

### 2.1 Entity Types

| ai-database | digital-objects | Notes |
|------------|-----------------|-------|
| `Record<string, unknown>` with `$id`, `$type` | `Thing<T>` with `id`, `noun`, `data` | Different shapes |
| `$id: string` | `id: string` | Same concept |
| `$type: string` | `noun: string` | Different naming |
| Entity data flattened | `data: T` nested | Structural difference |

**ai-database entity shape:**
```typescript
{
  $id: 'john',
  $type: 'User',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: '2026-01-15T...',
  updatedAt: '2026-01-15T...',
}
```

**digital-objects entity shape:**
```typescript
{
  id: 'john',
  noun: 'User',
  data: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  createdAt: Date,
  updatedAt: Date,
}
```

### 2.2 Action/Event Types

| ai-database | digital-objects | Notes |
|-------------|-----------------|-------|
| `DBEvent` | `Action` (combined) | Different models |
| `DBAction` | `Action` (combined) | Different models |
| Separate Events + Actions | Unified Actions model | Conceptual difference |

**ai-database separates concerns:**
- **Events**: Immutable records of what happened (Actor-Event-Object-Result pattern)
- **Actions**: Long-running operations with status tracking

**digital-objects unifies:**
- **Actions**: Serve as events, graph edges, and audit records simultaneously
- Graph traversal is done through `perform()` and querying actions

### 2.3 Verb/Noun Types

| ai-database | digital-objects | Notes |
|-------------|-----------------|-------|
| `Noun` (TypeMeta focus) | `Noun` (linguistic focus) | Different structure |
| `Verb` (Verbs constant) | `Verb` (full conjugations) | Similar concept |
| `TypeMeta` (auto-inferred) | `deriveNoun()` / `deriveVerb()` | Similar utilities |

**ai-database Noun:**
```typescript
interface Noun {
  singular: string
  plural: string
  description?: string
  properties?: Record<string, NounProperty>
  relationships?: Record<string, NounRelationship>
  actions?: Array<string | Verb>
}
```

**digital-objects Noun:**
```typescript
interface Noun {
  name: string           // 'Post', 'Author'
  singular: string       // 'post', 'author'
  plural: string         // 'posts', 'authors'
  slug: string           // URL-safe
  description?: string
  schema?: Record<string, FieldDefinition>
  createdAt: Date
}
```

---

## 3. DBProvider Interface Mapping

### 3.1 Core Methods (Both Have)

| ai-database DBProvider | digital-objects DigitalObjectsProvider | Status |
|------------------------|----------------------------------------|--------|
| `get(type, id)` | `get(id)` | Type filtering differs |
| `list(type, options)` | `list(noun, options)` | Compatible |
| `search(type, query, options)` | `search(query, options)` | Global vs typed |
| `create(type, id, data)` | `create(noun, data, id)` | Param order differs |
| `update(type, id, data)` | `update(id, data)` | Type param missing |
| `delete(type, id)` | `delete(id)` | Type param missing |

### 3.2 Relationship Methods

| ai-database | digital-objects | Notes |
|-------------|-----------------|-------|
| `related(type, id, relation)` | `related(id, verb?, direction?)` | Different models |
| `relate(from..., to...)` | `perform(verb, subject, object)` | Action-based |
| `unrelate(from..., to...)` | N/A (actions immutable) | **Gap** |

### 3.3 Methods in ai-database Only (Extended Provider)

| Method | Purpose | digital-objects Equivalent |
|--------|---------|---------------------------|
| `semanticSearch()` | Vector similarity search | None |
| `hybridSearch()` | FTS + semantic with RRF | None |
| `setEmbeddingsConfig()` | Configure embeddings | None |
| `on(pattern, handler)` | Event subscription | None |
| `emit(event)` | Emit events | Via `perform()` |
| `listEvents()` | Query events | `listActions()` (partial) |
| `replayEvents()` | Event replay | None |
| `createAction()` | Create long-running action | `perform()` (different) |
| `getAction()` | Get action by ID | `getAction()` |
| `updateAction()` | Update action status | None |
| `listActions()` | Query actions | `listActions()` |
| `retryAction()` | Retry failed action | None |
| `cancelAction()` | Cancel action | None |
| `getArtifact()` | Get cached artifact | None |
| `setArtifact()` | Store artifact | None |
| `deleteArtifact()` | Delete artifact | None |
| `listArtifacts()` | List artifacts | None |

### 3.4 Methods in digital-objects Only

| Method | Purpose | ai-database Equivalent |
|--------|---------|----------------------|
| `defineNoun()` | Create noun definition | Schema-defined |
| `getNoun()` | Get noun definition | N/A (schema static) |
| `listNouns()` | List all nouns | N/A |
| `defineVerb()` | Create verb definition | N/A |
| `getVerb()` | Get verb definition | N/A |
| `listVerbs()` | List all verbs | N/A |
| `find(noun, where)` | Find by criteria | `list(type, { where })` |
| `edges(id, verb?, direction?)` | Get action edges | N/A |

---

## 4. Current Adapter Analysis

### 4.1 What `ai-database-adapter.ts` Does

```typescript
export function createDBProviderAdapter(provider: DigitalObjectsProvider): DBProvider
```

**Implemented mappings:**
1. `get(type, id)` -> `provider.get(id)` with type check
2. `list(type, options)` -> `provider.list(type, options)`
3. `search(type, query, options)` -> `provider.search(query, options)` + type filter
4. `create(type, id, data)` -> Auto-defines noun, then `provider.create(type, data, id)`
5. `update(type, id, data)` -> `provider.update(id, data)`
6. `delete(type, id)` -> `provider.delete(id)`
7. `related(type, id, relation)` -> `provider.related(id, relation, 'both')` + type filter
8. `relate(...)` -> Auto-defines verb, then `provider.perform(relation, fromId, toId, metadata)`
9. `unrelate(...)` -> Logs warning (not fully supported)

### 4.2 Gaps in Current Adapter

1. **No Extended Provider Features**
   - No semantic search
   - No hybrid search
   - No events API
   - No actions API (beyond basic perform)
   - No artifacts API

2. **Type System Mismatch**
   - ai-database expects flat entities with `$id`, `$type`
   - digital-objects uses `Thing<T>` with nested `data`

3. **Immutable Actions**
   - ai-database expects `unrelate()` to work
   - digital-objects actions are immutable

4. **Search Behavior**
   - ai-database: Type-scoped search
   - digital-objects: Global search with post-filter

---

## 5. Migration Strategy

### 5.1 Option A: Enhance digital-objects to Match ai-database

**Pros:**
- digital-objects becomes fully compatible
- Can use all ai-database features

**Cons:**
- Significant changes to digital-objects
- May break existing users

**Required Changes:**
1. Add semantic/hybrid search to DigitalObjectsProvider
2. Add events API (separate from actions)
3. Add artifacts API
4. Add action status management (retry, cancel, update)
5. Change entity shape to flat format

### 5.2 Option B: Build Full Adapter Layer

**Pros:**
- No changes to digital-objects
- Backward compatible

**Cons:**
- Complex adapter
- Performance overhead
- Some features impossible (semantic search)

**Required Changes:**
1. Implement full DBProviderExtended interface
2. Simulate events using actions
3. Store artifacts as separate "things"
4. Implement embeddings externally

### 5.3 Option C: Bidirectional Adaptation (Recommended)

**Pros:**
- Each package maintains identity
- Gradual integration
- Flexible usage

**Approach:**
1. **ai-database as primary API**: Use ai-database's DBProvider interface
2. **digital-objects as storage backend**: Use DigitalObjectsProvider for persistence
3. **Adapter fills gaps**: Extended features implemented at adapter level

**Implementation:**

```typescript
// Full adapter implementing DBProviderExtended
export class DigitalObjectsDBProvider implements DBProviderExtended {
  private provider: DigitalObjectsProvider
  private embeddings: Map<string, number[]> = new Map()
  private events: Event[] = []
  private eventHandlers: Map<string, Function[]> = new Map()

  // Core methods delegate to provider
  async get(type: string, id: string) { ... }

  // Extended features implemented locally
  async semanticSearch(type: string, query: string, options?: SemanticSearchOptions) {
    // Generate embedding for query
    // Compare with stored embeddings
    // Return ranked results
  }

  // Events stored alongside actions
  async emit(event: CreateEventOptions) {
    // Store as action with special marker
    // Trigger handlers
  }
}
```

---

## 6. Breaking Changes to Consider

### 6.1 If Modifying digital-objects

1. **Entity Shape Change**
   - From: `{ id, noun, data: { ... }, createdAt, updatedAt }`
   - To: `{ $id, $type, ..., createdAt, updatedAt }`
   - **Impact**: All existing code accessing `thing.data.field` breaks

2. **Method Signature Changes**
   - `get(id)` -> `get(type, id)`
   - `update(id, data)` -> `update(type, id, data)`
   - `delete(id)` -> `delete(type, id)`
   - **Impact**: All existing provider usage breaks

3. **Actions vs Events Split**
   - Current: Unified action model
   - New: Separate events and actions
   - **Impact**: Conceptual change, new APIs to learn

### 6.2 If Keeping Adapter Approach

1. **Semantic Search Not Available**
   - Unless implemented externally
   - **Impact**: Limited functionality

2. **Performance Overhead**
   - Entity transformation on every call
   - **Impact**: Slower operations

3. **Feature Parity Issues**
   - Some features can't be fully adapted
   - **Impact**: API surface differences

---

## 7. Test Plan

### 7.1 Unit Tests for Adapter

```typescript
describe('DigitalObjectsDBProvider', () => {
  describe('Core CRUD', () => {
    it('creates entity with $id and $type')
    it('gets entity by type and id')
    it('lists entities with where clause')
    it('updates entity preserving $id and $type')
    it('deletes entity')
  })

  describe('Relationships', () => {
    it('relates entities via actions')
    it('gets related entities')
    it('handles unrelate gracefully')
  })

  describe('Search', () => {
    it('searches within type')
    it('supports field-specific search')
    it('filters by minScore')
  })

  describe('Events (if implemented)', () => {
    it('emits events on CRUD operations')
    it('supports pattern-based subscriptions')
    it('lists events with filters')
    it('replays events through handler')
  })

  describe('Actions (if implemented)', () => {
    it('creates pending actions')
    it('updates action status')
    it('supports retry and cancel')
  })

  describe('Artifacts (if implemented)', () => {
    it('stores and retrieves artifacts')
    it('deletes specific artifact types')
    it('lists artifacts by URL')
  })
})
```

### 7.2 Integration Tests

```typescript
describe('Integration: ai-database with digital-objects', () => {
  describe('DB() Factory', () => {
    it('works with digital-objects provider')
    it('supports schema definition')
    it('resolves relationships')
  })

  describe('Promise Pipelining', () => {
    it('chains operations without await')
    it('batch loads relationships')
    it('handles errors in pipeline')
  })

  describe('Schema Features', () => {
    it('auto-creates backrefs')
    it('supports forward relations (->)')
    it('supports fuzzy relations (~>)')
    it('cascades entity generation')
  })
})
```

### 7.3 Edge Case Tests

```typescript
describe('Edge Cases', () => {
  it('handles type not defined in provider')
  it('handles circular relationships')
  it('handles large result sets')
  it('handles concurrent operations')
  it('handles provider disconnection')
  it('handles schema changes at runtime')
})
```

---

## 8. Recommendations

### 8.1 Short-term (Immediate)

1. **Enhance current adapter** to handle more edge cases
2. **Add missing validations** for type/id parameters
3. **Document limitations** of adapter approach

### 8.2 Medium-term (Next Sprint)

1. **Implement extended adapter** with local event/artifact storage
2. **Add semantic search** using external embedding service
3. **Write comprehensive test suite**

### 8.3 Long-term (Future)

1. **Evaluate convergence** of the two packages
2. **Consider shared core types** package
3. **Unify provider interfaces** where possible

---

## 9. File Reference

### ai-database Files Analyzed

| File | Purpose |
|------|---------|
| `/packages/ai-database/src/types.ts` | Core type definitions |
| `/packages/ai-database/src/memory-provider.ts` | Full-featured in-memory provider |
| `/packages/ai-database/src/index.ts` | Package exports |
| `/packages/ai-database/src/schema.ts` | Schema re-exports |
| `/packages/ai-database/src/schema/provider.ts` | DBProvider interface |
| `/packages/ai-database/src/memory-provider.test.ts` | Test coverage |

### digital-objects Files Analyzed

| File | Purpose |
|------|---------|
| `/packages/digital-objects/src/types.ts` | Core type definitions |
| `/packages/digital-objects/src/memory-provider.ts` | Simple in-memory provider |
| `/packages/digital-objects/src/ai-database-adapter.ts` | Current adapter |
| `/packages/digital-objects/src/index.ts` | Package exports |

---

## 10. Appendix: Interface Comparison

### A.1 Full ai-database DBProvider

```typescript
interface DBProvider {
  get(type: string, id: string): Promise<Record<string, unknown> | null>
  list(type: string, options?: ListOptions): Promise<Record<string, unknown>[]>
  search(type: string, query: string, options?: SearchOptions): Promise<Record<string, unknown>[]>
  create(type: string, id: string | undefined, data: Record<string, unknown>): Promise<Record<string, unknown>>
  update(type: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>
  delete(type: string, id: string): Promise<boolean>
  related(type: string, id: string, relation: string): Promise<Record<string, unknown>[]>
  relate(fromType: string, fromId: string, relation: string, toType: string, toId: string, metadata?: {...}): Promise<void>
  unrelate(fromType: string, fromId: string, relation: string, toType: string, toId: string): Promise<void>
}
```

### A.2 Full digital-objects DigitalObjectsProvider

```typescript
interface DigitalObjectsProvider {
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

  // Graph traversal
  related<T>(id: string, verb?: string, direction?: 'out' | 'in' | 'both'): Promise<Thing<T>[]>
  edges<T>(id: string, verb?: string, direction?: 'out' | 'in' | 'both'): Promise<Action<T>[]>

  // Lifecycle
  close?(): Promise<void>
}
```

### A.3 DBProviderExtended Additional Methods

```typescript
interface DBProviderExtended extends DBProvider {
  setEmbeddingsConfig(config: EmbeddingsConfig): void
  semanticSearch(type: string, query: string, options?: SemanticSearchOptions): Promise<SemanticSearchResult[]>
  hybridSearch(type: string, query: string, options?: HybridSearchOptions): Promise<HybridSearchResult[]>

  // Events
  on(pattern: string, handler: (event: DBEvent) => void | Promise<void>): () => void
  emit(options: CreateEventOptions): Promise<DBEvent>
  emit(type: string, data: unknown): Promise<DBEvent>
  listEvents(options?: {...}): Promise<DBEvent[]>
  replayEvents(options: {...}): Promise<void>

  // Actions
  createAction(options: CreateActionOptions): Promise<DBAction>
  getAction(id: string): Promise<DBAction | null>
  updateAction(id: string, updates: Partial<...>): Promise<DBAction>
  listActions(options?: {...}): Promise<DBAction[]>
  retryAction(id: string): Promise<DBAction>
  cancelAction(id: string): Promise<void>

  // Artifacts
  getArtifact(url: string, type: string): Promise<DBArtifact | null>
  setArtifact(url: string, type: string, data: {...}): Promise<void>
  deleteArtifact(url: string, type?: string): Promise<void>
  listArtifacts(url: string): Promise<DBArtifact[]>
}
```
