/**
 * Generic Product() constructor
 */
import { registry } from './registry.js';
/**
 * Create a generic digital product definition
 *
 * @example
 * ```ts
 * const product = Product({
 *   id: 'my-product',
 *   name: 'My Product',
 *   description: 'A digital product',
 *   version: '1.0.0',
 * })
 * ```
 */
export function Product(config) {
    const product = {
        id: config.id,
        name: config.name,
        description: config.description,
        version: config.version,
        metadata: config.metadata,
        tags: config.tags,
        status: config.status || 'active',
    };
    return product;
}
/**
 * Create and register a product in one step
 *
 * @example
 * ```ts
 * const product = createProduct({
 *   id: 'my-product',
 *   name: 'My Product',
 *   description: 'A digital product',
 *   version: '1.0.0',
 * })
 * ```
 */
export function createProduct(config) {
    const product = Product(config);
    return product;
}
/**
 * Create and register any product definition
 */
export function registerProduct(product) {
    registry.register(product);
    return product;
}
