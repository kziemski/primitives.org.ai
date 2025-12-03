# ai-providers

Unified AI provider registry with Cloudflare AI Gateway support.

Access multiple AI providers via simple string identifiers like `openai:gpt-4o` or `anthropic:claude-3-5-sonnet-latest`.

## Installation

```bash
pnpm add ai-providers
```

## Quick Start

```typescript
import { model, embeddingModel } from 'ai-providers'
import { generateText, embed } from 'ai'

// Use any provider with simple string IDs
const gpt4 = await model('openai:gpt-4o')
const claude = await model('anthropic:claude-3-5-sonnet-latest')
const gemini = await model('google:gemini-2.0-flash-exp')
const llama = await model('openrouter:meta-llama/llama-3.3-70b-instruct')

// Embedding models
const openaiEmbed = await embeddingModel('openai:text-embedding-3-small')
const cfEmbed = await embeddingModel('cloudflare:@cf/baai/bge-m3')
```

## Cloudflare AI Gateway

The recommended setup uses Cloudflare AI Gateway for unified routing:

```bash
# Set environment variables
export AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_name}
export AI_GATEWAY_TOKEN=your-token
```

The gateway token is used for all providers, simplifying auth management.

## Available Providers

| Provider | ID | Example Models |
|----------|-----|----------------|
| OpenAI | `openai` | `gpt-4o`, `gpt-4o-mini`, `text-embedding-3-small` |
| Anthropic | `anthropic` | `claude-3-5-sonnet-latest`, `claude-3-opus-latest` |
| Google | `google` | `gemini-2.0-flash-exp`, `gemini-1.5-pro` |
| OpenRouter | `openrouter` | `meta-llama/llama-3.3-70b-instruct` |
| Cloudflare | `cloudflare` | `@cf/baai/bge-m3` (embeddings) |

## API

### `model(id: string)`

Get a language model from the default registry.

```typescript
import { model } from 'ai-providers'
import { generateText } from 'ai'

const { text } = await generateText({
  model: await model('openai:gpt-4o'),
  prompt: 'Hello!'
})
```

### `embeddingModel(id: string)`

Get an embedding model from the default registry.

```typescript
import { embeddingModel } from 'ai-providers'
import { embed } from 'ai'

const { embedding } = await embed({
  model: await embeddingModel('openai:text-embedding-3-small'),
  value: 'Hello!'
})
```

### `createRegistry(config?, options?)`

Create a custom provider registry.

```typescript
import { createRegistry } from 'ai-providers'

const registry = await createRegistry({
  gatewayUrl: 'https://gateway.ai.cloudflare.com/v1/...',
  gatewayToken: 'your-token'
})

const model = registry.languageModel('anthropic:claude-3-5-sonnet-latest')
```

### `configureRegistry(config)`

Configure the default registry with custom settings.

```typescript
import { configureRegistry } from 'ai-providers'

await configureRegistry({
  openaiApiKey: 'sk-...',
  anthropicApiKey: 'sk-ant-...'
})
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AI_GATEWAY_URL` | Cloudflare AI Gateway endpoint |
| `AI_GATEWAY_TOKEN` | Gateway auth token (or `DO_TOKEN`) |
| `OPENAI_API_KEY` | OpenAI API key (fallback) |
| `ANTHROPIC_API_KEY` | Anthropic API key (fallback) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key (fallback) |
| `OPENROUTER_API_KEY` | OpenRouter API key (fallback) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (fallback) |

## Gateway Provider Paths

When using Cloudflare AI Gateway, requests are routed to:

- `{gateway_url}/openai` - OpenAI
- `{gateway_url}/anthropic` - Anthropic
- `{gateway_url}/google-ai-studio` - Google AI
- `{gateway_url}/openrouter` - OpenRouter
- `{gateway_url}/workers-ai` - Cloudflare Workers AI
