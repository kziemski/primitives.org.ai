/**
 * Execution Queue - Manages execution priority and batching
 *
 * The queue decides WHEN to execute based on priority, concurrency, and batch windows.
 * Operations can be executed immediately, queued, or deferred to batch processing.
 *
 * @packageDocumentation
 */
import { Semaphore } from './memory-provider.js';
import { setBatchScheduler, } from './durable-promise.js';
// =============================================================================
// ExecutionQueue Class
// =============================================================================
/**
 * Manages execution of DurablePromises with priority-based scheduling
 *
 * @example
 * ```ts
 * const queue = new ExecutionQueue({
 *   priority: 'standard',
 *   concurrency: { standard: 10, batch: 1000 },
 *   batchWindow: 60000, // 1 minute
 * })
 *
 * // Register batch providers
 * queue.registerProvider(openaiProvider)
 * queue.registerProvider(claudeProvider)
 *
 * // Queue operations
 * queue.enqueue(durablePromise)
 *
 * // Flush batch at end of workflow
 * await queue.flush()
 * ```
 */
export class ExecutionQueue {
    semaphores;
    queues;
    providers = new Map();
    options;
    batchTimer = null;
    completedCount = 0;
    failedCount = 0;
    isProcessing = false;
    constructor(options = {}) {
        this.options = {
            priority: options.priority ?? 'standard',
            concurrency: {
                priority: options.concurrency?.priority ?? 50,
                standard: options.concurrency?.standard ?? 20,
                flex: options.concurrency?.flex ?? 10,
                batch: options.concurrency?.batch ?? 1000,
            },
            batchWindow: options.batchWindow ?? 60000, // 1 minute default
            maxBatchSize: options.maxBatchSize ?? 10000,
            flushOnExit: options.flushOnExit ?? true,
        };
        // Initialize semaphores for each priority tier
        this.semaphores = {
            priority: new Semaphore(this.options.concurrency.priority),
            standard: new Semaphore(this.options.concurrency.standard),
            flex: new Semaphore(this.options.concurrency.flex),
            batch: new Semaphore(this.options.concurrency.batch),
        };
        // Initialize queues
        this.queues = {
            priority: [],
            standard: [],
            flex: [],
            batch: [],
        };
        // Register as global batch scheduler
        setBatchScheduler(this);
        // Setup exit handler
        if (this.options.flushOnExit && typeof process !== 'undefined') {
            const exitHandler = async () => {
                await this.flush();
            };
            process.on('beforeExit', exitHandler);
            process.on('SIGINT', async () => {
                await exitHandler();
                process.exit(0);
            });
            process.on('SIGTERM', async () => {
                await exitHandler();
                process.exit(0);
            });
        }
    }
    // ===========================================================================
    // Provider Management
    // ===========================================================================
    /**
     * Register a batch provider
     */
    registerProvider(provider) {
        this.providers.set(provider.name, provider);
    }
    /**
     * Get a registered provider
     */
    getProvider(name) {
        return this.providers.get(name);
    }
    /**
     * List registered providers
     */
    listProviders() {
        return Array.from(this.providers.values());
    }
    // ===========================================================================
    // Queue Operations
    // ===========================================================================
    /**
     * Add a promise to the execution queue
     */
    enqueue(promise) {
        const item = {
            promise,
            priority: promise.priority,
            enqueuedAt: new Date(),
        };
        this.queues[promise.priority].push(item);
        // For batch, start the window timer
        if (promise.priority === 'batch') {
            this.startBatchTimer();
            // Check for auto-flush on size
            if (this.queues.batch.length >= this.options.maxBatchSize) {
                this.flush();
            }
        }
        else {
            // For other priorities, process immediately
            this.processQueue(promise.priority);
        }
    }
    startBatchTimer() {
        if (this.batchTimer)
            return;
        this.batchTimer = setTimeout(async () => {
            this.batchTimer = null;
            await this.flush();
        }, this.options.batchWindow);
    }
    async processQueue(priority) {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        const queue = this.queues[priority];
        const semaphore = this.semaphores[priority];
        try {
            while (queue.length > 0) {
                const item = queue.shift();
                if (!item)
                    break;
                // Run with concurrency control
                // The promise will execute itself; we just track completion
                semaphore.run(async () => {
                    try {
                        await item.promise;
                        this.completedCount++;
                    }
                    catch {
                        this.failedCount++;
                    }
                });
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    // ===========================================================================
    // Batch Operations
    // ===========================================================================
    /**
     * Flush all pending batch operations
     */
    async flush() {
        // Clear the timer
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        const batchItems = [...this.queues.batch];
        this.queues.batch = [];
        if (batchItems.length === 0)
            return;
        // Group by method/provider
        const groups = this.groupByProvider(batchItems);
        // Submit each group to its provider
        const submissions = await Promise.all(Array.from(groups.entries()).map(async ([providerName, items]) => {
            const provider = this.providers.get(providerName);
            if (!provider) {
                // Fallback to standard execution if no provider
                return this.executeFallback(items);
            }
            return this.submitToBatchProvider(provider, items);
        }));
        // Wait for all batch results
        await Promise.all(submissions.map((submission) => {
            if (submission && 'batchId' in submission) {
                return this.pollBatchCompletion(submission);
            }
            return Promise.resolve();
        }));
    }
    groupByProvider(items) {
        const groups = new Map();
        for (const item of items) {
            // Determine provider from method prefix
            const providerName = this.getProviderFromMethod(item.promise.method);
            const existing = groups.get(providerName) || [];
            existing.push(item);
            groups.set(providerName, existing);
        }
        return groups;
    }
    getProviderFromMethod(method) {
        // Extract provider from method like 'openai.chat' -> 'openai'
        const parts = method.split('.');
        return parts[0] || 'default';
    }
    async submitToBatchProvider(provider, items) {
        if (!provider.supportsBatch) {
            await this.executeFallback(items);
            return null;
        }
        const requests = items.map((item) => ({
            customId: crypto.randomUUID(),
            actionId: item.promise.actionId,
            method: item.promise.method,
            params: {}, // Would need to extract from promise
        }));
        try {
            return await provider.submitBatch(requests);
        }
        catch (error) {
            console.error(`Batch submission failed for ${provider.name}:`, error);
            await this.executeFallback(items);
            return null;
        }
    }
    async executeFallback(items) {
        // Execute as standard priority
        for (const item of items) {
            this.queues.standard.push(item);
        }
        await this.processQueue('standard');
    }
    async pollBatchCompletion(submission) {
        // This would be implemented by the specific provider
        // For now, just log
        console.log(`Batch ${submission.batchId} submitted with ${submission.count} requests`);
        // In production, this would poll getBatchStatus and stream results
    }
    // ===========================================================================
    // Configuration
    // ===========================================================================
    /**
     * Set the default priority for new operations
     */
    setPriority(priority) {
        this.options.priority = priority;
    }
    /**
     * Set concurrency limit for a priority tier
     */
    setConcurrency(priority, limit) {
        this.options.concurrency[priority] = limit;
        // Re-create the semaphore (existing operations continue with old limit)
        this.semaphores[priority] = new Semaphore(limit);
    }
    /**
     * Set the batch window (how long to accumulate before auto-flush)
     */
    setBatchWindow(ms) {
        this.options.batchWindow = ms;
    }
    /**
     * Set max batch size before auto-flush
     */
    setMaxBatchSize(size) {
        this.options.maxBatchSize = size;
    }
    // ===========================================================================
    // Stats
    // ===========================================================================
    /**
     * Get count of pending operations
     */
    get pending() {
        return (this.queues.priority.length +
            this.queues.standard.length +
            this.queues.flex.length +
            this.queues.batch.length);
    }
    /**
     * Get count of active operations
     */
    get active() {
        return (this.semaphores.priority.active +
            this.semaphores.standard.active +
            this.semaphores.flex.active +
            this.semaphores.batch.active);
    }
    /**
     * Get count of completed operations
     */
    get completed() {
        return this.completedCount;
    }
    /**
     * Get full queue statistics
     */
    getStats() {
        return {
            byPriority: {
                priority: {
                    pending: this.queues.priority.length,
                    active: this.semaphores.priority.active,
                    completed: 0, // Would need per-tier tracking
                },
                standard: {
                    pending: this.queues.standard.length,
                    active: this.semaphores.standard.active,
                    completed: 0,
                },
                flex: {
                    pending: this.queues.flex.length,
                    active: this.semaphores.flex.active,
                    completed: 0,
                },
                batch: {
                    pending: this.queues.batch.length,
                    active: this.semaphores.batch.active,
                    completed: 0,
                },
            },
            totals: {
                pending: this.pending,
                active: this.active,
                completed: this.completedCount,
                failed: this.failedCount,
            },
            batch: {
                size: this.queues.batch.length,
                nextFlush: this.batchTimer
                    ? new Date(Date.now() + this.options.batchWindow)
                    : null,
            },
        };
    }
    // ===========================================================================
    // Cleanup
    // ===========================================================================
    /**
     * Stop the queue and clear all pending operations
     */
    destroy() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        this.queues.priority = [];
        this.queues.standard = [];
        this.queues.flex = [];
        this.queues.batch = [];
        setBatchScheduler(null);
    }
}
// =============================================================================
// Factory
// =============================================================================
/**
 * Create an execution queue
 */
export function createExecutionQueue(options) {
    return new ExecutionQueue(options);
}
// =============================================================================
// Default Instance
// =============================================================================
let defaultQueue = null;
/**
 * Get or create the default execution queue
 */
export function getDefaultQueue() {
    if (!defaultQueue) {
        defaultQueue = createExecutionQueue();
    }
    return defaultQueue;
}
/**
 * Set the default execution queue
 */
export function setDefaultQueue(queue) {
    defaultQueue = queue;
}
