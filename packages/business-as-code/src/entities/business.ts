/**
 * Business Entity Types (Nouns)
 *
 * Core business entities: Business, Vision, Mission, Values.
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// Business
// =============================================================================

/**
 * Business entity
 *
 * Represents a company, startup, or business unit.
 */
export const Business: Noun = {
  singular: 'business',
  plural: 'businesses',
  description: 'A company, startup, or business unit',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Business name',
    },
    legalName: {
      type: 'string',
      optional: true,
      description: 'Legal entity name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },

    // Type
    type: {
      type: 'string',
      optional: true,
      description: 'Business type',
      examples: ['startup', 'smb', 'enterprise', 'agency', 'nonprofit', 'government'],
    },
    stage: {
      type: 'string',
      optional: true,
      description: 'Business stage',
      examples: ['idea', 'pre-seed', 'seed', 'series-a', 'series-b', 'growth', 'mature'],
    },
    industry: {
      type: 'string',
      optional: true,
      description: 'Industry or sector',
    },

    // Purpose
    mission: {
      type: 'string',
      optional: true,
      description: 'Mission statement',
    },
    vision: {
      type: 'string',
      optional: true,
      description: 'Vision statement',
    },
    values: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Core values',
    },
    tagline: {
      type: 'string',
      optional: true,
      description: 'Business tagline or slogan',
    },

    // Market
    targetMarket: {
      type: 'string',
      optional: true,
      description: 'Target market description',
    },
    customerSegments: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Customer segments',
    },

    // Location
    headquarters: {
      type: 'string',
      optional: true,
      description: 'Headquarters location',
    },
    locations: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Office locations',
    },
    timezone: {
      type: 'string',
      optional: true,
      description: 'Primary timezone',
    },

    // Size & Scale
    teamSize: {
      type: 'number',
      optional: true,
      description: 'Number of team members',
    },
    headcount: {
      type: 'number',
      optional: true,
      description: 'Total headcount including contractors',
    },

    // Dates
    foundedAt: {
      type: 'date',
      optional: true,
      description: 'Founding date',
    },
    incorporatedAt: {
      type: 'date',
      optional: true,
      description: 'Incorporation date',
    },

    // Contact
    website: {
      type: 'url',
      optional: true,
      description: 'Business website',
    },
    email: {
      type: 'string',
      optional: true,
      description: 'Contact email',
    },
    phone: {
      type: 'string',
      optional: true,
      description: 'Contact phone',
    },

    // Status
    status: {
      type: 'string',
      optional: true,
      description: 'Business status',
      examples: ['active', 'inactive', 'acquired', 'closed'],
    },
  },

  relationships: {
    organization: {
      type: 'Organization',
      description: 'Organizational structure',
    },
    products: {
      type: 'Product[]',
      description: 'Product offerings',
    },
    services: {
      type: 'Service[]',
      description: 'Service offerings',
    },
    goals: {
      type: 'Goal[]',
      description: 'Business goals',
    },
    okrs: {
      type: 'OKR[]',
      description: 'Objectives and key results',
    },
    kpis: {
      type: 'KPI[]',
      description: 'Key performance indicators',
    },
    financials: {
      type: 'FinancialPeriod[]',
      description: 'Financial records',
    },
  },

  actions: [
    'create',
    'update',
    'launch',
    'pivot',
    'scale',
    'acquire',
    'merge',
    'close',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'launched',
    'pivoted',
    'scaled',
    'acquired',
    'merged',
    'closed',
    'archived',
  ],
}

// =============================================================================
// Vision
// =============================================================================

/**
 * Vision entity
 *
 * Represents a long-term vision statement with success indicators.
 */
export const Vision: Noun = {
  singular: 'vision',
  plural: 'visions',
  description: 'A long-term vision statement with success indicators',

  properties: {
    // Content
    statement: {
      type: 'string',
      description: 'Vision statement',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Expanded description',
    },

    // Timeframe
    timeframe: {
      type: 'string',
      optional: true,
      description: 'Target timeframe (e.g., "5 years", "2030")',
    },
    targetDate: {
      type: 'date',
      optional: true,
      description: 'Target achievement date',
    },

    // Success
    successIndicators: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Indicators of success',
    },

    // Status
    status: {
      type: 'string',
      optional: true,
      description: 'Vision status',
      examples: ['draft', 'active', 'achieved', 'revised', 'abandoned'],
    },
    progress: {
      type: 'number',
      optional: true,
      description: 'Progress percentage (0-100)',
    },
  },

  relationships: {
    business: {
      type: 'Business',
      description: 'Parent business',
    },
    goals: {
      type: 'Goal[]',
      description: 'Supporting goals',
    },
  },

  actions: [
    'create',
    'update',
    'activate',
    'revise',
    'achieve',
    'abandon',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'activated',
    'revised',
    'achieved',
    'abandoned',
    'archived',
  ],
}

// =============================================================================
// Value
// =============================================================================

/**
 * Value entity
 *
 * Represents a core organizational value.
 */
export const Value: Noun = {
  singular: 'value',
  plural: 'values',
  description: 'A core organizational value',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Value name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Value description',
    },

    // Behaviors
    behaviors: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Example behaviors demonstrating this value',
    },
    antiPatterns: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Behaviors that violate this value',
    },

    // Priority
    priority: {
      type: 'number',
      optional: true,
      description: 'Priority order',
    },

    // Status
    status: {
      type: 'string',
      optional: true,
      description: 'Value status',
      examples: ['active', 'deprecated'],
    },
  },

  relationships: {
    business: {
      type: 'Business',
      description: 'Parent business',
    },
  },

  actions: [
    'create',
    'update',
    'prioritize',
    'deprecate',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'prioritized',
    'deprecated',
    'archived',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const BusinessEntities = {
  Business,
  Vision,
  Value,
}

export const BusinessCategories = {
  core: ['Business'],
  purpose: ['Vision', 'Value'],
} as const
