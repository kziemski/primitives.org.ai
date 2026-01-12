# ai-core

**Lightweight AI primitives for minimal footprint.**

Need just the basics without all the extras? `ai-core` gives you the essential AI building blocks—no batch processing, no retry logic, no caching overhead. Just the primitives you need to ship.

```typescript
import { ai, list, is } from 'ai-core'

const ideas = list`startup ideas for ${industry}`
const qualified = is`${idea} worth pursuing?`
const { summary, plan } = ai`analyze: ${idea}`
```

## When to Use ai-core vs ai-functions

| Choose `ai-core` when... | Choose `ai-functions` when... |
|--------------------------|-------------------------------|
| Building serverless functions | Processing large batches |
| Bundle size matters | Need automatic retries |
| Simple AI interactions | Caching generations/embeddings |
| Prototyping quickly | Tool orchestration (agentic loops) |
| Edge deployments | Budget tracking |

**ai-core** is the foundation. **ai-functions** builds on top of it with production resilience patterns.

## Installation

```bash
pnpm add ai-core
```

Or with npm/yarn:

```bash
npm install ai-core
yarn add ai-core
```

## Basic Examples

### Generate Anything with `ai`

Destructure to get exactly what you need—schema is inferred automatically:

```typescript
import { ai } from 'ai-core'

// Simple text
const text = await ai`write a tagline for ${product}`

// Structured output via destructuring
const { summary, keyPoints, conclusion } = ai`analyze this article: ${article}`
console.log(await summary)
console.log(await keyPoints)
```

### Template Literals with Data

Objects and arrays automatically convert to YAML for better LLM comprehension:

```typescript
import { ai } from 'ai-core'

const user = { name: 'Alice', role: 'developer', experience: 5 }
const feedback = ai`performance review for ${user}`

// The user object becomes readable YAML in the prompt
```

### Generate Lists

```typescript
import { list, lists } from 'ai-core'

// Single list
const ideas = await list`blog post topics for ${audience}`

// Multiple named lists via destructuring
const { pros, cons } = lists`pros and cons of ${decision}`
const { mustHave, niceToHave } = lists`feature requirements for ${product}`
```

### Boolean Classification with `is`

```typescript
import { is } from 'ai-core'

const isSpam = await is`${email} is spam`
const isUrgent = await is`${ticket} requires immediate attention`
const isQualified = await is`${lead} matches our ideal customer profile`
```

### Promise Pipelining

Chain AI operations without awaiting each one—dependencies resolve automatically:

```typescript
import { ai, is, list } from 'ai-core'

// No await needed until the end
const { analysis, recommendation } = ai`analyze ${data}`
const isValid = is`${recommendation} is actionable`
const alternatives = list`alternatives if ${recommendation} fails`

// Only await when you need the actual values
if (await isValid) {
  console.log(await recommendation)
} else {
  console.log(await alternatives)
}
```

### Low-Level Generation

For more control, use the underlying generate functions:

```typescript
import { generateText, generateObject } from 'ai-core'

// Text generation with model alias
const { text } = await generateText({
  model: 'sonnet',
  prompt: 'Explain quantum computing simply.',
})

// Structured object generation
const { object } = await generateObject({
  model: 'sonnet',
  schema: {
    name: 'Recipe name',
    ingredients: ['List of ingredients'],
    steps: ['Cooking steps'],
  },
  prompt: 'Generate a pasta recipe.',
})
```

## What's NOT Included

`ai-core` intentionally omits production patterns to stay lightweight. These features are available in `ai-functions`:

| Feature | Description | Package |
|---------|-------------|---------|
| **Batch Processing** | `BatchQueue`, `.map()` on lists | `ai-functions` |
| **Retry & Resilience** | `RetryPolicy`, `CircuitBreaker`, `FallbackChain` | `ai-functions` |
| **Caching** | `MemoryCache`, `EmbeddingCache`, `GenerationCache` | `ai-functions` |
| **Budget Tracking** | `BudgetTracker`, `TokenCounter`, cost limits | `ai-functions` |
| **Tool Orchestration** | `AgenticLoop`, `ToolRouter`, multi-step agents | `ai-functions` |
| **Embeddings** | Vector embeddings and similarity search | `ai-functions` |

## Migration Path to ai-functions

When you need more power, upgrading is seamless—same API, more features:

```diff
- import { ai, list, is } from 'ai-core'
+ import { ai, list, is } from 'ai-functions'
```

Your existing code works unchanged. Then add the features you need:

```typescript
import { ai, list, withRetry, withCache, BatchQueue } from 'ai-functions'

// Add automatic retries
const result = await withRetry(() => ai`analyze ${data}`, {
  maxRetries: 3,
  backoff: 'exponential',
})

// Add caching
const cachedGenerate = withCache(
  (prompt) => ai`${prompt}`,
  { ttl: 3600 }
)

// Process batches efficiently
const items = await list`items from ${source}`
const analyzed = await items.map(item => ({
  item,
  score: ai`score: ${item}`,
  valid: is`${item} is valid`,
}))
```

## API Reference

### Generative Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `ai` | `AIPromise<T>` | Flexible generation with dynamic schema |
| `write` | `AIPromise<string>` | Long-form text content |
| `code` | `AIPromise<string>` | Code generation |
| `list` | `AIPromise<string[]>` | List of items |
| `lists` | `AIPromise<Record<string, string[]>>` | Named lists via destructuring |
| `extract` | `AIPromise<unknown[]>` | Structured data extraction |
| `summarize` | `AIPromise<string>` | Content summarization |

### Classification & Decision

| Function | Returns | Description |
|----------|---------|-------------|
| `is` | `AIPromise<boolean>` | Boolean classification |
| `decide` | `AIPromise<T>` | LLM-as-judge comparison |

### Visual & Media

| Function | Returns | Description |
|----------|---------|-------------|
| `diagram` | `AIPromise<string>` | Mermaid diagrams |
| `slides` | `AIPromise<string>` | Slidev/Marp presentations |
| `image` | `AIPromise<Buffer>` | Image generation |
| `video` | `AIPromise<Buffer>` | Video generation |

### Agentic & Human-in-Loop

| Function | Returns | Description |
|----------|---------|-------------|
| `do` | `AIPromise<{ summary, actions }>` | Task execution |
| `research` | `AIPromise<{ summary, findings, sources }>` | Web research |
| `ask` | `AIPromise<HumanResult>` | Request human input |
| `approve` | `AIPromise<HumanResult>` | Request approval |
| `review` | `AIPromise<HumanResult>` | Request review |

## Related Packages

- [`ai-functions`](../ai-functions) — Full-featured AI primitives with batch, retry, cache
- [`ai-providers`](../ai-providers) — Model provider abstraction and routing
- [`language-models`](../language-models) — Model definitions and aliases
