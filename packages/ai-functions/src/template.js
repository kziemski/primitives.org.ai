/**
 * Tagged template literal utilities
 *
 * Provides support for tagged template syntax across all AI functions:
 * - fn`prompt ${variable}` - template literal syntax
 * - Objects/arrays auto-convert to YAML
 * - Options chaining: fn`prompt`({ model: '...' })
 *
 * @packageDocumentation
 */
import { stringify } from 'yaml';
/**
 * Parse a tagged template literal into a prompt string
 * Objects and arrays are converted to YAML for readability
 */
export function parseTemplate(strings, ...values) {
    return strings.reduce((result, str, i) => {
        const value = values[i];
        if (value === undefined) {
            return result + str;
        }
        // Convert objects/arrays to YAML
        if (typeof value === 'object' && value !== null) {
            const yaml = stringify(value).trim();
            return result + str + '\n' + yaml;
        }
        // Primitives use toString()
        return result + str + String(value);
    }, '');
}
/**
 * Create a chainable promise that supports both await and options chaining
 */
export function createChainablePromise(executor, defaultOptions) {
    // Create the base promise
    const basePromise = executor(defaultOptions);
    // Create a function that accepts options
    const chainable = ((options) => {
        return executor({ ...defaultOptions, ...options });
    });
    // Make it thenable
    chainable.then = basePromise.then.bind(basePromise);
    chainable.catch = basePromise.catch.bind(basePromise);
    chainable.finally = basePromise.finally.bind(basePromise);
    return chainable;
}
/**
 * Create a function that supports both tagged templates and regular calls
 */
export function createTemplateFunction(handler) {
    function templateFn(promptOrStrings, ...args) {
        // Tagged template literal
        if (Array.isArray(promptOrStrings) && 'raw' in promptOrStrings) {
            const prompt = parseTemplate(promptOrStrings, ...args);
            return createChainablePromise((options) => handler(prompt, options));
        }
        // Regular function call
        return handler(promptOrStrings, args[0]);
    }
    return templateFn;
}
/**
 * Add batch capability to a template function
 */
export function withBatch(fn, batchHandler) {
    const batchable = fn;
    batchable.batch = batchHandler;
    return batchable;
}
/**
 * Create an async iterable from a streaming generator
 */
export function createAsyncIterable(items) {
    if (Array.isArray(items)) {
        return {
            async *[Symbol.asyncIterator]() {
                for (const item of items) {
                    yield item;
                }
            },
        };
    }
    return {
        [Symbol.asyncIterator]: items,
    };
}
export function createStreamableList(getItems, streamItems) {
    const promise = getItems();
    const asyncIterator = streamItems
        ? streamItems
        : async function* () {
            const items = await promise;
            for (const item of items) {
                yield item;
            }
        };
    // Create a proper Promise-like object with async iterator
    const result = Object.create(null);
    // Add Promise methods
    Object.defineProperty(result, 'then', {
        value: promise.then.bind(promise),
        writable: false,
        enumerable: false,
    });
    Object.defineProperty(result, 'catch', {
        value: promise.catch.bind(promise),
        writable: false,
        enumerable: false,
    });
    Object.defineProperty(result, 'finally', {
        value: promise.finally.bind(promise),
        writable: false,
        enumerable: false,
    });
    // Add async iterator
    Object.defineProperty(result, Symbol.asyncIterator, {
        value: asyncIterator,
        writable: false,
        enumerable: false,
    });
    // Add Symbol.toStringTag for Promise compatibility
    Object.defineProperty(result, Symbol.toStringTag, {
        value: 'Promise',
        writable: false,
        enumerable: false,
    });
    return result;
}
