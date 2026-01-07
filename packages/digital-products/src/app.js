/**
 * App() - Define an application
 */
import { registerProduct } from './product.js';
/**
 * Create an application definition
 *
 * @example
 * ```ts
 * const myApp = App({
 *   id: 'my-app',
 *   name: 'My App',
 *   description: 'A web application',
 *   version: '1.0.0',
 *   framework: 'react',
 *   routes: [
 *     { path: '/', component: 'Home' },
 *     { path: '/about', component: 'About' },
 *     { path: '/users/:id', component: 'UserDetail' },
 *   ],
 *   state: {
 *     library: 'zustand',
 *     schema: {
 *       user: 'Current user object',
 *       settings: 'App settings object',
 *     },
 *   },
 *   auth: {
 *     provider: 'clerk',
 *     protectedRoutes: ['/dashboard', '/profile'],
 *   },
 * })
 * ```
 */
export function App(config) {
    const app = {
        type: 'app',
        id: config.id,
        name: config.name,
        description: config.description,
        version: config.version,
        framework: config.framework || 'react',
        routes: config.routes || [],
        config: config.config,
        state: config.state,
        auth: config.auth,
        deployments: config.deployments,
        metadata: config.metadata,
        tags: config.tags,
        status: config.status || 'active',
    };
    return registerProduct(app);
}
/**
 * Helper to create a route definition
 *
 * @example
 * ```ts
 * const userRoute = Route('/users/:id', 'UserDetail', {
 *   meta: { title: 'User Profile' },
 * })
 * ```
 */
export function Route(path, component, options) {
    return {
        path,
        component,
        ...options,
    };
}
/**
 * Helper to configure state management
 *
 * @example
 * ```ts
 * const state = State({
 *   library: 'zustand',
 *   schema: {
 *     user: 'Current user',
 *     settings: 'User settings',
 *   },
 *   persistence: {
 *     type: 'local',
 *     key: 'app-state',
 *   },
 * })
 * ```
 */
export function State(config) {
    return config;
}
/**
 * Helper to configure authentication
 *
 * @example
 * ```ts
 * const auth = Auth({
 *   provider: 'clerk',
 *   protectedRoutes: ['/dashboard', '/profile'],
 *   roles: ['admin', 'user'],
 * })
 * ```
 */
export function Auth(config) {
    return config;
}
