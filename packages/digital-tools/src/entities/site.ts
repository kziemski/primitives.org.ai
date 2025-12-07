/**
 * Site Entity Type (Noun)
 *
 * Represents a deployed web presence - a destination where users interact
 * with digital tools and content.
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// Site
// =============================================================================

/**
 * Site - A deployed web presence
 *
 * Represents any type of website, web application, or API endpoint.
 * The `type` property distinguishes between different kinds of sites:
 * - store: E-commerce storefront
 * - marketplace: Multi-vendor marketplace
 * - directory: Listings/directory site
 * - blog: Content/blog site
 * - docs: Documentation site
 * - forum: Community forum
 * - portal: Customer/partner portal
 * - dashboard: Admin/analytics dashboard
 * - app: Web application
 * - landing: Marketing landing page
 * - api: API endpoint/service
 */
export const Site: Noun = {
  singular: 'site',
  plural: 'sites',
  description: 'A deployed web presence (store, blog, docs, app, api, etc.)',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Site name',
    },
    slug: {
      type: 'string',
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Site description',
    },

    // Type
    type: {
      type: 'string',
      description: 'Site type',
      examples: ['store', 'marketplace', 'directory', 'blog', 'docs', 'forum', 'portal', 'dashboard', 'app', 'landing', 'api'],
    },

    // Domain
    domain: {
      type: 'string',
      optional: true,
      description: 'Primary domain',
    },
    customDomains: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Additional custom domains',
    },
    subdomain: {
      type: 'string',
      optional: true,
      description: 'Subdomain on platform domain',
    },

    // Status
    status: {
      type: 'string',
      description: 'Site status',
      examples: ['draft', 'published', 'archived', 'maintenance'],
    },
    publishedAt: {
      type: 'datetime',
      optional: true,
      description: 'When site was published',
    },

    // Appearance
    theme: {
      type: 'string',
      optional: true,
      description: 'Theme or template ID',
    },
    favicon: {
      type: 'url',
      optional: true,
      description: 'Favicon URL',
    },
    logo: {
      type: 'url',
      optional: true,
      description: 'Logo URL',
    },
    primaryColor: {
      type: 'string',
      optional: true,
      description: 'Primary brand color',
    },

    // SEO
    title: {
      type: 'string',
      optional: true,
      description: 'Default page title',
    },
    metaDescription: {
      type: 'string',
      optional: true,
      description: 'Default meta description',
    },
    ogImage: {
      type: 'url',
      optional: true,
      description: 'Default Open Graph image',
    },

    // Settings
    locale: {
      type: 'string',
      optional: true,
      description: 'Default locale',
    },
    timezone: {
      type: 'string',
      optional: true,
      description: 'Default timezone',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Default currency (for store/marketplace)',
    },

    // Access
    isPublic: {
      type: 'boolean',
      optional: true,
      description: 'Whether site is publicly accessible',
    },
    requiresAuth: {
      type: 'boolean',
      optional: true,
      description: 'Whether authentication is required',
    },
    allowedDomains: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Allowed email domains for access',
    },

    // Analytics
    analyticsId: {
      type: 'string',
      optional: true,
      description: 'Google Analytics or similar ID',
    },

    // Configuration (type-specific settings stored as JSON)
    config: {
      type: 'json',
      optional: true,
      description: 'Type-specific configuration',
    },
  },

  relationships: {
    owner: {
      type: 'Contact',
      description: 'Site owner',
    },
    team: {
      type: 'Contact[]',
      required: false,
      description: 'Team members with access',
    },
    deployments: {
      type: 'Deployment[]',
      required: false,
      description: 'Deployment history',
    },
  },

  actions: [
    'create',
    'update',
    'publish',
    'unpublish',
    'archive',
    'deploy',
    'addDomain',
    'removeDomain',
    'setTheme',
  ],

  events: [
    'created',
    'updated',
    'published',
    'unpublished',
    'archived',
    'deployed',
    'domainAdded',
    'domainRemoved',
    'themeChanged',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const SiteEntities = {
  Site,
}

export const SiteTypes = [
  'store',
  'marketplace',
  'directory',
  'blog',
  'docs',
  'forum',
  'portal',
  'dashboard',
  'app',
  'landing',
  'api',
] as const

export type SiteType = (typeof SiteTypes)[number]
