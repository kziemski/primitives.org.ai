/**
 * Workflow context implementation
 */
/**
 * Create a workflow context
 */
export function createWorkflowContext(eventBus) {
    const workflowState = {
        context: {},
        history: [],
    };
    const addHistory = (entry) => {
        workflowState.history.push({
            ...entry,
            timestamp: Date.now(),
        });
    };
    // Create no-op proxies for on/every (these are used in send context, not workflow setup)
    const noOpOnProxy = new Proxy({}, {
        get() {
            return new Proxy({}, {
                get() {
                    return () => { };
                }
            });
        }
    });
    const noOpEveryProxy = new Proxy(function () { }, {
        get() {
            return () => () => { };
        },
        apply() { }
    });
    return {
        async send(event, data) {
            addHistory({ type: 'event', name: event, data });
            await eventBus.emit(event, data);
        },
        async do(_event, _data) {
            throw new Error('$.do not available in this context');
        },
        async try(_event, _data) {
            throw new Error('$.try not available in this context');
        },
        on: noOpOnProxy,
        every: noOpEveryProxy,
        state: workflowState.context,
        getState() {
            // Return a deep copy to prevent mutation
            return {
                current: workflowState.current,
                context: { ...workflowState.context },
                history: [...workflowState.history],
            };
        },
        set(key, value) {
            workflowState.context[key] = value;
        },
        get(key) {
            return workflowState.context[key];
        },
        log(message, data) {
            addHistory({ type: 'action', name: 'log', data: { message, data } });
            console.log(`[workflow] ${message}`, data ?? '');
        },
    };
}
/**
 * Create an isolated workflow context (not connected to event bus)
 * Useful for testing or standalone execution
 */
export function createIsolatedContext() {
    const emittedEvents = [];
    const ctx = createWorkflowContext({
        async emit(event, data) {
            emittedEvents.push({ event, data });
        },
    });
    return {
        ...ctx,
        getEmittedEvents: () => [...emittedEvents],
    };
}
