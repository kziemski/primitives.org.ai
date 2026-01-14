/**
 * digital-products - Primitives for defining and building digital products
 *
 * This package provides primitives for defining digital products:
 * - Apps: Interactive user-facing applications
 * - APIs: Programmatic interfaces
 * - Content: Text/media content with schemas
 * - Data: Structured data definitions
 * - Datasets: Curated data collections
 * - Sites: Websites and documentation
 * - MCPs: Model Context Protocol servers
 * - SDKs: Software development kits
 *
 * @packageDocumentation
 */

// Export all types from types.ts
// This includes:
// - JSON-LD style interfaces: Product, App, API, Site, Service, Feature
// - Zod schemas: ProductSchema, AppSchema, APISchema, SiteSchema, ServiceSchema, FeatureSchema
// - Type guards: isProduct, isApp, isAPI, isSite, isService, isFeature
// - Factory functions: createProduct, createApp, createAPI, createSite, createService, createFeature
// - Legacy Definition interfaces for backwards compatibility
export * from './types.js'

// Export entity definitions (Nouns) as namespace to avoid conflicts with types
export * as Nouns from './entities/index.js'

// Also export individual entity collections for convenience
export {
  AllDigitalProductEntities,
  DigitalProductEntityCategories,
  Entities,
  // Category exports
  ProductEntities,
  ProductCategories,
  InterfaceEntities,
  InterfaceCategories,
  ContentEntities,
  ContentCategories,
  WebEntities,
  WebCategories,
  AIEntities,
  AICategories,
  LifecycleEntities,
  LifecycleCategories,
} from './entities/index.js'

// Export registry
export { registry } from './registry.js'

// Export builder functions (legacy API - these create Definition types, not JSON-LD types)
// These are exported as-is for backward compatibility with existing code
// Note: The interfaces Product, App, API, Site from types.ts are different from these functions
// The functions create *Definition types (AppDefinition, etc.), not JSON-LD types
export { Product as ProductBuilder, createProduct as createProductDefinition, registerProduct } from './product.js'
export { App as AppBuilder, Route, State, Auth } from './app.js'
export { API as APIBuilder, Endpoint, APIAuth, RateLimit } from './api.js'
export { Content, Workflow } from './content.js'
export { Data, Index, Relationship, Validate } from './data.js'
export { Dataset } from './dataset.js'
export { Site as SiteBuilder, Nav, SEO, Analytics } from './site.js'
export { MCP, Tool, Resource, Prompt, MCPConfig } from './mcp.js'
export { SDK, Export, Example } from './sdk.js'

// Re-export builder functions under original names for backwards compatibility
// This allows: import { Site } from 'digital-products'; Site({...})
// While also allowing: import { Site } from 'digital-products'; const x: Site = {...}
// TypeScript allows function and type/interface with same name
import { Product as ProductFn } from './product.js'
import { App as AppFn } from './app.js'
import { API as APIFn } from './api.js'
import { Site as SiteFn } from './site.js'

// Export functions - these shadow the type exports at runtime (which is fine, types are erased)
export { ProductFn as Product, AppFn as App, APIFn as API, SiteFn as Site }
