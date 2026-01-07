/**
 * Digital Product Entity Types (Nouns)
 *
 * Comprehensive entity definitions for digital-products primitives.
 * Each entity follows the Noun pattern with Properties, Actions, and Events.
 *
 * Categories:
 * - products: Core product entities (DigitalProduct, SaaSProduct, App, Platform, Marketplace)
 * - interfaces: API & integration products (API, Endpoint, SDK, MCP, Plugin, Integration, Webhook)
 * - content: Content & data products (ContentProduct, DataProduct, Dataset, Documentation, Template)
 * - web: Web products (Site, Component, Widget, Theme)
 * - ai: AI-native products (AIProduct, Model, Agent, Prompt, Tool)
 * - lifecycle: Product lifecycle (Version, Release, Deployment, Environment, Feature)
 *
 * @packageDocumentation
 */
// =============================================================================
// Products (Core product entities)
// =============================================================================
export { DigitalProduct, SaaSProduct, App, Platform, Marketplace, ProductEntities, ProductCategories, } from './products.js';
// =============================================================================
// Interfaces (API & integration products)
// =============================================================================
export { API, Endpoint, SDK, MCP, Plugin, Integration, Webhook, InterfaceEntities, InterfaceCategories, } from './interfaces.js';
// =============================================================================
// Content (Content & data products)
// =============================================================================
export { ContentProduct, DataProduct, Dataset, Documentation, Template, ContentEntities, ContentCategories, } from './content.js';
// =============================================================================
// Web (Web products)
// =============================================================================
export { Site, Component, Widget, Theme, WebEntities, WebCategories, } from './web.js';
// =============================================================================
// AI (AI-native products)
// =============================================================================
export { AIProduct, Model, Agent, Prompt, Tool, AIEntities, AICategories, } from './ai.js';
// =============================================================================
// Lifecycle (Product lifecycle)
// =============================================================================
export { Version, Release, Deployment, Environment, Feature, LifecycleEntities, LifecycleCategories, } from './lifecycle.js';
// =============================================================================
// All Entities Collection
// =============================================================================
import { ProductEntities } from './products.js';
import { InterfaceEntities } from './interfaces.js';
import { ContentEntities } from './content.js';
import { WebEntities } from './web.js';
import { AIEntities } from './ai.js';
import { LifecycleEntities } from './lifecycle.js';
/**
 * All digital product entities organized by category
 */
export const AllDigitalProductEntities = {
    products: ProductEntities,
    interfaces: InterfaceEntities,
    content: ContentEntities,
    web: WebEntities,
    ai: AIEntities,
    lifecycle: LifecycleEntities,
};
/**
 * All entity category names
 */
export const DigitalProductEntityCategories = [
    'products',
    'interfaces',
    'content',
    'web',
    'ai',
    'lifecycle',
];
/**
 * Flat list of all entities for quick access
 */
export const Entities = {
    // Products
    ...ProductEntities,
    // Interfaces
    ...InterfaceEntities,
    // Content
    ...ContentEntities,
    // Web
    ...WebEntities,
    // AI
    ...AIEntities,
    // Lifecycle
    ...LifecycleEntities,
};
