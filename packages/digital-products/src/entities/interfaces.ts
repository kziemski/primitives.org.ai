/**
 * Interface Entity Types (Nouns)
 *
 * API and integration products: API, SDK, MCP, Plugin, Integration, Webhook
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// API
// =============================================================================

/**
 * API entity
 *
 * Programmatic interface product.
 */
export const API: Noun = {
  singular: 'api',
  plural: 'apis',
  description: 'A programmatic interface for accessing functionality or data',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'API name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'API description',
    },

    // Classification
    style: {
      type: 'string',
      description: 'API style',
      examples: ['rest', 'graphql', 'rpc', 'grpc', 'websocket', 'soap', 'odata'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'API category',
    },

    // Configuration
    baseUrl: {
      type: 'string',
      optional: true,
      description: 'Base URL',
    },
    version: {
      type: 'string',
      optional: true,
      description: 'API version',
    },
    versioningStrategy: {
      type: 'string',
      optional: true,
      description: 'Versioning strategy',
      examples: ['url', 'header', 'query', 'none'],
    },

    // Specification
    openApiSpec: {
      type: 'string',
      optional: true,
      description: 'OpenAPI specification URL',
    },
    graphqlSchema: {
      type: 'string',
      optional: true,
      description: 'GraphQL schema URL',
    },

    // Authentication
    authMethods: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Supported authentication methods',
      examples: ['api-key', 'bearer', 'oauth2', 'basic', 'jwt', 'mtls'],
    },
    scopes: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Available OAuth scopes',
    },

    // Rate Limiting
    rateLimit: {
      type: 'number',
      optional: true,
      description: 'Requests per minute limit',
    },
    rateLimitWindow: {
      type: 'number',
      optional: true,
      description: 'Rate limit window in seconds',
    },
    burstLimit: {
      type: 'number',
      optional: true,
      description: 'Burst request limit',
    },

    // Documentation
    docsUrl: {
      type: 'string',
      optional: true,
      description: 'API documentation URL',
    },
    changelogUrl: {
      type: 'string',
      optional: true,
      description: 'Changelog URL',
    },

    // Status
    status: {
      type: 'string',
      description: 'API status',
      examples: ['draft', 'alpha', 'beta', 'stable', 'deprecated', 'sunset'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      description: 'Parent product',
    },
    endpoints: {
      type: 'Endpoint[]',
      description: 'API endpoints',
    },
    sdks: {
      type: 'SDK[]',
      description: 'Available SDKs',
    },
    webhooks: {
      type: 'Webhook[]',
      description: 'Available webhooks',
    },
  },

  actions: [
    'create',
    'update',
    'publish',
    'addEndpoint',
    'removeEndpoint',
    'updateRateLimit',
    'deprecate',
    'sunset',
  ],

  events: [
    'created',
    'updated',
    'published',
    'endpointAdded',
    'endpointRemoved',
    'rateLimitUpdated',
    'deprecated',
    'sunset',
  ],
}

// =============================================================================
// Endpoint
// =============================================================================

/**
 * Endpoint entity
 *
 * Individual API endpoint.
 */
export const Endpoint: Noun = {
  singular: 'endpoint',
  plural: 'endpoints',
  description: 'An individual API endpoint',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Endpoint name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Endpoint description',
    },

    // HTTP
    method: {
      type: 'string',
      description: 'HTTP method',
      examples: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    },
    path: {
      type: 'string',
      description: 'URL path pattern',
    },

    // Parameters
    pathParams: {
      type: 'json',
      optional: true,
      description: 'Path parameters schema',
    },
    queryParams: {
      type: 'json',
      optional: true,
      description: 'Query parameters schema',
    },
    headers: {
      type: 'json',
      optional: true,
      description: 'Required headers',
    },

    // Body
    requestBody: {
      type: 'json',
      optional: true,
      description: 'Request body schema',
    },
    responseBody: {
      type: 'json',
      optional: true,
      description: 'Response body schema',
    },
    contentType: {
      type: 'string',
      optional: true,
      description: 'Content type',
      examples: ['application/json', 'multipart/form-data', 'text/plain'],
    },

    // Authentication
    requiresAuth: {
      type: 'boolean',
      optional: true,
      description: 'Requires authentication',
    },
    requiredScopes: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Required OAuth scopes',
    },

    // Rate Limiting
    rateLimit: {
      type: 'number',
      optional: true,
      description: 'Endpoint-specific rate limit',
    },

    // Caching
    cacheable: {
      type: 'boolean',
      optional: true,
      description: 'Response is cacheable',
    },
    cacheTTL: {
      type: 'number',
      optional: true,
      description: 'Cache TTL in seconds',
    },

    // Status
    status: {
      type: 'string',
      description: 'Endpoint status',
      examples: ['active', 'deprecated', 'removed'],
    },
  },

  relationships: {
    api: {
      type: 'API',
      description: 'Parent API',
    },
  },

  actions: [
    'create',
    'update',
    'enable',
    'disable',
    'deprecate',
    'remove',
  ],

  events: [
    'created',
    'updated',
    'enabled',
    'disabled',
    'deprecated',
    'removed',
  ],
}

// =============================================================================
// SDK
// =============================================================================

/**
 * SDK entity
 *
 * Software development kit for consuming APIs.
 */
export const SDK: Noun = {
  singular: 'sdk',
  plural: 'sdks',
  description: 'A software development kit for accessing an API',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'SDK name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'SDK description',
    },

    // Target
    language: {
      type: 'string',
      description: 'Target programming language',
      examples: ['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'csharp', 'ruby', 'php', 'swift', 'kotlin'],
    },
    runtime: {
      type: 'string',
      optional: true,
      description: 'Target runtime',
      examples: ['node', 'bun', 'deno', 'browser', 'native'],
    },

    // Package
    packageName: {
      type: 'string',
      optional: true,
      description: 'Package name',
    },
    version: {
      type: 'string',
      optional: true,
      description: 'Current version',
    },
    registry: {
      type: 'string',
      optional: true,
      description: 'Package registry',
      examples: ['npm', 'pypi', 'crates', 'maven', 'nuget', 'rubygems'],
    },

    // Installation
    installCommand: {
      type: 'string',
      optional: true,
      description: 'Installation command',
    },

    // Generation
    generator: {
      type: 'string',
      optional: true,
      description: 'SDK generator used',
      examples: ['openapi-generator', 'swagger-codegen', 'fern', 'speakeasy', 'custom'],
    },
    autoGenerated: {
      type: 'boolean',
      optional: true,
      description: 'Auto-generated from spec',
    },

    // Documentation
    docsUrl: {
      type: 'string',
      optional: true,
      description: 'SDK documentation URL',
    },
    repositoryUrl: {
      type: 'string',
      optional: true,
      description: 'Source repository URL',
    },

    // Status
    status: {
      type: 'string',
      description: 'SDK status',
      examples: ['alpha', 'beta', 'stable', 'deprecated'],
    },
  },

  relationships: {
    api: {
      type: 'API',
      description: 'Parent API',
    },
    exports: {
      type: 'SDKExport[]',
      description: 'Exported functions/classes',
    },
    examples: {
      type: 'SDKExample[]',
      description: 'Code examples',
    },
  },

  actions: [
    'create',
    'update',
    'generate',
    'publish',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'generated',
    'published',
    'deprecated',
  ],
}

// =============================================================================
// MCP
// =============================================================================

/**
 * MCP entity
 *
 * Model Context Protocol server for AI tool integration.
 */
export const MCP: Noun = {
  singular: 'mcp',
  plural: 'mcps',
  description: 'A Model Context Protocol server providing AI tools',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'MCP server name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Server description',
    },

    // Transport
    transport: {
      type: 'string',
      description: 'Transport protocol',
      examples: ['stdio', 'http', 'websocket', 'sse'],
    },

    // Configuration
    host: {
      type: 'string',
      optional: true,
      description: 'Server host',
    },
    port: {
      type: 'number',
      optional: true,
      description: 'Server port',
    },
    command: {
      type: 'string',
      optional: true,
      description: 'Stdio command',
    },
    args: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Command arguments',
    },

    // Capabilities
    toolCount: {
      type: 'number',
      optional: true,
      description: 'Number of tools provided',
    },
    resourceCount: {
      type: 'number',
      optional: true,
      description: 'Number of resources provided',
    },
    promptCount: {
      type: 'number',
      optional: true,
      description: 'Number of prompts provided',
    },

    // Authentication
    authRequired: {
      type: 'boolean',
      optional: true,
      description: 'Authentication required',
    },
    authType: {
      type: 'string',
      optional: true,
      description: 'Authentication type',
      examples: ['bearer', 'api-key', 'oauth2'],
    },

    // Status
    status: {
      type: 'string',
      description: 'Server status',
      examples: ['active', 'inactive', 'deprecated'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      description: 'Parent product',
    },
    tools: {
      type: 'Tool[]',
      description: 'Available tools',
    },
    resources: {
      type: 'Resource[]',
      description: 'Available resources',
    },
    prompts: {
      type: 'Prompt[]',
      description: 'Available prompts',
    },
  },

  actions: [
    'create',
    'update',
    'start',
    'stop',
    'restart',
    'addTool',
    'removeTool',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'started',
    'stopped',
    'restarted',
    'toolAdded',
    'toolRemoved',
    'deprecated',
  ],
}

// =============================================================================
// Plugin
// =============================================================================

/**
 * Plugin entity
 *
 * Extension for existing platforms or applications.
 */
export const Plugin: Noun = {
  singular: 'plugin',
  plural: 'plugins',
  description: 'An extension that adds functionality to a platform',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Plugin name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Plugin description',
    },

    // Target
    platform: {
      type: 'string',
      description: 'Target platform',
      examples: ['vscode', 'chrome', 'figma', 'slack', 'notion', 'shopify', 'wordpress'],
    },
    platformVersion: {
      type: 'string',
      optional: true,
      description: 'Minimum platform version',
    },

    // Package
    version: {
      type: 'string',
      optional: true,
      description: 'Plugin version',
    },
    author: {
      type: 'string',
      optional: true,
      description: 'Plugin author',
    },

    // Capabilities
    permissions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Required permissions',
    },
    extensionPoints: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Extension points used',
    },

    // Distribution
    marketplaceUrl: {
      type: 'string',
      optional: true,
      description: 'Marketplace listing URL',
    },
    installCount: {
      type: 'number',
      optional: true,
      description: 'Total install count',
    },
    rating: {
      type: 'number',
      optional: true,
      description: 'Average rating',
    },

    // Status
    status: {
      type: 'string',
      description: 'Plugin status',
      examples: ['draft', 'review', 'published', 'suspended', 'deprecated'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      description: 'Parent product',
    },
    versions: {
      type: 'Version[]',
      description: 'Plugin versions',
    },
  },

  actions: [
    'create',
    'update',
    'submit',
    'publish',
    'update',
    'suspend',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'submitted',
    'published',
    'suspended',
    'deprecated',
  ],
}

// =============================================================================
// Integration
// =============================================================================

/**
 * Integration entity
 *
 * Connection between two systems or platforms.
 */
export const Integration: Noun = {
  singular: 'integration',
  plural: 'integrations',
  description: 'A connection between systems enabling data or functionality sharing',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Integration name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Integration description',
    },

    // Connection
    sourceSystem: {
      type: 'string',
      description: 'Source system',
    },
    targetSystem: {
      type: 'string',
      description: 'Target system',
    },
    direction: {
      type: 'string',
      description: 'Data flow direction',
      examples: ['one-way', 'two-way', 'bidirectional'],
    },

    // Type
    type: {
      type: 'string',
      description: 'Integration type',
      examples: ['native', 'oauth', 'api-key', 'webhook', 'embedded', 'custom'],
    },
    protocol: {
      type: 'string',
      optional: true,
      description: 'Integration protocol',
      examples: ['rest', 'graphql', 'grpc', 'soap', 'sftp', 'custom'],
    },

    // Data
    dataTypes: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Types of data exchanged',
    },
    syncFrequency: {
      type: 'string',
      optional: true,
      description: 'Sync frequency',
      examples: ['realtime', 'hourly', 'daily', 'on-demand'],
    },

    // Configuration
    configSchema: {
      type: 'json',
      optional: true,
      description: 'Configuration schema',
    },
    requiredScopes: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Required OAuth scopes',
    },

    // Status
    status: {
      type: 'string',
      description: 'Integration status',
      examples: ['draft', 'active', 'paused', 'deprecated'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      description: 'Parent product',
    },
    sourceApi: {
      type: 'API',
      required: false,
      description: 'Source API',
    },
    targetApi: {
      type: 'API',
      required: false,
      description: 'Target API',
    },
    webhooks: {
      type: 'Webhook[]',
      description: 'Integration webhooks',
    },
  },

  actions: [
    'create',
    'update',
    'configure',
    'activate',
    'pause',
    'sync',
    'test',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'configured',
    'activated',
    'paused',
    'synced',
    'tested',
    'deprecated',
  ],
}

// =============================================================================
// Webhook
// =============================================================================

/**
 * Webhook entity
 *
 * Event-driven callback endpoint.
 */
export const Webhook: Noun = {
  singular: 'webhook',
  plural: 'webhooks',
  description: 'An event-driven HTTP callback endpoint',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Webhook name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Webhook description',
    },

    // Events
    events: {
      type: 'string',
      array: true,
      description: 'Events that trigger this webhook',
    },

    // Endpoint
    url: {
      type: 'string',
      description: 'Callback URL',
    },
    method: {
      type: 'string',
      optional: true,
      description: 'HTTP method',
      examples: ['POST', 'PUT'],
    },

    // Payload
    payloadSchema: {
      type: 'json',
      optional: true,
      description: 'Payload schema',
    },
    contentType: {
      type: 'string',
      optional: true,
      description: 'Content type',
      examples: ['application/json', 'application/x-www-form-urlencoded'],
    },

    // Security
    secret: {
      type: 'string',
      optional: true,
      description: 'Webhook secret for signature validation',
    },
    signatureHeader: {
      type: 'string',
      optional: true,
      description: 'Header name for signature',
    },
    signatureAlgorithm: {
      type: 'string',
      optional: true,
      description: 'Signature algorithm',
      examples: ['hmac-sha256', 'hmac-sha1'],
    },

    // Delivery
    retryPolicy: {
      type: 'string',
      optional: true,
      description: 'Retry policy',
      examples: ['none', 'exponential', 'linear', 'fixed'],
    },
    maxRetries: {
      type: 'number',
      optional: true,
      description: 'Maximum retry attempts',
    },
    timeoutMs: {
      type: 'number',
      optional: true,
      description: 'Request timeout in milliseconds',
    },

    // Status
    status: {
      type: 'string',
      description: 'Webhook status',
      examples: ['active', 'paused', 'failed', 'disabled'],
    },
    lastDeliveryAt: {
      type: 'date',
      optional: true,
      description: 'Last successful delivery',
    },
    failureCount: {
      type: 'number',
      optional: true,
      description: 'Consecutive failure count',
    },
  },

  relationships: {
    api: {
      type: 'API',
      required: false,
      description: 'Parent API',
    },
    integration: {
      type: 'Integration',
      required: false,
      description: 'Parent integration',
    },
    deliveries: {
      type: 'WebhookDelivery[]',
      description: 'Delivery history',
    },
  },

  actions: [
    'create',
    'update',
    'enable',
    'disable',
    'test',
    'retry',
    'resetSecret',
    'delete',
  ],

  events: [
    'created',
    'updated',
    'enabled',
    'disabled',
    'tested',
    'delivered',
    'failed',
    'retried',
    'deleted',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const InterfaceEntities = {
  API,
  Endpoint,
  SDK,
  MCP,
  Plugin,
  Integration,
  Webhook,
}

export const InterfaceCategories = {
  apis: ['API', 'Endpoint'],
  sdks: ['SDK'],
  ai: ['MCP'],
  extensions: ['Plugin'],
  connections: ['Integration', 'Webhook'],
} as const
