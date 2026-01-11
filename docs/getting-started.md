# Getting Started with AI Functions

This guide covers the essential patterns for building AI-powered applications with `ai-functions`.

## Installation

```bash
npm install ai-functions
# or
pnpm add ai-functions
```

## Quick Start

### Text Generation

The simplest way to generate text:

```typescript
import { generateText } from 'ai-functions'

const result = await generateText({
  model: 'sonnet',  // Aliases: 'opus', 'gpt-4o', 'gemini'
  prompt: 'Explain quantum computing in simple terms',
})

console.log(result.text)
```

### Structured Object Generation

Generate typed, structured data:

```typescript
import { generateObject } from 'ai-functions'

const result = await generateObject({
  model: 'sonnet',
  schema: {
    title: 'Recipe title',
    ingredients: ['List of ingredients'],
    steps: ['Cooking steps'],
    prepTime: 'Preparation time in minutes',
  },
  prompt: 'Create a simple pasta recipe',
})

console.log(result.object.title)
console.log(result.object.ingredients)
```

### List Generation

Generate lists of items:

```typescript
import { generateObject } from 'ai-functions'

const result = await generateObject({
  model: 'sonnet',
  schema: { items: ['List items'] },
  prompt: 'Generate 5 startup ideas in the AI space',
})

console.log(result.object.items)
```

## Promise Pipelining with AIPromise

Chain AI operations efficiently without intermediate awaits:

```typescript
import { ai, is, list } from 'ai-functions'

// Dynamic schema inference from destructuring
const { summary, keyPoints, conclusion } = ai`write about ${topic}`

// Reference values without await
const isValid = is`${conclusion} is well-argued`

// Only await at the end
if (await isValid) {
  console.log(await summary)
}
```

### Batch Processing with .map()

Process multiple items efficiently:

```typescript
import { list, is, ai } from 'ai-functions'

// Generate a list, then evaluate each item
const ideas = await list`startup ideas in healthcare`

// Map over results - automatically batched!
const evaluated = await ideas.map(idea => ({
  idea,
  viable: is`${idea} is technically feasible`,
  market: ai`market size for ${idea}`,
}))

evaluated.forEach(({ idea, viable, market }) => {
  console.log(`${idea}: viable=${viable}, market=${market}`)
})
```

## Streaming

Display results as they generate:

```typescript
import { streamText } from 'ai-functions'

const result = await streamText({
  model: 'sonnet',
  prompt: 'Write a short story about AI',
})

for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}
```

## Error Handling

### Retry with Exponential Backoff

Handle transient failures automatically:

```typescript
import { RetryPolicy, generateText } from 'ai-functions'

const policy = new RetryPolicy({
  maxRetries: 3,
  baseDelay: 1000,    // 1 second
  maxDelay: 30000,    // 30 seconds max
  jitter: 0.2,        // +/- 20% randomization
})

const result = await policy.execute(async () => {
  const response = await generateText({
    model: 'sonnet',
    prompt: 'Generate content',
  })
  return response.text
})
```

### Fallback Chain

Fall back to alternative models:

```typescript
import { FallbackChain, generateText } from 'ai-functions'
import { model } from 'ai-providers'

const chain = new FallbackChain([
  {
    name: 'sonnet',
    execute: async () => {
      const m = await model('sonnet')
      return (await generateText({ model: m, prompt: 'Hello' })).text
    },
  },
  {
    name: 'opus',
    execute: async () => {
      const m = await model('opus')
      return (await generateText({ model: m, prompt: 'Hello' })).text
    },
  },
  {
    name: 'gpt-4o',
    execute: async () => {
      const m = await model('gpt-4o')
      return (await generateText({ model: m, prompt: 'Hello' })).text
    },
  },
])

// Tries sonnet first, falls back to opus, then gpt-4o
const result = await chain.execute()
```

### Circuit Breaker

Prevent cascading failures:

```typescript
import { CircuitBreaker, generateText } from 'ai-functions'

const breaker = new CircuitBreaker({
  failureThreshold: 5,   // Open after 5 failures
  resetTimeout: 30000,   // Try again after 30s
})

try {
  const result = await breaker.execute(async () => {
    return (await generateText({
      model: 'sonnet',
      prompt: 'Generate content',
    })).text
  })
} catch (error) {
  if (error.message === 'Circuit breaker is open') {
    // Service is down, fail fast
    console.log('Service temporarily unavailable')
  }
}

// Check circuit state
console.log(breaker.state)  // 'closed' | 'open' | 'half-open'
```

## Model Aliases

Simplified model names that route to the best provider:

| Alias | Full Model ID |
|-------|---------------|
| `sonnet` | `anthropic/claude-sonnet-4` |
| `opus` | `anthropic/claude-opus-4` |
| `gpt-4o` | `openai/gpt-4o` |
| `gemini` | `google/gemini-2.5-flash` |

## Schema Syntax

The simplified schema syntax makes it easy to define structured output:

```typescript
// String = description of expected value
{ name: 'User name' }

// Array with single string = list of that type
{ ingredients: ['List of ingredients'] }

// Pipe-separated values = enum
{ status: 'pending | approved | rejected' }

// Nested objects
{
  user: {
    name: 'User name',
    email: 'Email address',
  }
}
```

## Running Examples

The `@org.ai/examples` package contains runnable examples:

```bash
cd packages/examples
pnpm test  # Run all example tests
```

## Next Steps

- Explore the [API Reference](./api-reference.md)
- Learn about [Batch Processing](./batch-processing.md)
- See [Advanced Patterns](./advanced-patterns.md)
