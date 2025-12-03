# ai-database

AI-powered database primitives for intelligent data storage and retrieval. Built on linked data conventions with full RPC promise pipelining support.

## Installation

```bash
pnpm add ai-database
```

## Quick Start

```typescript
import { DB, db } from 'ai-database'

// Connect to database (uses DO_TOKEN auth)
const database = await DB({ ns: 'example.com' })

// Create a user
const user = await database.create({
  ns: 'example.com',
  type: 'users',
  id: 'john',
  data: { name: 'John Doe', email: 'john@example.com' },
})
// → https://example.com/users/john

// Get by URL
const found = await database.get('https://example.com/users/john')

// Semantic search
const results = await database.search({
  query: 'productivity software',
  type: 'products',
})
```

## Features

- **Linked Data Model** - Everything has a URL following mdxld conventions
- **Things + Relationships** - Simple graph structure with typed edges
- **Semantic Search** - AI-powered search across your data
- **RPC Promise Pipelining** - Efficient batched operations via capnweb
- **In-Memory Mode** - Fast local testing without network calls

## Core Concepts

### Things

Things are the primary data objects. Every Thing has:

- `ns` - Namespace (domain, e.g., `example.com`)
- `type` - Type of entity (e.g., `users`, `posts`)
- `id` - Unique identifier within namespace/type
- `url` - Full URL, defaults to `https://{ns}/{type}/{id}`
- `data` - Arbitrary JSON data
- `createdAt` / `updatedAt` - Timestamps

```typescript
interface Thing<T> {
  ns: string
  type: string
  id: string
  url: string
  data: T
  createdAt: Date
  updatedAt: Date
  '@context'?: string | Record<string, unknown>  // JSON-LD support
}
```

### Relationships

Relationships connect Things with typed edges:

```typescript
interface Relationship<T> {
  id: string
  type: string      // e.g., 'owns', 'follows', 'likes'
  from: string      // Source URL
  to: string        // Target URL
  createdAt: Date
  data?: T          // Optional edge properties
}
```

### URL Convention (mdxld)

URLs follow the pattern: `https://{namespace}/{type}/{id}`

```typescript
// These are equivalent:
await db.get('https://example.com/users/john')
await db.getById('example.com', 'users', 'john')

// Parse URLs
import { parseUrl, resolveUrl } from 'ai-database'

parseUrl('https://example.com/users/john')
// → { ns: 'example.com', type: 'users', id: 'john' }

resolveUrl({ ns: 'example.com', type: 'users', id: 'john' })
// → 'https://example.com/users/john'
```

## API

### Creating a Database Client

```typescript
import { DB } from 'ai-database'

// Remote database (async, uses auth)
const db = await DB({
  ns: 'example.com',           // Default namespace
  httpUrl: 'https://...',      // Optional custom endpoint
  wsUrl: 'wss://...',          // Optional WebSocket endpoint
})

// In-memory for testing (sync)
const testDb = DB({ memory: true })
```

### Thing Operations

#### create

Create a new Thing:

```typescript
const user = await db.create({
  ns: 'example.com',
  type: 'users',
  id: 'john',                  // Optional, auto-generated if omitted
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
  },
})
```

#### get / getById

Retrieve a Thing by URL or components:

```typescript
// By URL
const user = await db.get('https://example.com/users/john')

// By components
const user = await db.getById('example.com', 'users', 'john')
```

#### set

Set/replace a Thing's data:

```typescript
await db.set('https://example.com/users/john', {
  name: 'John Smith',
  email: 'john.smith@example.com',
})
```

#### update

Partially update a Thing:

```typescript
await db.update('https://example.com/users/john', {
  data: { role: 'superadmin' },  // Merges with existing data
})
```

#### upsert

Create or update a Thing:

```typescript
await db.upsert({
  ns: 'example.com',
  type: 'users',
  id: 'john',
  data: { name: 'John', visits: 1 },
})
```

#### delete

Delete a Thing:

```typescript
await db.delete('https://example.com/users/john')
```

### Querying

#### list

List all Things with optional filters:

```typescript
// All things
const all = await db.list()

// Filter by type
const users = await db.list({ type: 'users' })

// With pagination
const page = await db.list({
  type: 'posts',
  limit: 10,
  offset: 20,
  orderBy: 'createdAt',
  order: 'desc',
})
```

#### find

Find Things matching criteria:

```typescript
const admins = await db.find({
  ns: 'example.com',
  type: 'users',
  where: { role: 'admin' },
  orderBy: 'name',
  limit: 100,
})
```

#### search

Semantic search using AI:

```typescript
const results = await db.search({
  query: 'machine learning tutorials',
  type: 'articles',
  minScore: 0.7,
  limit: 10,
})
```

#### forEach

Iterate over Things:

```typescript
await db.forEach({ type: 'users' }, async (user) => {
  console.log(user.data.name)
})
```

### Relationships

#### relate

Create a relationship between Things:

```typescript
await db.relate({
  type: 'follows',
  from: 'https://example.com/users/john',
  to: 'https://example.com/users/jane',
  data: { since: new Date() },  // Optional edge data
})
```

#### unrelate

Remove a relationship:

```typescript
await db.unrelate(
  'https://example.com/users/john',
  'follows',
  'https://example.com/users/jane'
)
```

#### related

Get Things related to a Thing:

```typescript
// All related things
const related = await db.related('https://example.com/users/john')

// Filter by relationship type
const following = await db.related(
  'https://example.com/users/john',
  'follows',
  'from'  // Direction: 'from', 'to', or 'both'
)
```

#### relationships

Get the relationship edges themselves:

```typescript
const edges = await db.relationships(
  'https://example.com/users/john',
  'follows'
)
// → [{ id, type: 'follows', from, to, createdAt, data }]
```

## Promise Pipelining

Efficient batched operations with capnweb RPC:

```typescript
const db = await DB({ ns: 'example.com' })

// These operations are pipelined - single round trip!
const user = db.get('https://example.com/users/john')
const posts = user.map(u =>
  db.find({ type: 'posts', where: { authorId: u?.id } })
)

console.log(await posts)  // Only one network call
```

## In-Memory Database

For testing and development:

```typescript
import { DB, db } from 'ai-database'

// Option 1: Create directly
const memDb = DB({ memory: true })

// Option 2: Use helper
const testDb = db.memory()

// Use synchronously
const user = memDb.create({
  ns: 'test',
  type: 'users',
  id: '1',
  data: { name: 'Test User' },
})
```

## Default Client

Use the `db` export for quick access with auto-configuration:

```typescript
import { db } from 'ai-database'

// Auto-configures from environment
const users = await db.list({ type: 'users' })
const user = await db.get('https://example.com/users/john')
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_HTTP_URL` | Database HTTP endpoint |
| `DB_WS_URL` | Database WebSocket endpoint |
| `DB_NS` | Default namespace |
| `DO_TOKEN` | Authentication token |

### Default Endpoint

Without custom URLs, connects to `db.apis.do` with `DO_TOKEN` auth.

## Types

### QueryOptions

```typescript
interface QueryOptions {
  ns?: string
  type?: string
  where?: Record<string, unknown>
  orderBy?: string
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}
```

### SearchOptions

```typescript
interface SearchOptions extends QueryOptions {
  query: string
  fields?: string[]
  minScore?: number
}
```

### CreateOptions

```typescript
interface CreateOptions<T> {
  ns: string
  type: string
  id?: string
  url?: string
  data: T
  '@context'?: string | Record<string, unknown>
}
```

## Examples

### User Profile System

```typescript
const db = await DB({ ns: 'myapp.com' })

// Create user
const user = await db.create({
  ns: 'myapp.com',
  type: 'users',
  data: { name: 'Alice', email: 'alice@example.com' },
})

// Add posts
const post = await db.create({
  ns: 'myapp.com',
  type: 'posts',
  data: { title: 'Hello World', content: '...', authorId: user.id },
})

// Create relationship
await db.relate({
  type: 'authored',
  from: user.url,
  to: post.url,
})

// Get user's posts
const posts = await db.related(user.url, 'authored', 'from')
```

### Social Graph

```typescript
// Follow a user
await db.relate({
  type: 'follows',
  from: 'https://app.com/users/alice',
  to: 'https://app.com/users/bob',
})

// Get followers
const followers = await db.related(
  'https://app.com/users/bob',
  'follows',
  'to'
)

// Get following
const following = await db.related(
  'https://app.com/users/alice',
  'follows',
  'from'
)
```

### Content Search

```typescript
// Semantic search for articles
const articles = await db.search({
  query: 'how to build a REST API',
  type: 'articles',
  minScore: 0.8,
  limit: 5,
})

// Filter by author
const myArticles = await db.search({
  query: 'TypeScript patterns',
  type: 'articles',
  where: { authorId: 'john' },
})
```
