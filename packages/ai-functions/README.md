# ai-functions

Core AI primitives for building intelligent applications. This is the foundational package that all other primitives depend on.

## Installation

```bash
pnpm add ai-functions
```

## Quick Start

```typescript
import { AI, generateObject, generateText } from 'ai-functions'

// Create schema-based AI functions
const ai = AI({
  recipe: {
    name: 'Recipe name',
    type: 'food | drink | dessert',
    servings: 'How many servings? (number)',
    ingredients: ['List all ingredients'],
    steps: ['Cooking steps in order'],
  },
  storyBrand: {
    hero: 'Who is the customer?',
    problem: {
      internal: 'What internal struggle?',
      external: 'What external challenge?',
    },
    solution: 'How do we help?',
  },
})

// Call the generated functions
const recipe = await ai.recipe('Italian pasta for 4 people')
const brand = await ai.storyBrand('Acme Corp sells productivity tools')
```

## Features

- **Schema-based AI functions** - Define typed AI functions with simple schema syntax
- **Smart model routing** - Automatically routes to the best provider
- **Simplified schemas** - Human-readable schema definitions that compile to Zod
- **Embedding utilities** - Full embedding support with Cloudflare Workers AI
- **RPC with promise pipelining** - Efficient remote calls via capnweb

## AI Functions

### Creating Schema Functions

Define AI functions using a simple, human-readable schema syntax:

```typescript
import { AI } from 'ai-functions'

const ai = AI({
  // Each key becomes a function
  summarize: {
    summary: 'A concise summary of the content',
    keyPoints: ['The main takeaways'],
    sentiment: 'positive | negative | neutral',
  },

  extract: {
    entities: ['Named entities found in the text'],
    dates: ['Any dates mentioned'],
    numbers: ['Any numbers or quantities (number)'],
  },
})

// Call with a prompt
const { summary, keyPoints, sentiment } = await ai.summarize('Long article text...')
const { entities, dates } = await ai.extract('Meeting on Jan 15 with John...')
```

### Schema Syntax

The simplified schema syntax maps to Zod types:

| Syntax | Zod Equivalent | Example |
|--------|---------------|---------|
| `'description'` | `z.string().describe()` | `name: 'User name'` |
| `'desc (number)'` | `z.number().describe()` | `age: 'User age (number)'` |
| `'desc (boolean)'` | `z.boolean().describe()` | `active: 'Is active? (boolean)'` |
| `'desc (integer)'` | `z.number().int().describe()` | `count: 'Item count (integer)'` |
| `'opt1 \| opt2'` | `z.enum([...])` | `status: 'pending \| done'` |
| `['description']` | `z.array(z.string()).describe()` | `tags: ['List of tags']` |
| `{ nested }` | `z.object()` | `address: { city: '...', zip: '...' }` |

### Using with Options

```typescript
const ai = AI({
  analyze: {
    score: 'Quality score 1-10 (number)',
    issues: ['List of issues found'],
    recommendation: 'What to do next',
  },
}, {
  model: 'opus',      // Default model for all functions
  temperature: 0.7,   // Default temperature
})

// Override per-call
const result = await ai.analyze('Code to review', {
  model: 'sonnet',
  temperature: 0,
})
```

## Generate Functions

Use `generateObject` and `generateText` directly with smart model routing:

### generateObject

```typescript
import { generateObject } from 'ai-functions'

// With simplified schema
const { object } = await generateObject({
  model: 'sonnet',  // Resolves to anthropic/claude-sonnet-4.5
  schema: {
    title: 'Article title',
    sections: [{
      heading: 'Section heading',
      content: 'Section content',
    }],
    tags: ['Relevant tags'],
  },
  prompt: 'Write an article about TypeScript',
})

// With Zod schema
import { z } from 'zod'

const { object } = await generateObject({
  model: 'gpt-4o',
  schema: z.object({
    name: z.string(),
    age: z.number(),
  }),
  prompt: 'Generate a user profile',
})
```

### generateText

```typescript
import { generateText } from 'ai-functions'

const { text } = await generateText({
  model: 'opus',
  prompt: 'Explain quantum computing in simple terms',
})

// With tools
const { text, toolResults } = await generateText({
  model: 'sonnet',
  prompt: 'What is the weather in Tokyo?',
  tools: {
    getWeather: {
      description: 'Get weather for a city',
      parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => fetchWeather(city),
    },
  },
  maxSteps: 5,
})
```

### Streaming

```typescript
import { streamObject, streamText } from 'ai-functions'

// Stream object generation
const { partialObjectStream } = await streamObject({
  model: 'sonnet',
  schema: { story: 'A creative story' },
  prompt: 'Write a short story',
})

for await (const partial of partialObjectStream) {
  console.log(partial.story)
}

// Stream text generation
const { textStream } = await streamText({
  model: 'gemini',
  prompt: 'Explain machine learning',
})

for await (const chunk of textStream) {
  process.stdout.write(chunk)
}
```

## Model Routing

Models are automatically resolved and routed to the best provider:

```typescript
// Simple aliases
await generateText({ model: 'opus' })      // → anthropic/claude-opus-4.5
await generateText({ model: 'sonnet' })    // → anthropic/claude-sonnet-4.5
await generateText({ model: 'gpt-4o' })    // → openai/gpt-4o
await generateText({ model: 'gemini' })    // → google/gemini-2.5-flash
await generateText({ model: 'llama' })     // → meta-llama/llama-4-maverick

// Full IDs also work
await generateText({ model: 'anthropic/claude-opus-4.5' })
await generateText({ model: 'mistralai/mistral-large-2411' })
```

**Smart routing:**
- `openai/*` → OpenAI SDK (structured outputs, streaming)
- `anthropic/*` → Anthropic SDK (MCP, tool use)
- `google/*` → Google AI SDK (grounding, code execution)
- Everything else → OpenRouter (200+ models)

## Embeddings

Full embedding support with sensible defaults:

```typescript
import {
  embed,
  embedMany,
  embedText,
  embedTexts,
  cosineSimilarity,
  findSimilar,
} from 'ai-functions'

// Quick embedding with default Cloudflare model
const { embedding } = await embedText('Hello world')
const { embeddings } = await embedTexts(['doc1', 'doc2', 'doc3'])

// Custom model
import { embed } from 'ai-functions'

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'Hello world',
})

// Find similar items
const results = findSimilar(queryEmbedding, embeddings, documents, {
  topK: 5,
  minScore: 0.7,
})

// Clustering
import { clusterBySimilarity } from 'ai-functions'

const clusters = clusterBySimilarity(embeddings, documents, {
  threshold: 0.8,
})
```

### Embedding Utilities

| Function | Description |
|----------|-------------|
| `embed()` | Embed single value (AI SDK) |
| `embedMany()` | Embed multiple values (AI SDK) |
| `embedText()` | Embed text with default CF model |
| `embedTexts()` | Embed multiple texts with default CF model |
| `cosineSimilarity()` | Calculate similarity between embeddings |
| `findSimilar()` | Find most similar items |
| `pairwiseSimilarity()` | Calculate all pairwise similarities |
| `clusterBySimilarity()` | Cluster items by embedding similarity |
| `averageEmbeddings()` | Average multiple embeddings |
| `normalizeEmbedding()` | Normalize to unit length |

## RPC with Promise Pipelining

Efficient remote AI calls using capnweb:

```typescript
import { AI } from 'ai-functions'

// Connect to remote AI service
const ai = AI({ wsUrl: 'wss://ai.example.com/rpc' })

// Promise pipelining - single round trip!
const result = ai.generate({ prompt: 'Hello' })
const upper = result.text.map(t => t.toUpperCase())
console.log(await upper)  // Only one network call

// Dynamic function calling
const summary = await ai.summarize({ text: longText })
```

### Creating RPC Sessions

```typescript
import { createRPCSession, createAuthenticatedClient } from 'ai-functions/rpc'

// Basic session
const client = createRPCSession({ wsUrl: 'wss://...' })

// Authenticated (uses DO_TOKEN or oauth.do)
const client = await createAuthenticatedClient({
  httpUrl: 'https://apis.do/rpc',
  wsUrl: 'wss://apis.do/rpc',
})
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AI_GATEWAY_URL` | Cloudflare AI Gateway URL |
| `AI_GATEWAY_TOKEN` | Gateway auth token |
| `DO_TOKEN` | Default auth token for apis.do |
| `CLOUDFLARE_ACCOUNT_ID` | For Workers AI embeddings |
| `CLOUDFLARE_API_TOKEN` | For Workers AI embeddings |

### Configuring Defaults

```typescript
import { configureAI } from 'ai-functions'

// Configure default AI client
configureAI({
  wsUrl: 'wss://custom.example.com/rpc',
  model: 'sonnet',
})
```

## TypeScript Support

Full TypeScript support with inferred types:

```typescript
const ai = AI({
  user: {
    name: 'User name',
    age: 'User age (number)',
    roles: ['User roles'],
  },
})

// Type is inferred:
// { name: string; age: number; roles: string[] }
const user = await ai.user('Generate an admin user')
```

## API Reference

### Core Functions

| Export | Description |
|--------|-------------|
| `AI()` | Create schema functions or RPC client |
| `generateObject()` | Generate structured object |
| `generateText()` | Generate text |
| `streamObject()` | Stream object generation |
| `streamText()` | Stream text generation |
| `schema()` | Convert simple schema to Zod |

### Embedding Functions

| Export | Description |
|--------|-------------|
| `embed()` | Embed single value |
| `embedMany()` | Embed multiple values |
| `embedText()` | Quick embed with CF model |
| `embedTexts()` | Quick embed multiple |
| `cosineSimilarity()` | Calculate similarity |
| `findSimilar()` | Find similar items |
| `clusterBySimilarity()` | Cluster by similarity |

### RPC Functions

| Export | Description |
|--------|-------------|
| `createRPCSession()` | Create RPC session |
| `createAuthenticatedClient()` | Create authenticated client |
| `getDefaultRPCClient()` | Get default client |
