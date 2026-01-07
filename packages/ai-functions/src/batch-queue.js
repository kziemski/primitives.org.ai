/**
 * BatchQueue - Deferred execution queue for batch processing
 *
 * Collects AI operations and submits them to provider batch APIs
 * for cost-effective processing (typically 50% discount, 24hr turnaround).
 *
 * @example
 * ```ts
 * // Create a batch queue
 * const batch = createBatch({ provider: 'openai' })
 *
 * // Add items to the batch (these are deferred, not executed)
 * const titles = await list`10 blog post titles about startups`
 * const posts = titles.map(title => batch.add(write`blog post about ${title}`))
 *
 * // Submit the batch - returns job info
 * const job = await batch.submit()
 * console.log(job.id) // batch_abc123
 *
 * // Poll for results or use webhook
 * const results = await batch.wait()
 * ```
 *
 * @packageDocumentation
 */
// ============================================================================
// BatchQueue Implementation
// ============================================================================
/**
 * BatchQueue collects AI operations for deferred batch execution
 */
export class BatchQueue {
    items = [];
    options;
    idCounter = 0;
    submitted = false;
    job = null;
    constructor(options = {}) {
        this.options = {
            provider: 'openai',
            maxItems: 50000, // OpenAI's limit
            autoSubmit: false,
            ...options,
        };
    }
    /**
     * Add an item to the batch queue
     * Returns a placeholder that will be resolved after batch completion
     */
    add(prompt, options) {
        if (this.submitted) {
            throw new Error('Cannot add items to a submitted batch');
        }
        const item = {
            id: options?.customId || `item_${++this.idCounter}`,
            prompt,
            schema: options?.schema,
            options: options?.options,
            metadata: options?.metadata,
            status: 'pending',
        };
        this.items.push(item);
        // Auto-submit if we hit the limit
        if (this.options.autoSubmit && this.items.length >= (this.options.maxItems || 50000)) {
            // Fire and forget - user can await the completion promise
            this.submit().catch(console.error);
        }
        return item;
    }
    /**
     * Get all items in the queue
     */
    getItems() {
        return [...this.items];
    }
    /**
     * Get the number of items in the queue
     */
    get size() {
        return this.items.length;
    }
    /**
     * Check if the batch has been submitted
     */
    get isSubmitted() {
        return this.submitted;
    }
    /**
     * Get the batch job info (after submission)
     */
    getJob() {
        return this.job;
    }
    /**
     * Submit the batch to the provider
     */
    async submit() {
        if (this.submitted) {
            throw new Error('Batch has already been submitted');
        }
        if (this.items.length === 0) {
            throw new Error('Cannot submit empty batch');
        }
        this.submitted = true;
        // Get the appropriate batch adapter
        const adapter = getBatchAdapter(this.options.provider || 'openai');
        // Submit the batch
        const result = await adapter.submit(this.items, this.options);
        this.job = result.job;
        // When completion resolves, update item statuses
        result.completion.then((results) => {
            for (const r of results) {
                const item = this.items.find((i) => i.id === r.id);
                if (item) {
                    item.status = r.status;
                    item.result = r.result;
                    item.error = r.error;
                }
            }
        });
        return result;
    }
    /**
     * Cancel the batch (if supported by provider)
     */
    async cancel() {
        if (!this.job) {
            throw new Error('Batch has not been submitted');
        }
        const adapter = getBatchAdapter(this.options.provider || 'openai');
        await adapter.cancel(this.job.id);
        this.job.status = 'cancelling';
    }
    /**
     * Get the current status of the batch
     */
    async getStatus() {
        if (!this.job) {
            throw new Error('Batch has not been submitted');
        }
        const adapter = getBatchAdapter(this.options.provider || 'openai');
        this.job = await adapter.getStatus(this.job.id);
        return this.job;
    }
    /**
     * Wait for the batch to complete and return results
     */
    async wait(pollInterval = 5000) {
        if (!this.job) {
            throw new Error('Batch has not been submitted');
        }
        const adapter = getBatchAdapter(this.options.provider || 'openai');
        return adapter.waitForCompletion(this.job.id, pollInterval);
    }
}
// Adapter registry
const adapters = {
    openai: null,
    anthropic: null,
    google: null,
    bedrock: null,
    cloudflare: null,
};
// Flex adapter registry (only OpenAI and Bedrock support flex)
const flexAdapters = {
    openai: null,
    anthropic: null,
    google: null,
    bedrock: null,
    cloudflare: null,
};
/**
 * Register a batch adapter for a provider
 */
export function registerBatchAdapter(provider, adapter) {
    adapters[provider] = adapter;
}
/**
 * Register a flex adapter for a provider
 */
export function registerFlexAdapter(provider, adapter) {
    flexAdapters[provider] = adapter;
}
/**
 * Get the batch adapter for a provider
 */
export function getBatchAdapter(provider) {
    const adapter = adapters[provider];
    if (!adapter) {
        throw new Error(`No batch adapter registered for provider: ${provider}. ` +
            `Import the adapter: import 'ai-functions/batch/${provider}'`);
    }
    return adapter;
}
/**
 * Get the flex adapter for a provider
 */
export function getFlexAdapter(provider) {
    const adapter = flexAdapters[provider];
    if (!adapter) {
        throw new Error(`No flex adapter registered for provider: ${provider}. ` +
            `Flex processing is only available for OpenAI and AWS Bedrock.`);
    }
    return adapter;
}
/**
 * Check if flex is available for a provider
 */
export function hasFlexAdapter(provider) {
    return flexAdapters[provider] !== null;
}
// ============================================================================
// Factory Functions
// ============================================================================
/**
 * Create a new batch queue
 *
 * @example
 * ```ts
 * const batch = createBatch({ provider: 'openai' })
 * batch.add('Write a poem about cats')
 * batch.add('Write a poem about dogs')
 * const { job } = await batch.submit()
 * const results = await batch.wait()
 * ```
 */
export function createBatch(options) {
    return new BatchQueue(options);
}
/**
 * Execute operations in batch mode
 *
 * @example
 * ```ts
 * const results = await withBatch(async (batch) => {
 *   const titles = ['TypeScript', 'React', 'Next.js']
 *   return titles.map(title => batch.add(`Write a blog post about ${title}`))
 * })
 * ```
 */
export async function withBatch(fn, options) {
    const batch = createBatch(options);
    const items = await fn(batch);
    if (batch.size === 0) {
        return [];
    }
    const { completion } = await batch.submit();
    return completion;
}
// ============================================================================
// Deferred Execution Support
// ============================================================================
/** Symbol to mark an AIPromise as batched/deferred */
export const BATCH_MODE_SYMBOL = Symbol.for('ai-batch-mode');
/**
 * Check if we're in batch mode
 */
export function isBatchMode(options) {
    return !!options?.batch;
}
/**
 * Add an operation to the batch queue instead of executing immediately
 */
export function deferToBatch(batch, prompt, schema, options) {
    return batch.add(prompt, {
        schema,
        options,
        customId: options?.customId,
    });
}
