/**
 * NS - Namespace Durable Object
 *
 * Import from 'digital-objects/ns' when deploying to Cloudflare Workers.
 *
 * @example
 * ```typescript
 * // wrangler.jsonc
 * {
 *   "durable_objects": {
 *     "bindings": [{ "name": "NS", "class_name": "NS" }]
 *   }
 * }
 *
 * // worker.ts
 * export { NS } from 'digital-objects/ns'
 * ```
 */

export { NS } from './ns.js'
export type { Env } from './ns.js'
export { createNSClient } from './ns-client.js'
export type { NSClientOptions } from './ns-client.js'
