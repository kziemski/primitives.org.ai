/**
 * services-as-software - Primitives for building AI-powered services that operate as software
 *
 * Services are a superset of digital-workers with a payment/business overlay,
 * capable of crossing company/business boundaries.
 *
 * @packageDocumentation
 */
// Export entity definitions (Nouns)
export * from './entities/index.js';
// Core service primitives
export { Service } from './service.js';
export { Endpoint, GET, POST, PUT, DELETE, PATCH } from './endpoint.js';
export { Client } from './client.js';
export { Provider, providers } from './provider.js';
// Helper functions for common operations
export { ask, deliver, do_ as do, generate, is, notify, on, order, queue, quote, subscribe, every, entitlements, kpis, okrs, Plan, KPI, OKR, Entitlement, } from './helpers.js';
