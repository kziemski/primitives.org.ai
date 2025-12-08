/**
 * Content Entity Types (Nouns)
 *
 * Content and data products: ContentProduct, DataProduct, Dataset, Documentation, Template
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// ContentProduct
// =============================================================================

/**
 * ContentProduct entity
 *
 * Text/media content as a product.
 */
export const ContentProduct: Noun = {
  singular: 'content-product',
  plural: 'content-products',
  description: 'A content-based digital product',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Content product name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Product description',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Content type',
      examples: ['course', 'book', 'newsletter', 'podcast', 'video-series', 'documentation', 'blog'],
    },
    format: {
      type: 'string',
      description: 'Primary format',
      examples: ['text', 'video', 'audio', 'interactive', 'mixed'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Content category',
    },

    // Structure
    contentFormat: {
      type: 'string',
      optional: true,
      description: 'File format',
      examples: ['markdown', 'mdx', 'html', 'json', 'yaml', 'pdf', 'epub'],
    },
    schema: {
      type: 'json',
      optional: true,
      description: 'Content schema for structured content',
    },
    frontmatterSchema: {
      type: 'json',
      optional: true,
      description: 'Frontmatter schema',
    },

    // Publishing
    publishingModel: {
      type: 'string',
      optional: true,
      description: 'Publishing model',
      examples: ['one-time', 'subscription', 'freemium', 'drip', 'cohort'],
    },
    updateFrequency: {
      type: 'string',
      optional: true,
      description: 'Update frequency',
      examples: ['one-time', 'daily', 'weekly', 'monthly', 'on-demand'],
    },

    // Access
    accessModel: {
      type: 'string',
      optional: true,
      description: 'Access model',
      examples: ['free', 'paid', 'subscription', 'gated', 'preview'],
    },
    previewPercent: {
      type: 'number',
      optional: true,
      description: 'Percentage available for preview',
    },

    // Metrics
    itemCount: {
      type: 'number',
      optional: true,
      description: 'Number of content items',
    },
    totalDuration: {
      type: 'number',
      optional: true,
      description: 'Total duration in minutes (for video/audio)',
    },
    wordCount: {
      type: 'number',
      optional: true,
      description: 'Total word count',
    },

    // Status
    status: {
      type: 'string',
      description: 'Product status',
      examples: ['draft', 'production', 'published', 'archived'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      description: 'Parent product',
    },
    items: {
      type: 'ContentItem[]',
      description: 'Content items',
    },
    categories: {
      type: 'Category[]',
      description: 'Content categories',
    },
    authors: {
      type: 'Author[]',
      description: 'Content authors',
    },
  },

  actions: [
    'create',
    'update',
    'addItem',
    'removeItem',
    'publish',
    'unpublish',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'itemAdded',
    'itemRemoved',
    'published',
    'unpublished',
    'archived',
  ],
}

// =============================================================================
// DataProduct
// =============================================================================

/**
 * DataProduct entity
 *
 * Structured data as a product.
 */
export const DataProduct: Noun = {
  singular: 'data-product',
  plural: 'data-products',
  description: 'A data-based digital product',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Data product name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Product description',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Data product type',
      examples: ['raw', 'derived', 'aggregated', 'enriched', 'curated', 'synthetic'],
    },
    domain: {
      type: 'string',
      optional: true,
      description: 'Data domain',
    },

    // Schema
    schema: {
      type: 'json',
      description: 'Data schema',
    },
    format: {
      type: 'string',
      optional: true,
      description: 'Data format',
      examples: ['json', 'csv', 'parquet', 'avro', 'protobuf', 'arrow'],
    },

    // Storage
    storageType: {
      type: 'string',
      optional: true,
      description: 'Storage backend',
      examples: ['postgres', 'mysql', 'mongo', 'clickhouse', 's3', 'bigquery', 'snowflake'],
    },
    sizeBytes: {
      type: 'number',
      optional: true,
      description: 'Data size in bytes',
    },
    recordCount: {
      type: 'number',
      optional: true,
      description: 'Number of records',
    },

    // Quality
    qualityScore: {
      type: 'number',
      optional: true,
      description: 'Data quality score (0-100)',
    },
    freshness: {
      type: 'string',
      optional: true,
      description: 'Data freshness',
      examples: ['realtime', 'hourly', 'daily', 'weekly', 'static'],
    },
    lastUpdatedAt: {
      type: 'date',
      optional: true,
      description: 'Last data update',
    },

    // Access
    accessMethod: {
      type: 'string',
      optional: true,
      description: 'Access method',
      examples: ['api', 'download', 'stream', 'query', 'embedded'],
    },
    apiEndpoint: {
      type: 'string',
      optional: true,
      description: 'API endpoint for access',
    },

    // Governance
    owner: {
      type: 'string',
      optional: true,
      description: 'Data owner',
    },
    classification: {
      type: 'string',
      optional: true,
      description: 'Data classification',
      examples: ['public', 'internal', 'confidential', 'restricted', 'pii'],
    },
    retentionDays: {
      type: 'number',
      optional: true,
      description: 'Data retention period in days',
    },

    // Status
    status: {
      type: 'string',
      description: 'Product status',
      examples: ['draft', 'active', 'deprecated', 'archived'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      description: 'Parent product',
    },
    datasets: {
      type: 'Dataset[]',
      description: 'Associated datasets',
    },
    api: {
      type: 'API',
      required: false,
      description: 'Access API',
    },
    lineage: {
      type: 'DataProduct[]',
      description: 'Source data products',
    },
  },

  actions: [
    'create',
    'update',
    'ingest',
    'transform',
    'publish',
    'unpublish',
    'deprecate',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'ingested',
    'transformed',
    'published',
    'unpublished',
    'deprecated',
    'archived',
  ],
}

// =============================================================================
// Dataset
// =============================================================================

/**
 * Dataset entity
 *
 * Curated data collection.
 */
export const Dataset: Noun = {
  singular: 'dataset',
  plural: 'datasets',
  description: 'A curated collection of data',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Dataset name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Dataset description',
    },

    // Schema
    schema: {
      type: 'json',
      description: 'Dataset schema',
    },
    format: {
      type: 'string',
      description: 'Data format',
      examples: ['json', 'jsonl', 'csv', 'parquet', 'arrow', 'avro'],
    },

    // Size
    recordCount: {
      type: 'number',
      optional: true,
      description: 'Number of records',
    },
    sizeBytes: {
      type: 'number',
      optional: true,
      description: 'Size in bytes',
    },
    columnCount: {
      type: 'number',
      optional: true,
      description: 'Number of columns/fields',
    },

    // Source
    source: {
      type: 'string',
      optional: true,
      description: 'Data source',
    },
    sourceUrl: {
      type: 'string',
      optional: true,
      description: 'Source URL',
    },
    collectionMethod: {
      type: 'string',
      optional: true,
      description: 'How data was collected',
      examples: ['scraped', 'api', 'manual', 'generated', 'aggregated'],
    },

    // Temporal
    startDate: {
      type: 'date',
      optional: true,
      description: 'Data start date',
    },
    endDate: {
      type: 'date',
      optional: true,
      description: 'Data end date',
    },
    updateFrequency: {
      type: 'string',
      optional: true,
      description: 'Update frequency',
      examples: ['static', 'daily', 'weekly', 'monthly', 'realtime'],
    },

    // License
    license: {
      type: 'string',
      optional: true,
      description: 'Data license',
      examples: ['mit', 'cc-by', 'cc-by-sa', 'cc0', 'proprietary', 'custom'],
    },
    usageRestrictions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Usage restrictions',
    },

    // Distribution
    downloadUrl: {
      type: 'string',
      optional: true,
      description: 'Download URL',
    },
    downloadFormats: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Available download formats',
    },

    // Status
    status: {
      type: 'string',
      description: 'Dataset status',
      examples: ['draft', 'published', 'deprecated', 'archived'],
    },
    version: {
      type: 'string',
      optional: true,
      description: 'Dataset version',
    },
  },

  relationships: {
    dataProduct: {
      type: 'DataProduct',
      required: false,
      description: 'Parent data product',
    },
    versions: {
      type: 'DatasetVersion[]',
      description: 'Dataset versions',
    },
  },

  actions: [
    'create',
    'update',
    'addRecords',
    'removeRecords',
    'publish',
    'version',
    'deprecate',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'recordsAdded',
    'recordsRemoved',
    'published',
    'versioned',
    'deprecated',
    'archived',
  ],
}

// =============================================================================
// Documentation
// =============================================================================

/**
 * Documentation entity
 *
 * Technical documentation product.
 */
export const Documentation: Noun = {
  singular: 'documentation',
  plural: 'documentations',
  description: 'Technical documentation for a product or API',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Documentation name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Documentation description',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Documentation type',
      examples: ['api', 'guide', 'reference', 'tutorial', 'howto', 'explanation', 'changelog'],
    },
    audience: {
      type: 'string',
      optional: true,
      description: 'Target audience',
      examples: ['developers', 'users', 'admins', 'everyone'],
    },

    // Structure
    format: {
      type: 'string',
      description: 'Content format',
      examples: ['markdown', 'mdx', 'rst', 'html', 'openapi'],
    },
    generator: {
      type: 'string',
      optional: true,
      description: 'Documentation generator',
      examples: ['fumadocs', 'docusaurus', 'mintlify', 'readme', 'gitbook', 'custom'],
    },
    sourceDir: {
      type: 'string',
      optional: true,
      description: 'Source content directory',
    },

    // Hosting
    url: {
      type: 'string',
      optional: true,
      description: 'Documentation URL',
    },
    customDomain: {
      type: 'string',
      optional: true,
      description: 'Custom domain',
    },

    // Features
    searchEnabled: {
      type: 'boolean',
      optional: true,
      description: 'Search functionality enabled',
    },
    versioned: {
      type: 'boolean',
      optional: true,
      description: 'Multi-version support',
    },
    i18n: {
      type: 'boolean',
      optional: true,
      description: 'Internationalization support',
    },
    languages: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Supported languages',
    },

    // Metrics
    pageCount: {
      type: 'number',
      optional: true,
      description: 'Number of pages',
    },
    lastUpdatedAt: {
      type: 'date',
      optional: true,
      description: 'Last content update',
    },

    // Status
    status: {
      type: 'string',
      description: 'Documentation status',
      examples: ['draft', 'published', 'archived'],
    },
    version: {
      type: 'string',
      optional: true,
      description: 'Documentation version',
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      required: false,
      description: 'Documented product',
    },
    api: {
      type: 'API',
      required: false,
      description: 'Documented API',
    },
    pages: {
      type: 'DocPage[]',
      description: 'Documentation pages',
    },
  },

  actions: [
    'create',
    'update',
    'addPage',
    'removePage',
    'publish',
    'version',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'pageAdded',
    'pageRemoved',
    'published',
    'versioned',
    'archived',
  ],
}

// =============================================================================
// Template
// =============================================================================

/**
 * Template entity
 *
 * Reusable template or starter.
 */
export const Template: Noun = {
  singular: 'template',
  plural: 'templates',
  description: 'A reusable template or starter project',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Template name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Template description',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Template type',
      examples: ['starter', 'boilerplate', 'scaffold', 'example', 'demo'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Template category',
    },
    tags: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Template tags',
    },

    // Technology
    framework: {
      type: 'string',
      optional: true,
      description: 'Primary framework',
    },
    language: {
      type: 'string',
      optional: true,
      description: 'Primary language',
    },
    stack: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Technology stack',
    },

    // Source
    repositoryUrl: {
      type: 'string',
      optional: true,
      description: 'Source repository URL',
    },
    branch: {
      type: 'string',
      optional: true,
      description: 'Git branch',
    },

    // Installation
    installCommand: {
      type: 'string',
      optional: true,
      description: 'Installation command',
    },
    scaffoldTool: {
      type: 'string',
      optional: true,
      description: 'Scaffolding tool',
      examples: ['create-next-app', 'degit', 'tiged', 'custom'],
    },

    // Configuration
    configurable: {
      type: 'boolean',
      optional: true,
      description: 'Has configuration options',
    },
    configSchema: {
      type: 'json',
      optional: true,
      description: 'Configuration schema',
    },

    // Metrics
    useCount: {
      type: 'number',
      optional: true,
      description: 'Number of uses/clones',
    },
    starCount: {
      type: 'number',
      optional: true,
      description: 'GitHub stars',
    },

    // Status
    status: {
      type: 'string',
      description: 'Template status',
      examples: ['draft', 'published', 'deprecated', 'archived'],
    },
    version: {
      type: 'string',
      optional: true,
      description: 'Template version',
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      required: false,
      description: 'Parent product',
    },
    examples: {
      type: 'Example[]',
      description: 'Usage examples',
    },
  },

  actions: [
    'create',
    'update',
    'publish',
    'clone',
    'fork',
    'deprecate',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'published',
    'cloned',
    'forked',
    'deprecated',
    'archived',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const ContentEntities = {
  ContentProduct,
  DataProduct,
  Dataset,
  Documentation,
  Template,
}

export const ContentCategories = {
  content: ['ContentProduct'],
  data: ['DataProduct', 'Dataset'],
  docs: ['Documentation'],
  templates: ['Template'],
} as const
