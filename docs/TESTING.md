# Testing Guide

This guide documents testing patterns, expectations, and best practices for the AI Primitives monorepo.

## Testing Philosophy

### TDD (Red-Green-Refactor)

We follow Test-Driven Development principles:

1. **Red**: Write a failing test that defines expected behavior
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

```typescript
// 1. Red - Write the test first
it('extracts email addresses from text', async () => {
  const result = await extract('Contact us at support@example.com')
  expect(result).toContain('support@example.com')
})

// 2. Green - Implement the feature
// 3. Refactor - Clean up while tests pass
```

### Unit Tests vs Integration Tests

| Type | Purpose | Speed | Dependencies |
|------|---------|-------|--------------|
| **Unit** | Test isolated logic | Fast | Mocked |
| **Integration** | Test component interaction | Slower | Real or mocked |
| **E2E/Evals** | Test real AI responses | Slowest | Real AI APIs |

- **Unit tests**: Use mocks, run without network access
- **Integration tests**: May use real providers, skip when APIs unavailable
- **Evals**: Real AI calls, used for quality validation

### Test Isolation

Each test should:
- Set up its own state in `beforeEach`
- Clean up in `afterEach`
- Not depend on other tests' execution order
- Use fresh instances of providers/services

```typescript
describe('provider operations', () => {
  let provider: MemoryProvider

  beforeEach(() => {
    // Fresh provider for each test
    provider = createMemoryProvider()
  })

  afterEach(() => {
    provider.clear()
  })
})
```

## Running Tests

### All Tests

```bash
pnpm test           # Run all tests via Turbo
```

### Unit Tests Only

```bash
pnpm test:unit      # Unit tests (excludes evals/e2e)
```

### With Coverage

```bash
pnpm test:coverage  # Run with coverage reporting
```

### Package-Specific

```bash
# Run tests for a specific package
cd packages/ai-functions
pnpm test

# Run specific test file
pnpm test -- test/generate.test.ts

# Run with pattern matching
pnpm test -- --grep "generateObject"
```

### Eval Tests

Eval tests make real AI calls and validate output quality:

```bash
# Run all eval tests
pnpm test:evals

# Run specific eval suite
MODEL=sonnet pnpm test -- test/evals/primitives.eval.test.ts

# Run evals for specific tiers
EVAL_TIERS=fast,standard pnpm test:evals
```

## Package-Specific Notes

### ai-database

Tests use the in-memory provider by default to avoid filesystem/network dependencies.

```typescript
import { setProvider, createMemoryProvider } from '../src/index.js'

describe('database operations', () => {
  beforeEach(() => {
    // Use memory provider for fast, isolated tests
    setProvider(createMemoryProvider())
  })
})
```

**Key patterns:**
- Mock providers with `createMemoryProvider()`
- Test provider resolution without real database URLs
- Validate interface compliance for custom providers

### ai-functions

Tests can make real AI calls when API credentials are available, but skip gracefully when not.

```typescript
// Skip tests if no API configured
const hasGateway = !!process.env.AI_GATEWAY_URL || !!process.env.ANTHROPIC_API_KEY

describe.skipIf(!hasGateway)('generateObject', () => {
  it('generates a simple object', async () => {
    const { object } = await generateObject({
      model: 'sonnet',
      schema: { greeting: 'A greeting' },
      prompt: 'Say hello',
    })
    expect(object.greeting).toBeDefined()
  })
})
```

**Key patterns:**
- Use `describe.skipIf(!hasGateway)` for tests requiring AI
- Set appropriate timeouts (30-60s for AI calls)
- Validate output structure, not exact content
- Use AI Gateway for cached, reproducible responses

### ai-workflows

Test event handlers and scheduling with fake timers.

```typescript
import { clearEventHandlers } from '../src/on.js'
import { clearScheduleHandlers } from '../src/every.js'

describe('Workflow', () => {
  beforeEach(() => {
    clearEventHandlers()
    clearScheduleHandlers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('triggers schedule handlers', async () => {
    const handler = vi.fn()
    const workflow = Workflow($ => {
      $.every.seconds(1)(handler)
    })

    await workflow.start()
    await vi.advanceTimersByTimeAsync(1000)

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
```

**Key patterns:**
- Clear handlers between tests for isolation
- Use `vi.useFakeTimers()` for schedule testing
- Test event chaining with mock handlers
- Use `createTestContext()` for handler unit tests

## Writing Good Tests

### Descriptive Test Names

Test names should describe the expected behavior:

```typescript
// Good - describes behavior
it('generates list with at least 3 items when asked for 5', async () => {})
it('returns null when record does not exist', async () => {})
it('triggers handler when matching event is sent', async () => {})

// Avoid - vague or implementation-focused
it('works', async () => {})
it('calls the function', async () => {})
it('test 1', async () => {})
```

### Arrange-Act-Assert Pattern

Structure tests clearly with setup, execution, and verification:

```typescript
it('creates user and tracks in stats', async () => {
  // Arrange - set up test data and dependencies
  const provider = createMemoryProvider()
  const userData = { name: 'Test User', email: 'test@example.com' }

  // Act - perform the operation being tested
  await provider.create('User', 'user1', userData)
  const stats = provider.stats()

  // Assert - verify expected outcomes
  expect(stats.entities).toBe(1)
})
```

### Avoid Testing Implementation Details

Test behavior and outcomes, not internal implementation:

```typescript
// Good - tests observable behavior
it('returns empty array when no users exist', async () => {
  const users = await provider.list('User')
  expect(users).toEqual([])
})

// Avoid - tests internal implementation
it('has internal _users Map with 0 entries', () => {
  expect(provider._users.size).toBe(0)  // Don't access internals
})
```

### Test Edge Cases

Cover boundary conditions and error states:

```typescript
describe('email validation', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('rejects email without @', () => {
    expect(isValidEmail('invalid-email')).toBe(false)
  })

  it('handles empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('handles null/undefined', () => {
    expect(isValidEmail(null)).toBe(false)
  })
})
```

## Test Configuration

### Vitest Config

Each package has a `vitest.config.ts` with appropriate settings:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,              // Explicit imports preferred
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 30000,          // Higher for AI calls
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', 'test'],
    },
  },
})
```

### Sequential vs Parallel

- **Default**: Tests run in parallel for speed
- **AI/Database**: Run sequentially to avoid rate limits and conflicts

```typescript
// For tests that need sequential execution
pool: 'forks',
poolOptions: {
  forks: {
    singleFork: true,
  },
},
```

### Environment Variables

Required for certain test suites:

| Variable | Purpose |
|----------|---------|
| `AI_GATEWAY_URL` | Cloudflare AI Gateway URL |
| `AI_GATEWAY_TOKEN` | Gateway authentication |
| `ANTHROPIC_API_KEY` | Direct Anthropic API access |
| `OPENAI_API_KEY` | Direct OpenAI API access |
| `MODEL` | Specific model for eval tests |
| `EVAL_TIERS` | Comma-separated: `fast`, `standard`, `comprehensive` |

## Deterministic AI Testing

AI tests should be **truly deterministic**. Flaky AI tests waste time and erode confidence.

### The Four Principles

1. **AI Gateway Caching**: Route all AI calls through Cloudflare AI Gateway with caching enabled (1 month TTL). Same prompt = same cached response = deterministic results.

2. **Self-Validating Pattern**: Generate content, then verify each item with `is()`:
   ```typescript
   const colors = await list`exactly 5 colors`
   expect(colors).toHaveLength(5)  // Exact count

   for (const color of colors) {
     expect(await is`${color} a color`).toBe(true)  // Self-validation
   }
   ```

3. **Exact Count Validation**: When asking for N items, expect exactly N—no ranges:
   ```typescript
   // ❌ Bad - allows flakiness
   expect(colors.length).toBeGreaterThanOrEqual(3)
   expect(colors.length).toBeLessThanOrEqual(10)

   // ✅ Good - deterministic
   const colors = await list`exactly 5 colors`
   expect(colors).toHaveLength(5)
   ```

4. **Objectively Deterministic Questions**: Use questions with unambiguous answers:
   ```typescript
   // ✅ Objectively true/false
   expect(await is`red a color`).toBe(true)
   expect(await is`JavaScript a programming language`).toBe(true)
   expect(await is`banana a programming language`).toBe(false)
   expect(await is`Paris the capital of France`).toBe(true)

   // ❌ Subjective/ambiguous
   expect(await is`this code good`).toBe(true)  // Subjective
   expect(await is`the weather nice`).toBe(true)  // Depends on context
   ```

### Running Deterministic Tests

```bash
# Run deterministic eval suite
pnpm test -- test/evals/deterministic.eval.test.ts

# With specific model
TEST_MODEL=haiku pnpm test -- test/evals/deterministic.eval.test.ts
```

### Test File: `deterministic.eval.test.ts`

Location: `packages/ai-functions/test/evals/deterministic.eval.test.ts`

This file demonstrates all patterns:
- `is()` with objectively deterministic questions
- `list()` with exact counts and self-validation
- `extract()` from known text (deterministic input)
- Chained validation (generate topic content, verify each item is about topic)

## Eval Test Patterns

Eval tests validate AI output quality across models:

```typescript
const testCases = [
  {
    name: 'correctly identifies positive sentiment',
    prompt: '"I love this!" positive sentiment',
    expected: true,
  },
]

for (const model of models) {
  describe(`[${model.name}]`, () => {
    for (const tc of testCases) {
      it(tc.name, async () => {
        const result = await is(tc.prompt, { model: model.id })
        expect(result).toBe(tc.expected)
      }, AI_TIMEOUT)
    }
  })
}
```

**Best practices for evals:**
- Validate type and structure, allow content flexibility
- Use reasonable assertions (contains keyword, length bounds)
- Set appropriate timeouts for AI calls
- Group by model for clear failure attribution
- **Prefer deterministic patterns** (see above) when possible

## Coverage Expectations

Aim for meaningful coverage, not 100%:

- **Core logic**: 80%+ coverage
- **Edge cases**: All known edge cases tested
- **Error paths**: Test error handling explicitly
- **Integration points**: Verify component interaction

Generate coverage reports:

```bash
pnpm test:coverage
# Reports output to coverage/ directory
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main
- Release branches

CI configuration runs:
1. Type checking (`pnpm typecheck`)
2. Linting (`pnpm lint`)
3. Unit tests (`pnpm test:unit`)
4. Integration tests (with API keys in CI secrets)
