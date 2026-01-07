/**
 * AIPromise Database Layer
 *
 * Brings promise pipelining, destructuring schema inference, and batch
 * processing to database operations—just like ai-functions.
 *
 * @example
 * ```ts
 * // Chain without await
 * const leads = db.Lead.list()
 * const enriched = await leads.map(lead => ({
 *   lead,
 *   customer: lead.customer,        // Batch loaded
 *   orders: lead.customer.orders,   // Batch loaded
 * }))
 *
 * // Destructure for projections
 * const { name, email } = await db.Lead.first()
 * ```
 *
 * @packageDocumentation
 */
// =============================================================================
// Types
// =============================================================================
/** Symbol to identify DBPromise instances */
export const DB_PROMISE_SYMBOL = Symbol.for('db-promise');
/** Symbol to get raw promise */
export const RAW_DB_PROMISE_SYMBOL = Symbol.for('db-promise-raw');
// =============================================================================
// DBPromise Implementation
// =============================================================================
/**
 * DBPromise - Promise pipelining for database operations
 *
 * Like AIPromise but for database queries. Enables:
 * - Property access tracking for projections
 * - Batch relationship loading
 * - .map() for processing arrays efficiently
 */
export class DBPromise {
    [DB_PROMISE_SYMBOL] = true;
    _options;
    _accessedProps = new Set();
    _propertyPath;
    _parent;
    _resolver = null;
    _resolvedValue;
    _isResolved = false;
    _pendingRelations = new Map();
    constructor(options) {
        this._options = options;
        this._propertyPath = options.propertyPath || [];
        this._parent = options.parent || null;
        // Return proxy for property tracking
        return new Proxy(this, DB_PROXY_HANDLERS);
    }
    /** Get accessed properties */
    get accessedProps() {
        return this._accessedProps;
    }
    /** Get property path */
    get path() {
        return this._propertyPath;
    }
    /** Check if resolved */
    get isResolved() {
        return this._isResolved;
    }
    /**
     * Resolve this promise
     */
    async resolve() {
        if (this._isResolved) {
            return this._resolvedValue;
        }
        // If this is a property access on parent, resolve parent first
        if (this._parent && this._propertyPath.length > 0) {
            const parentValue = await this._parent.resolve();
            const value = getNestedValue(parentValue, this._propertyPath);
            this._resolvedValue = value;
            this._isResolved = true;
            return this._resolvedValue;
        }
        // Execute the query
        const result = await this._options.executor();
        this._resolvedValue = result;
        this._isResolved = true;
        return this._resolvedValue;
    }
    /**
     * Map over array results with batch optimization
     *
     * @example
     * ```ts
     * const customers = db.Customer.list()
     * const withOrders = await customers.map(customer => ({
     *   name: customer.name,
     *   orders: customer.orders,      // Batch loaded!
     *   total: customer.orders.length,
     * }))
     * ```
     */
    map(callback) {
        const parentPromise = this;
        return new DBPromise({
            type: this._options.type,
            executor: async () => {
                // Resolve the parent array
                const items = await parentPromise.resolve();
                if (!Array.isArray(items)) {
                    throw new Error('Cannot map over non-array result');
                }
                // Create recording context
                const recordings = [];
                // Record what the callback accesses for each item
                const recordedResults = [];
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const recording = {
                        paths: new Set(),
                        relations: new Map(),
                    };
                    // Create a recording proxy for this item
                    const recordingProxy = createRecordingProxy(item, recording);
                    // Execute callback with recording proxy
                    const result = callback(recordingProxy, i);
                    recordedResults.push(result);
                    recordings.push(recording);
                }
                // Analyze recordings to find batch-loadable relations
                const batchLoads = analyzeBatchLoads(recordings, items);
                // Execute batch loads
                const loadedRelations = await executeBatchLoads(batchLoads);
                // Apply loaded relations to results
                return applyBatchResults(recordedResults, loadedRelations, items);
            },
        });
    }
    /**
     * Filter results
     */
    filter(predicate) {
        const parentPromise = this;
        return new DBPromise({
            type: this._options.type,
            executor: async () => {
                const items = await parentPromise.resolve();
                if (!Array.isArray(items)) {
                    return items;
                }
                return items.filter(predicate);
            },
        });
    }
    /**
     * Sort results
     */
    sort(compareFn) {
        const parentPromise = this;
        return new DBPromise({
            type: this._options.type,
            executor: async () => {
                const items = await parentPromise.resolve();
                if (!Array.isArray(items)) {
                    return items;
                }
                return [...items].sort(compareFn);
            },
        });
    }
    /**
     * Limit results
     */
    limit(n) {
        const parentPromise = this;
        return new DBPromise({
            type: this._options.type,
            executor: async () => {
                const items = await parentPromise.resolve();
                if (!Array.isArray(items)) {
                    return items;
                }
                return items.slice(0, n);
            },
        });
    }
    /**
     * Get first item
     */
    first() {
        const parentPromise = this;
        return new DBPromise({
            type: this._options.type,
            executor: async () => {
                const items = await parentPromise.resolve();
                if (Array.isArray(items)) {
                    return items[0] ?? null;
                }
                return items;
            },
        });
    }
    /**
     * Process each item with concurrency control, progress tracking, and error handling
     *
     * Designed for large-scale operations like AI generations or workflows.
     *
     * @example
     * ```ts
     * // Simple - process sequentially
     * await db.Lead.list().forEach(async lead => {
     *   await processLead(lead)
     * })
     *
     * // With concurrency and progress
     * await db.Lead.list().forEach(async lead => {
     *   const analysis = await ai`analyze ${lead}`
     *   await db.Lead.update(lead.$id, { analysis })
     * }, {
     *   concurrency: 10,
     *   onProgress: p => console.log(`${p.completed}/${p.total} (${p.rate}/s)`),
     * })
     *
     * // With error handling and retries
     * const result = await db.Order.list().forEach(async order => {
     *   await sendInvoice(order)
     * }, {
     *   concurrency: 5,
     *   maxRetries: 3,
     *   retryDelay: attempt => 1000 * Math.pow(2, attempt),
     *   onError: (err, order) => err.code === 'RATE_LIMIT' ? 'retry' : 'continue',
     * })
     *
     * console.log(`Sent ${result.completed}, failed ${result.failed}`)
     * ```
     */
    async forEach(callback, options = {}) {
        const { concurrency = 1, batchSize = 100, maxRetries = 0, retryDelay = 1000, onProgress, onError = 'continue', onComplete, signal, timeout, persist, resume, } = options;
        const startTime = Date.now();
        const errors = [];
        let completed = 0;
        let failed = 0;
        let skipped = 0;
        let cancelled = false;
        let actionId;
        // Persistence state
        let processedIds = new Set();
        let persistCounter = 0;
        const getItemId = (item) => item?.$id ?? item?.id ?? String(item);
        // Get actions API from options (injected by wrapEntityOperations)
        const actionsAPI = this._options.actionsAPI;
        // Initialize persistence if enabled
        if (persist || resume) {
            if (!actionsAPI) {
                throw new Error('Persistence requires actions API - use db.Entity.forEach instead of db.Entity.list().forEach');
            }
            // Auto-generate action type from entity name
            const actionType = typeof persist === 'string' ? persist : `${this._options.type ?? 'unknown'}.forEach`;
            if (resume) {
                // Resume from existing action
                const existingAction = await actionsAPI.get(resume);
                if (existingAction) {
                    actionId = existingAction.id;
                    processedIds = new Set(existingAction.data?.processedIds ?? []);
                    await actionsAPI.update(actionId, { status: 'active' });
                }
                else {
                    throw new Error(`Action ${resume} not found`);
                }
            }
            else {
                // Create new action
                const action = await actionsAPI.create({
                    type: actionType,
                    data: { processedIds: [] },
                });
                actionId = action.id;
            }
        }
        // Resolve the items
        const items = await this.resolve();
        if (!Array.isArray(items)) {
            throw new Error('forEach can only be called on array results');
        }
        const total = items.length;
        // Update action with total if persistence is enabled
        if ((persist || resume) && actionId && actionsAPI) {
            await actionsAPI.update(actionId, { total, status: 'active' });
        }
        // Helper to calculate progress
        const getProgress = (index, current) => {
            const elapsed = Date.now() - startTime;
            const processed = completed + failed + skipped;
            const rate = processed > 0 ? (processed / elapsed) * 1000 : 0;
            const remaining = rate > 0 && total ? ((total - processed) / rate) * 1000 : undefined;
            return {
                index,
                total,
                completed,
                failed,
                skipped,
                current,
                elapsed,
                remaining,
                rate,
            };
        };
        // Helper to persist progress
        const persistProgress = async (itemId) => {
            if ((!persist && !resume) || !actionId || !actionsAPI)
                return;
            processedIds.add(itemId);
            persistCounter++;
            // Persist every 10 items to reduce overhead
            if (persistCounter % 10 === 0) {
                await actionsAPI.update(actionId, {
                    progress: completed + failed + skipped,
                    data: { processedIds: Array.from(processedIds) },
                });
            }
        };
        // Helper to get retry delay
        const getRetryDelay = (attempt) => {
            return typeof retryDelay === 'function' ? retryDelay(attempt) : retryDelay;
        };
        // Helper to handle error
        const handleError = async (error, item, attempt) => {
            if (typeof onError === 'function') {
                return onError(error, item, attempt);
            }
            return onError;
        };
        // Process a single item with retries
        const processItem = async (item, index) => {
            if (cancelled || signal?.aborted) {
                cancelled = true;
                return;
            }
            // Check if already processed (for resume)
            const itemId = getItemId(item);
            if (processedIds.has(itemId)) {
                skipped++;
                return;
            }
            let attempt = 0;
            while (true) {
                try {
                    // Create timeout wrapper if needed
                    let result;
                    if (timeout) {
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
                        });
                        result = await Promise.race([
                            Promise.resolve(callback(item, index)),
                            timeoutPromise,
                        ]);
                    }
                    else {
                        result = await callback(item, index);
                    }
                    // Success
                    completed++;
                    await persistProgress(itemId);
                    await onComplete?.(item, result, index);
                    onProgress?.(getProgress(index, item));
                    return;
                }
                catch (error) {
                    attempt++;
                    const action = await handleError(error, item, attempt);
                    switch (action) {
                        case 'retry':
                            if (attempt <= maxRetries) {
                                await sleep(getRetryDelay(attempt));
                                continue; // Retry
                            }
                            // Fall through to continue if max retries exceeded
                            failed++;
                            await persistProgress(itemId); // Still mark as processed
                            errors.push({ item, error: error, index });
                            onProgress?.(getProgress(index, item));
                            return;
                        case 'skip':
                            skipped++;
                            onProgress?.(getProgress(index, item));
                            return;
                        case 'stop':
                            failed++;
                            await persistProgress(itemId);
                            errors.push({ item, error: error, index });
                            cancelled = true;
                            return;
                        case 'continue':
                        default:
                            failed++;
                            await persistProgress(itemId);
                            errors.push({ item, error: error, index });
                            onProgress?.(getProgress(index, item));
                            return;
                    }
                }
            }
        };
        // Process items with concurrency
        try {
            if (concurrency === 1) {
                // Sequential processing
                for (let i = 0; i < items.length; i++) {
                    if (cancelled || signal?.aborted) {
                        cancelled = true;
                        break;
                    }
                    await processItem(items[i], i);
                }
            }
            else {
                // Concurrent processing with semaphore
                const semaphore = new Semaphore(concurrency);
                const promises = [];
                for (let i = 0; i < items.length; i++) {
                    if (cancelled || signal?.aborted) {
                        cancelled = true;
                        break;
                    }
                    const itemIndex = i;
                    const item = items[i];
                    promises.push(semaphore.acquire().then(async (release) => {
                        try {
                            await processItem(item, itemIndex);
                        }
                        finally {
                            release();
                        }
                    }));
                }
                await Promise.all(promises);
            }
        }
        finally {
            // Final persistence update
            if ((persist || resume) && actionId && actionsAPI) {
                const finalResult = {
                    total,
                    completed,
                    failed,
                    skipped,
                    elapsed: Date.now() - startTime,
                    errors,
                    cancelled,
                    actionId,
                };
                await actionsAPI.update(actionId, {
                    status: cancelled ? 'failed' : 'completed',
                    progress: completed + failed + skipped,
                    data: { processedIds: Array.from(processedIds) },
                    result: finalResult,
                    error: cancelled ? 'Cancelled' : errors.length > 0 ? `${errors.length} items failed` : undefined,
                });
            }
        }
        return {
            total,
            completed,
            failed,
            skipped,
            elapsed: Date.now() - startTime,
            errors,
            cancelled,
            actionId,
        };
    }
    /**
     * Async iteration
     */
    async *[Symbol.asyncIterator]() {
        const items = await this.resolve();
        if (Array.isArray(items)) {
            for (const item of items) {
                yield item;
            }
        }
        else {
            yield items;
        }
    }
    /**
     * Promise interface - then()
     */
    then(onfulfilled, onrejected) {
        if (!this._resolver) {
            this._resolver = new Promise((resolve, reject) => {
                queueMicrotask(async () => {
                    try {
                        const value = await this.resolve();
                        resolve(value);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
        }
        return this._resolver.then(onfulfilled, onrejected);
    }
    /**
     * Promise interface - catch()
     */
    catch(onrejected) {
        return this.then(null, onrejected);
    }
    /**
     * Promise interface - finally()
     */
    finally(onfinally) {
        return this.then((value) => {
            onfinally?.();
            return value;
        }, (reason) => {
            onfinally?.();
            throw reason;
        });
    }
}
// =============================================================================
// Proxy Handlers
// =============================================================================
const DB_PROXY_HANDLERS = {
    get(target, prop, receiver) {
        // Handle symbols
        if (typeof prop === 'symbol') {
            if (prop === DB_PROMISE_SYMBOL)
                return true;
            if (prop === RAW_DB_PROMISE_SYMBOL)
                return target;
            if (prop === Symbol.asyncIterator)
                return target[Symbol.asyncIterator].bind(target);
            return target[prop];
        }
        // Handle promise methods
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            return target[prop].bind(target);
        }
        // Handle DBPromise methods
        if (['map', 'filter', 'sort', 'limit', 'first', 'forEach', 'resolve'].includes(prop)) {
            return target[prop].bind(target);
        }
        // Handle internal properties
        if (prop.startsWith('_') || ['accessedProps', 'path', 'isResolved'].includes(prop)) {
            return target[prop];
        }
        // Track property access
        target.accessedProps.add(prop);
        // Return a new DBPromise for the property path
        return new DBPromise({
            type: target['_options']?.type,
            parent: target,
            propertyPath: [...target.path, prop],
            executor: async () => {
                const parentValue = await target.resolve();
                return getNestedValue(parentValue, [prop]);
            },
        });
    },
    set() {
        throw new Error('DBPromise properties are read-only');
    },
    deleteProperty() {
        throw new Error('DBPromise properties cannot be deleted');
    },
};
// =============================================================================
// Helper Functions
// =============================================================================
/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
    permits;
    queue = [];
    constructor(permits) {
        this.permits = permits;
    }
    async acquire() {
        if (this.permits > 0) {
            this.permits--;
            return () => this.release();
        }
        return new Promise((resolve) => {
            this.queue.push(() => {
                this.permits--;
                resolve(() => this.release());
            });
        });
    }
    release() {
        this.permits++;
        const next = this.queue.shift();
        if (next) {
            next();
        }
    }
}
/**
 * Get nested value from object
 */
function getNestedValue(obj, path) {
    let current = obj;
    for (const key of path) {
        if (current === null || current === undefined)
            return undefined;
        current = current[key];
    }
    return current;
}
/**
 * Create a proxy that records property accesses
 */
function createRecordingProxy(item, recording) {
    if (typeof item !== 'object' || item === null) {
        return item;
    }
    return new Proxy(item, {
        get(target, prop) {
            if (typeof prop === 'symbol') {
                return target[prop];
            }
            recording.paths.add(prop);
            const value = target[prop];
            // If accessing a relation (identified by $id or Promise), record it
            if (value && typeof value === 'object' && '$type' in value) {
                recording.relations.set(prop, {
                    type: value.$type,
                    isArray: Array.isArray(value),
                    nestedPaths: new Set(),
                });
            }
            // Return a nested recording proxy for objects
            if (value && typeof value === 'object') {
                return createRecordingProxy(value, recording);
            }
            return value;
        },
    });
}
/**
 * Analyze recordings to find batch-loadable relations
 */
function analyzeBatchLoads(recordings, items) {
    const batchLoads = new Map();
    // Find common relations across all recordings
    const relationCounts = new Map();
    for (const recording of recordings) {
        for (const [relationName, relation] of recording.relations) {
            relationCounts.set(relationName, (relationCounts.get(relationName) || 0) + 1);
        }
    }
    // Only batch-load relations accessed in all (or most) items
    for (const [relationName, count] of relationCounts) {
        if (count >= recordings.length * 0.5) {
            // At least 50% of items access this relation
            const ids = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const relationId = item[relationName];
                if (typeof relationId === 'string') {
                    ids.push(relationId);
                }
                else if (relationId && typeof relationId === 'object' && '$id' in relationId) {
                    ids.push(relationId.$id);
                }
            }
            if (ids.length > 0) {
                const relation = recordings[0]?.relations.get(relationName);
                if (relation) {
                    batchLoads.set(relationName, { type: relation.type, ids });
                }
            }
        }
    }
    return batchLoads;
}
/**
 * Execute batch loads for relations
 */
async function executeBatchLoads(batchLoads) {
    const results = new Map();
    // For now, return empty - actual implementation would batch query
    // This is a placeholder that will be filled in by the actual DB integration
    for (const [relationName, { type, ids }] of batchLoads) {
        results.set(relationName, new Map());
    }
    return results;
}
/**
 * Apply batch-loaded results to the mapped results
 */
function applyBatchResults(results, loadedRelations, originalItems) {
    // For now, return results as-is
    // Actual implementation would inject loaded relations
    return results;
}
// =============================================================================
// Check Functions
// =============================================================================
/**
 * Check if a value is a DBPromise
 */
export function isDBPromise(value) {
    return (value !== null &&
        typeof value === 'object' &&
        DB_PROMISE_SYMBOL in value &&
        value[DB_PROMISE_SYMBOL] === true);
}
/**
 * Get the raw DBPromise from a proxied value
 */
export function getRawDBPromise(value) {
    if (RAW_DB_PROMISE_SYMBOL in value) {
        return value[RAW_DB_PROMISE_SYMBOL];
    }
    return value;
}
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a DBPromise for a list query
 */
export function createListPromise(type, executor) {
    return new DBPromise({ type, executor });
}
/**
 * Create a DBPromise for a single entity query
 */
export function createEntityPromise(type, executor) {
    return new DBPromise({ type, executor });
}
/**
 * Create a DBPromise for a search query
 */
export function createSearchPromise(type, executor) {
    return new DBPromise({ type, executor });
}
// =============================================================================
// Entity Operations Wrapper
// =============================================================================
/**
 * Wrap EntityOperations to return DBPromise
 */
export function wrapEntityOperations(typeName, operations, actionsAPI) {
    return {
        get(id) {
            return new DBPromise({
                type: typeName,
                executor: () => operations.get(id),
                actionsAPI,
            });
        },
        list(options) {
            return new DBPromise({
                type: typeName,
                executor: () => operations.list(options),
                actionsAPI,
            });
        },
        find(where) {
            return new DBPromise({
                type: typeName,
                executor: () => operations.find(where),
                actionsAPI,
            });
        },
        search(query, options) {
            return new DBPromise({
                type: typeName,
                executor: () => operations.search(query, options),
                actionsAPI,
            });
        },
        first() {
            return new DBPromise({
                type: typeName,
                executor: async () => {
                    const items = await operations.list({ limit: 1 });
                    return items[0] ?? null;
                },
                actionsAPI,
            });
        },
        /**
         * Process all entities with concurrency, progress, and optional persistence
         *
         * Supports two calling styles:
         * - forEach(callback, options?) - callback first
         * - forEach(options, callback) - options first (with where filter)
         *
         * @example
         * ```ts
         * await db.Lead.forEach(lead => console.log(lead.name))
         * await db.Lead.forEach(processLead, { concurrency: 10 })
         * await db.Lead.forEach({ where: { status: 'active' } }, processLead)
         * await db.Lead.forEach(processLead, { persist: true })
         * await db.Lead.forEach(processLead, { resume: 'action-123' })
         * ```
         */
        async forEach(callbackOrOptions, callbackOrOpts) {
            // Detect which calling style is being used
            const isOptionsFirst = typeof callbackOrOptions === 'object' && callbackOrOptions !== null && !('call' in callbackOrOptions);
            const callback = isOptionsFirst
                ? callbackOrOpts
                : callbackOrOptions;
            const options = isOptionsFirst
                ? callbackOrOptions
                : (callbackOrOpts ?? {});
            // Extract where filter and pass to list
            const listOptions = options.where ? { where: options.where } : undefined;
            const listPromise = new DBPromise({
                type: typeName,
                executor: () => operations.list(listOptions),
                actionsAPI,
            });
            return listPromise.forEach(callback, options);
        },
        // Mutations don't need wrapping
        create: operations.create,
        update: operations.update,
        upsert: operations.upsert,
        delete: operations.delete,
    };
}
