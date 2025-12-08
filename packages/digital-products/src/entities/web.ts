/**
 * Web Entity Types (Nouns)
 *
 * Web-based products: Site, Component, Widget, Theme
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// Site
// =============================================================================

/**
 * Site entity
 *
 * Website or web application.
 */
export const Site: Noun = {
  singular: 'site',
  plural: 'sites',
  description: 'A website or web application',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Site name',
    },
    slug: {
      type: 'string',
      optional: true,
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
      examples: ['marketing', 'documentation', 'blog', 'e-commerce', 'portal', 'dashboard', 'landing'],
    },

    // Technology
    framework: {
      type: 'string',
      optional: true,
      description: 'Framework/generator',
      examples: ['next', 'nuxt', 'astro', 'gatsby', 'remix', 'sveltekit', 'eleventy', 'hugo'],
    },
    renderingMode: {
      type: 'string',
      optional: true,
      description: 'Rendering mode',
      examples: ['static', 'ssr', 'spa', 'hybrid', 'isr'],
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
      description: 'Custom domains',
    },
    subdomain: {
      type: 'string',
      optional: true,
      description: 'Subdomain',
    },

    // Hosting
    hosting: {
      type: 'string',
      optional: true,
      description: 'Hosting platform',
      examples: ['vercel', 'netlify', 'cloudflare', 'aws', 'gcp', 'self-hosted'],
    },
    cdnEnabled: {
      type: 'boolean',
      optional: true,
      description: 'CDN enabled',
    },

    // SEO
    title: {
      type: 'string',
      optional: true,
      description: 'Site title',
    },
    metaDescription: {
      type: 'string',
      optional: true,
      description: 'Meta description',
    },
    ogImage: {
      type: 'string',
      optional: true,
      description: 'Open Graph image URL',
    },

    // Analytics
    analyticsProvider: {
      type: 'string',
      optional: true,
      description: 'Analytics provider',
      examples: ['google', 'plausible', 'fathom', 'posthog', 'mixpanel'],
    },
    analyticsId: {
      type: 'string',
      optional: true,
      description: 'Analytics tracking ID',
    },

    // Performance
    lighthouseScore: {
      type: 'number',
      optional: true,
      description: 'Lighthouse performance score',
    },
    coreWebVitals: {
      type: 'json',
      optional: true,
      description: 'Core Web Vitals metrics',
    },

    // Status
    status: {
      type: 'string',
      description: 'Site status',
      examples: ['draft', 'development', 'staging', 'production', 'archived'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      required: false,
      description: 'Parent product',
    },
    pages: {
      type: 'Page[]',
      description: 'Site pages',
    },
    deployments: {
      type: 'Deployment[]',
      description: 'Site deployments',
    },
    theme: {
      type: 'Theme',
      required: false,
      description: 'Applied theme',
    },
  },

  actions: [
    'create',
    'update',
    'build',
    'deploy',
    'addDomain',
    'removeDomain',
    'updateSEO',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'built',
    'deployed',
    'domainAdded',
    'domainRemoved',
    'seoUpdated',
    'archived',
  ],
}

// =============================================================================
// Component
// =============================================================================

/**
 * Component entity
 *
 * Reusable UI component.
 */
export const Component: Noun = {
  singular: 'component',
  plural: 'components',
  description: 'A reusable UI component',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Component name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Component description',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Component type',
      examples: ['primitive', 'composite', 'layout', 'form', 'data-display', 'navigation', 'feedback'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Component category',
    },

    // Technology
    framework: {
      type: 'string',
      description: 'Target framework',
      examples: ['react', 'vue', 'svelte', 'solid', 'angular', 'web-components'],
    },
    language: {
      type: 'string',
      optional: true,
      description: 'Language',
      examples: ['typescript', 'javascript'],
    },

    // Interface
    propsSchema: {
      type: 'json',
      optional: true,
      description: 'Props/attributes schema',
    },
    slotsSchema: {
      type: 'json',
      optional: true,
      description: 'Slots schema',
    },
    eventsSchema: {
      type: 'json',
      optional: true,
      description: 'Events emitted',
    },

    // Styling
    styleApproach: {
      type: 'string',
      optional: true,
      description: 'Styling approach',
      examples: ['css-modules', 'tailwind', 'styled-components', 'css-in-js', 'vanilla'],
    },
    themeable: {
      type: 'boolean',
      optional: true,
      description: 'Supports theming',
    },

    // Accessibility
    a11yCompliant: {
      type: 'boolean',
      optional: true,
      description: 'WCAG compliant',
    },
    a11yLevel: {
      type: 'string',
      optional: true,
      description: 'WCAG compliance level',
      examples: ['A', 'AA', 'AAA'],
    },

    // Package
    packageName: {
      type: 'string',
      optional: true,
      description: 'npm package name',
    },
    version: {
      type: 'string',
      optional: true,
      description: 'Component version',
    },

    // Documentation
    storybookUrl: {
      type: 'string',
      optional: true,
      description: 'Storybook URL',
    },
    docsUrl: {
      type: 'string',
      optional: true,
      description: 'Documentation URL',
    },

    // Status
    status: {
      type: 'string',
      description: 'Component status',
      examples: ['draft', 'alpha', 'beta', 'stable', 'deprecated'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      required: false,
      description: 'Parent product',
    },
    variants: {
      type: 'ComponentVariant[]',
      description: 'Component variants',
    },
    dependencies: {
      type: 'Component[]',
      description: 'Dependent components',
    },
  },

  actions: [
    'create',
    'update',
    'addVariant',
    'removeVariant',
    'publish',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'variantAdded',
    'variantRemoved',
    'published',
    'deprecated',
  ],
}

// =============================================================================
// Widget
// =============================================================================

/**
 * Widget entity
 *
 * Embeddable UI element.
 */
export const Widget: Noun = {
  singular: 'widget',
  plural: 'widgets',
  description: 'An embeddable UI element for external sites',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Widget name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Widget description',
    },

    // Type
    type: {
      type: 'string',
      description: 'Widget type',
      examples: ['chat', 'form', 'badge', 'button', 'carousel', 'feed', 'player', 'tracker'],
    },

    // Embedding
    embedType: {
      type: 'string',
      description: 'Embed method',
      examples: ['script', 'iframe', 'web-component', 'react', 'snippet'],
    },
    embedCode: {
      type: 'string',
      optional: true,
      description: 'Embed code snippet',
    },
    scriptUrl: {
      type: 'string',
      optional: true,
      description: 'Widget script URL',
    },

    // Configuration
    configSchema: {
      type: 'json',
      optional: true,
      description: 'Configuration schema',
    },
    defaultConfig: {
      type: 'json',
      optional: true,
      description: 'Default configuration',
    },

    // Dimensions
    width: {
      type: 'string',
      optional: true,
      description: 'Default width',
    },
    height: {
      type: 'string',
      optional: true,
      description: 'Default height',
    },
    responsive: {
      type: 'boolean',
      optional: true,
      description: 'Responsive design',
    },

    // Styling
    customizable: {
      type: 'boolean',
      optional: true,
      description: 'Styling customizable',
    },
    themeOptions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Theme options',
    },

    // Security
    allowedDomains: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Allowed embed domains',
    },
    sandboxed: {
      type: 'boolean',
      optional: true,
      description: 'Runs in sandbox',
    },

    // Metrics
    embedCount: {
      type: 'number',
      optional: true,
      description: 'Number of active embeds',
    },
    impressions: {
      type: 'number',
      optional: true,
      description: 'Total impressions',
    },

    // Status
    status: {
      type: 'string',
      description: 'Widget status',
      examples: ['draft', 'active', 'deprecated'],
    },
    version: {
      type: 'string',
      optional: true,
      description: 'Widget version',
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      required: false,
      description: 'Parent product',
    },
    instances: {
      type: 'WidgetInstance[]',
      description: 'Widget instances',
    },
  },

  actions: [
    'create',
    'update',
    'configure',
    'publish',
    'embed',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'configured',
    'published',
    'embedded',
    'deprecated',
  ],
}

// =============================================================================
// Theme
// =============================================================================

/**
 * Theme entity
 *
 * Visual styling package.
 */
export const Theme: Noun = {
  singular: 'theme',
  plural: 'themes',
  description: 'A visual styling package for sites or apps',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Theme name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Theme description',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Theme type',
      examples: ['light', 'dark', 'high-contrast', 'custom'],
    },
    style: {
      type: 'string',
      optional: true,
      description: 'Design style',
      examples: ['minimal', 'modern', 'classic', 'playful', 'corporate', 'brutalist'],
    },

    // Target
    targetPlatform: {
      type: 'string',
      optional: true,
      description: 'Target platform',
      examples: ['web', 'mobile', 'desktop', 'universal'],
    },
    targetFramework: {
      type: 'string',
      optional: true,
      description: 'Target framework',
    },

    // Colors
    colorPalette: {
      type: 'json',
      optional: true,
      description: 'Color palette',
    },
    primaryColor: {
      type: 'string',
      optional: true,
      description: 'Primary brand color',
    },
    accentColor: {
      type: 'string',
      optional: true,
      description: 'Accent color',
    },

    // Typography
    fontFamily: {
      type: 'string',
      optional: true,
      description: 'Primary font family',
    },
    headingFont: {
      type: 'string',
      optional: true,
      description: 'Heading font family',
    },
    fontSize: {
      type: 'json',
      optional: true,
      description: 'Font size scale',
    },

    // Spacing
    spacing: {
      type: 'json',
      optional: true,
      description: 'Spacing scale',
    },
    borderRadius: {
      type: 'json',
      optional: true,
      description: 'Border radius scale',
    },

    // Variables
    cssVariables: {
      type: 'json',
      optional: true,
      description: 'CSS custom properties',
    },
    designTokens: {
      type: 'json',
      optional: true,
      description: 'Design tokens',
    },

    // Preview
    previewUrl: {
      type: 'string',
      optional: true,
      description: 'Preview URL',
    },
    thumbnailUrl: {
      type: 'string',
      optional: true,
      description: 'Thumbnail image URL',
    },

    // Package
    packageName: {
      type: 'string',
      optional: true,
      description: 'npm package name',
    },
    version: {
      type: 'string',
      optional: true,
      description: 'Theme version',
    },

    // Status
    status: {
      type: 'string',
      description: 'Theme status',
      examples: ['draft', 'published', 'deprecated'],
    },
  },

  relationships: {
    product: {
      type: 'DigitalProduct',
      required: false,
      description: 'Parent product',
    },
    sites: {
      type: 'Site[]',
      description: 'Sites using this theme',
    },
    variants: {
      type: 'Theme[]',
      description: 'Theme variants',
    },
  },

  actions: [
    'create',
    'update',
    'customize',
    'publish',
    'apply',
    'export',
    'deprecate',
  ],

  events: [
    'created',
    'updated',
    'customized',
    'published',
    'applied',
    'exported',
    'deprecated',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const WebEntities = {
  Site,
  Component,
  Widget,
  Theme,
}

export const WebCategories = {
  sites: ['Site'],
  ui: ['Component', 'Widget'],
  styling: ['Theme'],
} as const
