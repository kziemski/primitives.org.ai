/**
 * Event handler registration using on.Noun.event syntax
 *
 * Usage:
 *   on.Customer.created(customer => { ... })
 *   on.Order.completed(order => { ... })
 *   on.Payment.failed(payment => { ... })
 */
/**
 * Registry of event handlers
 */
const eventRegistry = [];
/**
 * Get all registered event handlers
 */
export function getEventHandlers() {
    return [...eventRegistry];
}
/**
 * Clear all registered event handlers
 */
export function clearEventHandlers() {
    eventRegistry.length = 0;
}
/**
 * Register an event handler directly
 */
export function registerEventHandler(noun, event, handler) {
    eventRegistry.push({
        noun,
        event,
        handler,
        source: handler.toString(),
    });
}
/**
 * Create the `on` proxy
 *
 * This creates a proxy that allows:
 *   on.Customer.created(handler)
 *   on.Order.shipped(handler)
 *
 * The first property access captures the noun (Customer, Order)
 * The second property access captures the event (created, shipped)
 * The function call registers the handler
 */
function createOnProxy() {
    return new Proxy({}, {
        get(_target, noun) {
            // Return a proxy for the event level
            return new Proxy({}, {
                get(_eventTarget, event) {
                    // Return a function that registers the handler
                    return (handler) => {
                        registerEventHandler(noun, event, handler);
                    };
                }
            });
        }
    });
}
/**
 * The `on` object for registering event handlers
 *
 * @example
 * ```ts
 * import { on } from 'ai-workflows'
 *
 * on.Customer.created(async (customer, $) => {
 *   $.log('Customer created:', customer.name)
 *   await $.send('Email.welcome', { to: customer.email })
 * })
 *
 * on.Order.completed(async (order, $) => {
 *   $.log('Order completed:', order.id)
 * })
 * ```
 */
export const on = createOnProxy();
