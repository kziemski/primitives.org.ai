/**
 * Marketing Entity Types (Nouns)
 *
 * Marketing and demand generation: Campaign, Lead, Audience, Channel, Content, Funnel, Event.
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// Campaign
// =============================================================================

/**
 * Campaign entity
 *
 * Represents a marketing campaign.
 */
export const Campaign: Noun = {
  singular: 'campaign',
  plural: 'campaigns',
  description: 'A marketing campaign',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Campaign name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Campaign description',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL slug',
    },

    // Type
    type: {
      type: 'string',
      description: 'Campaign type',
      examples: ['email', 'paid-ads', 'content', 'social', 'event', 'webinar', 'product-launch', 'referral', 'abm', 'outbound'],
    },
    channel: {
      type: 'string',
      optional: true,
      description: 'Primary channel',
      examples: ['email', 'google-ads', 'facebook', 'linkedin', 'twitter', 'youtube', 'podcast', 'blog', 'seo'],
    },

    // Objective
    objective: {
      type: 'string',
      optional: true,
      description: 'Campaign objective',
      examples: ['awareness', 'consideration', 'conversion', 'retention', 'expansion'],
    },
    goals: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Campaign goals',
    },

    // Timeline
    startDate: {
      type: 'date',
      optional: true,
      description: 'Start date',
    },
    endDate: {
      type: 'date',
      optional: true,
      description: 'End date',
    },

    // Budget
    budget: {
      type: 'number',
      optional: true,
      description: 'Campaign budget',
    },
    spent: {
      type: 'number',
      optional: true,
      description: 'Amount spent',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },

    // Targeting
    targetPersonas: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target personas',
    },
    targetSegments: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target segments',
    },
    targetGeo: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target geographies',
    },

    // Performance
    impressions: {
      type: 'number',
      optional: true,
      description: 'Total impressions',
    },
    clicks: {
      type: 'number',
      optional: true,
      description: 'Total clicks',
    },
    ctr: {
      type: 'number',
      optional: true,
      description: 'Click-through rate',
    },
    leads: {
      type: 'number',
      optional: true,
      description: 'Leads generated',
    },
    conversions: {
      type: 'number',
      optional: true,
      description: 'Conversions',
    },
    revenue: {
      type: 'number',
      optional: true,
      description: 'Revenue attributed',
    },
    roi: {
      type: 'number',
      optional: true,
      description: 'Return on investment',
    },
    cpl: {
      type: 'number',
      optional: true,
      description: 'Cost per lead',
    },
    cac: {
      type: 'number',
      optional: true,
      description: 'Customer acquisition cost',
    },

    // UTM
    utmSource: {
      type: 'string',
      optional: true,
      description: 'UTM source',
    },
    utmMedium: {
      type: 'string',
      optional: true,
      description: 'UTM medium',
    },
    utmCampaign: {
      type: 'string',
      optional: true,
      description: 'UTM campaign',
    },

    // Status
    status: {
      type: 'string',
      description: 'Campaign status',
      examples: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
    },
  },

  relationships: {
    owner: {
      type: 'Worker',
      required: false,
      description: 'Campaign owner',
    },
    team: {
      type: 'Team',
      required: false,
      description: 'Marketing team',
    },
    audiences: {
      type: 'Audience[]',
      description: 'Target audiences',
    },
    content: {
      type: 'Content[]',
      description: 'Campaign content',
    },
    leads: {
      type: 'Lead[]',
      description: 'Generated leads',
    },
    events: {
      type: 'MarketingEvent[]',
      description: 'Associated events',
    },
  },

  actions: [
    'create',
    'update',
    'schedule',
    'launch',
    'pause',
    'resume',
    'complete',
    'cancel',
    'duplicate',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'scheduled',
    'launched',
    'paused',
    'resumed',
    'completed',
    'cancelled',
    'duplicated',
    'archived',
  ],
}

// =============================================================================
// Lead
// =============================================================================

/**
 * Lead entity
 *
 * Represents a marketing lead.
 */
export const Lead: Noun = {
  singular: 'lead',
  plural: 'leads',
  description: 'A marketing lead',

  properties: {
    // Identity
    email: {
      type: 'string',
      description: 'Email address',
    },
    firstName: {
      type: 'string',
      optional: true,
      description: 'First name',
    },
    lastName: {
      type: 'string',
      optional: true,
      description: 'Last name',
    },
    phone: {
      type: 'string',
      optional: true,
      description: 'Phone number',
    },

    // Company
    company: {
      type: 'string',
      optional: true,
      description: 'Company name',
    },
    title: {
      type: 'string',
      optional: true,
      description: 'Job title',
    },
    industry: {
      type: 'string',
      optional: true,
      description: 'Industry',
    },
    companySize: {
      type: 'string',
      optional: true,
      description: 'Company size',
    },
    website: {
      type: 'url',
      optional: true,
      description: 'Website URL',
    },

    // Source
    source: {
      type: 'string',
      description: 'Lead source',
      examples: ['organic', 'paid', 'referral', 'partner', 'event', 'webinar', 'content', 'outbound', 'social'],
    },
    medium: {
      type: 'string',
      optional: true,
      description: 'Source medium',
    },
    campaignId: {
      type: 'string',
      optional: true,
      description: 'Source campaign',
    },
    referrer: {
      type: 'string',
      optional: true,
      description: 'Referrer URL',
    },
    landingPage: {
      type: 'string',
      optional: true,
      description: 'Landing page URL',
    },

    // UTM
    utmSource: {
      type: 'string',
      optional: true,
      description: 'UTM source',
    },
    utmMedium: {
      type: 'string',
      optional: true,
      description: 'UTM medium',
    },
    utmCampaign: {
      type: 'string',
      optional: true,
      description: 'UTM campaign',
    },
    utmTerm: {
      type: 'string',
      optional: true,
      description: 'UTM term',
    },
    utmContent: {
      type: 'string',
      optional: true,
      description: 'UTM content',
    },

    // Scoring
    score: {
      type: 'number',
      optional: true,
      description: 'Lead score',
    },
    grade: {
      type: 'string',
      optional: true,
      description: 'Lead grade',
      examples: ['A', 'B', 'C', 'D', 'F'],
    },
    fit: {
      type: 'string',
      optional: true,
      description: 'Fit score',
      examples: ['ideal', 'good', 'moderate', 'poor'],
    },
    intent: {
      type: 'string',
      optional: true,
      description: 'Intent level',
      examples: ['high', 'medium', 'low'],
    },

    // Lifecycle
    stage: {
      type: 'string',
      description: 'Lead stage',
      examples: ['new', 'engaged', 'mql', 'sql', 'opportunity', 'customer', 'disqualified'],
    },
    qualifiedAt: {
      type: 'datetime',
      optional: true,
      description: 'MQL date',
    },
    convertedAt: {
      type: 'datetime',
      optional: true,
      description: 'Conversion date',
    },

    // Location
    country: {
      type: 'string',
      optional: true,
      description: 'Country',
    },
    region: {
      type: 'string',
      optional: true,
      description: 'Region',
    },
    city: {
      type: 'string',
      optional: true,
      description: 'City',
    },
    timezone: {
      type: 'string',
      optional: true,
      description: 'Timezone',
    },

    // Consent
    marketingConsent: {
      type: 'boolean',
      optional: true,
      description: 'Marketing consent',
    },
    consentDate: {
      type: 'datetime',
      optional: true,
      description: 'Consent date',
    },

    // Tags
    tags: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Tags',
    },

    // Status
    status: {
      type: 'string',
      description: 'Lead status',
      examples: ['active', 'nurturing', 'converted', 'disqualified', 'unsubscribed'],
    },
  },

  relationships: {
    campaign: {
      type: 'Campaign',
      required: false,
      description: 'Source campaign',
    },
    owner: {
      type: 'Worker',
      required: false,
      description: 'Lead owner',
    },
    customer: {
      type: 'Customer',
      required: false,
      description: 'Converted customer',
    },
    deal: {
      type: 'Deal',
      required: false,
      description: 'Associated deal',
    },
    audiences: {
      type: 'Audience[]',
      description: 'Member of audiences',
    },
    interactions: {
      type: 'Interaction[]',
      description: 'Interactions',
    },
  },

  actions: [
    'create',
    'update',
    'score',
    'qualify',
    'assignOwner',
    'nurture',
    'convert',
    'disqualify',
    'merge',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'scored',
    'qualified',
    'ownerAssigned',
    'nurtured',
    'converted',
    'disqualified',
    'merged',
    'unsubscribed',
    'archived',
  ],
}

// =============================================================================
// Audience
// =============================================================================

/**
 * Audience entity
 *
 * Represents a marketing audience.
 */
export const Audience: Noun = {
  singular: 'audience',
  plural: 'audiences',
  description: 'A marketing audience',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Audience name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Audience description',
    },

    // Type
    type: {
      type: 'string',
      description: 'Audience type',
      examples: ['static', 'dynamic', 'lookalike', 'retargeting', 'suppression'],
    },
    source: {
      type: 'string',
      optional: true,
      description: 'Audience source',
      examples: ['crm', 'website', 'import', 'integration', 'ad-platform'],
    },

    // Criteria
    criteria: {
      type: 'json',
      optional: true,
      description: 'Audience criteria/filters',
    },
    criteriaDescription: {
      type: 'string',
      optional: true,
      description: 'Human-readable criteria',
    },

    // Size
    size: {
      type: 'number',
      optional: true,
      description: 'Audience size',
    },
    lastSyncedAt: {
      type: 'datetime',
      optional: true,
      description: 'Last sync time',
    },

    // Sync
    syncToFacebook: {
      type: 'boolean',
      optional: true,
      description: 'Sync to Facebook',
    },
    syncToGoogle: {
      type: 'boolean',
      optional: true,
      description: 'Sync to Google',
    },
    syncToLinkedIn: {
      type: 'boolean',
      optional: true,
      description: 'Sync to LinkedIn',
    },

    // Status
    status: {
      type: 'string',
      description: 'Audience status',
      examples: ['active', 'building', 'inactive', 'archived'],
    },
  },

  relationships: {
    campaigns: {
      type: 'Campaign[]',
      description: 'Campaigns using this audience',
    },
    leads: {
      type: 'Lead[]',
      description: 'Leads in audience',
    },
    customers: {
      type: 'Customer[]',
      description: 'Customers in audience',
    },
    segment: {
      type: 'Segment',
      required: false,
      description: 'Based on segment',
    },
  },

  actions: [
    'create',
    'update',
    'refresh',
    'sync',
    'addMember',
    'removeMember',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'refreshed',
    'synced',
    'memberAdded',
    'memberRemoved',
    'archived',
  ],
}

// =============================================================================
// Content
// =============================================================================

/**
 * Content entity
 *
 * Represents marketing content.
 */
export const Content: Noun = {
  singular: 'content',
  plural: 'contents',
  description: 'Marketing content',

  properties: {
    // Identity
    title: {
      type: 'string',
      description: 'Content title',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL slug',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Content description',
    },

    // Type
    type: {
      type: 'string',
      description: 'Content type',
      examples: ['blog-post', 'ebook', 'whitepaper', 'case-study', 'video', 'webinar', 'podcast', 'infographic', 'template', 'guide', 'landing-page', 'email'],
    },
    format: {
      type: 'string',
      optional: true,
      description: 'Content format',
      examples: ['text', 'video', 'audio', 'image', 'pdf', 'interactive'],
    },

    // Body
    body: {
      type: 'markdown',
      optional: true,
      description: 'Content body',
    },
    excerpt: {
      type: 'string',
      optional: true,
      description: 'Content excerpt',
    },

    // Media
    featuredImage: {
      type: 'url',
      optional: true,
      description: 'Featured image URL',
    },
    mediaUrl: {
      type: 'url',
      optional: true,
      description: 'Media URL (video, audio, etc.)',
    },

    // SEO
    metaTitle: {
      type: 'string',
      optional: true,
      description: 'Meta title',
    },
    metaDescription: {
      type: 'string',
      optional: true,
      description: 'Meta description',
    },
    keywords: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target keywords',
    },

    // Targeting
    targetPersonas: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target personas',
    },
    funnelStage: {
      type: 'string',
      optional: true,
      description: 'Funnel stage',
      examples: ['awareness', 'consideration', 'decision', 'retention'],
    },

    // Publishing
    publishedAt: {
      type: 'datetime',
      optional: true,
      description: 'Publish date',
    },
    expiresAt: {
      type: 'datetime',
      optional: true,
      description: 'Expiration date',
    },

    // Performance
    views: {
      type: 'number',
      optional: true,
      description: 'Total views',
    },
    uniqueViews: {
      type: 'number',
      optional: true,
      description: 'Unique views',
    },
    downloads: {
      type: 'number',
      optional: true,
      description: 'Downloads (for gated content)',
    },
    shares: {
      type: 'number',
      optional: true,
      description: 'Social shares',
    },
    avgTimeOnPage: {
      type: 'number',
      optional: true,
      description: 'Average time on page (seconds)',
    },

    // Gating
    isGated: {
      type: 'boolean',
      optional: true,
      description: 'Requires form fill',
    },

    // Tags
    tags: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Tags',
    },
    categories: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Categories',
    },

    // Status
    status: {
      type: 'string',
      description: 'Content status',
      examples: ['draft', 'review', 'scheduled', 'published', 'archived'],
    },
  },

  relationships: {
    author: {
      type: 'Worker',
      required: false,
      description: 'Content author',
    },
    campaigns: {
      type: 'Campaign[]',
      description: 'Associated campaigns',
    },
    personas: {
      type: 'Persona[]',
      description: 'Target personas',
    },
  },

  actions: [
    'create',
    'update',
    'submit',
    'approve',
    'schedule',
    'publish',
    'unpublish',
    'duplicate',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'submitted',
    'approved',
    'scheduled',
    'published',
    'unpublished',
    'duplicated',
    'archived',
  ],
}

// =============================================================================
// Funnel
// =============================================================================

/**
 * Funnel entity
 *
 * Represents a marketing/sales funnel.
 */
export const Funnel: Noun = {
  singular: 'funnel',
  plural: 'funnels',
  description: 'A marketing or sales funnel',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Funnel name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Funnel description',
    },

    // Type
    type: {
      type: 'string',
      optional: true,
      description: 'Funnel type',
      examples: ['marketing', 'sales', 'product', 'onboarding', 'conversion'],
    },

    // Metrics (top-level)
    totalEntries: {
      type: 'number',
      optional: true,
      description: 'Total funnel entries',
    },
    totalConversions: {
      type: 'number',
      optional: true,
      description: 'Total conversions',
    },
    conversionRate: {
      type: 'number',
      optional: true,
      description: 'Overall conversion rate',
    },
    avgTimeToConvert: {
      type: 'number',
      optional: true,
      description: 'Average time to convert (hours)',
    },

    // Status
    status: {
      type: 'string',
      description: 'Funnel status',
      examples: ['active', 'inactive', 'archived'],
    },
  },

  relationships: {
    stages: {
      type: 'FunnelStage[]',
      description: 'Funnel stages',
    },
    campaigns: {
      type: 'Campaign[]',
      description: 'Associated campaigns',
    },
  },

  actions: [
    'create',
    'update',
    'addStage',
    'removeStage',
    'reorderStages',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'stageAdded',
    'stageRemoved',
    'stagesReordered',
    'archived',
  ],
}

// =============================================================================
// FunnelStage
// =============================================================================

/**
 * FunnelStage entity
 *
 * Represents a stage in a funnel.
 */
export const FunnelStage: Noun = {
  singular: 'funnel-stage',
  plural: 'funnel-stages',
  description: 'A stage in a marketing/sales funnel',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Stage name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Stage description',
    },

    // Order
    order: {
      type: 'number',
      description: 'Stage order',
    },

    // Metrics
    entries: {
      type: 'number',
      optional: true,
      description: 'Entries to this stage',
    },
    exits: {
      type: 'number',
      optional: true,
      description: 'Exits from this stage',
    },
    conversionRate: {
      type: 'number',
      optional: true,
      description: 'Conversion to next stage',
    },
    dropoffRate: {
      type: 'number',
      optional: true,
      description: 'Drop-off rate',
    },
    avgTimeInStage: {
      type: 'number',
      optional: true,
      description: 'Average time in stage (hours)',
    },

    // Goals
    targetConversionRate: {
      type: 'number',
      optional: true,
      description: 'Target conversion rate',
    },
  },

  relationships: {
    funnel: {
      type: 'Funnel',
      description: 'Parent funnel',
    },
  },

  actions: [
    'create',
    'update',
    'move',
    'delete',
  ],

  events: [
    'created',
    'updated',
    'moved',
    'deleted',
  ],
}

// =============================================================================
// MarketingEvent
// =============================================================================

/**
 * MarketingEvent entity
 *
 * Represents a marketing event (webinar, conference, meetup).
 */
export const MarketingEvent: Noun = {
  singular: 'marketing-event',
  plural: 'marketing-events',
  description: 'A marketing event (webinar, conference, meetup)',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Event name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Event description',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL slug',
    },

    // Type
    type: {
      type: 'string',
      description: 'Event type',
      examples: ['webinar', 'conference', 'meetup', 'workshop', 'demo-day', 'trade-show', 'virtual-event', 'hybrid'],
    },
    format: {
      type: 'string',
      optional: true,
      description: 'Event format',
      examples: ['in-person', 'virtual', 'hybrid'],
    },

    // Schedule
    startDate: {
      type: 'datetime',
      description: 'Start date/time',
    },
    endDate: {
      type: 'datetime',
      optional: true,
      description: 'End date/time',
    },
    timezone: {
      type: 'string',
      optional: true,
      description: 'Timezone',
    },
    duration: {
      type: 'number',
      optional: true,
      description: 'Duration in minutes',
    },

    // Location
    location: {
      type: 'string',
      optional: true,
      description: 'Physical location',
    },
    virtualUrl: {
      type: 'url',
      optional: true,
      description: 'Virtual event URL',
    },

    // Capacity
    capacity: {
      type: 'number',
      optional: true,
      description: 'Max capacity',
    },
    registrations: {
      type: 'number',
      optional: true,
      description: 'Total registrations',
    },
    attendees: {
      type: 'number',
      optional: true,
      description: 'Actual attendees',
    },
    attendanceRate: {
      type: 'number',
      optional: true,
      description: 'Attendance rate',
    },

    // Budget
    budget: {
      type: 'number',
      optional: true,
      description: 'Event budget',
    },
    actualCost: {
      type: 'number',
      optional: true,
      description: 'Actual cost',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },

    // Results
    leadsGenerated: {
      type: 'number',
      optional: true,
      description: 'Leads generated',
    },
    pipelineGenerated: {
      type: 'number',
      optional: true,
      description: 'Pipeline generated',
    },
    revenueAttributed: {
      type: 'number',
      optional: true,
      description: 'Revenue attributed',
    },

    // Recording
    recordingUrl: {
      type: 'url',
      optional: true,
      description: 'Recording URL',
    },

    // Status
    status: {
      type: 'string',
      description: 'Event status',
      examples: ['draft', 'scheduled', 'registration-open', 'live', 'completed', 'cancelled'],
    },
  },

  relationships: {
    campaign: {
      type: 'Campaign',
      required: false,
      description: 'Parent campaign',
    },
    owner: {
      type: 'Worker',
      required: false,
      description: 'Event owner',
    },
    speakers: {
      type: 'Worker[]',
      description: 'Speakers',
    },
    registrants: {
      type: 'Lead[]',
      description: 'Registrants',
    },
  },

  actions: [
    'create',
    'update',
    'schedule',
    'openRegistration',
    'closeRegistration',
    'start',
    'end',
    'cancel',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'scheduled',
    'registrationOpened',
    'registrationClosed',
    'started',
    'ended',
    'cancelled',
    'archived',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const MarketingEntities = {
  Campaign,
  Lead,
  Audience,
  Content,
  Funnel,
  FunnelStage,
  MarketingEvent,
}

export const MarketingCategories = {
  campaigns: ['Campaign'],
  leads: ['Lead', 'Audience'],
  content: ['Content'],
  funnels: ['Funnel', 'FunnelStage'],
  events: ['MarketingEvent'],
} as const
