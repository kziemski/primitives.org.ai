/**
 * Tests for unified type system consolidation
 *
 * TDD RED PHASE - These tests WILL FAIL because the implementation doesn't exist yet.
 *
 * Goal: Consolidate to ONLY use JSON-LD style with $id, $type and add Zod schemas.
 * The old builder pattern types (id, type) should be rejected.
 *
 * @see https://schema.org.ai/Product
 */

import { describe, it, expect } from 'vitest'
import {
  // Core types (these exist as interfaces but need Zod schemas)
  Product, ProductSchema, isProduct, createProduct,
  App, AppSchema, isApp, createApp,
  API, APISchema, isAPI, createAPI,
  Site, SiteSchema, isSite, createSite,
  // New types to add
  Service, ServiceSchema, isService, createService,
  Feature, FeatureSchema, isFeature, createFeature
} from '../src/index.js'

describe('Unified Product Type', () => {
  const validProduct = {
    $id: 'https://schema.org.ai/products/acme',
    $type: 'https://schema.org.ai/Product' as const,
    name: 'Acme Product',
    description: 'A product',
    status: 'active' as const
  }

  it('should use $id and $type (JSON-LD style)', () => {
    expect(validProduct.$id).toBeDefined()
    expect(validProduct.$type).toBe('https://schema.org.ai/Product')
  })

  it('should NOT use plain id and type fields', () => {
    // This should fail - we want to enforce $id/$type
    const oldStyle = { id: 'test', type: 'product', name: 'Test' }
    const result = ProductSchema.safeParse(oldStyle)
    expect(result.success).toBe(false)
  })

  it('should validate with Zod schema', () => {
    const result = ProductSchema.safeParse(validProduct)
    expect(result.success).toBe(true)
  })

  it('should reject invalid status', () => {
    const invalid = { ...validProduct, status: 'invalid' }
    const result = ProductSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('isProduct type guard should work', () => {
    expect(isProduct(validProduct)).toBe(true)
    expect(isProduct({ id: 'old-style' })).toBe(false)
  })

  it('createProduct factory should create valid Product', () => {
    const product = createProduct({
      $id: 'https://schema.org.ai/products/new',
      name: 'New Product',
      description: 'A new product'
    })
    expect(product.$type).toBe('https://schema.org.ai/Product')
    expect(product.status).toBe('active') // default
    expect(isProduct(product)).toBe(true)
  })
})

describe('Unified App Type', () => {
  const validApp = {
    $id: 'https://schema.org.ai/apps/dashboard',
    $type: 'https://schema.org.ai/App' as const,
    name: 'Dashboard',
    description: 'Admin dashboard',
    status: 'active' as const,
    platform: 'web' as const,
    url: 'https://dashboard.example.com'
  }

  it('should extend Product with $type override', () => {
    expect(validApp.$type).toBe('https://schema.org.ai/App')
  })

  it('should have platform and url fields', () => {
    expect(validApp.platform).toBeDefined()
    expect(validApp.url).toBeDefined()
  })

  it('should validate platform enum', () => {
    const platforms = ['web', 'mobile', 'desktop', 'api']
    platforms.forEach(platform => {
      const result = AppSchema.safeParse({ ...validApp, platform })
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid platform', () => {
    const result = AppSchema.safeParse({ ...validApp, platform: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('isApp type guard should work', () => {
    expect(isApp(validApp)).toBe(true)
    expect(isApp({ type: 'app' })).toBe(false) // old style
  })

  it('createApp factory should work', () => {
    const app = createApp({
      $id: 'https://schema.org.ai/apps/new',
      name: 'New App',
      description: 'A new app',
      platform: 'web',
      url: 'https://new.app'
    })
    expect(app.$type).toBe('https://schema.org.ai/App')
    expect(isApp(app)).toBe(true)
  })
})

describe('Unified API Type', () => {
  const validAPI = {
    $id: 'https://schema.org.ai/apis/v1',
    $type: 'https://schema.org.ai/API' as const,
    name: 'API v1',
    description: 'REST API',
    status: 'active' as const,
    baseUrl: 'https://api.example.com/v1',
    version: '1.0.0',
    authentication: 'bearer' as const
  }

  it('should extend Product with $type override', () => {
    expect(validAPI.$type).toBe('https://schema.org.ai/API')
  })

  it('should have baseUrl, version, authentication', () => {
    expect(validAPI.baseUrl).toBeDefined()
    expect(validAPI.version).toBeDefined()
    expect(validAPI.authentication).toBeDefined()
  })

  it('should validate authentication enum', () => {
    const auths = ['bearer', 'api_key', 'oauth', 'none']
    auths.forEach(auth => {
      const result = APISchema.safeParse({ ...validAPI, authentication: auth })
      expect(result.success).toBe(true)
    })
  })

  it('isAPI type guard should work', () => {
    expect(isAPI(validAPI)).toBe(true)
    expect(isAPI({ type: 'api' })).toBe(false) // old style
  })

  it('createAPI factory should work', () => {
    const api = createAPI({
      $id: 'https://schema.org.ai/apis/new',
      name: 'New API',
      description: 'A new API',
      baseUrl: 'https://api.new.com',
      version: '1.0.0',
      authentication: 'bearer'
    })
    expect(api.$type).toBe('https://schema.org.ai/API')
    expect(isAPI(api)).toBe(true)
  })
})

describe('Unified Site Type', () => {
  const validSite = {
    $id: 'https://schema.org.ai/sites/docs',
    $type: 'https://schema.org.ai/Site' as const,
    name: 'Docs',
    description: 'Documentation site',
    status: 'active' as const,
    url: 'https://docs.example.com',
    siteType: 'docs' as const
  }

  it('should extend Product with $type override', () => {
    expect(validSite.$type).toBe('https://schema.org.ai/Site')
  })

  it('should have url and siteType', () => {
    expect(validSite.url).toBeDefined()
    expect(validSite.siteType).toBeDefined()
  })

  it('should validate siteType enum', () => {
    const types = ['marketing', 'docs', 'blog', 'app']
    types.forEach(siteType => {
      const result = SiteSchema.safeParse({ ...validSite, siteType })
      expect(result.success).toBe(true)
    })
  })

  it('isSite type guard should work', () => {
    expect(isSite(validSite)).toBe(true)
  })

  it('createSite factory should work', () => {
    const site = createSite({
      $id: 'https://schema.org.ai/sites/new',
      name: 'New Site',
      description: 'A new site',
      url: 'https://new.site',
      siteType: 'marketing'
    })
    expect(site.$type).toBe('https://schema.org.ai/Site')
    expect(isSite(site)).toBe(true)
  })
})

describe('Service Type', () => {
  const validService = {
    $id: 'https://schema.org.ai/services/auth',
    $type: 'https://schema.org.ai/Service' as const,
    name: 'Auth Service',
    description: 'Authentication service',
    status: 'active' as const,
    endpoints: ['/login', '/logout', '/refresh']
  }

  it('should have $id, $type, name, description', () => {
    expect(validService.$id).toBeDefined()
    expect(validService.$type).toBe('https://schema.org.ai/Service')
  })

  it('should validate with Zod schema', () => {
    const result = ServiceSchema.safeParse(validService)
    expect(result.success).toBe(true)
  })

  it('endpoints should be optional', () => {
    const noEndpoints = { ...validService, endpoints: undefined }
    const result = ServiceSchema.safeParse(noEndpoints)
    expect(result.success).toBe(true)
  })

  it('isService type guard should work', () => {
    expect(isService(validService)).toBe(true)
  })

  it('createService factory should work', () => {
    const service = createService({
      $id: 'https://schema.org.ai/services/new',
      name: 'New Service',
      description: 'A new service'
    })
    expect(service.$type).toBe('https://schema.org.ai/Service')
    expect(isService(service)).toBe(true)
  })
})

describe('Feature Type', () => {
  const validFeature = {
    $id: 'https://schema.org.ai/features/dark-mode',
    $type: 'https://schema.org.ai/Feature' as const,
    name: 'Dark Mode',
    description: 'Toggle dark theme',
    productId: 'https://schema.org.ai/products/dashboard',
    status: 'ga' as const
  }

  it('should have $id, $type, name, description', () => {
    expect(validFeature.$id).toBeDefined()
    expect(validFeature.$type).toBe('https://schema.org.ai/Feature')
  })

  it('should reference productId', () => {
    expect(validFeature.productId).toBeDefined()
  })

  it('status should be: draft, beta, ga, deprecated', () => {
    const statuses = ['draft', 'beta', 'ga', 'deprecated']
    statuses.forEach(status => {
      const result = FeatureSchema.safeParse({ ...validFeature, status })
      expect(result.success).toBe(true)
    })
  })

  it('isFeature type guard should work', () => {
    expect(isFeature(validFeature)).toBe(true)
  })

  it('createFeature factory should work', () => {
    const feature = createFeature({
      $id: 'https://schema.org.ai/features/new',
      name: 'New Feature',
      description: 'A new feature',
      productId: 'https://schema.org.ai/products/main'
    })
    expect(feature.$type).toBe('https://schema.org.ai/Feature')
    expect(feature.status).toBe('draft') // default
    expect(isFeature(feature)).toBe(true)
  })
})

// Test coverage for existing Definition types - ensure old style is rejected
describe('Type Coverage - Consolidation', () => {
  it('AppDefinition should be replaced by App with Zod', () => {
    // Old style should not work
    const oldStyle = {
      id: 'app-1',
      type: 'app',
      name: 'Old Style App',
      description: 'Uses old pattern',
      version: '1.0.0'
    }
    const result = AppSchema.safeParse(oldStyle)
    expect(result.success).toBe(false)
  })

  it('APIDefinition should be replaced by API with Zod', () => {
    const oldStyle = {
      id: 'api-1',
      type: 'api',
      name: 'Old Style API',
      description: 'Uses old pattern',
      version: '1.0.0'
    }
    const result = APISchema.safeParse(oldStyle)
    expect(result.success).toBe(false)
  })

  it('SiteDefinition should be replaced by Site with Zod', () => {
    const oldStyle = {
      id: 'site-1',
      type: 'site',
      name: 'Old Style Site',
      description: 'Uses old pattern',
      version: '1.0.0'
    }
    const result = SiteSchema.safeParse(oldStyle)
    expect(result.success).toBe(false)
  })

  it('DigitalProduct base type should be deprecated', () => {
    // Old DigitalProduct uses id/name/description/version/status
    // New Product uses $id/$type/name/description/status
    const oldDigitalProduct = {
      id: 'dp-1',
      name: 'Old',
      description: 'Old style',
      version: '1.0.0',
      status: 'active'
    }
    const result = ProductSchema.safeParse(oldDigitalProduct)
    expect(result.success).toBe(false)
  })
})

// Schema validation edge cases
describe('Schema Validation Edge Cases', () => {
  describe('ProductSchema', () => {
    it('should require $id', () => {
      const missing = {
        $type: 'https://schema.org.ai/Product' as const,
        name: 'Test',
        description: 'Test',
        status: 'active' as const
      }
      const result = ProductSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })

    it('should require $type', () => {
      const missing = {
        $id: 'https://schema.org.ai/products/test',
        name: 'Test',
        description: 'Test',
        status: 'active' as const
      }
      const result = ProductSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })

    it('should require name', () => {
      const missing = {
        $id: 'https://schema.org.ai/products/test',
        $type: 'https://schema.org.ai/Product' as const,
        description: 'Test',
        status: 'active' as const
      }
      const result = ProductSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })

    it('should require description', () => {
      const missing = {
        $id: 'https://schema.org.ai/products/test',
        $type: 'https://schema.org.ai/Product' as const,
        name: 'Test',
        status: 'active' as const
      }
      const result = ProductSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })

    it('should require status', () => {
      const missing = {
        $id: 'https://schema.org.ai/products/test',
        $type: 'https://schema.org.ai/Product' as const,
        name: 'Test',
        description: 'Test'
      }
      const result = ProductSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })
  })

  describe('AppSchema', () => {
    it('should require platform', () => {
      const missing = {
        $id: 'https://schema.org.ai/apps/test',
        $type: 'https://schema.org.ai/App' as const,
        name: 'Test',
        description: 'Test',
        status: 'active' as const,
        url: 'https://test.com'
      }
      const result = AppSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })

    it('should require url', () => {
      const missing = {
        $id: 'https://schema.org.ai/apps/test',
        $type: 'https://schema.org.ai/App' as const,
        name: 'Test',
        description: 'Test',
        status: 'active' as const,
        platform: 'web' as const
      }
      const result = AppSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })
  })

  describe('APISchema', () => {
    it('should require baseUrl', () => {
      const missing = {
        $id: 'https://schema.org.ai/apis/test',
        $type: 'https://schema.org.ai/API' as const,
        name: 'Test',
        description: 'Test',
        status: 'active' as const,
        version: '1.0.0',
        authentication: 'bearer' as const
      }
      const result = APISchema.safeParse(missing)
      expect(result.success).toBe(false)
    })

    it('should require version', () => {
      const missing = {
        $id: 'https://schema.org.ai/apis/test',
        $type: 'https://schema.org.ai/API' as const,
        name: 'Test',
        description: 'Test',
        status: 'active' as const,
        baseUrl: 'https://api.test.com',
        authentication: 'bearer' as const
      }
      const result = APISchema.safeParse(missing)
      expect(result.success).toBe(false)
    })

    it('should require authentication', () => {
      const missing = {
        $id: 'https://schema.org.ai/apis/test',
        $type: 'https://schema.org.ai/API' as const,
        name: 'Test',
        description: 'Test',
        status: 'active' as const,
        baseUrl: 'https://api.test.com',
        version: '1.0.0'
      }
      const result = APISchema.safeParse(missing)
      expect(result.success).toBe(false)
    })
  })

  describe('SiteSchema', () => {
    it('should require url', () => {
      const missing = {
        $id: 'https://schema.org.ai/sites/test',
        $type: 'https://schema.org.ai/Site' as const,
        name: 'Test',
        description: 'Test',
        status: 'active' as const,
        siteType: 'docs' as const
      }
      const result = SiteSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })

    it('should require siteType', () => {
      const missing = {
        $id: 'https://schema.org.ai/sites/test',
        $type: 'https://schema.org.ai/Site' as const,
        name: 'Test',
        description: 'Test',
        status: 'active' as const,
        url: 'https://test.com'
      }
      const result = SiteSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })
  })

  describe('ServiceSchema', () => {
    it('should allow empty endpoints array', () => {
      const withEmpty = {
        $id: 'https://schema.org.ai/services/test',
        $type: 'https://schema.org.ai/Service' as const,
        name: 'Test',
        description: 'Test',
        status: 'active' as const,
        endpoints: []
      }
      const result = ServiceSchema.safeParse(withEmpty)
      expect(result.success).toBe(true)
    })
  })

  describe('FeatureSchema', () => {
    it('should require productId', () => {
      const missing = {
        $id: 'https://schema.org.ai/features/test',
        $type: 'https://schema.org.ai/Feature' as const,
        name: 'Test',
        description: 'Test',
        status: 'draft' as const
      }
      const result = FeatureSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })

    it('should validate feature status enum', () => {
      const invalidStatus = {
        $id: 'https://schema.org.ai/features/test',
        $type: 'https://schema.org.ai/Feature' as const,
        name: 'Test',
        description: 'Test',
        productId: 'https://schema.org.ai/products/main',
        status: 'active' // 'active' is not valid for Feature - should be draft/beta/ga/deprecated
      }
      const result = FeatureSchema.safeParse(invalidStatus)
      expect(result.success).toBe(false)
    })
  })
})

// Type inference tests - ensure Zod infers correct TypeScript types
describe('Type Inference', () => {
  it('ProductSchema.parse should return Product type', () => {
    const input = {
      $id: 'https://schema.org.ai/products/test',
      $type: 'https://schema.org.ai/Product' as const,
      name: 'Test',
      description: 'Test',
      status: 'active' as const
    }
    const result = ProductSchema.parse(input)
    // TypeScript should infer result as Product type
    const _typeCheck: typeof result.$type = 'https://schema.org.ai/Product'
    expect(result.$type).toBe('https://schema.org.ai/Product')
  })

  it('AppSchema.parse should return App type', () => {
    const input = {
      $id: 'https://schema.org.ai/apps/test',
      $type: 'https://schema.org.ai/App' as const,
      name: 'Test',
      description: 'Test',
      status: 'active' as const,
      platform: 'web' as const,
      url: 'https://test.com'
    }
    const result = AppSchema.parse(input)
    const _typeCheck: typeof result.$type = 'https://schema.org.ai/App'
    expect(result.$type).toBe('https://schema.org.ai/App')
  })
})
