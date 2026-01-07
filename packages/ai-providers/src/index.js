/**
 * ai-providers - Unified AI Provider Registry
 *
 * Access multiple AI providers via simple string identifiers.
 * Supports Cloudflare AI Gateway for unified routing and auth.
 *
 * @packageDocumentation
 */
export { createRegistry, getRegistry, configureRegistry, model, embeddingModel, DIRECT_PROVIDERS } from './registry.js';
// Export llm.do WebSocket transport
export { LLM, getLLM, createLLMFetch } from './llm.do.js';
