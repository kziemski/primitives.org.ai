/**
 * Service Entity Types (Nouns)
 *
 * Core service entities: ProductizedService, ServiceOffering, ServicePlan, ServiceInstance, ServiceExecution
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// ProductizedService
// =============================================================================

/**
 * ProductizedService entity
 *
 * A service packaged and delivered as software.
 */
export const ProductizedService: Noun = {
  singular: 'productized-service',
  plural: 'productized-services',
  description: 'A service packaged and delivered as software',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Service name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Service description',
    },
    tagline: {
      type: 'string',
      optional: true,
      description: 'Short marketing tagline',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Service type',
      examples: ['consulting', 'implementation', 'support', 'managed', 'creative', 'technical', 'ai-powered'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Service category',
    },
    domain: {
      type: 'string',
      optional: true,
      description: 'Business domain',
    },

    // Delivery Model
    deliveryModel: {
      type: 'string',
      description: 'How service is delivered',
      examples: ['autonomous', 'assisted', 'supervised', 'manual', 'hybrid'],
    },
    automationLevel: {
      type: 'number',
      optional: true,
      description: 'Automation percentage (0-100)',
    },

    // Autonomy
    autonomyLevel: {
      type: 'number',
      optional: true,
      description: 'AI autonomy level (1-5)',
    },
    confidenceThreshold: {
      type: 'number',
      optional: true,
      description: 'Min confidence for auto-completion (0-1)',
    },
    escalationPolicy: {
      type: 'string',
      optional: true,
      description: 'When to escalate to humans',
      examples: ['immediate', 'queue', 'scheduled', 'manual', 'never'],
    },

    // Scope
    inclusions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'What is included',
    },
    exclusions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'What is excluded',
    },
    deliverables: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Service deliverables',
    },

    // Timing
    estimatedDuration: {
      type: 'string',
      optional: true,
      description: 'Estimated delivery time',
    },
    turnaroundTime: {
      type: 'string',
      optional: true,
      description: 'Standard turnaround time',
      examples: ['instant', 'minutes', 'hours', 'days', 'weeks'],
    },

    // Capacity
    capacityModel: {
      type: 'string',
      optional: true,
      description: 'Capacity model',
      examples: ['unlimited', 'limited', 'queue-based', 'appointment'],
    },
    maxConcurrent: {
      type: 'number',
      optional: true,
      description: 'Max concurrent executions',
    },

    // Pricing
    pricingModel: {
      type: 'string',
      optional: true,
      description: 'Pricing model',
      examples: ['fixed', 'per-use', 'subscription', 'tiered', 'custom'],
    },
    basePrice: {
      type: 'number',
      optional: true,
      description: 'Base price',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },

    // Status
    status: {
      type: 'string',
      description: 'Service status',
      examples: ['draft', 'active', 'paused', 'deprecated', 'archived'],
    },
    visibility: {
      type: 'string',
      optional: true,
      description: 'Visibility',
      examples: ['public', 'private', 'invite-only', 'beta'],
    },
  },

  relationships: {
    provider: {
      type: 'Organization',
      required: false,
      description: 'Service provider',
    },
    plans: {
      type: 'ServicePlan[]',
      description: 'Pricing plans',
    },
    offerings: {
      type: 'ServiceOffering[]',
      description: 'Service offerings/tiers',
    },
    agent: {
      type: 'AgentDelivery',
      required: false,
      description: 'AI agent for delivery',
    },
    sla: {
      type: 'SLA',
      required: false,
      description: 'Service level agreement',
    },
    workflows: {
      type: 'ServiceWorkflow[]',
      description: 'Service workflows',
    },
  },

  actions: [
    'create',
    'update',
    'publish',
    'pause',
    'resume',
    'execute',
    'escalate',
    'complete',
    'deprecate',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'published',
    'paused',
    'resumed',
    'executed',
    'escalated',
    'completed',
    'deprecated',
    'archived',
  ],
}

// =============================================================================
// ServiceOffering
// =============================================================================

/**
 * ServiceOffering entity
 *
 * A specific offering or tier of a service.
 */
export const ServiceOffering: Noun = {
  singular: 'service-offering',
  plural: 'service-offerings',
  description: 'A specific offering or tier of a productized service',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Offering name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Offering description',
    },

    // Tier
    tier: {
      type: 'string',
      description: 'Offering tier',
      examples: ['basic', 'standard', 'premium', 'enterprise', 'custom'],
    },
    displayOrder: {
      type: 'number',
      optional: true,
      description: 'Display order',
    },
    highlighted: {
      type: 'boolean',
      optional: true,
      description: 'Featured/highlighted offering',
    },

    // Scope
    scope: {
      type: 'string',
      optional: true,
      description: 'Scope of work',
    },
    inclusions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'What is included',
    },
    limitations: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Limitations',
    },

    // Delivery
    deliveryTime: {
      type: 'string',
      optional: true,
      description: 'Delivery time',
    },
    revisions: {
      type: 'number',
      optional: true,
      description: 'Number of revisions included',
    },
    supportLevel: {
      type: 'string',
      optional: true,
      description: 'Support level',
      examples: ['email', 'priority', 'dedicated', '24/7'],
    },

    // Pricing
    price: {
      type: 'number',
      description: 'Price',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },
    billingType: {
      type: 'string',
      optional: true,
      description: 'Billing type',
      examples: ['one-time', 'recurring', 'usage-based'],
    },

    // Availability
    availability: {
      type: 'string',
      optional: true,
      description: 'Availability',
      examples: ['always', 'limited', 'by-appointment', 'seasonal'],
    },
    maxOrders: {
      type: 'number',
      optional: true,
      description: 'Max orders per period',
    },

    // Status
    status: {
      type: 'string',
      description: 'Offering status',
      examples: ['active', 'inactive', 'sold-out', 'discontinued'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Parent service',
    },
    orders: {
      type: 'ServiceOrder[]',
      description: 'Orders for this offering',
    },
  },

  actions: [
    'create',
    'update',
    'activate',
    'deactivate',
    'updatePricing',
    'discontinue',
  ],

  events: [
    'created',
    'updated',
    'activated',
    'deactivated',
    'pricingUpdated',
    'discontinued',
  ],
}

// =============================================================================
// ServicePlan
// =============================================================================

/**
 * ServicePlan entity
 *
 * A subscription plan for a service.
 */
export const ServicePlan: Noun = {
  singular: 'service-plan',
  plural: 'service-plans',
  description: 'A subscription plan for a productized service',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Plan name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Plan description',
    },

    // Tier
    tier: {
      type: 'string',
      description: 'Plan tier',
      examples: ['free', 'starter', 'pro', 'business', 'enterprise'],
    },
    displayOrder: {
      type: 'number',
      optional: true,
      description: 'Display order',
    },
    highlighted: {
      type: 'boolean',
      optional: true,
      description: 'Featured plan',
    },

    // Pricing
    price: {
      type: 'number',
      description: 'Plan price',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },
    billingInterval: {
      type: 'string',
      description: 'Billing interval',
      examples: ['monthly', 'quarterly', 'yearly'],
    },
    annualDiscount: {
      type: 'number',
      optional: true,
      description: 'Annual discount percentage',
    },

    // Entitlements
    entitlements: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Plan entitlements',
    },
    features: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Included features',
    },

    // Limits
    limits: {
      type: 'json',
      optional: true,
      description: 'Usage limits',
    },
    executionsPerMonth: {
      type: 'number',
      optional: true,
      description: 'Executions per month',
    },
    supportHours: {
      type: 'number',
      optional: true,
      description: 'Support hours included',
    },

    // Overage
    overagePrice: {
      type: 'number',
      optional: true,
      description: 'Price per overage unit',
    },
    overageEnabled: {
      type: 'boolean',
      optional: true,
      description: 'Allow overage',
    },

    // Trial
    trialDays: {
      type: 'number',
      optional: true,
      description: 'Trial period days',
    },
    trialRequiresCard: {
      type: 'boolean',
      optional: true,
      description: 'Trial requires payment method',
    },

    // Status
    status: {
      type: 'string',
      description: 'Plan status',
      examples: ['active', 'hidden', 'discontinued', 'legacy'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Parent service',
    },
    subscriptions: {
      type: 'ServiceSubscription[]',
      description: 'Active subscriptions',
    },
  },

  actions: [
    'create',
    'update',
    'activate',
    'hide',
    'updatePricing',
    'discontinue',
  ],

  events: [
    'created',
    'updated',
    'activated',
    'hidden',
    'pricingUpdated',
    'discontinued',
  ],
}

// =============================================================================
// ServiceInstance
// =============================================================================

/**
 * ServiceInstance entity
 *
 * A running instance of a service for a customer.
 */
export const ServiceInstance: Noun = {
  singular: 'service-instance',
  plural: 'service-instances',
  description: 'A running instance of a service for a customer',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Instance ID',
    },
    name: {
      type: 'string',
      optional: true,
      description: 'Instance name',
    },

    // Configuration
    config: {
      type: 'json',
      optional: true,
      description: 'Instance configuration',
    },
    environment: {
      type: 'string',
      optional: true,
      description: 'Environment',
      examples: ['production', 'staging', 'development'],
    },

    // Resources
    resourceAllocation: {
      type: 'json',
      optional: true,
      description: 'Allocated resources',
    },

    // State
    state: {
      type: 'json',
      optional: true,
      description: 'Instance state',
    },
    lastActivityAt: {
      type: 'date',
      optional: true,
      description: 'Last activity timestamp',
    },

    // Dates
    provisionedAt: {
      type: 'date',
      optional: true,
      description: 'Provisioning date',
    },
    expiresAt: {
      type: 'date',
      optional: true,
      description: 'Expiration date',
    },

    // Status
    status: {
      type: 'string',
      description: 'Instance status',
      examples: ['provisioning', 'running', 'paused', 'stopped', 'terminated', 'failed'],
    },
    healthStatus: {
      type: 'string',
      optional: true,
      description: 'Health status',
      examples: ['healthy', 'degraded', 'unhealthy', 'unknown'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Service type',
    },
    customer: {
      type: 'ServiceCustomer',
      description: 'Customer',
    },
    subscription: {
      type: 'ServiceSubscription',
      required: false,
      description: 'Associated subscription',
    },
    executions: {
      type: 'ServiceExecution[]',
      description: 'Execution history',
    },
  },

  actions: [
    'provision',
    'configure',
    'start',
    'stop',
    'pause',
    'resume',
    'scale',
    'terminate',
  ],

  events: [
    'provisioned',
    'configured',
    'started',
    'stopped',
    'paused',
    'resumed',
    'scaled',
    'terminated',
  ],
}

// =============================================================================
// ServiceExecution
// =============================================================================

/**
 * ServiceExecution entity
 *
 * A single execution or run of a service.
 */
export const ServiceExecution: Noun = {
  singular: 'service-execution',
  plural: 'service-executions',
  description: 'A single execution or run of a service',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Execution ID',
    },
    requestId: {
      type: 'string',
      optional: true,
      description: 'Request trace ID',
    },

    // Input/Output
    input: {
      type: 'json',
      optional: true,
      description: 'Execution input',
    },
    output: {
      type: 'json',
      optional: true,
      description: 'Execution output',
    },
    context: {
      type: 'json',
      optional: true,
      description: 'Execution context',
    },

    // Execution Details
    executionType: {
      type: 'string',
      optional: true,
      description: 'Type of execution',
      examples: ['sync', 'async', 'batch', 'scheduled', 'triggered'],
    },
    trigger: {
      type: 'string',
      optional: true,
      description: 'What triggered execution',
      examples: ['api', 'schedule', 'webhook', 'manual', 'event'],
    },

    // AI Details
    agentUsed: {
      type: 'boolean',
      optional: true,
      description: 'AI agent was used',
    },
    confidence: {
      type: 'number',
      optional: true,
      description: 'AI confidence score (0-1)',
    },
    humanReviewRequired: {
      type: 'boolean',
      optional: true,
      description: 'Human review needed',
    },
    humanReviewed: {
      type: 'boolean',
      optional: true,
      description: 'Was reviewed by human',
    },

    // Timing
    startedAt: {
      type: 'date',
      optional: true,
      description: 'Start time',
    },
    completedAt: {
      type: 'date',
      optional: true,
      description: 'Completion time',
    },
    durationMs: {
      type: 'number',
      optional: true,
      description: 'Duration in milliseconds',
    },

    // Resources
    tokensUsed: {
      type: 'number',
      optional: true,
      description: 'AI tokens consumed',
    },
    computeUnits: {
      type: 'number',
      optional: true,
      description: 'Compute units used',
    },
    cost: {
      type: 'number',
      optional: true,
      description: 'Execution cost',
    },

    // Errors
    error: {
      type: 'string',
      optional: true,
      description: 'Error message if failed',
    },
    errorCode: {
      type: 'string',
      optional: true,
      description: 'Error code',
    },
    retryCount: {
      type: 'number',
      optional: true,
      description: 'Number of retries',
    },

    // Status
    status: {
      type: 'string',
      description: 'Execution status',
      examples: ['pending', 'running', 'completed', 'failed', 'cancelled', 'timeout', 'escalated'],
    },
  },

  relationships: {
    instance: {
      type: 'ServiceInstance',
      required: false,
      description: 'Service instance',
    },
    service: {
      type: 'ProductizedService',
      description: 'Service',
    },
    customer: {
      type: 'ServiceCustomer',
      description: 'Customer',
    },
    workflow: {
      type: 'ServiceWorkflow',
      required: false,
      description: 'Workflow executed',
    },
    tasks: {
      type: 'ServiceTask[]',
      description: 'Tasks in this execution',
    },
  },

  actions: [
    'start',
    'pause',
    'resume',
    'cancel',
    'retry',
    'escalate',
    'complete',
    'fail',
  ],

  events: [
    'started',
    'paused',
    'resumed',
    'cancelled',
    'retried',
    'escalated',
    'completed',
    'failed',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const ServiceEntities = {
  ProductizedService,
  ServiceOffering,
  ServicePlan,
  ServiceInstance,
  ServiceExecution,
}

export const ServiceCategories = {
  core: ['ProductizedService', 'ServiceOffering', 'ServicePlan'],
  runtime: ['ServiceInstance', 'ServiceExecution'],
} as const
