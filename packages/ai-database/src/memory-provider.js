/**
 * In-memory Database Provider
 *
 * Simple provider implementation for testing and development.
 * Includes concurrency control via Semaphore for rate limiting.
 */
// =============================================================================
// Semaphore for Concurrency Control
// =============================================================================
/**
 * Simple semaphore for concurrency control
 * Used to limit parallel operations (e.g., embedding, generation)
 */
export class Semaphore {
    concurrency;
    queue = [];
    running = 0;
    constructor(concurrency) {
        this.concurrency = concurrency;
    }
    /**
     * Acquire a slot. Returns a release function.
     */
    async acquire() {
        if (this.running < this.concurrency) {
            this.running++;
            return () => this.release();
        }
        return new Promise((resolve) => {
            this.queue.push(() => {
                this.running++;
                resolve(() => this.release());
            });
        });
    }
    release() {
        this.running--;
        const next = this.queue.shift();
        if (next)
            next();
    }
    /**
     * Run a function with concurrency control
     */
    async run(fn) {
        const release = await this.acquire();
        try {
            return await fn();
        }
        finally {
            release();
        }
    }
    /**
     * Run multiple functions with concurrency control
     */
    async map(items, fn) {
        return Promise.all(items.map((item) => this.run(() => fn(item))));
    }
    get pending() {
        return this.queue.length;
    }
    get active() {
        return this.running;
    }
}
// =============================================================================
// Generate ID
// =============================================================================
function generateId() {
    return crypto.randomUUID();
}
// =============================================================================
// Verb Conjugation (Linguistic Helpers)
// =============================================================================
/**
 * Conjugate a verb to get all forms
 *
 * @example
 * ```ts
 * conjugateVerb('create')
 * // => { action: 'create', act: 'creates', activity: 'creating' }
 *
 * conjugateVerb('publish')
 * // => { action: 'publish', act: 'publishes', activity: 'publishing' }
 * ```
 */
function conjugateVerb(verb) {
    const base = verb.toLowerCase();
    // Known verbs with pre-defined conjugations
    const known = {
        create: { act: 'creates', activity: 'creating' },
        update: { act: 'updates', activity: 'updating' },
        delete: { act: 'deletes', activity: 'deleting' },
        publish: { act: 'publishes', activity: 'publishing' },
        archive: { act: 'archives', activity: 'archiving' },
        generate: { act: 'generates', activity: 'generating' },
        process: { act: 'processes', activity: 'processing' },
        sync: { act: 'syncs', activity: 'syncing' },
        import: { act: 'imports', activity: 'importing' },
        export: { act: 'exports', activity: 'exporting' },
        run: { act: 'runs', activity: 'running' },
        execute: { act: 'executes', activity: 'executing' },
        send: { act: 'sends', activity: 'sending' },
        fetch: { act: 'fetches', activity: 'fetching' },
        build: { act: 'builds', activity: 'building' },
        deploy: { act: 'deploys', activity: 'deploying' },
    };
    if (known[base]) {
        return { action: base, ...known[base] };
    }
    // Auto-conjugate unknown verbs
    return {
        action: base,
        act: toPresent(base),
        activity: toGerund(base),
    };
}
/** Check if character is a vowel */
function isVowel(char) {
    return char ? 'aeiou'.includes(char.toLowerCase()) : false;
}
/** Check if we should double the final consonant */
function shouldDoubleConsonant(verb) {
    if (verb.length < 2)
        return false;
    const last = verb[verb.length - 1];
    const secondLast = verb[verb.length - 2];
    if ('wxy'.includes(last))
        return false;
    if (isVowel(last) || !isVowel(secondLast))
        return false;
    // Short words (3 letters) almost always double
    if (verb.length <= 3)
        return true;
    return false;
}
/** Convert verb to present 3rd person (create → creates) */
function toPresent(verb) {
    if (verb.endsWith('y') && !isVowel(verb[verb.length - 2])) {
        return verb.slice(0, -1) + 'ies';
    }
    if (verb.endsWith('s') || verb.endsWith('x') || verb.endsWith('z') ||
        verb.endsWith('ch') || verb.endsWith('sh')) {
        return verb + 'es';
    }
    return verb + 's';
}
/** Convert verb to gerund (create → creating) */
function toGerund(verb) {
    if (verb.endsWith('ie'))
        return verb.slice(0, -2) + 'ying';
    if (verb.endsWith('e') && !verb.endsWith('ee'))
        return verb.slice(0, -1) + 'ing';
    if (shouldDoubleConsonant(verb)) {
        return verb + verb[verb.length - 1] + 'ing';
    }
    return verb + 'ing';
}
// =============================================================================
// In-memory Provider
// =============================================================================
/**
 * In-memory storage for entities, relationships, events, actions, and artifacts
 */
export class MemoryProvider {
    // Things: type -> id -> entity
    entities = new Map();
    // Relationships: from:relation -> Set<to>
    relations = new Map();
    // Events: chronological log
    events = [];
    eventHandlers = new Map();
    // Actions: id -> action
    actions = new Map();
    // Artifacts: url:type -> artifact
    artifacts = new Map();
    // Concurrency control
    semaphore;
    constructor(options = {}) {
        this.semaphore = new Semaphore(options.concurrency ?? 10);
    }
    // ===========================================================================
    // Things (Records)
    // ===========================================================================
    getTypeStore(type) {
        if (!this.entities.has(type)) {
            this.entities.set(type, new Map());
        }
        return this.entities.get(type);
    }
    async get(type, id) {
        const store = this.getTypeStore(type);
        const entity = store.get(id);
        return entity ? { ...entity, $id: id, $type: type } : null;
    }
    async list(type, options) {
        const store = this.getTypeStore(type);
        let results = [];
        for (const [id, entity] of store) {
            const full = { ...entity, $id: id, $type: type };
            // Apply where filter
            if (options?.where) {
                let matches = true;
                for (const [key, value] of Object.entries(options.where)) {
                    if (full[key] !== value) {
                        matches = false;
                        break;
                    }
                }
                if (!matches)
                    continue;
            }
            results.push(full);
        }
        // Sort
        if (options?.orderBy) {
            const field = options.orderBy;
            const dir = options.order === 'desc' ? -1 : 1;
            results.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                if (aVal === undefined && bVal === undefined)
                    return 0;
                if (aVal === undefined)
                    return dir;
                if (bVal === undefined)
                    return -dir;
                if (aVal < bVal)
                    return -dir;
                if (aVal > bVal)
                    return dir;
                return 0;
            });
        }
        // Paginate
        if (options?.offset) {
            results = results.slice(options.offset);
        }
        if (options?.limit) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    async search(type, query, options) {
        const all = await this.list(type, options);
        const queryLower = query.toLowerCase();
        const fields = options?.fields || ['$all'];
        const scored = [];
        for (const entity of all) {
            let searchText;
            if (fields.includes('$all')) {
                searchText = JSON.stringify(entity).toLowerCase();
            }
            else {
                searchText = fields
                    .map((f) => String(entity[f] || ''))
                    .join(' ')
                    .toLowerCase();
            }
            if (searchText.includes(queryLower)) {
                const index = searchText.indexOf(queryLower);
                const score = 1 - index / searchText.length;
                if (!options?.minScore || score >= options.minScore) {
                    scored.push({ entity, score });
                }
            }
        }
        scored.sort((a, b) => b.score - a.score);
        return scored.map((s) => s.entity);
    }
    async create(type, id, data) {
        const store = this.getTypeStore(type);
        const entityId = id || generateId();
        if (store.has(entityId)) {
            throw new Error(`Entity already exists: ${type}/${entityId}`);
        }
        const entity = {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        store.set(entityId, entity);
        // Emit event
        await this.emit(`${type}.created`, { $id: entityId, $type: type, ...entity });
        return { ...entity, $id: entityId, $type: type };
    }
    async update(type, id, data) {
        const store = this.getTypeStore(type);
        const existing = store.get(id);
        if (!existing) {
            throw new Error(`Entity not found: ${type}/${id}`);
        }
        const updated = {
            ...existing,
            ...data,
            updatedAt: new Date().toISOString(),
        };
        store.set(id, updated);
        // Emit event
        await this.emit(`${type}.updated`, { $id: id, $type: type, ...updated });
        // Invalidate artifacts when data changes
        await this.invalidateArtifacts(`${type}/${id}`);
        return { ...updated, $id: id, $type: type };
    }
    async delete(type, id) {
        const store = this.getTypeStore(type);
        if (!store.has(id)) {
            return false;
        }
        store.delete(id);
        // Emit event
        await this.emit(`${type}.deleted`, { $id: id, $type: type });
        // Clean up relations
        for (const [key, targets] of this.relations) {
            if (key.startsWith(`${type}:${id}:`)) {
                this.relations.delete(key);
            }
            targets.delete(`${type}:${id}`);
        }
        // Clean up artifacts
        await this.deleteArtifact(`${type}/${id}`);
        return true;
    }
    // ===========================================================================
    // Relationships
    // ===========================================================================
    relationKey(fromType, fromId, relation) {
        return `${fromType}:${fromId}:${relation}`;
    }
    async related(type, id, relation) {
        const key = this.relationKey(type, id, relation);
        const targets = this.relations.get(key);
        if (!targets)
            return [];
        const results = [];
        for (const target of targets) {
            const [targetType, targetId] = target.split(':');
            const entity = await this.get(targetType, targetId);
            if (entity) {
                results.push(entity);
            }
        }
        return results;
    }
    async relate(fromType, fromId, relation, toType, toId) {
        const key = this.relationKey(fromType, fromId, relation);
        if (!this.relations.has(key)) {
            this.relations.set(key, new Set());
        }
        this.relations.get(key).add(`${toType}:${toId}`);
        // Emit event
        await this.emit('Relation.created', {
            from: `${fromType}/${fromId}`,
            type: relation,
            to: `${toType}/${toId}`,
        });
    }
    async unrelate(fromType, fromId, relation, toType, toId) {
        const key = this.relationKey(fromType, fromId, relation);
        const targets = this.relations.get(key);
        if (targets) {
            targets.delete(`${toType}:${toId}`);
            // Emit event
            await this.emit('Relation.deleted', {
                from: `${fromType}/${fromId}`,
                type: relation,
                to: `${toType}/${toId}`,
            });
        }
    }
    // ===========================================================================
    // Events (Actor-Event-Object-Result pattern)
    // ===========================================================================
    /**
     * Emit an event using Actor-Event-Object-Result pattern
     *
     * @example
     * ```ts
     * // New pattern
     * await provider.emit({
     *   actor: 'user:john',
     *   event: 'Post.created',
     *   object: 'Post/hello-world',
     *   objectData: { title: 'Hello World' },
     * })
     *
     * // Legacy pattern (still supported)
     * await provider.emit('Post.created', { title: 'Hello World' })
     * ```
     */
    async emit(eventOrType, data) {
        let event;
        if (typeof eventOrType === 'string') {
            // Legacy pattern: emit('Post.created', { ... })
            event = {
                id: generateId(),
                actor: 'system',
                event: eventOrType,
                objectData: data,
                timestamp: new Date(),
                // Legacy fields
                type: eventOrType,
                data,
            };
        }
        else {
            // New pattern: emit({ actor, event, object, ... })
            event = {
                id: generateId(),
                actor: eventOrType.actor ?? 'system',
                actorData: eventOrType.actorData,
                event: eventOrType.event,
                object: eventOrType.object,
                objectData: eventOrType.objectData,
                result: eventOrType.result,
                resultData: eventOrType.resultData,
                meta: eventOrType.meta,
                timestamp: new Date(),
                // Legacy fields
                type: eventOrType.event,
            };
        }
        this.events.push(event);
        // Trigger handlers (with concurrency control)
        const handlers = this.getEventHandlers(event.event);
        await this.semaphore.map(handlers, (handler) => Promise.resolve(handler(event)));
        return event;
    }
    getEventHandlers(type) {
        const handlers = [];
        for (const [pattern, patternHandlers] of this.eventHandlers) {
            if (this.matchesPattern(type, pattern)) {
                handlers.push(...patternHandlers);
            }
        }
        return handlers;
    }
    matchesPattern(type, pattern) {
        if (pattern === type)
            return true;
        if (pattern === '*')
            return true;
        if (pattern.endsWith('.*')) {
            const prefix = pattern.slice(0, -2);
            return type.startsWith(prefix + '.');
        }
        if (pattern.startsWith('*.')) {
            const suffix = pattern.slice(2);
            return type.endsWith('.' + suffix);
        }
        return false;
    }
    on(pattern, handler) {
        if (!this.eventHandlers.has(pattern)) {
            this.eventHandlers.set(pattern, []);
        }
        this.eventHandlers.get(pattern).push(handler);
        // Return unsubscribe function
        return () => {
            const handlers = this.eventHandlers.get(pattern);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index !== -1)
                    handlers.splice(index, 1);
            }
        };
    }
    async listEvents(options) {
        let results = [...this.events];
        // Filter by event pattern
        const eventPattern = options?.event ?? options?.type;
        if (eventPattern) {
            results = results.filter((e) => this.matchesPattern(e.event, eventPattern));
        }
        if (options?.actor) {
            results = results.filter((e) => e.actor === options.actor);
        }
        if (options?.object) {
            results = results.filter((e) => e.object === options.object);
        }
        if (options?.since) {
            results = results.filter((e) => e.timestamp >= options.since);
        }
        if (options?.until) {
            results = results.filter((e) => e.timestamp <= options.until);
        }
        if (options?.limit) {
            results = results.slice(-options.limit);
        }
        return results;
    }
    async replayEvents(options) {
        const events = await this.listEvents({
            event: options.event ?? options.type,
            actor: options.actor,
            since: options.since,
        });
        for (const event of events) {
            await this.semaphore.run(() => Promise.resolve(options.handler(event)));
        }
    }
    // ===========================================================================
    // Actions (Linguistic Verb Pattern)
    // ===========================================================================
    /**
     * Create an action with automatic verb conjugation
     *
     * @example
     * ```ts
     * // New pattern with verb conjugation
     * const action = await provider.createAction({
     *   actor: 'system',
     *   action: 'generate',  // auto-conjugates to act='generates', activity='generating'
     *   object: 'Post',
     *   objectData: { count: 100 },
     *   total: 100,
     * })
     *
     * // Legacy pattern (still supported)
     * const action = await provider.createAction({
     *   type: 'generate',
     *   data: { count: 100 },
     *   total: 100,
     * })
     * ```
     */
    async createAction(data) {
        // Get base verb from action or legacy type
        const baseVerb = data.action ?? data.type ?? 'process';
        // Auto-conjugate verb forms
        const conjugated = conjugateVerb(baseVerb);
        const action = {
            id: generateId(),
            actor: data.actor ?? 'system',
            actorData: data.actorData,
            act: conjugated.act,
            action: conjugated.action,
            activity: conjugated.activity,
            object: data.object,
            objectData: data.objectData ?? data.data,
            status: 'pending',
            progress: 0,
            total: data.total,
            meta: data.meta,
            createdAt: new Date(),
            // Legacy fields
            type: baseVerb,
            data: data.data,
        };
        this.actions.set(action.id, action);
        await this.emit({
            actor: action.actor,
            actorData: action.actorData,
            event: 'Action.created',
            object: action.id,
            objectData: { action: action.action, object: action.object },
        });
        return action;
    }
    async getAction(id) {
        return this.actions.get(id) ?? null;
    }
    async updateAction(id, updates) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action not found: ${id}`);
        }
        Object.assign(action, updates);
        if (updates.status === 'active' && !action.startedAt) {
            action.startedAt = new Date();
            await this.emit({
                actor: action.actor,
                event: 'Action.started',
                object: action.id,
                objectData: { action: action.action, activity: action.activity },
            });
        }
        if (updates.status === 'completed') {
            action.completedAt = new Date();
            await this.emit({
                actor: action.actor,
                event: 'Action.completed',
                object: action.id,
                objectData: { action: action.action },
                result: action.object,
                resultData: action.result,
            });
        }
        if (updates.status === 'failed') {
            action.completedAt = new Date();
            await this.emit({
                actor: action.actor,
                event: 'Action.failed',
                object: action.id,
                objectData: { action: action.action, error: action.error },
            });
        }
        if (updates.status === 'cancelled') {
            action.completedAt = new Date();
            await this.emit({
                actor: action.actor,
                event: 'Action.cancelled',
                object: action.id,
                objectData: { action: action.action },
            });
        }
        return action;
    }
    async listActions(options) {
        let results = Array.from(this.actions.values());
        if (options?.status) {
            results = results.filter((a) => a.status === options.status);
        }
        // Filter by action or legacy type
        const actionFilter = options?.action ?? options?.type;
        if (actionFilter) {
            results = results.filter((a) => a.action === actionFilter);
        }
        if (options?.actor) {
            results = results.filter((a) => a.actor === options.actor);
        }
        if (options?.object) {
            results = results.filter((a) => a.object === options.object);
        }
        if (options?.since) {
            results = results.filter((a) => a.createdAt >= options.since);
        }
        if (options?.until) {
            results = results.filter((a) => a.createdAt <= options.until);
        }
        if (options?.limit) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    async retryAction(id) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action not found: ${id}`);
        }
        if (action.status !== 'failed') {
            throw new Error(`Can only retry failed actions: ${id}`);
        }
        action.status = 'pending';
        action.error = undefined;
        action.startedAt = undefined;
        action.completedAt = undefined;
        await this.emit({
            actor: action.actor,
            event: 'Action.retried',
            object: action.id,
            objectData: { action: action.action },
        });
        return action;
    }
    async cancelAction(id) {
        const action = this.actions.get(id);
        if (!action) {
            throw new Error(`Action not found: ${id}`);
        }
        if (action.status === 'completed' || action.status === 'failed' || action.status === 'cancelled') {
            throw new Error(`Cannot cancel finished action: ${id}`);
        }
        action.status = 'cancelled';
        action.completedAt = new Date();
        await this.emit({
            actor: action.actor,
            event: 'Action.cancelled',
            object: action.id,
            objectData: { action: action.action },
        });
    }
    // ===========================================================================
    // Artifacts
    // ===========================================================================
    artifactKey(url, type) {
        return `${url}:${type}`;
    }
    async getArtifact(url, type) {
        return this.artifacts.get(this.artifactKey(url, type)) ?? null;
    }
    async setArtifact(url, type, data) {
        const artifact = {
            url,
            type,
            sourceHash: data.sourceHash,
            content: data.content,
            metadata: data.metadata,
            createdAt: new Date(),
        };
        this.artifacts.set(this.artifactKey(url, type), artifact);
    }
    async deleteArtifact(url, type) {
        if (type) {
            this.artifacts.delete(this.artifactKey(url, type));
        }
        else {
            // Delete all artifacts for this URL
            for (const key of this.artifacts.keys()) {
                if (key.startsWith(`${url}:`)) {
                    this.artifacts.delete(key);
                }
            }
        }
    }
    async invalidateArtifacts(url) {
        // Keep embedding artifact but mark others for regeneration
        for (const [key, artifact] of this.artifacts) {
            if (key.startsWith(`${url}:`) && artifact.type !== 'embedding') {
                this.artifacts.delete(key);
            }
        }
    }
    async listArtifacts(url) {
        const results = [];
        for (const [key, artifact] of this.artifacts) {
            if (key.startsWith(`${url}:`)) {
                results.push(artifact);
            }
        }
        return results;
    }
    // ===========================================================================
    // Utilities
    // ===========================================================================
    /**
     * Run an operation with concurrency control
     */
    async withConcurrency(fn) {
        return this.semaphore.run(fn);
    }
    /**
     * Run multiple operations with concurrency control
     */
    async mapWithConcurrency(items, fn) {
        return this.semaphore.map(items, fn);
    }
    /**
     * Clear all data (useful for testing)
     */
    clear() {
        this.entities.clear();
        this.relations.clear();
        this.events.length = 0;
        this.actions.clear();
        this.artifacts.clear();
        this.eventHandlers.clear();
    }
    /**
     * Get stats
     */
    stats() {
        let entityCount = 0;
        for (const store of this.entities.values()) {
            entityCount += store.size;
        }
        let relationCount = 0;
        for (const targets of this.relations.values()) {
            relationCount += targets.size;
        }
        const actionStats = { pending: 0, active: 0, completed: 0, failed: 0, cancelled: 0 };
        for (const action of this.actions.values()) {
            actionStats[action.status]++;
        }
        return {
            entities: entityCount,
            relations: relationCount,
            events: this.events.length,
            actions: actionStats,
            artifacts: this.artifacts.size,
            concurrency: {
                active: this.semaphore.active,
                pending: this.semaphore.pending,
            },
        };
    }
}
/**
 * Create an in-memory provider
 */
export function createMemoryProvider(options) {
    return new MemoryProvider(options);
}
