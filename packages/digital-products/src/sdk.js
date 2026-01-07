/**
 * SDK() - Define a software development kit
 */
import { registerProduct } from './product.js';
/**
 * Create an SDK definition
 *
 * @example
 * ```ts
 * const mySDK = SDK({
 *   id: 'my-sdk',
 *   name: 'My SDK',
 *   description: 'JavaScript SDK for My API',
 *   version: '1.0.0',
 *   language: 'typescript',
 *   api: 'my-api',
 *   exports: [
 *     Export('function', 'createClient', 'Create an API client', {
 *       parameters: {
 *         apiKey: 'API key for authentication',
 *         baseUrl: 'Optional base URL',
 *       },
 *       returns: 'API client instance',
 *     }),
 *     Export('class', 'APIClient', 'Main API client', {
 *       methods: [
 *         Export('function', 'get', 'GET request', {
 *           parameters: { path: 'Request path' },
 *           returns: 'Response data',
 *         }),
 *         Export('function', 'post', 'POST request', {
 *           parameters: { path: 'Request path', data: 'Request body' },
 *           returns: 'Response data',
 *         }),
 *       ],
 *     }),
 *   ],
 *   install: 'npm install my-sdk',
 *   examples: [
 *     Example(
 *       'Basic Usage',
 *       'Create a client and make a request',
 *       `import { createClient } from 'my-sdk'
 *
 * const client = createClient({ apiKey: 'YOUR_API_KEY' })
 * const users = await client.get('/users')
 * console.log(users)`
 *     ),
 *   ],
 * })
 * ```
 */
export function SDK(config) {
    const sdk = {
        type: 'sdk',
        id: config.id,
        name: config.name,
        description: config.description,
        version: config.version,
        language: config.language,
        api: config.api,
        exports: config.exports,
        install: config.install,
        docs: config.docs,
        examples: config.examples,
        metadata: config.metadata,
        tags: config.tags,
        status: config.status || 'active',
    };
    return registerProduct(sdk);
}
/**
 * Helper to create an SDK export
 *
 * @example
 * ```ts
 * const fn = Export('function', 'calculateTotal', 'Calculate order total', {
 *   parameters: {
 *     items: ['Array of order items'],
 *     taxRate: 'Tax rate (number)',
 *   },
 *   returns: 'Total amount (number)',
 * })
 *
 * const cls = Export('class', 'OrderManager', 'Manage orders', {
 *   methods: [
 *     Export('function', 'create', 'Create order', {
 *       parameters: { order: 'Order data' },
 *       returns: 'Created order',
 *     }),
 *   ],
 * })
 * ```
 */
export function Export(type, name, description, options) {
    return {
        type,
        name,
        description,
        parameters: options?.parameters,
        returns: options?.returns,
        methods: options?.methods,
    };
}
/**
 * Helper to create an SDK example
 *
 * @example
 * ```ts
 * const example = Example(
 *   'Authentication',
 *   'How to authenticate with the API',
 *   `const client = createClient({
 *     apiKey: process.env.API_KEY,
 *   })`,
 *   '{ authenticated: true }'
 * )
 * ```
 */
export function Example(title, description, code, output) {
    return {
        title,
        description,
        code,
        output,
    };
}
