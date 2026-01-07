/**
 * Batch Map - Automatic batch detection for .map() operations
 *
 * When you call .map() on a list result, the individual operations
 * are captured and automatically batched when resolved.
 *
 * @example
 * ```ts
 * // This automatically batches the write operations
 * const titles = await list`10 blog post titles`
 * const posts = titles.map(title => write`blog post: # ${title}`)
 *
 * // When awaited, posts are generated via batch API
 * console.log(await posts) // 10 blog posts
 * ```
 *
 * @packageDocumentation
 */
// Note: We avoid importing AIPromise here to prevent circular dependencies
// The AI promise module imports from this file for recording mode
import { getContext, getExecutionTier, getProvider, getModel, isFlexAvailable, } from './context.js';
import { createBatch, getBatchAdapter } from './batch-queue.js';
import { generateObject, generateText } from './generate.js';
// ============================================================================
// Types
// ============================================================================
/** Symbol to identify BatchMapPromise instances */
export const BATCH_MAP_SYMBOL = Symbol.for('ai-batch-map');
// ============================================================================
// BatchMapPromise
// ============================================================================
/**
 * A promise that represents a batch of mapped operations.
 * Resolves by either:
 * - Executing via batch API (for large batches or when deferred)
 * - Executing concurrently (for small batches or when immediate)
 */
export class BatchMapPromise {
    [BATCH_MAP_SYMBOL] = true;
    /** The source list items */
    _items;
    /** The captured operations (one per item) */
    _operations;
    /** Options for batch execution */
    _options;
    /** Cached resolver promise */
    _resolver = null;
    constructor(items, operations, options = {}) {
        this._items = items;
        this._operations = operations;
        this._options = options;
    }
    /**
     * Get the number of items in the batch
     */
    get size() {
        return this._items.length;
    }
    /**
     * Resolve the batch
     */
    async resolve() {
        const totalOperations = this._operations.reduce((sum, ops) => sum + ops.length, 0);
        // Determine execution tier
        let tier;
        if (this._options.deferred) {
            tier = 'batch';
        }
        else if (this._options.immediate) {
            tier = 'immediate';
        }
        else {
            tier = getExecutionTier(totalOperations);
        }
        // Execute based on tier
        switch (tier) {
            case 'immediate':
                return this._resolveImmediately();
            case 'flex':
                // Use flex processing if available, otherwise fall back to immediate
                if (isFlexAvailable()) {
                    return this._resolveViaFlex();
                }
                console.warn(`Flex processing not available for ${getProvider()}, using immediate execution`);
                return this._resolveImmediately();
            case 'batch':
                return this._resolveViaBatchAPI();
            default:
                return this._resolveImmediately();
        }
    }
    /**
     * Execute via flex processing (faster than batch, ~50% discount)
     * Available for OpenAI and AWS Bedrock
     */
    async _resolveViaFlex() {
        const provider = getProvider();
        const model = getModel();
        // Try to get the flex adapter
        try {
            const { getFlexAdapter } = await import('./batch-queue.js');
            const adapter = getFlexAdapter(provider);
            // Build batch items
            const batchItems = [];
            const itemOperationMap = new Map();
            for (let itemIndex = 0; itemIndex < this._items.length; itemIndex++) {
                const item = this._items[itemIndex];
                const operations = this._operations[itemIndex] || [];
                for (let opIndex = 0; opIndex < operations.length; opIndex++) {
                    const op = operations[opIndex];
                    if (!op)
                        continue;
                    const id = `item_${itemIndex}_op_${opIndex}`;
                    const prompt = op.prompt.replace(op.itemPlaceholder, String(item));
                    batchItems.push({
                        id,
                        prompt,
                        schema: op.schema,
                        options: { system: op.system, model },
                        status: 'pending',
                    });
                    itemOperationMap.set(id, { itemIndex, opIndex });
                }
            }
            // Submit via flex adapter
            const results = await adapter.submitFlex(batchItems, { model });
            return this._reconstructResults(results, itemOperationMap);
        }
        catch {
            // Flex adapter not available, fall back to batch or immediate
            console.warn(`Flex adapter not available, falling back to batch API`);
            return this._resolveViaBatchAPI();
        }
    }
    /**
     * Execute via provider batch API (deferred, 50% discount)
     */
    async _resolveViaBatchAPI() {
        const ctx = getContext();
        const provider = getProvider();
        const model = getModel();
        // Try to get the batch adapter
        let adapter;
        try {
            adapter = getBatchAdapter(provider);
        }
        catch {
            // Adapter not registered, fall back to immediate execution
            console.warn(`Batch adapter for ${provider} not available, falling back to immediate execution`);
            return this._resolveImmediately();
        }
        // Flatten all operations into a single batch
        const batchItems = [];
        const itemOperationMap = new Map();
        for (let itemIndex = 0; itemIndex < this._items.length; itemIndex++) {
            const item = this._items[itemIndex];
            const operations = this._operations[itemIndex] || [];
            for (let opIndex = 0; opIndex < operations.length; opIndex++) {
                const op = operations[opIndex];
                if (!op)
                    continue;
                const id = `item_${itemIndex}_op_${opIndex}`;
                // Substitute the actual item value into the prompt
                const prompt = op.prompt.replace(op.itemPlaceholder, String(item));
                batchItems.push({
                    id,
                    prompt,
                    schema: op.schema,
                    options: { system: op.system, model },
                    status: 'pending',
                });
                itemOperationMap.set(id, { itemIndex, opIndex });
            }
        }
        // Submit batch
        const batch = createBatch({
            provider,
            model,
            webhookUrl: ctx.webhookUrl,
            metadata: ctx.metadata,
        });
        for (const item of batchItems) {
            batch.add(item.prompt, {
                schema: item.schema,
                options: item.options,
                customId: item.id,
            });
        }
        const { completion } = await batch.submit();
        const results = await completion;
        // Reconstruct the results array
        return this._reconstructResults(results, itemOperationMap);
    }
    /**
     * Execute immediately (concurrent requests)
     */
    async _resolveImmediately() {
        const model = getModel();
        const results = [];
        // Process each item
        for (let itemIndex = 0; itemIndex < this._items.length; itemIndex++) {
            const item = this._items[itemIndex];
            const operations = this._operations[itemIndex] || [];
            // If there's only one operation per item, resolve it directly
            if (operations.length === 1) {
                const op = operations[0];
                if (op) {
                    const prompt = op.prompt.replace(op.itemPlaceholder, String(item));
                    const result = await this._executeOperation(op, prompt, model);
                    results.push(result);
                }
            }
            else if (operations.length > 0) {
                // Multiple operations per item - resolve as object
                const opResults = {};
                await Promise.all(operations.map(async (op, opIndex) => {
                    if (!op)
                        return;
                    const prompt = op.prompt.replace(op.itemPlaceholder, String(item));
                    opResults[`op_${opIndex}`] = await this._executeOperation(op, prompt, model);
                }));
                results.push(opResults);
            }
        }
        return results;
    }
    /**
     * Execute a single operation
     */
    async _executeOperation(op, prompt, model) {
        switch (op.type) {
            case 'text':
                const textResult = await generateText({ model, prompt, system: op.system });
                return textResult.text;
            case 'boolean':
                const boolResult = await generateObject({
                    model,
                    schema: { answer: 'true | false' },
                    prompt,
                    system: op.system || 'Answer with true or false.',
                });
                return boolResult.object.answer === 'true';
            case 'list':
                const listResult = await generateObject({
                    model,
                    schema: { items: ['List items'] },
                    prompt,
                    system: op.system,
                });
                return listResult.object.items;
            case 'object':
            default:
                const objResult = await generateObject({
                    model,
                    schema: op.schema || { result: 'The result' },
                    prompt,
                    system: op.system,
                });
                return objResult.object;
        }
    }
    /**
     * Reconstruct results from batch response
     */
    _reconstructResults(batchResults, itemOperationMap) {
        const results = new Array(this._items.length);
        // Initialize results array
        for (let i = 0; i < this._items.length; i++) {
            const operations = this._operations[i] || [];
            if (operations.length === 1) {
                results[i] = undefined;
            }
            else {
                results[i] = {};
            }
        }
        // Fill in results
        for (const batchResult of batchResults) {
            const mapping = itemOperationMap.get(batchResult.id);
            if (!mapping)
                continue;
            const { itemIndex, opIndex } = mapping;
            const operations = this._operations[itemIndex] || [];
            if (operations.length === 1) {
                results[itemIndex] = batchResult.result;
            }
            else {
                results[itemIndex][`op_${opIndex}`] = batchResult.result;
            }
        }
        return results;
    }
    /**
     * Promise interface - then()
     */
    then(onfulfilled, onrejected) {
        if (!this._resolver) {
            this._resolver = this.resolve();
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
// ============================================================================
// Recording Context
// ============================================================================
/** Current item value being recorded */
let currentRecordingItem = null;
/** Current item placeholder string */
let currentItemPlaceholder = '';
/** Captured operations during recording */
let capturedOperations = [];
/** Recording mode flag */
let isRecording = false;
/** Operation counter for unique IDs */
let operationCounter = 0;
/**
 * Check if we're in recording mode
 */
export function isInRecordingMode() {
    return isRecording;
}
/**
 * Get the current item placeholder for template substitution
 */
export function getCurrentItemPlaceholder() {
    return isRecording ? currentItemPlaceholder : null;
}
/**
 * Capture an operation during recording
 */
export function captureOperation(prompt, type, schema, system) {
    if (!isRecording)
        return;
    capturedOperations.push({
        id: `op_${++operationCounter}`,
        prompt,
        itemPlaceholder: currentItemPlaceholder,
        schema,
        type,
        system,
    });
}
// ============================================================================
// Batch Map Factory
// ============================================================================
/**
 * Create a batch map from an array and a callback
 *
 * This is called internally by AIPromise.map()
 */
export function createBatchMap(items, callback, options = {}) {
    const allOperations = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Enter recording mode
        isRecording = true;
        currentRecordingItem = item;
        currentItemPlaceholder = `__BATCH_ITEM_${i}__`;
        capturedOperations = [];
        try {
            // Execute the callback to capture operations
            callback(item, i);
            // Operations should have been captured via captureOperation()
            allOperations.push([...capturedOperations]);
        }
        finally {
            // Exit recording mode
            isRecording = false;
            currentRecordingItem = null;
            currentItemPlaceholder = '';
            capturedOperations = [];
        }
    }
    return new BatchMapPromise(items, allOperations, options);
}
// ============================================================================
// Helpers
// ============================================================================
/**
 * Check if a value is a BatchMapPromise
 */
export function isBatchMapPromise(value) {
    return (value !== null &&
        typeof value === 'object' &&
        BATCH_MAP_SYMBOL in value &&
        value[BATCH_MAP_SYMBOL] === true);
}
