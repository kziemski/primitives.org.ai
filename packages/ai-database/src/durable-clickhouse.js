/**
 * ClickHouse-backed Durable Promise Provider
 *
 * Uses @mdxdb/clickhouse as the persistence layer for DurablePromise.
 * Provides full durability, crash recovery, and observability.
 *
 * @packageDocumentation
 */
import { DurablePromise, getCurrentContext, setBatchScheduler } from './durable-promise.js';
import { Semaphore } from './memory-provider.js';
/**
 * Priority tier to numeric priority mapping
 * Lower number = higher priority
 */
const PRIORITY_MAP = {
    priority: 1,
    standard: 5,
    flex: 7,
    batch: 9,
};
/**
 * Numeric priority to tier mapping
 */
const PRIORITY_REVERSE = {
    1: 'priority',
    5: 'standard',
    7: 'flex',
    9: 'batch',
};
// =============================================================================
// ClickHouse Durable Provider
// =============================================================================
/**
 * ClickHouse-backed provider for durable promises
 *
 * @example
 * ```ts
 * import { createClickHouseDatabase } from '@mdxdb/clickhouse'
 * import { ClickHouseDurableProvider } from 'ai-database'
 *
 * const db = await createClickHouseDatabase({ url: 'http://localhost:8123' })
 * const provider = new ClickHouseDurableProvider({
 *   executor: db.getExecutor(),
 *   namespace: 'myapp.example.com',
 * })
 *
 * // Use context for automatic persistence
 * await provider.withContext({ priority: 'batch' }, async () => {
 *   const result = await ai.generate({ prompt: 'Hello' })
 * })
 *
 * // Flush batched operations
 * await provider.flush()
 * ```
 */
export class ClickHouseDurableProvider {
    executor;
    namespace;
    semaphores;
    config;
    // Batch queue
    batchQueue = new Map();
    batchTimer = null;
    // Tracking
    pendingCount = 0;
    activeCount = 0;
    completedCount = 0;
    failedCount = 0;
    constructor(config) {
        this.executor = config.executor;
        this.namespace = config.namespace ?? 'default';
        this.config = {
            namespace: this.namespace,
            concurrency: {
                priority: config.concurrency?.priority ?? 50,
                standard: config.concurrency?.standard ?? 20,
                flex: config.concurrency?.flex ?? 10,
                batch: config.concurrency?.batch ?? 1000,
            },
            batchWindow: config.batchWindow ?? 60000,
            maxBatchSize: config.maxBatchSize ?? 10000,
            pollInterval: config.pollInterval ?? 1000,
            autoRecover: config.autoRecover ?? true,
        };
        // Initialize semaphores
        this.semaphores = {
            priority: new Semaphore(this.config.concurrency.priority),
            standard: new Semaphore(this.config.concurrency.standard),
            flex: new Semaphore(this.config.concurrency.flex),
            batch: new Semaphore(this.config.concurrency.batch),
        };
        // Register as global batch scheduler
        setBatchScheduler(this);
        // Auto-recover on init
        if (this.config.autoRecover) {
            this.recover().catch(console.error);
        }
    }
    // ===========================================================================
    // Action Creation
    // ===========================================================================
    /**
     * Create an action in ClickHouse
     */
    async createAction(options) {
        const now = new Date().toISOString();
        const verb = this.parseVerb(options.method);
        const action = {
            id: options.id,
            ns: this.namespace,
            actor: options.actor ?? getCurrentContext()?.actor ?? 'system',
            act: verb,
            action: `${verb}s`,
            activity: `${verb}ing`,
            object: options.method,
            objectData: {
                method: options.method,
                args: options.args,
            },
            status: 'pending',
            progress: 0,
            total: 1,
            result: {},
            error: '',
            data: {},
            meta: options.meta ?? {},
            priority: PRIORITY_MAP[options.priority],
            batch: '',
            batchIndex: 0,
            batchTotal: 0,
            dependencies: options.dependsOn ?? [],
            scheduledAt: options.deferUntil?.toISOString() ?? null,
            startedAt: null,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
        };
        await this.executor.insert('Actions', [action]);
        this.pendingCount++;
        return action;
    }
    /**
     * Update action status
     */
    async updateAction(id, updates) {
        const now = new Date().toISOString();
        // Get existing action
        const rows = await this.executor.query(`SELECT * FROM Actions FINAL WHERE id = '${this.escapeString(id)}' AND ns = '${this.namespace}' ORDER BY updatedAt DESC LIMIT 1`);
        if (rows.length === 0) {
            throw new Error(`Action not found: ${id}`);
        }
        const existing = rows[0];
        // Track status changes
        if (updates.status && updates.status !== existing.status) {
            if (existing.status === 'pending')
                this.pendingCount--;
            if (existing.status === 'active')
                this.activeCount--;
            if (updates.status === 'active')
                this.activeCount++;
            if (updates.status === 'completed')
                this.completedCount++;
            if (updates.status === 'failed')
                this.failedCount++;
        }
        // Insert new row with updates (ReplacingMergeTree will handle dedup)
        await this.executor.insert('Actions', [{
                ...existing,
                ...updates,
                updatedAt: now,
            }]);
    }
    /**
     * Get action by ID
     */
    async getAction(id) {
        const rows = await this.executor.query(`SELECT * FROM Actions FINAL WHERE id = '${this.escapeString(id)}' AND ns = '${this.namespace}' ORDER BY updatedAt DESC LIMIT 1`);
        return rows[0] ?? null;
    }
    /**
     * List actions by status
     */
    async listActions(options = {}) {
        const conditions = [`ns = '${this.namespace}'`];
        if (options.status) {
            if (Array.isArray(options.status)) {
                const statuses = options.status.map(s => `'${s}'`).join(', ');
                conditions.push(`status IN (${statuses})`);
            }
            else {
                conditions.push(`status = '${options.status}'`);
            }
        }
        if (options.priority) {
            conditions.push(`priority = ${PRIORITY_MAP[options.priority]}`);
        }
        const limit = options.limit ? `LIMIT ${options.limit}` : '';
        return this.executor.query(`SELECT * FROM Actions FINAL WHERE ${conditions.join(' AND ')} ORDER BY createdAt ASC ${limit}`);
    }
    // ===========================================================================
    // Batch Scheduler Interface
    // ===========================================================================
    /**
     * Add a promise to the batch queue
     */
    enqueue(promise) {
        this.batchQueue.set(promise.actionId, promise);
        this.startBatchTimer();
        if (this.batchQueue.size >= this.config.maxBatchSize) {
            this.flush();
        }
    }
    /**
     * Get pending count
     */
    get pending() {
        return this.batchQueue.size + this.pendingCount;
    }
    /**
     * Flush all pending batch operations
     */
    async flush() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        const promises = Array.from(this.batchQueue.values());
        this.batchQueue.clear();
        if (promises.length === 0)
            return;
        // Group by method prefix (provider)
        const groups = new Map();
        for (const promise of promises) {
            const provider = promise.method.split('.')[0] ?? 'default';
            const existing = groups.get(provider) ?? [];
            existing.push(promise);
            groups.set(provider, existing);
        }
        // Update batch metadata in ClickHouse
        for (const [provider, batch] of groups) {
            const batchId = crypto.randomUUID();
            for (let i = 0; i < batch.length; i++) {
                await this.executor.insert('Actions', [{
                        id: batch[i].actionId,
                        ns: this.namespace,
                        batch: batchId,
                        batchIndex: i,
                        batchTotal: batch.length,
                        updatedAt: new Date().toISOString(),
                    }]);
            }
            console.log(`Batch ${batchId}: ${batch.length} ${provider} operations queued`);
        }
        // Execute non-batch immediately with concurrency control
        await Promise.all(promises.map(async (promise) => {
            await this.semaphores.batch.run(async () => {
                try {
                    await promise;
                }
                catch {
                    // Error is handled by the promise itself
                }
            });
        }));
    }
    startBatchTimer() {
        if (this.batchTimer)
            return;
        this.batchTimer = setTimeout(async () => {
            this.batchTimer = null;
            await this.flush();
        }, this.config.batchWindow);
    }
    // ===========================================================================
    // Recovery
    // ===========================================================================
    /**
     * Recover pending/active actions from ClickHouse after crash
     */
    async recover() {
        const actions = await this.listActions({
            status: ['pending', 'active'],
        });
        console.log(`Recovering ${actions.length} actions from ClickHouse`);
        let recovered = 0;
        for (const action of actions) {
            // Mark active as failed (we don't know if it completed)
            if (action.status === 'active') {
                await this.updateAction(action.id, {
                    status: 'failed',
                    error: 'Recovered after crash - execution interrupted',
                    completedAt: new Date().toISOString(),
                });
                recovered++;
            }
            // Pending actions can be retried
            else if (action.status === 'pending') {
                this.pendingCount++;
            }
        }
        return recovered;
    }
    /**
     * Retry failed actions
     */
    async retryFailed(filter) {
        const conditions = [
            `ns = '${this.namespace}'`,
            `status = 'failed'`,
        ];
        if (filter?.method) {
            conditions.push(`object = '${this.escapeString(filter.method)}'`);
        }
        if (filter?.since) {
            conditions.push(`completedAt > '${filter.since.toISOString()}'`);
        }
        const failed = await this.executor.query(`SELECT * FROM Actions FINAL WHERE ${conditions.join(' AND ')}`);
        for (const action of failed) {
            await this.updateAction(action.id, {
                status: 'pending',
                error: '',
                completedAt: null,
            });
        }
        return failed.length;
    }
    // ===========================================================================
    // Context
    // ===========================================================================
    /**
     * Create a DurablePromise with ClickHouse persistence
     */
    createPromise(options) {
        // The provider will be used via context
        return new DurablePromise({
            ...options,
            // Inject ourselves as the context provider
        });
    }
    // ===========================================================================
    // Stats
    // ===========================================================================
    /**
     * Get current statistics
     */
    async getStats() {
        // Query ClickHouse for accurate counts
        const statusCounts = await this.executor.query(`SELECT status, priority, count() as count FROM Actions FINAL WHERE ns = '${this.namespace}' GROUP BY status, priority`);
        const byPriority = {
            priority: { pending: 0, active: 0, completed: 0 },
            standard: { pending: 0, active: 0, completed: 0 },
            flex: { pending: 0, active: 0, completed: 0 },
            batch: { pending: 0, active: 0, completed: 0 },
        };
        let pending = 0;
        let active = 0;
        let completed = 0;
        let failed = 0;
        for (const row of statusCounts) {
            const count = parseInt(row.count, 10);
            const tier = PRIORITY_REVERSE[row.priority] ?? 'standard';
            if (row.status === 'pending') {
                pending += count;
                byPriority[tier].pending += count;
            }
            else if (row.status === 'active') {
                active += count;
                byPriority[tier].active += count;
            }
            else if (row.status === 'completed') {
                completed += count;
                byPriority[tier].completed += count;
            }
            else if (row.status === 'failed') {
                failed += count;
            }
        }
        return {
            pending,
            active,
            completed,
            failed,
            byPriority,
            batchQueue: this.batchQueue.size,
        };
    }
    // ===========================================================================
    // Helpers
    // ===========================================================================
    parseVerb(method) {
        const parts = method.split('.');
        return parts[parts.length - 1] ?? 'process';
    }
    escapeString(str) {
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }
    // ===========================================================================
    // Cleanup
    // ===========================================================================
    /**
     * Close the provider
     */
    async close() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        // Flush any remaining batch
        await this.flush();
        setBatchScheduler(null);
    }
}
// =============================================================================
// Factory
// =============================================================================
/**
 * Create a ClickHouse durable provider
 */
export function createClickHouseDurableProvider(config) {
    return new ClickHouseDurableProvider(config);
}
