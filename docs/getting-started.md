# Getting Started with ai-functions

Build AI-powered applications in 5 minutes. No boilerplate. No configuration files. Just say what you need.

## 1. Install

```bash
npm install ai-functions
# or
pnpm add ai-functions
```

## 2. Configure Your Provider

Set one environment variable - that's it:

```bash
# Choose your provider:
export ANTHROPIC_API_KEY=sk-ant-...     # Claude (recommended)
export OPENAI_API_KEY=sk-...            # GPT-4
export GOOGLE_API_KEY=...               # Gemini
```

The library auto-detects your provider from environment variables. No configuration code needed.

## 3. Your First AI Call

Create `hello.ts`:

```typescript
import { ai } from 'ai-functions'

// Just ask for what you need
const greeting = await ai`write a friendly greeting for a developer`

console.log(greeting)
```

Run it:

```bash
npx tsx hello.ts
```

Output:
```
Hey there, fellow developer! Hope your code compiles on the first try today.
```

## 4. Get Structured Data with `list()`

AI that returns actual data types, not just strings:

```typescript
import { list } from 'ai-functions'

// Get a typed array of strings
const ideas = await list`5 startup ideas in the AI space`

ideas.forEach((idea, i) => {
  console.log(`${i + 1}. ${idea}`)
})
```

Output:
```
1. AI-powered code review tool
2. Automated customer support agent
3. Intelligent document summarization
4. Personalized learning assistant
5. Smart contract audit platform
```

### Batch Processing with `.map()`

Process items efficiently - multiple AI calls batched into one:

```typescript
import { list, is, ai } from 'ai-functions'

const ideas = await list`startup ideas in healthcare`

// All these AI calls are batched into a single request
const evaluated = await ideas.map(idea => ({
  idea,
  viable: is`${idea} is technically feasible`,
  market: ai`one-line market analysis for ${idea}`,
}))

evaluated.forEach(({ idea, viable, market }) => {
  console.log(`${idea}`)
  console.log(`  Viable: ${viable}`)
  console.log(`  Market: ${market}`)
})
```

## 5. Add Type Safety with Schemas

### Simple Schema Syntax

Define structure with plain objects - no Zod required:

```typescript
import { AI } from 'ai-functions'

// Define your schema with human-readable descriptions
const ai = AI({
  analyzeCompany: {
    name: 'Company name',
    industry: 'tech | healthcare | finance | retail | other',
    score: 'Investment potential 1-100 (number)',
    strengths: ['Key competitive advantages'],
    risks: ['Potential concerns'],
  },
})

// Fully typed return value
const analysis = await ai.analyzeCompany('Analyze Tesla for investment potential')

console.log(analysis.name)       // string
console.log(analysis.score)      // number
console.log(analysis.strengths)  // string[]
```

### Schema Syntax Reference

| Syntax | Type | Example |
|--------|------|---------|
| `'description'` | string | `name: 'Company name'` |
| `'desc (number)'` | number | `score: 'Score 1-100 (number)'` |
| `'desc (boolean)'` | boolean | `qualified: 'Is qualified? (boolean)'` |
| `'opt1 \| opt2'` | enum | `priority: 'high \| medium \| low'` |
| `['description']` | array | `items: ['List of items']` |
| `{ nested }` | object | `contact: { name, email }` |

### Using Zod for Full Type Safety

When you need advanced validation:

```typescript
import { generateObject } from 'ai-functions'
import { z } from 'zod'

const result = await generateObject({
  model: 'sonnet',
  schema: z.object({
    title: z.string().describe('Recipe title'),
    servings: z.number().min(1).max(20).describe('Number of servings'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    ingredients: z.array(z.string()).describe('List of ingredients'),
    steps: z.array(z.string()).describe('Cooking steps'),
  }),
  prompt: 'Create a simple pasta recipe for beginners',
})

// result.object is fully typed
console.log(result.object.title)
console.log(result.object.ingredients)
```

## 6. More Primitives

### Boolean Classification

```typescript
import { is } from 'ai-functions'

const isSpam = await is`${email} looks like spam`
const isUrgent = await is`${ticket} requires immediate attention`

if (isSpam) {
  // handle spam
}
```

### Multiple Named Lists

```typescript
import { lists } from 'ai-functions'

const { pros, cons } = await lists`pros and cons of remote work`

console.log('Pros:', pros)
console.log('Cons:', cons)
```

### Structured Extraction

```typescript
import { extract } from 'ai-functions'

const { name, email, phone } = await extract`
  contact info from: ${businessCard}
`
```

### Long-form Content

```typescript
import { write } from 'ai-functions'

const post = await write`
  blog post about TypeScript best practices
  for a senior developer audience
`
```

## Complete Example

Put it all together:

```typescript
import { ai, list, is, lists } from 'ai-functions'

async function analyzeMarket(industry: string) {
  // Generate competitor list
  const competitors = await list`top 5 companies in ${industry}`

  // Analyze each competitor
  const analyses = await competitors.map(company => ({
    company,
    isPublic: is`${company} is publicly traded`,
    analysis: ai`one paragraph analysis of ${company}'s market position`,
  }))

  // Get overall market insights
  const { opportunities, threats } = await lists`
    market opportunities and threats in ${industry}
  `

  return {
    competitors: analyses,
    opportunities,
    threats,
  }
}

// Run it
const result = await analyzeMarket('electric vehicles')
console.log(JSON.stringify(result, null, 2))
```

## Next Steps

- [API Reference](./api-reference.md) - Complete function documentation
- [Batch Processing](./batch-processing.md) - Optimize for high volume
- [Error Handling](./error-handling.md) - Retry policies and circuit breakers
- [ai-functions README](../packages/ai-functions/README.md) - Full feature overview

## Model Aliases

Use simple names instead of full model IDs:

| Alias | Model |
|-------|-------|
| `sonnet` | Claude Sonnet 4 (default) |
| `opus` | Claude Opus 4 |
| `gpt-4o` | GPT-4o |
| `gemini` | Gemini 2.5 Flash |

```typescript
import { configure, ai } from 'ai-functions'

// Change the default model globally
configure({ model: 'gpt-4o' })

// Or per-call
const result = await ai`explain quantum computing`
```

---

**Ready to build?** Check out the [examples](../examples/) directory for real-world patterns.
