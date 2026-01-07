/**
 * In-Memory Batch Adapter for Testing
 *
 * Simulates batch processing locally for testing purposes.
 * Executes requests immediately (or with configurable delay).
 *
 * @packageDocumentation
 */
import { registerBatchAdapter, } from '../batch-queue.js';
import { generateObject, generateText } from '../generate.js';
// ============================================================================
// Storage
// ============================================================================
const batches = new Map();
let batchCounter = 0;
let memoryOptions = {};
/**
 * Configure the memory adapter
 */
export function configureMemoryAdapter(options) {
    memoryOptions = options;
}
/**
 * Clear all stored batches (for testing)
 */
export function clearBatches() {
    batches.clear();
    batchCounter = 0;
}
/**
 * Get all stored batches (for testing)
 */
export function getBatches() {
    return batches;
}
// ============================================================================
// Memory Batch Adapter
// ============================================================================
const memoryAdapter = {
    async submit(items, options) {
        const batchId = `batch_memory_${++batchCounter}`;
        const batch = {
            id: batchId,
            items: [...items],
            options,
            status: 'pending',
            results: [],
            createdAt: new Date(),
        };
        batches.set(batchId, batch);
        // Start processing asynchronously
        const completion = processMemoryBatch(batch);
        const job = {
            id: batchId,
            provider: 'openai', // Simulating OpenAI
            status: 'pending',
            totalItems: items.length,
            completedItems: 0,
            failedItems: 0,
            createdAt: batch.createdAt,
            webhookUrl: options.webhookUrl,
        };
        return { job, completion };
    },
    async getStatus(batchId) {
        const batch = batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch not found: ${batchId}`);
        }
        const completedItems = batch.results.filter((r) => r.status === 'completed').length;
        const failedItems = batch.results.filter((r) => r.status === 'failed').length;
        return {
            id: batch.id,
            provider: 'openai',
            status: batch.status === 'completed' ? 'completed' : batch.status === 'failed' ? 'failed' : 'in_progress',
            totalItems: batch.items.length,
            completedItems,
            failedItems,
            createdAt: batch.createdAt,
            completedAt: batch.completedAt,
        };
    },
    async cancel(batchId) {
        const batch = batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch not found: ${batchId}`);
        }
        batch.status = 'failed';
    },
    async getResults(batchId) {
        const batch = batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch not found: ${batchId}`);
        }
        return batch.results;
    },
    async waitForCompletion(batchId) {
        const batch = batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch not found: ${batchId}`);
        }
        // Wait for completion
        while (batch.status !== 'completed' && batch.status !== 'failed') {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return batch.results;
    },
};
// ============================================================================
// Processing
// ============================================================================
async function processMemoryBatch(batch) {
    batch.status = 'in_progress';
    // Optional delay
    if (memoryOptions.delay) {
        await new Promise((resolve) => setTimeout(resolve, memoryOptions.delay));
    }
    const results = [];
    for (const item of batch.items) {
        try {
            // Simulate failure
            if (memoryOptions.failureRate && Math.random() < memoryOptions.failureRate) {
                throw new Error('Simulated failure');
            }
            let result;
            if (memoryOptions.handler) {
                // Use custom handler
                result = await memoryOptions.handler(item);
            }
            else if (item.schema) {
                // Generate structured output
                const response = await generateObject({
                    model: batch.options.model || 'sonnet',
                    schema: item.schema,
                    prompt: item.prompt,
                    system: item.options?.system,
                    temperature: item.options?.temperature,
                    maxTokens: item.options?.maxTokens,
                });
                result = response.object;
            }
            else {
                // Generate text
                const response = await generateText({
                    model: batch.options.model || 'sonnet',
                    prompt: item.prompt,
                    system: item.options?.system,
                    temperature: item.options?.temperature,
                    maxTokens: item.options?.maxTokens,
                });
                result = response.text;
            }
            results.push({
                id: item.id,
                customId: item.id,
                status: 'completed',
                result,
                usage: {
                    promptTokens: 100,
                    completionTokens: 200,
                    totalTokens: 300,
                },
            });
        }
        catch (error) {
            results.push({
                id: item.id,
                customId: item.id,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    batch.results = results;
    batch.status = results.every((r) => r.status === 'completed') ? 'completed' : 'failed';
    batch.completedAt = new Date();
    return results;
}
// ============================================================================
// Register Adapter
// ============================================================================
registerBatchAdapter('openai', memoryAdapter);
registerBatchAdapter('anthropic', memoryAdapter);
registerBatchAdapter('google', memoryAdapter);
registerBatchAdapter('bedrock', memoryAdapter);
registerBatchAdapter('cloudflare', memoryAdapter);
export { memoryAdapter };
