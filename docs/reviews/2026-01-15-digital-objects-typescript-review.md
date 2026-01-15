# TypeScript Type System Review: digital-objects Package

**Date:** 2026-01-15
**Package:** `digital-objects`
**Version:** 0.1.0
**Reviewer:** Claude (automated type system review)

---

## Executive Summary

The `digital-objects` package demonstrates generally **strong TypeScript practices** with strict mode enabled and excellent use of generics. However, several type safety issues and gaps were identified that should be addressed before production release.

**Overall Type Safety Grade: B+**

### Key Findings

| Category | Status | Issues |
|----------|--------|--------|
| Strict Mode | PASS | Enabled with additional strict checks |
| Generic Usage | PASS | Well-designed `Thing<T>` and `Action<T>` |
| Type Safety | NEEDS WORK | Multiple unsafe type assertions |
| Null Safety | PASS | Generally good with `noUncheckedIndexedAccess` |
| Discriminated Unions | PASS | `WALEntry` and `FieldDefinition` well-designed |
| Type Exports | PASS | All necessary types exported |
| JSDoc | PARTIAL | Complex types documented, some gaps |

---

## 1. Strict Mode Configuration

### Status: PASS

The `tsconfig.base.json` enables comprehensive strict type checking:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

**Strengths:**
- Full strict mode enabled
- `noUncheckedIndexedAccess` prevents unsafe array/object indexing
- Additional strictness flags beyond the default `strict` setting

**No violations detected in source files.**

---

## 2. Type Safety Analysis

### Critical Issues

#### Issue 2.1: Unsafe Type Assertions in MemoryProvider

**File:** `/packages/digital-objects/src/memory-provider.ts`

The `MemoryProvider` class uses `Map<string, Thing>` and `Map<string, Action>` without generic type parameters, then performs unsafe casts:

```typescript
// Line 28-29: Maps lose generic type information
private things = new Map<string, Thing>()
private actions = new Map<string, Action>()

// Line 94: Unsafe cast when storing
this.things.set(thing.id, thing as Thing)

// Line 99: Unsafe cast when retrieving
return (this.things.get(id) as Thing<T>) ?? null

// Line 103: Unsafe cast in list
let results = Array.from(this.things.values()).filter((t) => t.noun === noun) as Thing<T>[]
```

**Impact:** HIGH - Runtime type mismatches possible
**Risk:** Data corruption if different types share IDs

**Recommendation:** This is a known limitation when implementing a provider that stores heterogeneous types. Document this as a contract: callers must use consistent generic types for the same entity. Consider adding runtime type guards or using branded types for additional safety.

---

#### Issue 2.2: SQL Row Mapping with Type Assertions

**File:** `/packages/digital-objects/src/ns.ts`

All SQL query results use unsafe `Record<string, unknown>` casts:

```typescript
// Line 293: Unsafe row cast
const row = rows[0] as Record<string, unknown>
return {
  name: row.name as string,
  singular: row.singular as string,
  // ... more unsafe casts
}
```

**Occurrences:** 12+ instances throughout `ns.ts`

**Impact:** MEDIUM - Runtime errors if schema changes
**Risk:** Silent type mismatches if database schema diverges from TypeScript types

**Recommendation:** Create typed row interfaces that match SQLite schema:

```typescript
interface NounRow {
  name: string
  singular: string
  plural: string
  slug: string
  description: string | null
  schema: string | null
  created_at: number
}

// Then use type guard or zod validation
function parseNounRow(row: unknown): Noun { ... }
```

---

#### Issue 2.3: SQL Injection Vulnerability in Dynamic ORDER BY

**File:** `/packages/digital-objects/src/ns.ts`, Line 454

```typescript
if (options?.orderBy) {
  // Note: SQLite can't parameterize column names, but we're ordering by JSON field
  sql += ` ORDER BY json_extract(data, '$.${options.orderBy}')`  // UNSAFE!
  sql += options.order === 'desc' ? ' DESC' : ' ASC'
}
```

**Impact:** CRITICAL - SQL injection possible
**Risk:** Arbitrary SQL execution through `orderBy` parameter

**Recommendation:** Whitelist allowed field names or escape the value:

```typescript
const ALLOWED_ORDER_FIELDS = ['title', 'createdAt', 'updatedAt', 'name'] as const
type AllowedOrderField = typeof ALLOWED_ORDER_FIELDS[number]

if (options?.orderBy && ALLOWED_ORDER_FIELDS.includes(options.orderBy as AllowedOrderField)) {
  // Safe to use
}
```

---

#### Issue 2.4: Unused Variable in deriveVerb

**File:** `/packages/digital-objects/src/linguistic.ts`, Line 190

```typescript
if (irregulars[base]) {
  const irr = irregulars[base]
  const capitalizedEvent = capitalize(irr.event)  // UNUSED!
  return {
    action: base,
    // capitalizedEvent is never used
  }
}
```

**Impact:** LOW - Dead code, but indicates incomplete logic
**Risk:** Potential oversight in intended functionality

---

### Moderate Issues

#### Issue 2.5: Missing Type Validation in HTTP Request Parsing

**File:** `/packages/digital-objects/src/ns.ts`

Request bodies are cast directly without validation:

```typescript
// Line 112: Unsafe cast from unknown
const body = (await request.json()) as NounDefinition

// Line 146-149: Unsafe cast with implicit any
const { noun, data, id } = (await request.json()) as {
  noun: string
  data: unknown
  id?: string
}
```

**Impact:** MEDIUM - Invalid data passes type checks
**Recommendation:** Add runtime validation with zod or similar:

```typescript
import { z } from 'zod'

const NounDefinitionSchema = z.object({
  name: z.string(),
  singular: z.string().optional(),
  plural: z.string().optional(),
  description: z.string().optional(),
})

const body = NounDefinitionSchema.parse(await request.json())
```

---

#### Issue 2.6: URL Direction Parameter Cast Without Validation

**File:** `/packages/digital-objects/src/ns.ts`, Lines 237, 245

```typescript
const direction = (url.searchParams.get('direction') ?? 'out') as 'out' | 'in' | 'both'
```

**Impact:** LOW - Invalid values pass as valid
**Recommendation:** Add validation:

```typescript
const rawDirection = url.searchParams.get('direction') ?? 'out'
const direction = ['out', 'in', 'both'].includes(rawDirection)
  ? rawDirection as 'out' | 'in' | 'both'
  : 'out'
```

---

## 3. Generic Usage Assessment

### Status: PASS (Excellent)

The package makes excellent use of TypeScript generics for type-safe data handling.

#### Strengths

**Thing<T> Generic:**
```typescript
export interface Thing<T = Record<string, unknown>> {
  id: string
  noun: string
  data: T  // Strongly typed payload
  createdAt: Date
  updatedAt: Date
}
```

**Action<T> Generic:**
```typescript
export interface Action<T = Record<string, unknown>> {
  id: string
  verb: string
  subject?: string
  object?: string
  data?: T  // Strongly typed metadata
  status: ActionStatus
  createdAt: Date
  completedAt?: Date
}
```

**Provider Methods Propagate Generics:**
```typescript
interface DigitalObjectsProvider {
  create<T>(noun: string, data: T, id?: string): Promise<Thing<T>>
  get<T>(id: string): Promise<Thing<T> | null>
  list<T>(noun: string, options?: ListOptions): Promise<Thing<T>[]>
  // ... consistent generic propagation
}
```

**Default Generic Values:** Using `Record<string, unknown>` as default allows untyped usage while still supporting full type safety when types are provided.

---

## 4. Interface Design Review

### Status: PASS (Well-Designed)

#### Core Type Hierarchy

```
NounDefinition (input) -> Noun (stored)
VerbDefinition (input) -> Verb (stored)
```

This separation between definition (what user provides) and full type (what system stores) is excellent design.

#### DigitalObjectsProvider Interface

The provider interface is comprehensive and well-organized:

```typescript
interface DigitalObjectsProvider {
  // Nouns - 3 methods
  defineNoun(def: NounDefinition): Promise<Noun>
  getNoun(name: string): Promise<Noun | null>
  listNouns(): Promise<Noun[]>

  // Verbs - 3 methods
  defineVerb(def: VerbDefinition): Promise<Verb>
  getVerb(name: string): Promise<Verb | null>
  listVerbs(): Promise<Verb[]>

  // Things - 7 methods
  create<T>(...): Promise<Thing<T>>
  get<T>(...): Promise<Thing<T> | null>
  list<T>(...): Promise<Thing<T>[]>
  find<T>(...): Promise<Thing<T>[]>
  update<T>(...): Promise<Thing<T>>
  delete(...): Promise<boolean>
  search<T>(...): Promise<Thing<T>[]>

  // Actions - 3 methods
  perform<T>(...): Promise<Action<T>>
  getAction<T>(...): Promise<Action<T> | null>
  listActions<T>(...): Promise<Action<T>[]>

  // Graph traversal - 2 methods
  related<T>(...): Promise<Thing<T>[]>
  edges<T>(...): Promise<Action<T>[]>

  // Lifecycle - 1 optional method
  close?(): Promise<void>
}
```

**Strengths:**
- Consistent naming conventions
- Proper async/Promise returns
- Optional lifecycle method with `?`
- Clear separation of concerns

#### Minor Improvement Suggestions

1. **ListOptions.where type could be stricter:**
   ```typescript
   // Current
   where?: Record<string, unknown>

   // Better for type safety
   where?: Partial<T>  // But requires generic on ListOptions
   ```

2. **Consider branded types for IDs:**
   ```typescript
   type ThingId = string & { __brand: 'ThingId' }
   type NounName = string & { __brand: 'NounName' }
   ```

---

## 5. Discriminated Unions Analysis

### Status: PASS (Well-Implemented)

#### WALEntry Union (Excellent)

```typescript
export type WALEntry =
  | { type: 'defineNoun'; data: Noun; timestamp: number }
  | { type: 'defineVerb'; data: Verb; timestamp: number }
  | { type: 'create'; noun: string; id: string; data: unknown; timestamp: number }
  | { type: 'update'; id: string; data: unknown; timestamp: number }
  | { type: 'delete'; id: string; timestamp: number }
  | { type: 'perform'; verb: string; subject?: string; object?: string; data?: unknown; timestamp: number }
```

**Strengths:**
- Clear `type` discriminator
- Each variant has appropriate properties
- TypeScript can narrow types in switch statements

**Usage in replayWAL is correct:**
```typescript
switch (entry.type) {
  case 'defineNoun':
    await provider.defineNoun(entry.data)  // entry.data is Noun
    break
  case 'create':
    await provider.create(entry.noun, entry.data, entry.id)  // correct properties
    break
  // ...
}
```

#### FieldDefinition Union (Good)

```typescript
export type FieldDefinition =
  | PrimitiveType
  | `${string}.${string}`      // Relation
  | `[${string}.${string}]`    // Array relation
  | `${PrimitiveType}?`        // Optional
```

**Strengths:**
- Template literal types for relations
- Clear distinction between variants

**Consideration:** The template literal types are powerful but may need runtime parsing helpers to extract parts.

#### ActionStatus Union (Good)

```typescript
export type ActionStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'
```

Simple and appropriate for the use case.

---

## 6. Null Safety Analysis

### Status: PASS

With `noUncheckedIndexedAccess: true` enabled, the codebase properly handles potential undefined values.

#### Good Patterns Found

```typescript
// Proper null coalescing
return this.nouns.get(name) ?? null

// Optional chaining with nullish coalescing
url.searchParams.get('q') ?? ''

// Proper null checks before use
const existing = this.things.get(id)
if (!existing) {
  throw new Error(`Thing not found: ${id}`)
}
```

#### Minor Issue in linguistic.ts

```typescript
// Line 41: Non-null assertion used
parts[lastIdx] = pluralize(parts[lastIdx]!)
```

This is safe due to the length check, but could use a more explicit guard:

```typescript
const lastPart = parts[lastIdx]
if (lastPart) {
  parts[lastIdx] = pluralize(lastPart)
}
```

---

## 7. Type Exports Review

### Status: PASS

All necessary types are exported from the package entry points.

#### Main Exports (`index.ts`)

```typescript
export type {
  Noun,
  NounDefinition,
  Verb,
  VerbDefinition,
  Thing,
  Action,
  ActionStatus,
  FieldDefinition,
  PrimitiveType,
  ListOptions,
  ActionOptions,
  DigitalObjectsProvider,
} from './types.js'

export type { NSClientOptions } from './ns-client.js'
export type { Snapshot, WALEntry, SnapshotOptions, SnapshotResult } from './r2-persistence.js'
export type {
  DBProvider,
  ListOptions as DBListOptions,
  SearchOptions,
  SemanticSearchOptions,
  HybridSearchOptions,
} from './ai-database-adapter.js'
```

#### NS Exports (`ns-exports.ts`)

```typescript
export { NS } from './ns.js'
export type { Env } from './ns.js'
export { createNSClient } from './ns-client.js'
export type { NSClientOptions } from './ns-client.js'
```

#### Package.json Exports Configuration

```json
{
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./ns": { "import": "./dist/ns.js", "types": "./dist/ns.d.ts" }
  }
}
```

**Note:** The `./ns` export points to `ns.js` but the `ns-exports.ts` file is the intended entry point. This should be verified:

```json
// Should be:
"./ns": { "import": "./dist/ns-exports.js", "types": "./dist/ns-exports.d.ts" }
```

---

## 8. JSDoc Documentation Review

### Status: PARTIAL

#### Well-Documented

- Main `types.ts` has excellent module-level documentation
- Core interfaces have purpose comments
- `linguistic.ts` has good function examples
- `NSClient` has usage examples

#### Missing Documentation

1. **Parameter descriptions** for complex methods:
   ```typescript
   // Current
   async perform<T>(verb: string, subject?: string, object?: string, data?: T)

   // Better
   /**
    * Perform an action, creating a graph edge and audit record
    * @param verb - The action type (must match a defined Verb name)
    * @param subject - ID of the actor/source Thing
    * @param object - ID of the target Thing
    * @param data - Additional metadata for the action
    */
   async perform<T>(verb: string, subject?: string, object?: string, data?: T)
   ```

2. **Generic type parameter documentation**:
   ```typescript
   /**
    * @template T - The data type stored in the Thing's data field
    */
   interface Thing<T = Record<string, unknown>>
   ```

3. **FieldDefinition variants** need explanation of the template literal patterns

---

## 9. Type-Level Bugs Found

### Bug 9.1: Incorrect NS Export in package.json

**File:** `/packages/digital-objects/package.json`

```json
"./ns": { "import": "./dist/ns.js", "types": "./dist/ns.d.ts" }
```

The NS export likely intends to use `ns-exports.ts`, not `ns.ts` directly. The `ns.ts` file exports both the Durable Object class and a default fetch handler, while `ns-exports.ts` provides the clean public API.

**Fix:**
```json
"./ns": { "import": "./dist/ns-exports.js", "types": "./dist/ns-exports.d.ts" }
```

---

### Bug 9.2: Missing reverseIn in SQL Schema

**File:** `/packages/digital-objects/src/ns.ts`, Line 69

The SQL schema includes `reverse_in` column:
```sql
reverse_in TEXT,
```

But the INSERT statement (Line 333) doesn't include it:
```typescript
sql.exec(
  `INSERT OR REPLACE INTO verbs
   (name, action, act, activity, event, reverse_by, reverse_at, inverse, description, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  // ... no reverseIn parameter
)
```

And the `Verb` interface has `reverseIn` defined:
```typescript
interface Verb {
  reverseIn?: string  // Defined but never stored!
}
```

**Impact:** Data loss - `reverseIn` values are never persisted.

---

### Bug 9.3: importJSONL Uses Raw Thing Type

**File:** `/packages/digital-objects/src/r2-persistence.ts`, Line 322

```typescript
case 'thing': {
  const thing = entry.data as Thing  // Missing generic!
  await provider.create(thing.noun, thing.data, thing.id)
  stats.things++
  break
}
```

This uses the raw `Thing` type without generic, losing type information. The `Thing<unknown>` type would be more correct.

---

## 10. Recommendations

### Critical (Fix Before Release)

1. **Fix SQL injection vulnerability** in `orderBy` clause (Issue 2.3)
2. **Add runtime validation** for HTTP request bodies using zod or similar
3. **Fix NS export path** in package.json (Bug 9.1)
4. **Fix reverseIn persistence** in SQL INSERT (Bug 9.2)

### High Priority

5. **Add typed row interfaces** for SQL query results to reduce unsafe casts
6. **Document the type contract** for generic storage (callers must use consistent types)
7. **Validate direction parameter** from URL search params (Issue 2.6)

### Medium Priority

8. **Add comprehensive JSDoc** for all public methods with parameter descriptions
9. **Consider branded types** for IDs to prevent mixing Thing IDs with Action IDs
10. **Remove unused variable** `capitalizedEvent` in linguistic.ts

### Low Priority (Nice to Have)

11. **Add generic constraints** where appropriate (e.g., `T extends Record<string, unknown>`)
12. **Consider making ListOptions generic** for type-safe `where` clauses
13. **Add type guards** for discriminated unions to assist consumers

---

## Appendix: File-by-File Summary

| File | Issues | Severity |
|------|--------|----------|
| `types.ts` | None | - |
| `memory-provider.ts` | Unsafe casts (documented limitation) | Medium |
| `ns.ts` | SQL injection, unsafe casts, missing reverseIn | Critical |
| `ns-client.ts` | Minor unsafe casts | Low |
| `ai-database-adapter.ts` | Clean | - |
| `r2-persistence.ts` | Minor type issue in importJSONL | Low |
| `linguistic.ts` | Unused variable | Low |
| `index.ts` | Clean | - |
| `ns-exports.ts` | Clean | - |
| `package.json` | Incorrect NS export path | Medium |

---

**Review completed:** 2026-01-15
**Next review recommended:** After addressing critical issues
