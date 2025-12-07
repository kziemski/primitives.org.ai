/**
 * Advertising Entity Types (Nouns)
 *
 * Entities for digital advertising platforms like Google Ads, Meta Ads, etc.
 * Includes ads, campaigns, ad groups, keywords, and conversions.
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// Ad
// =============================================================================

/**
 * Ad entity
 *
 * Represents a digital advertisement
 */
export const Ad: Noun = {
  singular: 'ad',
  plural: 'ads',
  description: 'A digital advertisement',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Ad name',
    },
    type: {
      type: 'string',
      description: 'Ad type: search, display, video, shopping, social',
      examples: ['search', 'display', 'video', 'shopping', 'social', 'native'],
    },
    format: {
      type: 'string',
      optional: true,
      description: 'Ad format: text, image, carousel, video, collection',
      examples: ['text', 'image', 'carousel', 'video', 'collection', 'stories'],
    },

    // Content - Text
    headline: {
      type: 'string',
      optional: true,
      description: 'Ad headline',
    },
    headlines: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Multiple headlines (for responsive ads)',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Ad description',
    },
    descriptions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Multiple descriptions',
    },
    callToAction: {
      type: 'string',
      optional: true,
      description: 'Call to action text',
    },

    // Content - Media
    imageUrl: {
      type: 'url',
      optional: true,
      description: 'Ad image URL',
    },
    videoUrl: {
      type: 'url',
      optional: true,
      description: 'Ad video URL',
    },
    thumbnailUrl: {
      type: 'url',
      optional: true,
      description: 'Video thumbnail URL',
    },

    // Destination
    finalUrl: {
      type: 'url',
      optional: true,
      description: 'Final destination URL',
    },
    displayUrl: {
      type: 'string',
      optional: true,
      description: 'Display URL',
    },
    trackingUrl: {
      type: 'url',
      optional: true,
      description: 'Tracking URL template',
    },

    // Status
    status: {
      type: 'string',
      description: 'Ad status: enabled, paused, removed, pending_review, disapproved',
      examples: ['enabled', 'paused', 'removed', 'pending_review', 'disapproved'],
    },
    reviewStatus: {
      type: 'string',
      optional: true,
      description: 'Review status: approved, disapproved, under_review',
      examples: ['approved', 'disapproved', 'under_review'],
    },
    disapprovalReasons: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Reasons for disapproval',
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
    conversions: {
      type: 'number',
      optional: true,
      description: 'Total conversions',
    },
    conversionRate: {
      type: 'number',
      optional: true,
      description: 'Conversion rate',
    },
    cost: {
      type: 'number',
      optional: true,
      description: 'Total cost',
    },
    cpc: {
      type: 'number',
      optional: true,
      description: 'Cost per click',
    },
    cpm: {
      type: 'number',
      optional: true,
      description: 'Cost per thousand impressions',
    },
    cpa: {
      type: 'number',
      optional: true,
      description: 'Cost per acquisition',
    },
    roas: {
      type: 'number',
      optional: true,
      description: 'Return on ad spend',
    },
  },

  relationships: {
    adGroup: {
      type: 'AdGroup',
      description: 'Parent ad group',
    },
    campaign: {
      type: 'AdCampaign',
      description: 'Parent campaign',
    },
  },

  actions: [
    'create',
    'update',
    'delete',
    'enable',
    'pause',
    'duplicate',
    'preview',
    'submitForReview',
  ],

  events: [
    'created',
    'updated',
    'deleted',
    'enabled',
    'paused',
    'approved',
    'disapproved',
    'impressionServed',
    'clicked',
    'converted',
  ],
}

// =============================================================================
// Ad Group
// =============================================================================

/**
 * Ad group entity
 *
 * Represents a group of related ads
 */
export const AdGroup: Noun = {
  singular: 'ad group',
  plural: 'ad groups',
  description: 'A group of related ads with shared targeting',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Ad group name',
    },

    // Status
    status: {
      type: 'string',
      description: 'Ad group status: enabled, paused, removed',
      examples: ['enabled', 'paused', 'removed'],
    },

    // Bidding
    bidStrategy: {
      type: 'string',
      optional: true,
      description: 'Bid strategy: manual_cpc, target_cpa, maximize_conversions',
      examples: ['manual_cpc', 'target_cpa', 'maximize_conversions', 'target_roas'],
    },
    defaultBid: {
      type: 'number',
      optional: true,
      description: 'Default bid amount',
    },
    targetCpa: {
      type: 'number',
      optional: true,
      description: 'Target CPA',
    },
    targetRoas: {
      type: 'number',
      optional: true,
      description: 'Target ROAS',
    },

    // Targeting
    targetingSettings: {
      type: 'json',
      optional: true,
      description: 'Targeting configuration',
    },
    audiences: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target audiences',
    },
    placements: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target placements',
    },
    topics: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target topics',
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
    conversions: {
      type: 'number',
      optional: true,
      description: 'Total conversions',
    },
    cost: {
      type: 'number',
      optional: true,
      description: 'Total cost',
    },
  },

  relationships: {
    campaign: {
      type: 'AdCampaign',
      backref: 'adGroups',
      description: 'Parent campaign',
    },
    ads: {
      type: 'Ad[]',
      backref: 'adGroup',
      description: 'Ads in this group',
    },
    keywords: {
      type: 'Keyword[]',
      backref: 'adGroup',
      description: 'Keywords for search ads',
    },
  },

  actions: [
    'create',
    'update',
    'delete',
    'enable',
    'pause',
    'setBid',
    'addAudience',
    'removeAudience',
  ],

  events: [
    'created',
    'updated',
    'deleted',
    'enabled',
    'paused',
    'bidChanged',
    'audienceAdded',
    'audienceRemoved',
  ],
}

// =============================================================================
// Ad Campaign
// =============================================================================

/**
 * Ad campaign entity
 *
 * Represents an advertising campaign
 */
export const AdCampaign: Noun = {
  singular: 'ad campaign',
  plural: 'ad campaigns',
  description: 'An advertising campaign',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Campaign name',
    },
    objective: {
      type: 'string',
      description: 'Campaign objective: awareness, traffic, engagement, leads, sales',
      examples: ['awareness', 'traffic', 'engagement', 'leads', 'sales', 'app_installs'],
    },
    type: {
      type: 'string',
      description: 'Campaign type: search, display, video, shopping, performance_max',
      examples: ['search', 'display', 'video', 'shopping', 'performance_max', 'app'],
    },

    // Status
    status: {
      type: 'string',
      description: 'Campaign status: enabled, paused, removed, ended',
      examples: ['enabled', 'paused', 'removed', 'ended'],
    },

    // Schedule
    startDate: {
      type: 'datetime',
      optional: true,
      description: 'Campaign start date',
    },
    endDate: {
      type: 'datetime',
      optional: true,
      description: 'Campaign end date',
    },

    // Budget
    budget: {
      type: 'number',
      optional: true,
      description: 'Campaign budget',
    },
    budgetType: {
      type: 'string',
      optional: true,
      description: 'Budget type: daily, lifetime',
      examples: ['daily', 'lifetime'],
    },
    spent: {
      type: 'number',
      optional: true,
      description: 'Amount spent',
    },
    remainingBudget: {
      type: 'number',
      optional: true,
      description: 'Remaining budget',
    },

    // Bidding
    bidStrategy: {
      type: 'string',
      optional: true,
      description: 'Bid strategy',
    },
    targetCpa: {
      type: 'number',
      optional: true,
      description: 'Target CPA',
    },
    targetRoas: {
      type: 'number',
      optional: true,
      description: 'Target ROAS',
    },

    // Targeting
    geoTargets: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Geographic targets',
    },
    languages: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target languages',
    },
    devices: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Target devices',
    },
    schedule: {
      type: 'json',
      optional: true,
      description: 'Ad schedule',
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
    conversions: {
      type: 'number',
      optional: true,
      description: 'Total conversions',
    },
    conversionValue: {
      type: 'number',
      optional: true,
      description: 'Total conversion value',
    },
    cpc: {
      type: 'number',
      optional: true,
      description: 'Average CPC',
    },
    cpa: {
      type: 'number',
      optional: true,
      description: 'Average CPA',
    },
    roas: {
      type: 'number',
      optional: true,
      description: 'Return on ad spend',
    },
  },

  relationships: {
    account: {
      type: 'Account',
      description: 'Advertising account',
    },
    adGroups: {
      type: 'AdGroup[]',
      backref: 'campaign',
      description: 'Ad groups in this campaign',
    },
    conversions: {
      type: 'Conversion[]',
      description: 'Conversions attributed to this campaign',
    },
  },

  actions: [
    'create',
    'update',
    'delete',
    'enable',
    'pause',
    'setBudget',
    'extendSchedule',
    'duplicate',
    'optimize',
  ],

  events: [
    'created',
    'updated',
    'deleted',
    'enabled',
    'paused',
    'budgetChanged',
    'scheduleExtended',
    'budgetExhausted',
    'ended',
  ],
}

// =============================================================================
// Keyword
// =============================================================================

/**
 * Keyword entity
 *
 * Represents a search keyword for advertising
 */
export const Keyword: Noun = {
  singular: 'keyword',
  plural: 'keywords',
  description: 'A search keyword for advertising',

  properties: {
    // Identity
    text: {
      type: 'string',
      description: 'Keyword text',
    },
    matchType: {
      type: 'string',
      description: 'Match type: exact, phrase, broad',
      examples: ['exact', 'phrase', 'broad'],
    },

    // Status
    status: {
      type: 'string',
      description: 'Keyword status: enabled, paused, removed',
      examples: ['enabled', 'paused', 'removed'],
    },
    qualityScore: {
      type: 'number',
      optional: true,
      description: 'Quality score (1-10)',
    },

    // Bidding
    bid: {
      type: 'number',
      optional: true,
      description: 'Keyword bid',
    },
    estimatedFirstPageBid: {
      type: 'number',
      optional: true,
      description: 'Estimated first page bid',
    },
    estimatedTopPageBid: {
      type: 'number',
      optional: true,
      description: 'Estimated top of page bid',
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
    conversions: {
      type: 'number',
      optional: true,
      description: 'Total conversions',
    },
    cost: {
      type: 'number',
      optional: true,
      description: 'Total cost',
    },
    avgCpc: {
      type: 'number',
      optional: true,
      description: 'Average CPC',
    },
    avgPosition: {
      type: 'number',
      optional: true,
      description: 'Average position',
    },

    // Search terms
    searchVolume: {
      type: 'number',
      optional: true,
      description: 'Monthly search volume',
    },
    competition: {
      type: 'string',
      optional: true,
      description: 'Competition level: low, medium, high',
      examples: ['low', 'medium', 'high'],
    },
  },

  relationships: {
    adGroup: {
      type: 'AdGroup',
      backref: 'keywords',
      description: 'Parent ad group',
    },
    negativeKeyword: {
      type: 'NegativeKeyword',
      required: false,
      description: 'If this is a negative keyword',
    },
  },

  actions: [
    'create',
    'update',
    'delete',
    'enable',
    'pause',
    'setBid',
    'changeMatchType',
  ],

  events: [
    'created',
    'updated',
    'deleted',
    'enabled',
    'paused',
    'bidChanged',
    'matchTypeChanged',
  ],
}

/**
 * Negative keyword entity
 */
export const NegativeKeyword: Noun = {
  singular: 'negative keyword',
  plural: 'negative keywords',
  description: 'A negative keyword to exclude from targeting',

  properties: {
    text: {
      type: 'string',
      description: 'Keyword text',
    },
    matchType: {
      type: 'string',
      description: 'Match type: exact, phrase, broad',
      examples: ['exact', 'phrase', 'broad'],
    },
    level: {
      type: 'string',
      description: 'Level: campaign, ad_group, account',
      examples: ['campaign', 'ad_group', 'account'],
    },
  },

  relationships: {
    campaign: {
      type: 'AdCampaign',
      required: false,
      description: 'Parent campaign',
    },
    adGroup: {
      type: 'AdGroup',
      required: false,
      description: 'Parent ad group',
    },
  },

  actions: ['create', 'delete'],

  events: ['created', 'deleted'],
}

// =============================================================================
// Conversion
// =============================================================================

/**
 * Conversion entity
 *
 * Represents a tracked conversion
 */
export const Conversion: Noun = {
  singular: 'conversion',
  plural: 'conversions',
  description: 'A tracked advertising conversion',

  properties: {
    // Identity
    conversionName: {
      type: 'string',
      description: 'Conversion action name',
    },
    conversionType: {
      type: 'string',
      description: 'Conversion type: purchase, lead, signup, pageview, custom',
      examples: ['purchase', 'lead', 'signup', 'pageview', 'download', 'custom'],
    },

    // Attribution
    attributionModel: {
      type: 'string',
      optional: true,
      description: 'Attribution model: last_click, first_click, linear, data_driven',
      examples: ['last_click', 'first_click', 'linear', 'time_decay', 'data_driven'],
    },
    clickId: {
      type: 'string',
      optional: true,
      description: 'Click ID that led to conversion',
    },

    // Value
    value: {
      type: 'number',
      optional: true,
      description: 'Conversion value',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },
    quantity: {
      type: 'number',
      optional: true,
      description: 'Number of conversions',
    },

    // Timing
    timestamp: {
      type: 'datetime',
      description: 'Conversion timestamp',
    },
    clickTimestamp: {
      type: 'datetime',
      optional: true,
      description: 'Original click timestamp',
    },
    conversionLag: {
      type: 'number',
      optional: true,
      description: 'Days between click and conversion',
    },

    // Source
    source: {
      type: 'string',
      optional: true,
      description: 'Conversion source',
    },
    medium: {
      type: 'string',
      optional: true,
      description: 'Traffic medium',
    },
  },

  relationships: {
    campaign: {
      type: 'AdCampaign',
      required: false,
      description: 'Source campaign',
    },
    adGroup: {
      type: 'AdGroup',
      required: false,
      description: 'Source ad group',
    },
    ad: {
      type: 'Ad',
      required: false,
      description: 'Source ad',
    },
    keyword: {
      type: 'Keyword',
      required: false,
      description: 'Source keyword',
    },
  },

  actions: ['track', 'import', 'adjust', 'delete'],

  events: ['tracked', 'imported', 'adjusted', 'deleted'],
}

// =============================================================================
// Budget
// =============================================================================

/**
 * Budget entity
 *
 * Represents an advertising budget
 */
export const Budget: Noun = {
  singular: 'budget',
  plural: 'budgets',
  description: 'An advertising budget',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Budget name',
    },

    // Amount
    amount: {
      type: 'number',
      description: 'Budget amount',
    },
    currency: {
      type: 'string',
      description: 'Currency code',
    },
    period: {
      type: 'string',
      description: 'Budget period: daily, monthly, lifetime',
      examples: ['daily', 'monthly', 'lifetime'],
    },

    // Delivery
    deliveryMethod: {
      type: 'string',
      optional: true,
      description: 'Delivery method: standard, accelerated',
      examples: ['standard', 'accelerated'],
    },

    // Spending
    spent: {
      type: 'number',
      optional: true,
      description: 'Amount spent',
    },
    remaining: {
      type: 'number',
      optional: true,
      description: 'Remaining amount',
    },
    percentUsed: {
      type: 'number',
      optional: true,
      description: 'Percentage of budget used',
    },

    // Status
    status: {
      type: 'string',
      description: 'Budget status: active, depleted, paused',
      examples: ['active', 'depleted', 'paused'],
    },
    shared: {
      type: 'boolean',
      optional: true,
      description: 'Whether budget is shared across campaigns',
    },
  },

  relationships: {
    campaigns: {
      type: 'AdCampaign[]',
      description: 'Campaigns using this budget',
    },
  },

  actions: ['create', 'update', 'delete', 'increase', 'decrease'],

  events: ['created', 'updated', 'deleted', 'increased', 'decreased', 'depleted'],
}

// =============================================================================
// Audience (for advertising)
// =============================================================================

/**
 * Ad audience entity
 *
 * Represents a targetable audience for advertising
 */
export const AdAudience: Noun = {
  singular: 'ad audience',
  plural: 'ad audiences',
  description: 'A targetable audience for advertising',

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
    type: {
      type: 'string',
      description: 'Audience type: custom, lookalike, remarketing, in_market, affinity',
      examples: ['custom', 'lookalike', 'remarketing', 'in_market', 'affinity'],
    },

    // Source
    source: {
      type: 'string',
      optional: true,
      description: 'Audience source: website, app, crm, engagement',
      examples: ['website', 'app', 'crm', 'engagement'],
    },
    sourceDetails: {
      type: 'json',
      optional: true,
      description: 'Source configuration details',
    },

    // Size
    size: {
      type: 'number',
      optional: true,
      description: 'Estimated audience size',
    },
    sizeRange: {
      type: 'string',
      optional: true,
      description: 'Size range description',
    },

    // Lookalike
    seedAudience: {
      type: 'string',
      optional: true,
      description: 'Seed audience for lookalike',
    },
    expansionLevel: {
      type: 'number',
      optional: true,
      description: 'Lookalike expansion level (1-10)',
    },

    // Status
    status: {
      type: 'string',
      description: 'Audience status: ready, populating, too_small, expired',
      examples: ['ready', 'populating', 'too_small', 'expired'],
    },
    membershipDuration: {
      type: 'number',
      optional: true,
      description: 'Membership duration in days',
    },
  },

  relationships: {
    campaigns: {
      type: 'AdCampaign[]',
      description: 'Campaigns targeting this audience',
    },
    adGroups: {
      type: 'AdGroup[]',
      description: 'Ad groups targeting this audience',
    },
  },

  actions: [
    'create',
    'update',
    'delete',
    'refresh',
    'expand',
    'createLookalike',
    'share',
  ],

  events: [
    'created',
    'updated',
    'deleted',
    'refreshed',
    'expanded',
    'lookalikeCreated',
    'shared',
    'ready',
  ],
}

// =============================================================================
// Export all entities as a schema
// =============================================================================

/**
 * All advertising entity types
 */
export const AdvertisingEntities = {
  // Ads
  Ad,
  AdGroup,
  AdCampaign,

  // Keywords
  Keyword,
  NegativeKeyword,

  // Conversions
  Conversion,

  // Budget
  Budget,

  // Audiences
  AdAudience,
}

/**
 * Entity categories for organization
 */
export const AdvertisingCategories = {
  ads: ['Ad', 'AdGroup', 'AdCampaign'],
  keywords: ['Keyword', 'NegativeKeyword'],
  conversions: ['Conversion'],
  budget: ['Budget'],
  audiences: ['AdAudience'],
} as const
