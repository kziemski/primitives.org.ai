/**
 * Props caching for ai-props
 *
 * Provides in-memory caching for generated props to avoid
 * redundant AI calls with the same context.
 *
 * @packageDocumentation
 */
/**
 * Default cache TTL (5 minutes)
 */
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000;
/**
 * Create a cache key from schema and context
 */
export function createCacheKey(schema, context) {
    const schemaStr = typeof schema === 'string' ? schema : JSON.stringify(schema);
    const contextStr = context ? JSON.stringify(sortObject(context)) : '';
    return `${hashString(schemaStr)}:${hashString(contextStr)}`;
}
/**
 * Simple string hash function
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
}
/**
 * Sort object keys for consistent hashing
 */
function sortObject(obj) {
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
        const value = obj[key];
        sorted[key] = value && typeof value === 'object' && !Array.isArray(value)
            ? sortObject(value)
            : value;
    }
    return sorted;
}
/**
 * In-memory props cache implementation
 */
export class MemoryPropsCache {
    cache = new Map();
    ttl;
    constructor(ttl = DEFAULT_CACHE_TTL) {
        this.ttl = ttl;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return undefined;
        }
        return entry;
    }
    set(key, props) {
        this.cache.set(key, {
            props,
            timestamp: Date.now(),
            key
        });
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
    /**
     * Remove expired entries
     */
    cleanup() {
        const now = Date.now();
        let removed = 0;
        for (const [key, entry] of this.cache) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key);
                removed++;
            }
        }
        return removed;
    }
    /**
     * Get all entries (for debugging)
     */
    entries() {
        return this.cache.entries();
    }
}
/**
 * Global default cache instance
 */
let defaultCache = null;
/**
 * Get or create the default cache
 */
export function getDefaultCache() {
    if (!defaultCache) {
        defaultCache = new MemoryPropsCache();
    }
    return defaultCache;
}
/**
 * Configure the default cache
 */
export function configureCache(ttl) {
    defaultCache = new MemoryPropsCache(ttl);
}
/**
 * Clear the default cache
 */
export function clearCache() {
    if (defaultCache) {
        defaultCache.clear();
    }
}
/**
 * LRU (Least Recently Used) cache implementation
 * For scenarios where memory usage needs to be bounded
 */
export class LRUPropsCache {
    cache = new Map();
    maxSize;
    ttl;
    constructor(maxSize = 100, ttl = DEFAULT_CACHE_TTL) {
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return undefined;
        }
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry;
    }
    set(key, props) {
        // Remove oldest entries if at capacity
        while (this.cache.size >= this.maxSize) {
            const oldest = this.cache.keys().next().value;
            if (oldest) {
                this.cache.delete(oldest);
            }
            else {
                break;
            }
        }
        this.cache.set(key, {
            props,
            timestamp: Date.now(),
            key
        });
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
}
