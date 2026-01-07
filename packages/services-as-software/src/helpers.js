/**
 * Helper functions for common service operations
 */
/**
 * Ask a question (helper for creating ask endpoints)
 *
 * @example
 * ```ts
 * const askEndpoint = Endpoint({
 *   name: 'ask',
 *   handler: ask(async (question, context) => {
 *     // Your Q&A logic here
 *     return `Answer to: ${question}`
 *   }),
 * })
 * ```
 */
export function ask(handler) {
    return async (input, serviceContext) => {
        return handler(input.question, input.context, serviceContext);
    };
}
/**
 * Deliver results (helper for creating deliver endpoints)
 *
 * @example
 * ```ts
 * const deliverEndpoint = Endpoint({
 *   name: 'deliver',
 *   handler: deliver(async (orderId, results) => {
 *     // Delivery logic here
 *     console.log(`Delivering order ${orderId}`)
 *   }),
 * })
 * ```
 */
export function deliver(handler) {
    return async (input, context) => {
        return handler(input.orderId, input.results, context);
    };
}
/**
 * Execute a task (helper for creating do endpoints)
 *
 * @example
 * ```ts
 * const doEndpoint = Endpoint({
 *   name: 'do',
 *   handler: do(async (action, input) => {
 *     switch (action) {
 *       case 'process':
 *         return { status: 'processed' }
 *       default:
 *         throw new Error(`Unknown action: ${action}`)
 *     }
 *   }),
 * })
 * ```
 */
export function do_(handler) {
    return async (input, context) => {
        return handler(input.action, input.input, context);
    };
}
/**
 * Generate content (helper for creating generate endpoints)
 *
 * @example
 * ```ts
 * const generateEndpoint = Endpoint({
 *   name: 'generate',
 *   handler: generate(async (prompt, options) => {
 *     // Generation logic here
 *     return { text: `Generated from: ${prompt}` }
 *   }),
 * })
 * ```
 */
export function generate(handler) {
    return async (input, context) => {
        return handler(input.prompt, input.options, context);
    };
}
/**
 * Type checking/validation (helper for creating is endpoints)
 *
 * @example
 * ```ts
 * const isEndpoint = Endpoint({
 *   name: 'is',
 *   handler: is(async (value, type) => {
 *     // Validation logic here
 *     return typeof value === type
 *   }),
 * })
 * ```
 */
export function is(handler) {
    return async (input, context) => {
        return handler(input.value, input.type, context);
    };
}
/**
 * Send notification (helper for creating notify endpoints)
 *
 * @example
 * ```ts
 * const notifyEndpoint = Endpoint({
 *   name: 'notify',
 *   handler: notify(async (notification) => {
 *     // Send notification via email, Slack, etc.
 *     console.log(`Sending notification: ${notification.subject}`)
 *   }),
 * })
 * ```
 */
export function notify(handler) {
    return async (input, context) => {
        return handler(input, context);
    };
}
/**
 * Event handler (helper for creating event handlers)
 *
 * @example
 * ```ts
 * service.on('order.created', on(async (order) => {
 *   console.log(`New order: ${order.id}`)
 * }))
 * ```
 */
export function on(handler) {
    return handler;
}
/**
 * Place an order (helper for creating order endpoints)
 *
 * @example
 * ```ts
 * const orderEndpoint = Endpoint({
 *   name: 'order',
 *   handler: order(async (product, quantity, context) => {
 *     const orderId = generateOrderId()
 *     return {
 *       id: orderId,
 *       customerId: context?.customerId || 'unknown',
 *       product,
 *       quantity,
 *       total: calculateTotal(product, quantity),
 *       currency: 'USD',
 *       status: 'pending',
 *       createdAt: new Date(),
 *       updatedAt: new Date(),
 *     }
 *   }),
 * })
 * ```
 */
export function order(handler) {
    return async (input, context) => {
        return handler(input.product, input.quantity, context);
    };
}
/**
 * Queue processor (helper for queue handlers)
 *
 * @example
 * ```ts
 * service.queue('process-orders', queue(async (job) => {
 *   console.log(`Processing job: ${job.id}`)
 * }))
 * ```
 */
export function queue(handler) {
    return handler;
}
/**
 * Request a quote (helper for creating quote endpoints)
 *
 * @example
 * ```ts
 * const quoteEndpoint = Endpoint({
 *   name: 'quote',
 *   handler: quote(async (product, quantity, context) => {
 *     const price = calculatePrice(product, quantity)
 *     return {
 *       id: generateQuoteId(),
 *       customerId: context?.customerId || 'unknown',
 *       product,
 *       quantity,
 *       price,
 *       currency: 'USD',
 *       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
 *     }
 *   }),
 * })
 * ```
 */
export function quote(handler) {
    return async (input, context) => {
        return handler(input.product, input.quantity, context);
    };
}
/**
 * Subscribe to a plan (helper for creating subscribe endpoints)
 *
 * @example
 * ```ts
 * const subscribeEndpoint = Endpoint({
 *   name: 'subscribe',
 *   handler: subscribe(async (planId, context) => {
 *     const plan = findPlan(planId)
 *     return {
 *       id: generateSubscriptionId(),
 *       customerId: context?.customerId || 'unknown',
 *       planId,
 *       status: 'active',
 *       currentPeriodStart: new Date(),
 *       currentPeriodEnd: getNextBillingDate(plan.pricing.interval),
 *     }
 *   }),
 * })
 * ```
 */
export function subscribe(handler) {
    return async (input, context) => {
        return handler(input.planId, context);
    };
}
/**
 * Scheduled task (helper for every/scheduled tasks)
 *
 * @example
 * ```ts
 * service.every('0 0 * * *', every(async () => {
 *   console.log('Running daily task')
 * }))
 * ```
 */
export function every(handler) {
    return handler;
}
/**
 * Get entitlements (helper for creating entitlements endpoints)
 *
 * @example
 * ```ts
 * const entitlementsEndpoint = Endpoint({
 *   name: 'entitlements',
 *   handler: entitlements(async (context) => {
 *     return context?.entitlements || []
 *   }),
 * })
 * ```
 */
export function entitlements(handler) {
    return async (_input, context) => {
        return handler(context);
    };
}
/**
 * Get KPIs (helper for creating KPI endpoints)
 *
 * @example
 * ```ts
 * const kpisEndpoint = Endpoint({
 *   name: 'kpis',
 *   handler: kpis(async () => {
 *     return {
 *       'revenue': 10000,
 *       'customers': 150,
 *       'satisfaction': 4.5,
 *     }
 *   }),
 * })
 * ```
 */
export function kpis(handler) {
    return async (_input, context) => {
        return handler(context);
    };
}
/**
 * Get OKRs (helper for creating OKR endpoints)
 *
 * @example
 * ```ts
 * const okrsEndpoint = Endpoint({
 *   name: 'okrs',
 *   handler: okrs(async () => {
 *     return [{
 *       id: 'okr-1',
 *       objective: 'Improve customer satisfaction',
 *       keyResults: [
 *         {
 *           description: 'Increase NPS score',
 *           measure: async () => 8.5,
 *           target: 9.0,
 *           unit: 'score',
 *         },
 *       ],
 *     }]
 *   }),
 * })
 * ```
 */
export function okrs(handler) {
    return async (_input, context) => {
        return handler(context);
    };
}
/**
 * Create a subscription plan
 *
 * @example
 * ```ts
 * const plan = Plan({
 *   id: 'pro',
 *   name: 'Pro Plan',
 *   description: 'For professional users',
 *   pricing: {
 *     model: 'subscription',
 *     basePrice: 49.99,
 *     currency: 'USD',
 *     interval: 'monthly',
 *   },
 *   entitlements: ['api-access', 'advanced-features'],
 *   features: ['Unlimited API calls', '24/7 support', 'Custom integrations'],
 *   limits: {
 *     'api-calls': 100000,
 *     'storage': 1000000000, // 1GB in bytes
 *   },
 * })
 * ```
 */
export function Plan(plan) {
    return plan;
}
/**
 * Create a KPI definition
 *
 * @example
 * ```ts
 * const kpi = KPI({
 *   id: 'monthly-revenue',
 *   name: 'Monthly Revenue',
 *   description: 'Total revenue for the current month',
 *   calculate: async () => {
 *     return await getMonthlyRevenue()
 *   },
 *   target: 100000,
 *   unit: 'USD',
 * })
 * ```
 */
export function KPI(kpi) {
    return kpi;
}
/**
 * Create an OKR definition
 *
 * @example
 * ```ts
 * const okr = OKR({
 *   id: 'q1-2024',
 *   objective: 'Grow user base by 50%',
 *   keyResults: [
 *     {
 *       description: 'Acquire 5000 new users',
 *       measure: async () => await getNewUserCount(),
 *       target: 5000,
 *       unit: 'users',
 *     },
 *   ],
 *   period: 'Q1 2024',
 *   owner: 'Growth Team',
 * })
 * ```
 */
export function OKR(okr) {
    return okr;
}
/**
 * Create an entitlement definition
 *
 * @example
 * ```ts
 * const entitlement = Entitlement({
 *   id: 'api-access',
 *   name: 'API Access',
 *   description: 'Access to the service API',
 *   resource: 'api',
 *   actions: ['read', 'write'],
 * })
 * ```
 */
export function Entitlement(entitlement) {
    return entitlement;
}
