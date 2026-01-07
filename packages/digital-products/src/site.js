/**
 * Site() - Define a website
 */
import { registerProduct } from './product.js';
/**
 * Create a site definition
 *
 * @example
 * ```ts
 * const docsSite = Site({
 *   id: 'docs',
 *   name: 'Documentation Site',
 *   description: 'Product documentation',
 *   version: '1.0.0',
 *   generator: 'fumadocs',
 *   structure: {
 *     home: '/docs/index.mdx',
 *     docs: [
 *       '/docs/getting-started.mdx',
 *       '/docs/api-reference.mdx',
 *     ],
 *   },
 *   navigation: [
 *     Nav('Home', '/'),
 *     Nav('Docs', '/docs', {
 *       children: [
 *         Nav('Getting Started', '/docs/getting-started'),
 *         Nav('API Reference', '/docs/api-reference'),
 *       ],
 *     }),
 *   ],
 *   seo: {
 *     titleTemplate: '%s | My Product',
 *     description: 'Official documentation for My Product',
 *     keywords: ['docs', 'api', 'reference'],
 *   },
 *   analytics: {
 *     provider: 'plausible',
 *     id: 'docs.example.com',
 *   },
 * })
 * ```
 */
export function Site(config) {
    const site = {
        type: 'site',
        id: config.id,
        name: config.name,
        description: config.description,
        version: config.version,
        generator: config.generator || 'next',
        structure: config.structure,
        navigation: config.navigation,
        seo: config.seo,
        analytics: config.analytics,
        deployment: config.deployment,
        metadata: config.metadata,
        tags: config.tags,
        status: config.status || 'active',
    };
    return registerProduct(site);
}
/**
 * Helper to create a navigation item
 *
 * @example
 * ```ts
 * const nav = Nav('Documentation', '/docs', {
 *   icon: 'book',
 *   children: [
 *     Nav('Getting Started', '/docs/getting-started'),
 *     Nav('API Reference', '/docs/api'),
 *   ],
 * })
 * ```
 */
export function Nav(label, href, options) {
    return {
        label,
        href,
        ...options,
    };
}
/**
 * Helper to configure SEO
 *
 * @example
 * ```ts
 * const seo = SEO({
 *   titleTemplate: '%s | My Site',
 *   description: 'My awesome site',
 *   keywords: ['keyword1', 'keyword2'],
 *   ogImage: '/og-image.png',
 *   twitterCard: 'summary_large_image',
 * })
 * ```
 */
export function SEO(config) {
    return config;
}
/**
 * Helper to configure analytics
 *
 * @example
 * ```ts
 * const analytics = Analytics('google', 'G-XXXXXXXXXX')
 * const analytics = Analytics('plausible', 'example.com')
 * ```
 */
export function Analytics(provider, id, config) {
    return { provider, id, config };
}
