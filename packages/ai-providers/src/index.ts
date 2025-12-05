/**
 * ai-providers - Unified AI Provider Registry
 *
 * Access multiple AI providers via simple string identifiers.
 * Supports Cloudflare AI Gateway for unified routing and auth.
 *
 * @packageDocumentation
 */

export {
  createRegistry,
  getRegistry,
  configureRegistry,
  model,
  embeddingModel,
  DIRECT_PROVIDERS,
  type ProviderId,
  type DirectProvider,
  type ProviderConfig
} from './registry.js'

// Export llm.do WebSocket transport
export {
  LLM,
  getLLM,
  createLLMFetch,
  type LLMConfig,
  type UniversalRequest,
  type UniversalCreated,
  type UniversalStream,
  type UniversalDone,
  type UniversalError,
  type GatewayMessage
} from './llm.do.js'

// Re-export AI SDK types for convenience
export type { Provider, ProviderRegistryProvider } from 'ai'
