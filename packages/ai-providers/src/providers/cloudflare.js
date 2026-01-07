/**
 * Cloudflare Workers AI Provider for embeddings
 *
 * Provides embedding models via Cloudflare Workers AI API.
 * Default model: @cf/baai/bge-m3
 *
 * @packageDocumentation
 */
/**
 * Default Cloudflare embedding model
 */
export const DEFAULT_CF_EMBEDDING_MODEL = '@cf/baai/bge-m3';
/**
 * Get Cloudflare config from environment
 */
function getCloudflareConfig() {
    return {
        accountId: typeof process !== 'undefined' ? process.env?.CLOUDFLARE_ACCOUNT_ID : undefined,
        apiToken: typeof process !== 'undefined' ? process.env?.CLOUDFLARE_API_TOKEN : undefined,
        gateway: typeof process !== 'undefined' ? process.env?.CLOUDFLARE_AI_GATEWAY : undefined
    };
}
/**
 * Cloudflare embedding model implementation (AI SDK v5 compatible)
 */
class CloudflareEmbeddingModel {
    specificationVersion = 'v2';
    modelId;
    provider = 'cloudflare';
    maxEmbeddingsPerCall = 100;
    supportsParallelCalls = true;
    config;
    ai; // Cloudflare AI binding (when running in Workers)
    constructor(modelId = DEFAULT_CF_EMBEDDING_MODEL, config = {}, ai) {
        this.modelId = modelId;
        this.config = { ...getCloudflareConfig(), ...config };
        this.ai = ai;
    }
    async doEmbed(options) {
        const { values, abortSignal, headers } = options;
        // If running in Cloudflare Workers with AI binding
        if (this.ai) {
            return this.embedWithBinding(values);
        }
        // Otherwise use REST API
        return this.embedWithRest(values, abortSignal, headers);
    }
    async embedWithBinding(values) {
        const embeddings = [];
        // Cloudflare AI binding processes one at a time or in batches depending on model
        for (const text of values) {
            const result = await this.ai.run(this.modelId, {
                text
            });
            if (result.data && Array.isArray(result.data) && result.data[0]) {
                embeddings.push(result.data[0]);
            }
        }
        return { embeddings };
    }
    async embedWithRest(values, abortSignal, headers) {
        const { accountId, apiToken, gateway, baseUrl } = this.config;
        if (!accountId || !apiToken) {
            throw new Error('Cloudflare credentials required. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.');
        }
        const url = baseUrl ||
            (gateway
                ? `https://gateway.ai.cloudflare.com/v1/${accountId}/${gateway}/workers-ai/${this.modelId}`
                : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${this.modelId}`);
        const embeddings = [];
        // Process in batches (some models have limits)
        for (const text of values) {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify({ text }),
                signal: abortSignal
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Cloudflare AI error: ${response.status} ${error}`);
            }
            const result = await response.json();
            if (!result.success || !result.result || !result.result.data[0]) {
                throw new Error(`Cloudflare AI error: ${result.errors?.[0]?.message || 'Unknown error'}`);
            }
            embeddings.push(result.result.data[0]);
        }
        return { embeddings };
    }
}
/**
 * Create a Cloudflare Workers AI embedding model
 *
 * @example
 * ```ts
 * // Using REST API (outside Workers)
 * import { cloudflareEmbedding, embed } from 'ai-functions'
 *
 * const model = cloudflareEmbedding('@cf/baai/bge-m3')
 * const { embedding } = await embed({ model, value: 'hello world' })
 *
 * // Using AI binding (inside Workers)
 * const model = cloudflareEmbedding('@cf/baai/bge-m3', {}, env.AI)
 * ```
 */
export function cloudflareEmbedding(modelId = DEFAULT_CF_EMBEDDING_MODEL, config = {}, ai) {
    return new CloudflareEmbeddingModel(modelId, config, ai);
}
/**
 * Cloudflare Workers AI provider
 */
export const cloudflare = {
    /**
     * Create an embedding model
     */
    embedding: cloudflareEmbedding,
    /**
     * Alias for embedding
     */
    textEmbeddingModel: cloudflareEmbedding
};
