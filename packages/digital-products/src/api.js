/**
 * API() - Define an API
 */
import { registerProduct } from './product.js';
/**
 * Create an API definition
 *
 * @example
 * ```ts
 * const myAPI = API({
 *   id: 'my-api',
 *   name: 'My API',
 *   description: 'A RESTful API',
 *   version: '1.0.0',
 *   style: 'rest',
 *   baseUrl: 'https://api.example.com',
 *   endpoints: [
 *     Endpoint('GET', '/users', 'List all users', {
 *       response: {
 *         users: ['Array of user objects'],
 *         total: 'Total count (number)',
 *       },
 *     }),
 *     Endpoint('POST', '/users', 'Create a user', {
 *       request: {
 *         name: 'User name',
 *         email: 'User email',
 *       },
 *       response: {
 *         id: 'User ID',
 *         name: 'User name',
 *         email: 'User email',
 *       },
 *     }),
 *   ],
 *   auth: {
 *     type: 'bearer',
 *     header: 'Authorization',
 *   },
 *   rateLimit: {
 *     requests: 100,
 *     window: 60,
 *   },
 * })
 * ```
 */
export function API(config) {
    const api = {
        type: 'api',
        id: config.id,
        name: config.name,
        description: config.description,
        version: config.version,
        style: config.style || 'rest',
        baseUrl: config.baseUrl,
        endpoints: config.endpoints || [],
        auth: config.auth,
        rateLimit: config.rateLimit,
        docsUrl: config.docsUrl,
        openapi: config.openapi,
        metadata: config.metadata,
        tags: config.tags,
        status: config.status || 'active',
    };
    return registerProduct(api);
}
/**
 * Helper to create an endpoint definition
 *
 * @example
 * ```ts
 * const endpoint = Endpoint('GET', '/users/:id', 'Get user by ID', {
 *   params: { id: 'User ID' },
 *   response: {
 *     id: 'User ID',
 *     name: 'User name',
 *     email: 'User email',
 *   },
 *   auth: true,
 * })
 * ```
 */
export function Endpoint(method, path, description, options) {
    return {
        method,
        path,
        description,
        ...options,
    };
}
/**
 * Helper to configure API authentication
 *
 * @example
 * ```ts
 * const auth = APIAuth({
 *   type: 'bearer',
 *   header: 'Authorization',
 * })
 *
 * const oauth = APIAuth({
 *   type: 'oauth2',
 *   oauth2: {
 *     authUrl: 'https://auth.example.com/authorize',
 *     tokenUrl: 'https://auth.example.com/token',
 *     scopes: ['read', 'write'],
 *   },
 * })
 * ```
 */
export function APIAuth(config) {
    return config;
}
/**
 * Helper to configure rate limiting
 *
 * @example
 * ```ts
 * const rateLimit = RateLimit({
 *   requests: 100,
 *   window: 60, // 60 seconds
 *   onExceeded: 'reject',
 * })
 * ```
 */
export function RateLimit(config) {
    return config;
}
