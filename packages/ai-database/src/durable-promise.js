/**
 * Durable Promise - Promise-like wrapper around database Actions
 *
 * Time is an implementation detail. Whether an operation takes 10ms or 10 hours,
 * the same code works. The DurablePromise persists its state as an Action,
 * allowing crash recovery, observability, and time-agnostic execution.
 *
 * @packageDocumentation
 */
const contextStack = [];
/**
 * Get the current execution context
 */
export function getCurrentContext() {
    return contextStack[contextStack.length - 1];
}
/**
 * Run code within an execution context
 */
export async function withContext(context, fn) {
    const parent = getCurrentContext();
    const merged = {
        priority: context.priority ?? parent?.priority ?? 'standard',
        provider: context.provider ?? parent?.provider,
        concurrencyKey: context.concurrencyKey ?? parent?.concurrencyKey,
        actor: context.actor ?? parent?.actor,
        batchWindow: context.batchWindow ?? parent?.batchWindow,
        onFlush: context.onFlush ?? parent?.onFlush,
    };
    contextStack.push(merged);
    try {
        return await fn();
    }
    finally {
        contextStack.pop();
    }
}
/**
 * Set global default context
 */
export function setDefaultContext(context) {
    if (contextStack.length === 0) {
        contextStack.push({
            priority: context.priority ?? 'standard',
            provider: context.provider,
            concurrencyKey: context.concurrencyKey,
            actor: context.actor,
            batchWindow: context.batchWindow,
            onFlush: context.onFlush,
        });
    }
    else {
        Object.assign(contextStack[0], context);
    }
}
// =============================================================================
// DurablePromise Class
// =============================================================================
/** Symbol to identify DurablePromise instances */
export const DURABLE_PROMISE_SYMBOL = Symbol.for('ai-database.DurablePromise');
/**
 * A Promise-like class that persists its state as an Action
 *
 * @example
 * ```ts
 * const promise = new DurablePromise({
 *   method: 'ai.generate',
 *   args: [{ prompt: 'Hello' }],
 *   executor: async () => await ai.generate({ prompt: 'Hello' }),
 *   priority: 'batch',
 * })
 *
 * // Access the underlying action
 * console.log(promise.actionId)
 *
 * // Await like a normal promise
 * const result = await promise
 * ```
 */
export class DurablePromise {
    [DURABLE_PROMISE_SYMBOL] = true;
    /** The Action ID backing this promise */
    actionId;
    /** The method being executed */
    method;
    /** The execution priority */
    priority;
    /** Dependencies that must complete first */
    dependsOn;
    state = {
        status: 'pending',
        resolvers: [],
    };
    action = null;
    provider = null;
    executor = null;
    startTime = Date.now();
    constructor(options) {
        const context = getCurrentContext();
        this.method = options.method;
        this.priority = options.priority ?? context?.priority ?? 'standard';
        this.dependsOn = options.dependsOn ?? [];
        this.provider = options.provider ?? context?.provider ?? null;
        this.executor = options.executor;
        this.actionId = crypto.randomUUID();
        // Create the action immediately if we have a provider
        if (this.provider) {
            this.initializeAction(options);
        }
        else {
            // Defer action creation but start execution
            this.executeDirectly();
        }
    }
    async initializeAction(options) {
        if (!this.provider)
            return;
        try {
            // Create the action record
            this.action = await this.provider.createAction({
                actor: options.actor ?? getCurrentContext()?.actor ?? 'system',
                action: this.parseActionVerb(this.method),
                object: this.method,
                objectData: {
                    method: this.method,
                    args: options.args,
                    priority: this.priority,
                    concurrencyKey: options.concurrencyKey,
                    deferUntil: options.deferUntil?.toISOString(),
                    dependsOn: this.dependsOn,
                },
                meta: options.meta,
            });
            this.action.id = this.actionId;
            // Check if we should defer execution
            if (this.priority === 'batch') {
                // Register with the batch scheduler instead of executing immediately
                const scheduler = getBatchScheduler();
                if (scheduler) {
                    scheduler.enqueue(this);
                    return;
                }
            }
            // Check dependencies
            if (this.dependsOn.length > 0) {
                await this.waitForDependencies();
            }
            // Execute
            await this.execute();
        }
        catch (error) {
            this.reject(error);
        }
    }
    parseActionVerb(method) {
        // Extract verb from method like 'ai.generate' -> 'generate'
        const parts = method.split('.');
        return parts[parts.length - 1] || 'process';
    }
    async waitForDependencies() {
        if (!this.provider || this.dependsOn.length === 0)
            return;
        // Poll for dependency completion
        const checkInterval = 100; // ms
        const maxWait = 24 * 60 * 60 * 1000; // 24 hours
        const startWait = Date.now();
        while (Date.now() - startWait < maxWait) {
            const pending = await this.provider.listActions({
                status: 'pending',
            });
            const active = await this.provider.listActions({
                status: 'active',
            });
            const blockedBy = [...pending, ...active]
                .filter((a) => this.dependsOn.includes(a.id))
                .map((a) => a.id);
            if (blockedBy.length === 0) {
                // All dependencies resolved
                return;
            }
            // Wait before checking again
            await new Promise((resolve) => setTimeout(resolve, checkInterval));
        }
        throw new Error(`Timeout waiting for dependencies: ${this.dependsOn.join(', ')}`);
    }
    async execute() {
        if (!this.executor) {
            throw new Error('No executor provided');
        }
        try {
            // Mark as active
            if (this.provider && this.action) {
                await this.provider.updateAction(this.actionId, { status: 'active' });
            }
            // Execute the actual work
            const result = await this.executor();
            // Mark as completed
            if (this.provider && this.action) {
                await this.provider.updateAction(this.actionId, {
                    status: 'completed',
                    result: { value: result },
                });
            }
            this.resolve(result);
        }
        catch (error) {
            // Mark as failed
            if (this.provider && this.action) {
                await this.provider.updateAction(this.actionId, {
                    status: 'failed',
                    error: error.message,
                });
            }
            this.reject(error);
        }
    }
    async executeDirectly() {
        if (!this.executor) {
            throw new Error('No executor provided');
        }
        try {
            const result = await this.executor();
            this.resolve(result);
        }
        catch (error) {
            this.reject(error);
        }
    }
    resolve(value) {
        if (this.state.status !== 'pending')
            return;
        this.state.status = 'resolved';
        this.state.value = value;
        for (const { resolve } of this.state.resolvers) {
            resolve(value);
        }
        this.state.resolvers = [];
    }
    reject(error) {
        if (this.state.status !== 'pending')
            return;
        this.state.status = 'rejected';
        this.state.error = error;
        for (const { reject } of this.state.resolvers) {
            reject(error);
        }
        this.state.resolvers = [];
    }
    /**
     * Implement PromiseLike interface
     */
    then(onfulfilled, onrejected) {
        return new Promise((resolve, reject) => {
            const handleResolve = (value) => {
                if (onfulfilled) {
                    try {
                        resolve(onfulfilled(value));
                    }
                    catch (e) {
                        reject(e);
                    }
                }
                else {
                    resolve(value);
                }
            };
            const handleReject = (error) => {
                if (onrejected) {
                    try {
                        resolve(onrejected(error));
                    }
                    catch (e) {
                        reject(e);
                    }
                }
                else {
                    reject(error);
                }
            };
            if (this.state.status === 'resolved') {
                handleResolve(this.state.value);
            }
            else if (this.state.status === 'rejected') {
                handleReject(this.state.error);
            }
            else {
                this.state.resolvers.push({
                    resolve: handleResolve,
                    reject: handleReject,
                });
            }
        });
    }
    /**
     * Catch handler
     */
    catch(onrejected) {
        return this.then(null, onrejected);
    }
    /**
     * Finally handler
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
    /**
     * Get the current status
     */
    get status() {
        if (this.action)
            return this.action.status;
        if (this.state.status === 'resolved')
            return 'completed';
        if (this.state.status === 'rejected')
            return 'failed';
        return 'pending';
    }
    /**
     * Get the underlying Action (if available)
     */
    async getAction() {
        if (this.action)
            return this.action;
        if (!this.provider)
            return null;
        return this.provider.getAction(this.actionId);
    }
    /**
     * Get the result with full metadata
     */
    async getResult() {
        const value = await this;
        const action = await this.getAction();
        return {
            value,
            action: action,
            duration: Date.now() - this.startTime,
        };
    }
    /**
     * Cancel the promise if still pending
     */
    async cancel() {
        if (this.state.status !== 'pending') {
            throw new Error('Cannot cancel a resolved or rejected promise');
        }
        if (this.provider) {
            await this.provider.cancelAction(this.actionId);
        }
        this.reject(new Error('Promise cancelled'));
    }
    /**
     * Retry a failed promise
     */
    async retry() {
        if (this.state.status !== 'rejected') {
            throw new Error('Can only retry failed promises');
        }
        if (this.provider) {
            await this.provider.retryAction(this.actionId);
        }
        // Re-execute
        this.state.status = 'pending';
        await this.execute();
        return this;
    }
}
/**
 * Check if a value is a DurablePromise
 */
export function isDurablePromise(value) {
    return (typeof value === 'object' &&
        value !== null &&
        DURABLE_PROMISE_SYMBOL in value &&
        value[DURABLE_PROMISE_SYMBOL] === true);
}
/**
 * Create a durable promise from an executor function
 */
export function durable(method, executor, options) {
    return new DurablePromise({
        method,
        executor,
        ...options,
    });
}
// =============================================================================
// Batch Scheduler Singleton
// =============================================================================
let batchScheduler = null;
/**
 * Get the global batch scheduler
 */
export function getBatchScheduler() {
    return batchScheduler;
}
/**
 * Set the global batch scheduler
 */
export function setBatchScheduler(scheduler) {
    batchScheduler = scheduler;
}
