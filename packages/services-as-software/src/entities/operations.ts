/**
 * Operations Entity Types (Nouns)
 *
 * Service operations: SLA, SLO, ServiceIncident, SupportTicket, ServiceFeedback, ServiceMetric
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// SLA
// =============================================================================

/**
 * SLA entity
 *
 * Service Level Agreement.
 */
export const SLA: Noun = {
  singular: 'sla',
  plural: 'slas',
  description: 'A Service Level Agreement defining commitments',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'SLA name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'SLA description',
    },
    version: {
      type: 'string',
      optional: true,
      description: 'SLA version',
    },

    // Tier
    tier: {
      type: 'string',
      optional: true,
      description: 'SLA tier',
      examples: ['basic', 'standard', 'premium', 'enterprise'],
    },

    // Availability
    uptimeTarget: {
      type: 'number',
      optional: true,
      description: 'Uptime target percentage (e.g., 99.9)',
    },
    uptimeCalculation: {
      type: 'string',
      optional: true,
      description: 'How uptime is calculated',
      examples: ['monthly', 'quarterly', 'yearly'],
    },

    // Response Times
    responseTimeTarget: {
      type: 'number',
      optional: true,
      description: 'Target response time (ms)',
    },
    responseTimeP50: {
      type: 'number',
      optional: true,
      description: 'P50 response time target (ms)',
    },
    responseTimeP99: {
      type: 'number',
      optional: true,
      description: 'P99 response time target (ms)',
    },

    // Support
    supportResponseTime: {
      type: 'string',
      optional: true,
      description: 'Support response time target',
    },
    supportHours: {
      type: 'string',
      optional: true,
      description: 'Support hours',
      examples: ['24/7', 'business-hours', '9-5'],
    },
    supportChannels: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Support channels',
      examples: ['email', 'chat', 'phone', 'slack'],
    },

    // Credits
    creditPolicy: {
      type: 'json',
      optional: true,
      description: 'Credit policy for SLA breaches',
    },
    maxCredit: {
      type: 'number',
      optional: true,
      description: 'Maximum credit percentage',
    },

    // Exclusions
    exclusions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'SLA exclusions',
    },
    maintenanceWindows: {
      type: 'json',
      optional: true,
      description: 'Scheduled maintenance windows',
    },

    // Dates
    effectiveFrom: {
      type: 'date',
      optional: true,
      description: 'Effective from date',
    },
    effectiveUntil: {
      type: 'date',
      optional: true,
      description: 'Effective until date',
    },

    // Status
    status: {
      type: 'string',
      description: 'SLA status',
      examples: ['draft', 'active', 'superseded', 'expired'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Service this SLA covers',
    },
    objectives: {
      type: 'SLO[]',
      description: 'Service level objectives',
    },
    incidents: {
      type: 'ServiceIncident[]',
      description: 'Related incidents',
    },
  },

  actions: [
    'create',
    'update',
    'activate',
    'supersede',
    'expire',
  ],

  events: [
    'created',
    'updated',
    'activated',
    'superseded',
    'expired',
    'breached',
  ],
}

// =============================================================================
// SLO
// =============================================================================

/**
 * SLO entity
 *
 * Service Level Objective.
 */
export const SLO: Noun = {
  singular: 'slo',
  plural: 'slos',
  description: 'A Service Level Objective defining a specific target',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'SLO name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'SLO description',
    },

    // Metric
    metric: {
      type: 'string',
      description: 'Metric being measured',
      examples: ['availability', 'latency', 'throughput', 'error-rate', 'success-rate'],
    },
    metricQuery: {
      type: 'string',
      optional: true,
      description: 'Query to calculate metric',
    },

    // Target
    target: {
      type: 'number',
      description: 'Target value',
    },
    comparison: {
      type: 'string',
      description: 'Comparison operator',
      examples: ['>=', '<=', '>', '<', '='],
    },
    unit: {
      type: 'string',
      optional: true,
      description: 'Unit of measure',
    },

    // Window
    windowType: {
      type: 'string',
      description: 'Window type',
      examples: ['rolling', 'calendar'],
    },
    windowDuration: {
      type: 'string',
      optional: true,
      description: 'Window duration',
      examples: ['30d', '7d', '1h', '1m'],
    },

    // Error Budget
    errorBudget: {
      type: 'number',
      optional: true,
      description: 'Error budget (as percentage)',
    },
    errorBudgetRemaining: {
      type: 'number',
      optional: true,
      description: 'Remaining error budget',
    },
    burnRate: {
      type: 'number',
      optional: true,
      description: 'Current burn rate',
    },

    // Current State
    currentValue: {
      type: 'number',
      optional: true,
      description: 'Current metric value',
    },
    lastCalculatedAt: {
      type: 'date',
      optional: true,
      description: 'Last calculation time',
    },

    // Alerting
    alertThreshold: {
      type: 'number',
      optional: true,
      description: 'Alert threshold',
    },
    alertOnBreach: {
      type: 'boolean',
      optional: true,
      description: 'Alert on breach',
    },

    // Status
    status: {
      type: 'string',
      description: 'SLO status',
      examples: ['healthy', 'at-risk', 'breached', 'disabled'],
    },
    isMet: {
      type: 'boolean',
      optional: true,
      description: 'Currently meeting target',
    },
  },

  relationships: {
    sla: {
      type: 'SLA',
      required: false,
      description: 'Parent SLA',
    },
    service: {
      type: 'ProductizedService',
      description: 'Service measured',
    },
    alerts: {
      type: 'Alert[]',
      description: 'Related alerts',
    },
  },

  actions: [
    'create',
    'update',
    'enable',
    'disable',
    'recalculate',
    'alert',
  ],

  events: [
    'created',
    'updated',
    'enabled',
    'disabled',
    'breached',
    'recovered',
    'alertTriggered',
  ],
}

// =============================================================================
// ServiceIncident
// =============================================================================

/**
 * ServiceIncident entity
 *
 * Service incident or outage.
 */
export const ServiceIncident: Noun = {
  singular: 'service-incident',
  plural: 'service-incidents',
  description: 'A service incident or outage',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Incident ID',
    },
    title: {
      type: 'string',
      description: 'Incident title',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Incident description',
    },

    // Classification
    severity: {
      type: 'string',
      description: 'Incident severity',
      examples: ['critical', 'major', 'minor', 'warning'],
    },
    type: {
      type: 'string',
      optional: true,
      description: 'Incident type',
      examples: ['outage', 'degradation', 'maintenance', 'security', 'data'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Incident category',
    },

    // Impact
    impactLevel: {
      type: 'string',
      optional: true,
      description: 'Impact level',
      examples: ['none', 'partial', 'major', 'complete'],
    },
    affectedServices: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Affected services',
    },
    affectedCustomers: {
      type: 'number',
      optional: true,
      description: 'Number of affected customers',
    },
    affectedRegions: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Affected regions',
    },

    // Root Cause
    rootCause: {
      type: 'string',
      optional: true,
      description: 'Root cause',
    },
    rootCauseCategory: {
      type: 'string',
      optional: true,
      description: 'Root cause category',
      examples: ['infrastructure', 'code', 'config', 'dependency', 'external', 'unknown'],
    },

    // Resolution
    resolution: {
      type: 'string',
      optional: true,
      description: 'Resolution description',
    },
    resolutionSteps: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Resolution steps taken',
    },
    preventionPlan: {
      type: 'string',
      optional: true,
      description: 'Prevention plan',
    },

    // Timeline
    detectedAt: {
      type: 'date',
      optional: true,
      description: 'Detection time',
    },
    startedAt: {
      type: 'date',
      optional: true,
      description: 'Incident start time',
    },
    acknowledgedAt: {
      type: 'date',
      optional: true,
      description: 'Acknowledgement time',
    },
    mitigatedAt: {
      type: 'date',
      optional: true,
      description: 'Mitigation time',
    },
    resolvedAt: {
      type: 'date',
      optional: true,
      description: 'Resolution time',
    },
    closedAt: {
      type: 'date',
      optional: true,
      description: 'Closure time',
    },

    // Duration
    durationMinutes: {
      type: 'number',
      optional: true,
      description: 'Total duration in minutes',
    },
    timeToDetect: {
      type: 'number',
      optional: true,
      description: 'Time to detect (minutes)',
    },
    timeToMitigate: {
      type: 'number',
      optional: true,
      description: 'Time to mitigate (minutes)',
    },
    timeToResolve: {
      type: 'number',
      optional: true,
      description: 'Time to resolve (minutes)',
    },

    // Status
    status: {
      type: 'string',
      description: 'Incident status',
      examples: ['detected', 'investigating', 'identified', 'mitigating', 'monitoring', 'resolved', 'closed'],
    },
    isPublic: {
      type: 'boolean',
      optional: true,
      description: 'Visible on status page',
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Affected service',
    },
    sla: {
      type: 'SLA',
      required: false,
      description: 'Related SLA',
    },
    assignee: {
      type: 'Worker',
      required: false,
      description: 'Assigned responder',
    },
    tickets: {
      type: 'SupportTicket[]',
      description: 'Related tickets',
    },
  },

  actions: [
    'create',
    'acknowledge',
    'investigate',
    'mitigate',
    'resolve',
    'close',
    'reopen',
    'escalate',
  ],

  events: [
    'created',
    'acknowledged',
    'investigating',
    'identified',
    'mitigating',
    'resolved',
    'closed',
    'reopened',
    'escalated',
  ],
}

// =============================================================================
// SupportTicket
// =============================================================================

/**
 * SupportTicket entity
 *
 * Customer support ticket.
 */
export const SupportTicket: Noun = {
  singular: 'support-ticket',
  plural: 'support-tickets',
  description: 'A customer support ticket',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Ticket ID',
    },
    number: {
      type: 'string',
      optional: true,
      description: 'Ticket number',
    },

    // Content
    subject: {
      type: 'string',
      description: 'Ticket subject',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Ticket description',
    },
    tags: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Ticket tags',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Ticket type',
      examples: ['question', 'problem', 'feature-request', 'bug', 'task'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Ticket category',
    },

    // Priority
    priority: {
      type: 'string',
      description: 'Ticket priority',
      examples: ['low', 'normal', 'high', 'urgent'],
    },
    severity: {
      type: 'string',
      optional: true,
      description: 'Issue severity',
      examples: ['cosmetic', 'minor', 'major', 'critical'],
    },

    // Channel
    channel: {
      type: 'string',
      optional: true,
      description: 'Ticket channel',
      examples: ['email', 'chat', 'phone', 'web', 'api', 'social'],
    },

    // Assignment
    assignedTo: {
      type: 'string',
      optional: true,
      description: 'Assigned agent',
    },
    assignedTeam: {
      type: 'string',
      optional: true,
      description: 'Assigned team',
    },

    // SLA
    slaTarget: {
      type: 'date',
      optional: true,
      description: 'SLA target time',
    },
    slaBreached: {
      type: 'boolean',
      optional: true,
      description: 'SLA was breached',
    },
    firstResponseAt: {
      type: 'date',
      optional: true,
      description: 'First response time',
    },

    // Resolution
    resolution: {
      type: 'string',
      optional: true,
      description: 'Resolution description',
    },
    resolutionCode: {
      type: 'string',
      optional: true,
      description: 'Resolution code',
      examples: ['solved', 'not-a-bug', 'duplicate', 'wont-fix', 'by-design'],
    },

    // Timeline
    createdAt: {
      type: 'date',
      optional: true,
      description: 'Creation time',
    },
    updatedAt: {
      type: 'date',
      optional: true,
      description: 'Last update time',
    },
    resolvedAt: {
      type: 'date',
      optional: true,
      description: 'Resolution time',
    },
    closedAt: {
      type: 'date',
      optional: true,
      description: 'Closure time',
    },

    // AI
    aiHandled: {
      type: 'boolean',
      optional: true,
      description: 'Handled by AI',
    },
    aiSuggestedResolution: {
      type: 'string',
      optional: true,
      description: 'AI suggested resolution',
    },
    aiConfidence: {
      type: 'number',
      optional: true,
      description: 'AI confidence score',
    },

    // Satisfaction
    satisfactionScore: {
      type: 'number',
      optional: true,
      description: 'Customer satisfaction score',
    },
    satisfactionComment: {
      type: 'string',
      optional: true,
      description: 'Satisfaction comment',
    },

    // Status
    status: {
      type: 'string',
      description: 'Ticket status',
      examples: ['new', 'open', 'pending', 'on-hold', 'escalated', 'solved', 'closed'],
    },
  },

  relationships: {
    customer: {
      type: 'ServiceCustomer',
      description: 'Customer',
    },
    service: {
      type: 'ProductizedService',
      required: false,
      description: 'Related service',
    },
    incident: {
      type: 'ServiceIncident',
      required: false,
      description: 'Related incident',
    },
    messages: {
      type: 'TicketMessage[]',
      description: 'Ticket messages',
    },
  },

  actions: [
    'create',
    'assign',
    'respond',
    'escalate',
    'solve',
    'close',
    'reopen',
  ],

  events: [
    'created',
    'assigned',
    'responded',
    'escalated',
    'solved',
    'closed',
    'reopened',
    'ratedByCustomer',
  ],
}

// =============================================================================
// ServiceFeedback
// =============================================================================

/**
 * ServiceFeedback entity
 *
 * Customer feedback on service.
 */
export const ServiceFeedback: Noun = {
  singular: 'service-feedback',
  plural: 'service-feedbacks',
  description: 'Customer feedback on a service',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Feedback ID',
    },

    // Rating
    rating: {
      type: 'number',
      optional: true,
      description: 'Rating score (1-5)',
    },
    npsScore: {
      type: 'number',
      optional: true,
      description: 'NPS score (0-10)',
    },
    satisfactionScore: {
      type: 'number',
      optional: true,
      description: 'Satisfaction score (1-5)',
    },

    // Content
    comment: {
      type: 'string',
      optional: true,
      description: 'Feedback comment',
    },
    highlights: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Positive highlights',
    },
    improvements: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Suggested improvements',
    },

    // Type
    type: {
      type: 'string',
      description: 'Feedback type',
      examples: ['post-execution', 'periodic', 'exit', 'support', 'spontaneous'],
    },
    trigger: {
      type: 'string',
      optional: true,
      description: 'What triggered feedback request',
    },

    // Context
    context: {
      type: 'json',
      optional: true,
      description: 'Feedback context',
    },

    // Sentiment
    sentiment: {
      type: 'string',
      optional: true,
      description: 'Detected sentiment',
      examples: ['positive', 'neutral', 'negative', 'mixed'],
    },
    sentimentScore: {
      type: 'number',
      optional: true,
      description: 'Sentiment score (-1 to 1)',
    },

    // Follow-up
    requiresFollowUp: {
      type: 'boolean',
      optional: true,
      description: 'Requires follow-up',
    },
    followedUpAt: {
      type: 'date',
      optional: true,
      description: 'Follow-up date',
    },

    // Dates
    submittedAt: {
      type: 'date',
      optional: true,
      description: 'Submission time',
    },

    // Status
    status: {
      type: 'string',
      description: 'Feedback status',
      examples: ['submitted', 'reviewed', 'actioned', 'archived'],
    },
  },

  relationships: {
    customer: {
      type: 'ServiceCustomer',
      description: 'Customer',
    },
    service: {
      type: 'ProductizedService',
      description: 'Service',
    },
    execution: {
      type: 'ServiceExecution',
      required: false,
      description: 'Related execution',
    },
    ticket: {
      type: 'SupportTicket',
      required: false,
      description: 'Related ticket',
    },
  },

  actions: [
    'submit',
    'review',
    'action',
    'followUp',
    'archive',
  ],

  events: [
    'submitted',
    'reviewed',
    'actioned',
    'followedUp',
    'archived',
  ],
}

// =============================================================================
// ServiceMetric
// =============================================================================

/**
 * ServiceMetric entity
 *
 * Service performance metric.
 */
export const ServiceMetric: Noun = {
  singular: 'service-metric',
  plural: 'service-metrics',
  description: 'A service performance metric',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Metric name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Metric description',
    },

    // Classification
    type: {
      type: 'string',
      description: 'Metric type',
      examples: ['counter', 'gauge', 'histogram', 'summary'],
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Metric category',
      examples: ['performance', 'reliability', 'usage', 'cost', 'quality'],
    },

    // Value
    value: {
      type: 'number',
      optional: true,
      description: 'Current value',
    },
    unit: {
      type: 'string',
      optional: true,
      description: 'Unit of measure',
    },

    // Aggregation
    aggregation: {
      type: 'string',
      optional: true,
      description: 'Aggregation method',
      examples: ['sum', 'avg', 'min', 'max', 'p50', 'p95', 'p99', 'count'],
    },
    windowDuration: {
      type: 'string',
      optional: true,
      description: 'Aggregation window',
    },

    // Dimensions
    dimensions: {
      type: 'json',
      optional: true,
      description: 'Metric dimensions/labels',
    },

    // Targets
    targetValue: {
      type: 'number',
      optional: true,
      description: 'Target value',
    },
    warningThreshold: {
      type: 'number',
      optional: true,
      description: 'Warning threshold',
    },
    criticalThreshold: {
      type: 'number',
      optional: true,
      description: 'Critical threshold',
    },

    // Trends
    trend: {
      type: 'string',
      optional: true,
      description: 'Value trend',
      examples: ['improving', 'stable', 'degrading'],
    },
    changePercent: {
      type: 'number',
      optional: true,
      description: 'Change percentage from previous period',
    },

    // Timestamps
    lastUpdatedAt: {
      type: 'date',
      optional: true,
      description: 'Last update time',
    },
    periodStart: {
      type: 'date',
      optional: true,
      description: 'Period start',
    },
    periodEnd: {
      type: 'date',
      optional: true,
      description: 'Period end',
    },

    // Status
    status: {
      type: 'string',
      description: 'Metric status',
      examples: ['healthy', 'warning', 'critical', 'unknown'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Service measured',
    },
    slo: {
      type: 'SLO',
      required: false,
      description: 'Related SLO',
    },
  },

  actions: [
    'create',
    'update',
    'record',
    'aggregate',
    'alert',
  ],

  events: [
    'created',
    'updated',
    'recorded',
    'aggregated',
    'thresholdExceeded',
    'recovered',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const OperationsEntities = {
  SLA,
  SLO,
  ServiceIncident,
  SupportTicket,
  ServiceFeedback,
  ServiceMetric,
}

export const OperationsCategories = {
  agreements: ['SLA', 'SLO'],
  incidents: ['ServiceIncident'],
  support: ['SupportTicket', 'ServiceFeedback'],
  metrics: ['ServiceMetric'],
} as const
