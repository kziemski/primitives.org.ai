# AI-Database + Digital-Objects Integration Plan

**Date:** 2026-01-15
**Status:** Draft
**Author:** Claude Code

## Executive Summary

This plan outlines the integration of `digital-objects` as a storage backend for `ai-database`. The `digital-objects` package provides a unified nouns/verbs/things/actions model that aligns well with `ai-database`'s schema-first approach. The integration will be achieved through an adapter layer that maps `DBProvider` interface to `DigitalObjectsProvider`.

---

## 1. Current State Analysis

### 1.1 DBProvider Interface

The core provider interface (`/packages/ai-database/src/schema/provider.ts`) defines:

```typescript
export interface DBProvider {
  // Entity CRUD
  get(type: string, id: string): Promise<Record<string, unknown> | null>
  list(type: string, options?: ListOptions): Promise<Record<string, unknown>[]>
  search(type: string, query: string, options?: SearchOptions): Promise<Record<string, unknown>[]>
  create(type: string, id: string | undefined, data: Record<string, unknown>): Promise<Record<string, unknown>>
  update(type: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>
  delete(type: string, id: string): Promise<boolean>

  // Relationships
  related(type: string, id: string, relation: string): Promise<Record<string, unknown>[]>
  relate(fromType: string, fromId: string, relation: string, toType: string, toId: string, metadata?: {...}): Promise<void>
  unrelate(fromType: string, fromId: string, relation: string, toType: string, toId: string): Promise<void>
}
```

### 1.2 DBProviderExtended Interface

Extended providers add semantic search, events, actions, and artifacts:

```typescript
export interface DBProviderExtended extends DBProvider {
  // Embeddings
  setEmbeddingsConfig(config: EmbeddingsConfig): void
  semanticSearch(type: string, query: string, options?: SemanticSearchOptions): Promise<SemanticSearchResult[]>
  hybridSearch(type: string, query: string, options?: HybridSearchOptions): Promise<HybridSearchResult[]>

  // Events API
  on(pattern: string, handler: (event: DBEvent) => void | Promise<void>): () => void
  emit(options: CreateEventOptions): Promise<DBEvent>
  listEvents(options?: {...}): Promise<DBEvent[]>
  replayEvents(options: {...}): Promise<void>

  // Actions API
  createAction(options: CreateActionOptions): Promise<DBAction>
  getAction(id: string): Promise<DBAction | null>
  updateAction(id: string, updates: {...}): Promise<DBAction>
  listActions(options?: {...}): Promise<DBAction[]>
  retryAction(id: string): Promise<DBAction>
  cancelAction(id: string): Promise<void>

  // Artifacts API
  getArtifact(url: string, type: string): Promise<DBArtifact | null>
  setArtifact(url: string, type: string, data: {...}): Promise<void>
  deleteArtifact(url: string, type?: string): Promise<void>
  listArtifacts(url: string): Promise<DBArtifact[]>
}
```

### 1.3 MemoryProvider Implementation

Located at `/packages/ai-database/src/memory-provider.ts`:

- **2164 lines** of comprehensive implementation
- Implements full `DBProviderExtended` interface
- In-memory Maps for entities, relations, events, actions, artifacts
- Includes embedding generation (mock + ai-functions)
- Verb conjugation for actions (act/action/activity)
- Event pattern matching with wildcards

### 1.4 Provider Resolution

In `provider.ts`, the `resolveProvider()` function:

1. Checks for global provider (set via `setProvider()`)
2. Parses `DATABASE_URL` environment variable
3. Supports: memory, fs, sqlite, clickhouse
4. Falls back to memory provider if external packages unavailable

---

## 2. Digital-Objects Interface Analysis

### 2.1 DigitalObjectsProvider Interface

From `/packages/digital-objects/src/types.ts`:

```typescript
export interface DigitalObjectsProvider {
  // Nouns (type definitions)
  defineNoun(def: NounDefinition): Promise<Noun>
  getNoun(name: string): Promise<Noun | null>
  listNouns(): Promise<Noun[]>

  // Verbs (action definitions)
  defineVerb(def: VerbDefinition): Promise<Verb>
  getVerb(name: string): Promise<Verb | null>
  listVerbs(): Promise<Verb[]>

  // Things (entity instances)
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

  close?(): Promise<void>
}
```

### 2.2 Key Conceptual Mappings

| ai-database | digital-objects | Notes |
|-------------|-----------------|-------|
| Entity type | Noun | Type definitions with schemas |
| Entity instance | Thing | Data with `noun` reference |
| DBAction | Action | Similar but different field names |
| DBEvent | Action (verb=event) | Events are actions in DO |
| Relations | Actions | Edges stored as subject->verb->object |

---

## 3. Integration Strategy

### 3.1 Package Structure

```
packages/ai-database/
  src/
    providers/
      digital-objects-adapter.ts   # NEW: Adapter implementation
      index.ts                     # Re-export all providers
    schema/
      provider.ts                  # Modify: Add DO resolution
```

### 3.2 Adapter Class Design

```typescript
// digital-objects-adapter.ts
import type { DigitalObjectsProvider, Thing, Action } from 'digital-objects'
import type { DBProviderExtended, DBEvent, DBAction } from '../schema/types.js'

export class DigitalObjectsAdapter implements DBProviderExtended {
  private provider: DigitalObjectsProvider
  private embeddingsConfig: EmbeddingsConfig = {}
  private eventHandlers = new Map<string, Array<(event: DBEvent) => void>>()

  constructor(provider: DigitalObjectsProvider) {
    this.provider = provider
  }

  // Auto-define nouns for types on first use
  private async ensureNoun(type: string): Promise<void> {
    const existing = await this.provider.getNoun(type)
    if (!existing) {
      await this.provider.defineNoun({ name: type })
    }
  }
}
```

### 3.3 Method Mapping Implementation

#### Entity Operations

```typescript
// get(type, id) -> provider.get(compositeId)
async get(type: string, id: string): Promise<Record<string, unknown> | null> {
  await this.ensureNoun(type)
  const thing = await this.provider.get<Record<string, unknown>>(`${type}:${id}`)
  if (!thing) return null
  return { ...thing.data, $id: id, $type: type }
}

// list(type, options) -> provider.list(noun, options)
async list(type: string, options?: ListOptions): Promise<Record<string, unknown>[]> {
  await this.ensureNoun(type)
  const things = await this.provider.list<Record<string, unknown>>(type, options)
  return things.map(t => ({ ...t.data, $id: extractId(t.id), $type: type }))
}

// create(type, id, data) -> provider.create(noun, data, compositeId)
async create(type: string, id: string | undefined, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  await this.ensureNoun(type)
  const entityId = id ?? crypto.randomUUID()
  const thing = await this.provider.create(type, data, `${type}:${entityId}`)
  return { ...thing.data, $id: entityId, $type: type }
}
```

#### Relationships via Actions

```typescript
// relate() -> provider.perform('relates', fromId, toId, { relation })
async relate(fromType: string, fromId: string, relation: string, toType: string, toId: string): Promise<void> {
  const subjectId = `${fromType}:${fromId}`
  const objectId = `${toType}:${toId}`
  await this.provider.perform(relation, subjectId, objectId, { relation })
}

// related() -> provider.related(id, relation, 'out')
async related(type: string, id: string, relation: string): Promise<Record<string, unknown>[]> {
  const things = await this.provider.related(`${type}:${id}`, relation, 'out')
  return things.map(t => ({ ...t.data, $id: extractId(t.id), $type: t.noun }))
}
```

#### Events via Actions

```typescript
// emit() -> provider.perform(eventVerb, actorId, objectId, eventData)
async emit(options: CreateEventOptions): Promise<DBEvent> {
  const verb = options.event.replace('.', '_') // 'Post.created' -> 'Post_created'
  const action = await this.provider.perform(verb, options.actor, options.object, {
    actorData: options.actorData,
    objectData: options.objectData,
    result: options.result,
    resultData: options.resultData,
    meta: options.meta
  })
  return this.actionToDBEvent(action)
}
```

#### Actions Mapping

```typescript
// createAction() -> provider.perform() with status handling
async createAction(options: CreateActionOptions): Promise<DBAction> {
  await this.ensureVerb(options.action)
  const action = await this.provider.perform(
    options.action,
    options.actor,
    options.object,
    { ...options.objectData, status: 'pending', total: options.total }
  )
  return this.doActionToDBAction(action)
}

// Map digital-objects Action to ai-database DBAction
private doActionToDBAction(action: Action): DBAction {
  const conjugated = conjugateVerb(action.verb)
  return {
    id: action.id,
    actor: action.subject ?? 'system',
    act: conjugated.act,
    action: conjugated.action,
    activity: conjugated.activity,
    object: action.object,
    objectData: action.data as Record<string, unknown>,
    status: action.status,
    createdAt: action.createdAt,
    completedAt: action.completedAt,
  }
}
```

### 3.4 Schema Type to Noun Mapping

When `DB(schema)` is called, auto-register nouns:

```typescript
// In DB() factory, after resolving provider:
if (provider instanceof DigitalObjectsAdapter) {
  for (const [typeName, entity] of parsedSchema.entities) {
    await provider.defineNoun({
      name: typeName,
      schema: convertEntitySchemaToFields(entity)
    })
  }

  // Define standard verbs
  for (const verb of ['create', 'update', 'delete', 'relate', 'unrelate']) {
    await provider.defineVerb({ name: verb })
  }
}
```

### 3.5 Provider Resolution Update

Modify `resolveProvider()` in `provider.ts`:

```typescript
async function resolveProvider(): Promise<DBProvider> {
  const databaseUrl = process.env.DATABASE_URL || './content'
  const parsed = parseDatabaseUrl(databaseUrl)

  switch (parsed.provider) {
    case 'digital-objects': {
      try {
        const { createMemoryProvider } = await import('digital-objects')
        const doProvider = createMemoryProvider()
        return new DigitalObjectsAdapter(doProvider)
      } catch {
        console.warn('digital-objects not available, falling back to memory')
        return createMemoryProvider()
      }
    }

    case 'ns': {
      try {
        const { createNSClient } = await import('digital-objects/ns')
        const nsClient = createNSClient({ url: parsed.remoteUrl })
        return new DigitalObjectsAdapter(nsClient)
      } catch {
        console.warn('digital-objects/ns not available, falling back to memory')
        return createMemoryProvider()
      }
    }

    // ... existing cases
  }
}
```

---

## 4. Migration Path

### Phase 1: Adapter Implementation (Week 1-2)

**Goal:** Both providers available, ai-database memory provider is default

1. Create `digital-objects-adapter.ts` with full `DBProviderExtended` implementation
2. Add unit tests for adapter (using DO's MemoryProvider)
3. Export adapter from ai-database package
4. Add `DATABASE_URL=do://` and `DATABASE_URL=ns://` support

**Breaking Changes:** None - new functionality only

### Phase 2: Integration Testing (Week 3)

**Goal:** Validate all ai-database features work with DO backend

1. Run full ai-database test suite against adapter
2. Add integration tests for schema-to-noun mapping
3. Test Events/Actions translation fidelity
4. Performance benchmarks: memory vs DO memory vs NS

**Breaking Changes:** None

### Phase 3: Default Switch (Week 4)

**Goal:** Digital-objects becomes default for new projects

1. Change default provider resolution order:
   - `DATABASE_URL` explicit setting takes priority
   - `digital-objects` if available
   - `memory-provider` fallback
2. Update documentation with migration guide
3. Deprecation warnings on MemoryProvider direct usage

**Breaking Changes:** Behavioral - new projects use DO by default

### Phase 4: Deprecation (Future)

**Goal:** Consolidate on single storage abstraction

1. Add deprecation warnings to MemoryProvider
2. Migration tooling for existing data
3. Remove MemoryProvider in next major version

**Breaking Changes:** MemoryProvider removed in ai-database v2.0

---

## 5. Test Strategy

### 5.1 Unit Tests

```typescript
// test/digital-objects-adapter.test.ts
describe('DigitalObjectsAdapter', () => {
  describe('Entity Operations', () => {
    it('create() maps to Thing with correct noun', async () => {})
    it('get() returns null for missing entities', async () => {})
    it('list() filters by type (noun)', async () => {})
    it('update() preserves existing data', async () => {})
    it('delete() returns true for existing entities', async () => {})
  })

  describe('Relationships', () => {
    it('relate() creates Action as edge', async () => {})
    it('related() traverses outbound edges', async () => {})
    it('unrelate() removes edge Action', async () => {})
  })

  describe('Events', () => {
    it('emit() creates Action with event verb', async () => {})
    it('on() registers handler for pattern', async () => {})
    it('listEvents() filters by event pattern', async () => {})
  })

  describe('Schema Integration', () => {
    it('auto-defines Nouns from schema types', async () => {})
    it('maps field types to Noun schema', async () => {})
  })
})
```

### 5.2 Integration Tests

Run existing ai-database test suite with DO adapter:

```typescript
// test/integration/digital-objects.test.ts
describe('ai-database with DigitalObjectsAdapter', () => {
  beforeEach(() => {
    const adapter = new DigitalObjectsAdapter(createMemoryProvider())
    setProvider(adapter)
  })

  // Import and run existing test suites
  runEntityOperationsTests()
  runRelationshipTests()
  runEventsActionsTests()
  runSemanticSearchTests()
})
```

### 5.3 Compatibility Tests

Verify behavioral equivalence:

```typescript
describe('Provider Compatibility', () => {
  const providers = [
    ['MemoryProvider', createMemoryProvider()],
    ['DigitalObjectsAdapter', new DigitalObjectsAdapter(createDOMemoryProvider())]
  ]

  providers.forEach(([name, provider]) => {
    describe(name, () => {
      it('returns same shape for get()', async () => {})
      it('returns same shape for list()', async () => {})
      it('handles missing entities identically', async () => {})
      it('generates same event structure', async () => {})
    })
  })
})
```

---

## 6. Identified Gaps & Solutions

### 6.1 Missing in DigitalObjects

| Feature | ai-database | digital-objects | Solution |
|---------|-------------|-----------------|----------|
| Semantic search | `semanticSearch()` | Not implemented | Store embeddings in Thing.data, search locally |
| Hybrid search | `hybridSearch()` | Not implemented | Combine FTS + semantic in adapter |
| Artifacts | Full API | Not implemented | Store as special Things (noun='Artifact') |
| Event subscriptions | `on()` with patterns | Not implemented | In-memory handler registry in adapter |

### 6.2 Structural Differences

| Aspect | ai-database | digital-objects | Adapter Strategy |
|--------|-------------|-----------------|------------------|
| ID format | `type + id` separate | Single string ID | Composite ID: `${type}:${id}` |
| Type field | `$type` | `thing.noun` | Map in responses |
| Relations | Separate map | Actions as edges | Use `perform()` for relations |
| Actions | `act/action/activity` | `verb` | Auto-conjugate in adapter |

### 6.3 Artifacts Strategy

Store artifacts as Things with reserved noun:

```typescript
// Artifact storage via Things
async setArtifact(url: string, type: string, data: {...}): Promise<void> {
  await this.provider.create('_Artifact', {
    url,
    artifactType: type,
    sourceHash: data.sourceHash,
    content: data.content,
    metadata: data.metadata
  }, `_Artifact:${url}:${type}`)
}

async getArtifact(url: string, type: string): Promise<DBArtifact | null> {
  const thing = await this.provider.get(`_Artifact:${url}:${type}`)
  if (!thing) return null
  return {
    url: thing.data.url,
    type: thing.data.artifactType,
    ...thing.data
  }
}
```

---

## 7. Documentation Changes

### 7.1 New Documentation

- `docs/providers/digital-objects.md` - Setup and configuration
- Update `docs/getting-started.md` - Add DO as recommended option

### 7.2 API Reference Updates

- Add `DATABASE_URL=do://` and `DATABASE_URL=ns://` examples
- Document adapter-specific behaviors (if any)

---

## 8. Success Criteria

1. **Functional Parity:** All existing ai-database tests pass with DO adapter
2. **Schema Mapping:** DB schema types correctly create Nouns
3. **Relations:** Relationships persist and traverse correctly via Actions
4. **Events:** Event emission and subscription work with pattern matching
5. **Performance:** No significant regression vs MemoryProvider for common ops
6. **Migration:** Clear path from MemoryProvider to DO without data loss

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Semantic search gap | High | Implement in adapter with embeddings stored in Thing.data |
| Performance overhead | Medium | Benchmark early, optimize composite ID parsing |
| Event pattern mismatch | Medium | Thorough pattern matching tests |
| Breaking NS API changes | Low | Pin digital-objects version, integration tests |

---

## 10. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Adapter | 1-2 weeks | None |
| Phase 2: Testing | 1 week | Phase 1 |
| Phase 3: Default Switch | 1 week | Phase 2 |
| Phase 4: Deprecation | Future | Phase 3 + major version |

**Total:** 3-4 weeks to production-ready integration

---

## Appendix A: File Changes Summary

### New Files

- `/packages/ai-database/src/providers/digital-objects-adapter.ts`
- `/packages/ai-database/src/providers/index.ts`
- `/packages/ai-database/test/digital-objects-adapter.test.ts`
- `/packages/ai-database/test/integration/digital-objects.test.ts`

### Modified Files

- `/packages/ai-database/src/schema/provider.ts` - Add DO resolution
- `/packages/ai-database/src/schema/index.ts` - Export adapter
- `/packages/ai-database/package.json` - Add digital-objects peer dependency

### Documentation

- `/docs/providers/digital-objects.md` (new)
- `/docs/getting-started.md` (update)
