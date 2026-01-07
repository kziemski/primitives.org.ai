/**
 * AI Generation functions with automatic model resolution and routing
 *
 * Wraps AI SDK generateObject and generateText with smart model routing:
 * - Simple aliases: 'opus', 'sonnet', 'gpt-4o'
 * - Full IDs: 'anthropic/claude-sonnet-4.5'
 * - Auto-routes to native SDKs for openai/anthropic/google
 *
 * @packageDocumentation
 */
import { generateObject as sdkGenerateObject, generateText as sdkGenerateText, streamObject as sdkStreamObject, streamText as sdkStreamText } from 'ai';
import { schema as convertSchema } from './schema.js';
/**
 * Resolve model string to LanguageModel instance
 * Uses ai-providers for model routing with Cloudflare AI Gateway support
 */
async function resolveModel(modelArg) {
    // Already a LanguageModel instance
    if (typeof modelArg !== 'string') {
        return modelArg;
    }
    // Use ai-providers for model resolution
    const { model } = await import('ai-providers');
    return model(modelArg);
}
/**
 * Check if value is a Zod schema
 */
function isZodSchema(value) {
    return value !== null &&
        typeof value === 'object' &&
        '_def' in value &&
        'parse' in value;
}
/**
 * Convert schema to Zod if needed
 */
function resolveSchema(schemaArg) {
    if (isZodSchema(schemaArg)) {
        return schemaArg;
    }
    return convertSchema(schemaArg);
}
/**
 * Generate a typed object from a prompt using AI
 *
 * Automatically resolves model aliases and routes to the best provider.
 * Supports both Zod schemas and simplified schema syntax.
 *
 * @example
 * ```ts
 * import { generateObject } from 'ai-functions'
 *
 * // Simplified schema syntax
 * const { object } = await generateObject({
 *   model: 'sonnet',
 *   schema: {
 *     recipe: {
 *       name: 'What is the recipe name?',
 *       type: 'food | drink | dessert',
 *       ingredients: ['List all ingredients'],
 *       steps: ['List all cooking steps'],
 *     },
 *   },
 *   prompt: 'Generate a lasagna recipe.',
 * })
 *
 * // Zod schema also works
 * import { z } from 'zod'
 * const { object } = await generateObject({
 *   model: 'sonnet',
 *   schema: z.object({
 *     name: z.string(),
 *     ingredients: z.array(z.string()),
 *   }),
 *   prompt: 'Generate a lasagna recipe.',
 * })
 * ```
 */
export async function generateObject(options) {
    const model = await resolveModel(options.model);
    const schema = resolveSchema(options.schema);
    // Use 'as any' to handle AI SDK v4 API variance
    return sdkGenerateObject({
        ...options,
        model,
        schema,
        output: 'object'
    });
}
/**
 * Generate text from a prompt using AI
 *
 * Automatically resolves model aliases and routes to the best provider.
 *
 * @example
 * ```ts
 * import { generateText } from 'ai-functions'
 *
 * const { text } = await generateText({
 *   model: 'opus',  // → anthropic/claude-opus-4.5
 *   prompt: 'Write a haiku about programming.',
 * })
 *
 * // With tools
 * const { text, toolResults } = await generateText({
 *   model: 'gpt-4o',  // → openai/gpt-4o
 *   prompt: 'What is the weather in San Francisco?',
 *   tools: { ... },
 *   maxSteps: 5,
 * })
 * ```
 */
export async function generateText(options) {
    const model = await resolveModel(options.model);
    return sdkGenerateText({
        ...options,
        model
    });
}
/**
 * Stream a typed object from a prompt using AI
 *
 * @example
 * ```ts
 * import { streamObject } from 'ai-functions'
 *
 * const { partialObjectStream } = streamObject({
 *   model: 'sonnet',
 *   schema: { story: 'Write a creative story' },
 *   prompt: 'Write a short story.',
 * })
 *
 * for await (const partial of partialObjectStream) {
 *   console.log(partial.story)
 * }
 * ```
 */
export async function streamObject(options) {
    const model = await resolveModel(options.model);
    const schema = resolveSchema(options.schema);
    // Use 'as any' to handle AI SDK API variance
    return sdkStreamObject({
        ...options,
        model,
        schema,
        output: 'object'
    });
}
/**
 * Stream text from a prompt using AI
 *
 * @example
 * ```ts
 * import { streamText } from 'ai-functions'
 *
 * const { textStream } = streamText({
 *   model: 'gemini',  // → google/gemini-2.5-flash
 *   prompt: 'Explain quantum computing.',
 * })
 *
 * for await (const chunk of textStream) {
 *   process.stdout.write(chunk)
 * }
 * ```
 */
export async function streamText(options) {
    const model = await resolveModel(options.model);
    return sdkStreamText({
        ...options,
        model
    });
}
