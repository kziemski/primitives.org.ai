/**
 * Model listing and resolution
 */
import { createRequire } from 'module';
import { ALIASES } from './aliases.js';
const require = createRequire(import.meta.url);
// Load models from JSON
let modelsCache = null;
function loadModels() {
    if (modelsCache)
        return modelsCache;
    try {
        modelsCache = require('../data/models.json');
        return modelsCache;
    }
    catch {
        return [];
    }
}
/**
 * List all available models
 */
export function list() {
    return loadModels();
}
/**
 * Get a model by exact ID
 */
export function get(id) {
    return loadModels().find(m => m.id === id);
}
/**
 * Search models by query string
 * Searches in id and name fields
 */
export function search(query) {
    const q = query.toLowerCase();
    return loadModels().filter(m => m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q));
}
/**
 * Resolve a model alias or partial name to a full model ID
 *
 * Resolution order:
 * 1. Check aliases (e.g., 'opus' -> 'anthropic/claude-opus-4.5')
 * 2. Check if it's already a full ID (contains '/')
 * 3. Search for first matching model
 *
 * @example
 * resolve('opus')           // 'anthropic/claude-opus-4.5'
 * resolve('gpt-4o')         // 'openai/gpt-4o'
 * resolve('claude-sonnet')  // 'anthropic/claude-sonnet-4.5'
 * resolve('llama-70b')      // 'meta-llama/llama-3.3-70b-instruct'
 */
export function resolve(input) {
    const normalized = input.toLowerCase().trim();
    // Check aliases first
    if (ALIASES[normalized]) {
        return ALIASES[normalized];
    }
    // Already a full ID with provider prefix
    if (input.includes('/')) {
        // Verify it exists or return as-is
        const model = get(input);
        return model?.id || input;
    }
    // Search for matching model
    const matches = search(normalized);
    const firstMatch = matches[0];
    if (firstMatch) {
        return firstMatch.id;
    }
    // Return as-is if nothing found
    return input;
}
/**
 * Providers that support direct SDK access (not via OpenRouter)
 * These providers have special capabilities like MCP, extended thinking, etc.
 */
export const DIRECT_PROVIDERS = ['openai', 'anthropic', 'google'];
/**
 * Resolve a model alias and get full routing information
 *
 * @example
 * const info = resolveWithProvider('opus')
 * // {
 * //   id: 'anthropic/claude-opus-4.5',
 * //   provider: 'anthropic',
 * //   providerModelId: 'claude-opus-4-5-20251101',
 * //   supportsDirectRouting: true,
 * //   model: { ... }
 * // }
 */
export function resolveWithProvider(input) {
    const id = resolve(input);
    const model = get(id);
    // Extract provider from ID (e.g., 'anthropic' from 'anthropic/claude-opus-4.5')
    const slashIndex = id.indexOf('/');
    const provider = slashIndex > 0 ? id.substring(0, slashIndex) : 'unknown';
    const supportsDirectRouting = DIRECT_PROVIDERS.includes(provider);
    return {
        id,
        provider,
        providerModelId: model?.provider_model_id,
        supportsDirectRouting,
        model
    };
}
