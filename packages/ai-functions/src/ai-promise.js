/**
 * AIPromise - RPC-style promise pipelining for AI functions
 *
 * Inspired by capnweb's RpcPromise, this enables:
 * - Property access tracking for dynamic schema inference
 * - Promise pipelining without await
 * - Magical .map() for batch processing
 * - Dependency graph resolution
 *
 * @example
 * ```ts
 * // Dynamic schema from destructuring
 * const { summary, keyPoints, conclusion } = ai`write about ${topic}`
 *
 * // Pipeline without await
 * const isValid = is`${conclusion} is solid given ${keyPoints}`
 *
 * // Batch process with map
 * const ideas = list`startup ideas`
 * const evaluated = await ideas.map(idea => ({
 *   idea,
 *   viable: is`${idea} is viable`,
 *   market: ai`market size for ${idea}`,
 * }))
 *
 * // Only await at the end
 * if (await isValid) { ... }
 * ```
 *
 * @packageDocumentation
 */
import { generateObject } from './generate.js';
import { isInRecordingMode, captureOperation, createBatchMap, BatchMapPromise, } from './batch-map.js';
// ============================================================================
// Types
// ============================================================================
/** Symbol to identify AIPromise instances */
export const AI_PROMISE_SYMBOL = Symbol.for('ai-promise');
/** Symbol to get the raw AIPromise from a proxy */
export const RAW_PROMISE_SYMBOL = Symbol.for('ai-promise-raw');
/** Recording mode for map() */
export const RECORDING_MODE = Symbol.for('ai-promise-recording');
// ============================================================================
// Global State
// ============================================================================
/** Current recording context for map() */
let currentRecording = null;
/** Pending promises for batch resolution */
const pendingPromises = new Set();
/** Promise resolution queue */
let resolutionScheduled = false;
// ============================================================================
// AIPromise Implementation
// ============================================================================
/**
 * AIPromise - Like capnweb's RpcPromise but for AI functions
 *
 * Acts as both a Promise AND a stub that:
 * - Tracks property accesses for dynamic schema inference
 * - Records dependencies for promise pipelining
 * - Supports .map() for batch processing
 */
export class AIPromise {
    /** Marker to identify AIPromise instances */
    [AI_PROMISE_SYMBOL] = true;
    /** The prompt that will generate this value */
    _prompt;
    /** Options for generation */
    _options;
    /** Properties accessed on this promise (for schema inference) */
    _accessedProps = new Set();
    /** Property path from parent (for nested access) */
    _propertyPath;
    /** Parent promise (if this is a property access) */
    _parent;
    /** Dependencies (other AIPromises used in our prompt) */
    _dependencies = [];
    /** Cached resolver promise */
    _resolver = null;
    /** Resolved value (cached after first resolution) */
    _resolvedValue;
    /** Whether this promise has been resolved */
    _isResolved = false;
    /** Whether we're in recording mode */
    _isRecording = false;
    constructor(prompt, options = {}) {
        this._prompt = prompt;
        this._options = options;
        this._propertyPath = options.propertyPath || [];
        this._parent = options.parent || null;
        // Track this promise for batch resolution
        pendingPromises.add(this);
        // Return a proxy that intercepts property access
        return new Proxy(this, PROXY_HANDLERS);
    }
    /** Get the prompt */
    get prompt() {
        return this._prompt;
    }
    /** Get the property path */
    get path() {
        return this._propertyPath;
    }
    /** Check if resolved */
    get isResolved() {
        return this._isResolved;
    }
    /** Get accessed properties */
    get accessedProps() {
        return this._accessedProps;
    }
    /**
     * Add a dependency (another AIPromise used in this one's prompt)
     */
    addDependency(promise, path = []) {
        this._dependencies.push({ promise, path });
    }
    /**
     * Resolve this promise
     */
    async resolve() {
        if (this._isResolved) {
            return this._resolvedValue;
        }
        // If this is a property access on a parent, resolve the parent first
        if (this._parent) {
            const parentValue = await this._parent.resolve();
            const value = getNestedValue(parentValue, this._propertyPath);
            this._resolvedValue = value;
            this._isResolved = true;
            return this._resolvedValue;
        }
        // Resolve dependencies first
        const resolvedDeps = {};
        for (const dep of this._dependencies) {
            const value = await dep.promise.resolve();
            const key = dep.path.length > 0 ? dep.path.join('.') : `dep_${this._dependencies.indexOf(dep)}`;
            resolvedDeps[key] = value;
        }
        // Substitute resolved dependencies into prompt
        let finalPrompt = this._prompt;
        for (const [key, value] of Object.entries(resolvedDeps)) {
            finalPrompt = finalPrompt.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
        }
        // Build schema from accessed properties
        const schema = this._buildSchema();
        // Generate the result
        const result = await generateObject({
            model: this._options.model || 'sonnet',
            schema,
            prompt: finalPrompt,
            system: this._options.system,
            temperature: this._options.temperature,
            maxTokens: this._options.maxTokens,
        });
        this._resolvedValue = result.object;
        this._isResolved = true;
        pendingPromises.delete(this);
        return this._resolvedValue;
    }
    /**
     * Build schema from accessed properties and base schema
     */
    _buildSchema() {
        const baseSchema = this._options.baseSchema || {};
        // If no properties accessed, use base schema or infer from type
        if (this._accessedProps.size === 0) {
            if (typeof baseSchema === 'object' && Object.keys(baseSchema).length > 0) {
                return baseSchema;
            }
            // Infer from type
            switch (this._options.type) {
                case 'list':
                    return { items: ['List items'] };
                case 'lists':
                    return { categories: ['Category names'], data: 'JSON object with categorized lists' };
                case 'boolean':
                    return { answer: 'true | false' };
                case 'text':
                    return { text: 'The generated text' };
                default:
                    return { result: 'The result' };
            }
        }
        // Build schema from accessed properties
        const schema = {};
        for (const prop of this._accessedProps) {
            // Check if base schema has this property
            if (typeof baseSchema === 'object' && !Array.isArray(baseSchema) && prop in baseSchema) {
                const propSchema = baseSchema[prop];
                if (propSchema !== undefined) {
                    schema[prop] = propSchema;
                    continue;
                }
            }
            // Infer type from property name patterns
            const lowerProp = prop.toLowerCase();
            if (lowerProp.endsWith('s') ||
                lowerProp.includes('list') ||
                lowerProp.includes('items') ||
                lowerProp.includes('array')) {
                schema[prop] = [`List of ${prop}`];
            }
            else if (lowerProp.includes('is') ||
                lowerProp.includes('has') ||
                lowerProp.includes('can') ||
                lowerProp.includes('should')) {
                schema[prop] = `Whether ${prop} (true/false)`;
            }
            else if (lowerProp.includes('count') ||
                lowerProp.includes('number') ||
                lowerProp.includes('total') ||
                lowerProp.includes('amount')) {
                schema[prop] = `The ${prop} (number)`;
            }
            else {
                schema[prop] = `The ${prop}`;
            }
        }
        return schema;
    }
    /**
     * Map over array results - automatically batches operations!
     *
     * When you map over a list, the operations are captured and
     * automatically batched when resolved. Uses provider batch APIs
     * for cost savings (50% discount) when beneficial.
     *
     * @example
     * ```ts
     * // Simple map - each title becomes a blog post
     * const titles = await list`10 blog post titles`
     * const posts = titles.map(title => write`blog post: # ${title}`)
     * console.log(await posts) // 10 blog posts via batch API
     *
     * // Complex map - multiple operations per item
     * const ideas = await list`startup ideas`
     * const evaluated = await ideas.map(idea => ({
     *   idea,
     *   viable: is`${idea} is viable`,
     *   market: ai`market size for ${idea}`,
     * }))
     * ```
     */
    map(callback) {
        // Create a wrapper that resolves this promise first, then maps
        const mapPromise = new BatchMapPromise([], [], {});
        // Override the resolve to first get the list items
        const originalResolve = mapPromise.resolve.bind(mapPromise);
        mapPromise.resolve = async () => {
            // First, resolve the list
            const items = await this.resolve();
            if (!Array.isArray(items)) {
                throw new Error('Cannot map over non-array result');
            }
            // Now create the actual batch map with the resolved items
            const actualBatchMap = createBatchMap(items, callback);
            return actualBatchMap.resolve();
        };
        return mapPromise;
    }
    /**
     * Map with explicit batch options
     *
     * @example
     * ```ts
     * // Force immediate execution (no batch API)
     * const posts = titles.mapImmediate(title => write`blog post: ${title}`)
     *
     * // Force batch API (even for small lists)
     * const posts = titles.mapDeferred(title => write`blog post: ${title}`)
     * ```
     */
    mapImmediate(callback) {
        const mapPromise = new BatchMapPromise([], [], { immediate: true });
        mapPromise.resolve = async () => {
            const items = await this.resolve();
            if (!Array.isArray(items)) {
                throw new Error('Cannot map over non-array result');
            }
            const actualBatchMap = createBatchMap(items, callback, { immediate: true });
            return actualBatchMap.resolve();
        };
        return mapPromise;
    }
    mapDeferred(callback) {
        const mapPromise = new BatchMapPromise([], [], { deferred: true });
        mapPromise.resolve = async () => {
            const items = await this.resolve();
            if (!Array.isArray(items)) {
                throw new Error('Cannot map over non-array result');
            }
            const actualBatchMap = createBatchMap(items, callback, { deferred: true });
            return actualBatchMap.resolve();
        };
        return mapPromise;
    }
    /**
     * ForEach with automatic batching
     *
     * @example
     * ```ts
     * await list`startup ideas`.forEach(async idea => {
     *   console.log(await is`${idea} is viable`)
     * })
     * ```
     */
    async forEach(callback) {
        const items = await this.resolve();
        if (Array.isArray(items)) {
            for (let i = 0; i < items.length; i++) {
                await callback(items[i], i);
            }
        }
        else {
            await callback(items, 0);
        }
    }
    /**
     * Async iterator support with smart batching
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
            // Schedule batch resolution on next microtask
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
// ============================================================================
// Proxy Handlers
// ============================================================================
const PROXY_HANDLERS = {
    get(target, prop, receiver) {
        // Handle symbols
        if (typeof prop === 'symbol') {
            if (prop === AI_PROMISE_SYMBOL)
                return true;
            if (prop === RAW_PROMISE_SYMBOL)
                return target;
            if (prop === Symbol.asyncIterator)
                return target[Symbol.asyncIterator].bind(target);
            return target[prop];
        }
        // Handle promise methods
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            return target[prop].bind(target);
        }
        // Handle AIPromise methods
        if (prop === 'map' || prop === 'forEach' || prop === 'resolve') {
            return target[prop].bind(target);
        }
        // Handle internal properties
        if (prop.startsWith('_') || prop === 'prompt' || prop === 'path' || prop === 'isResolved' || prop === 'accessedProps') {
            return target[prop];
        }
        // Track property access for schema inference
        target.accessedProps.add(prop);
        // If we're in recording mode, record this access
        if (currentRecording) {
            // Just track the access, don't create new promise
        }
        // Return a new AIPromise for the property path
        return new AIPromise(target.prompt, {
            ...target['_options'],
            parent: target,
            propertyPath: [...target.path, prop],
        });
    },
    // Prevent mutation
    set() {
        throw new Error('AIPromise properties are read-only');
    },
    deleteProperty() {
        throw new Error('AIPromise properties cannot be deleted');
    },
    // Handle function calls (for chained methods)
    apply(target, thisArg, args) {
        // If the target is callable (e.g., from a template function), call it
        if (typeof target._call === 'function') {
            return target._call(...args);
        }
        throw new Error('AIPromise is not callable');
    },
};
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Get a nested value from an object by path
 */
function getNestedValue(obj, path) {
    let current = obj;
    for (const key of path) {
        if (current === null || current === undefined)
            return undefined;
        if (key === '__item__')
            continue; // Skip internal markers
        current = current[key];
    }
    return current;
}
/**
 * Analyze the result of a map callback to build batch schema
 */
function analyzeRecordingResult(result, recording) {
    if (result === null || result === undefined) {
        return { result: 'The result' };
    }
    if (typeof result !== 'object') {
        return { result: 'The result' };
    }
    // Build schema from the result structure
    const schema = {};
    for (const [key, value] of Object.entries(result)) {
        if (isAIPromise(value)) {
            // This is a reference to an AI operation
            const aiPromise = getRawPromise(value);
            // Infer schema from the promise's accessed properties or type
            if (aiPromise.accessedProps.size > 0) {
                schema[key] = Object.fromEntries(Array.from(aiPromise.accessedProps).map(p => [p, `The ${p}`]));
            }
            else {
                const type = aiPromise._options?.type;
                if (type === 'boolean') {
                    schema[key] = 'true | false';
                }
                else if (type === 'list') {
                    schema[key] = ['List items'];
                }
                else {
                    schema[key] = `The ${key}`;
                }
            }
        }
        else if (typeof value === 'object' && value !== null) {
            // Recursively analyze nested objects
            schema[key] = analyzeRecordingResult(value, recording);
        }
        else {
            // Literal value - include as-is
            schema[key] = `Value: ${JSON.stringify(value)}`;
        }
    }
    return schema;
}
/**
 * Check if a value is an AIPromise
 */
export function isAIPromise(value) {
    return (value !== null &&
        typeof value === 'object' &&
        AI_PROMISE_SYMBOL in value &&
        value[AI_PROMISE_SYMBOL] === true);
}
/**
 * Get the raw AIPromise from a proxied value
 */
export function getRawPromise(value) {
    if (RAW_PROMISE_SYMBOL in value) {
        return value[RAW_PROMISE_SYMBOL];
    }
    return value;
}
// ============================================================================
// Factory Functions
// ============================================================================
/**
 * Create an AIPromise for text generation
 */
export function createTextPromise(prompt, options) {
    return new AIPromise(prompt, { ...options, type: 'text' });
}
/**
 * Create an AIPromise for object generation with dynamic schema
 */
export function createObjectPromise(prompt, options) {
    return new AIPromise(prompt, { ...options, type: 'object' });
}
/**
 * Create an AIPromise for list generation
 */
export function createListPromise(prompt, options) {
    return new AIPromise(prompt, { ...options, type: 'list' });
}
/**
 * Create an AIPromise for multiple lists generation
 */
export function createListsPromise(prompt, options) {
    return new AIPromise(prompt, { ...options, type: 'lists' });
}
/**
 * Create an AIPromise for boolean/is check
 */
export function createBooleanPromise(prompt, options) {
    return new AIPromise(prompt, { ...options, type: 'boolean' });
}
/**
 * Create an AIPromise for extraction
 */
export function createExtractPromise(prompt, options) {
    return new AIPromise(prompt, { ...options, type: 'extract' });
}
// ============================================================================
// Template Tag Helpers
// ============================================================================
/**
 * Parse template literals and track AIPromise dependencies
 */
export function parseTemplateWithDependencies(strings, ...values) {
    const dependencies = [];
    let prompt = '';
    for (let i = 0; i < strings.length; i++) {
        prompt += strings[i];
        if (i < values.length) {
            const value = values[i];
            if (isAIPromise(value)) {
                // Track as dependency
                const rawPromise = getRawPromise(value);
                const depKey = `dep_${dependencies.length}`;
                dependencies.push({ promise: rawPromise, path: rawPromise.path });
                prompt += `\${${depKey}}`;
            }
            else {
                // Inline the value
                prompt += String(value);
            }
        }
    }
    return { prompt, dependencies };
}
/**
 * Create a template function that returns AIPromise
 */
export function createAITemplateFunction(type, baseOptions) {
    function templateFn(promptOrStrings, ...args) {
        let prompt;
        let dependencies = [];
        let options = { ...baseOptions };
        if (Array.isArray(promptOrStrings) && 'raw' in promptOrStrings) {
            // Tagged template literal
            const parsed = parseTemplateWithDependencies(promptOrStrings, ...args);
            prompt = parsed.prompt;
            dependencies = parsed.dependencies;
        }
        else {
            // Regular function call
            prompt = promptOrStrings;
            if (args.length > 0 && typeof args[0] === 'object') {
                options = { ...options, ...args[0] };
            }
        }
        // If we're in recording mode (inside a .map() callback), capture this operation
        if (isInRecordingMode()) {
            const batchType = type === 'text' ? 'text' : type === 'boolean' ? 'boolean' : type === 'list' ? 'list' : 'object';
            captureOperation(prompt, batchType, options.baseSchema, options.system);
        }
        const promise = new AIPromise(prompt, { ...options, type });
        // Add dependencies
        for (const dep of dependencies) {
            promise.addDependency(dep.promise, dep.path);
        }
        return promise;
    }
    return templateFn;
}
