/**
 * Customer Entity Types (Nouns)
 *
 * Customer entities: ServiceCustomer, ServiceEntitlement, CustomerUsage, CustomerSegment
 *
 * @packageDocumentation
 */
// =============================================================================
// ServiceCustomer
// =============================================================================
/**
 * ServiceCustomer entity
 *
 * Customer of a productized service.
 */
export const ServiceCustomer = {
    singular: 'service-customer',
    plural: 'service-customers',
    description: 'A customer of a productized service',
    properties: {
        // Identity
        id: {
            type: 'string',
            description: 'Customer ID',
        },
        externalId: {
            type: 'string',
            optional: true,
            description: 'External system ID',
        },
        // Contact
        name: {
            type: 'string',
            description: 'Customer name',
        },
        email: {
            type: 'string',
            optional: true,
            description: 'Email address',
        },
        phone: {
            type: 'string',
            optional: true,
            description: 'Phone number',
        },
        // Type
        type: {
            type: 'string',
            description: 'Customer type',
            examples: ['individual', 'business', 'enterprise', 'partner'],
        },
        company: {
            type: 'string',
            optional: true,
            description: 'Company name',
        },
        industry: {
            type: 'string',
            optional: true,
            description: 'Industry',
        },
        size: {
            type: 'string',
            optional: true,
            description: 'Company size',
            examples: ['startup', 'smb', 'mid-market', 'enterprise'],
        },
        // Location
        country: {
            type: 'string',
            optional: true,
            description: 'Country code',
        },
        timezone: {
            type: 'string',
            optional: true,
            description: 'Timezone',
        },
        locale: {
            type: 'string',
            optional: true,
            description: 'Locale',
        },
        // Billing
        billingEmail: {
            type: 'string',
            optional: true,
            description: 'Billing email',
        },
        billingAddress: {
            type: 'json',
            optional: true,
            description: 'Billing address',
        },
        taxId: {
            type: 'string',
            optional: true,
            description: 'Tax ID',
        },
        defaultCurrency: {
            type: 'string',
            optional: true,
            description: 'Default currency',
        },
        paymentMethod: {
            type: 'string',
            optional: true,
            description: 'Default payment method',
        },
        // Account Health
        healthScore: {
            type: 'number',
            optional: true,
            description: 'Account health score (0-100)',
        },
        riskLevel: {
            type: 'string',
            optional: true,
            description: 'Churn risk level',
            examples: ['low', 'medium', 'high', 'critical'],
        },
        // Value
        lifetimeValue: {
            type: 'number',
            optional: true,
            description: 'Lifetime value',
        },
        monthlySpend: {
            type: 'number',
            optional: true,
            description: 'Monthly spend',
        },
        // Engagement
        lastActivityAt: {
            type: 'date',
            optional: true,
            description: 'Last activity date',
        },
        engagementScore: {
            type: 'number',
            optional: true,
            description: 'Engagement score',
        },
        // Dates
        createdAt: {
            type: 'date',
            optional: true,
            description: 'Creation date',
        },
        firstPurchaseAt: {
            type: 'date',
            optional: true,
            description: 'First purchase date',
        },
        // Status
        status: {
            type: 'string',
            description: 'Customer status',
            examples: ['prospect', 'active', 'at-risk', 'churned', 'reactivated'],
        },
    },
    relationships: {
        subscriptions: {
            type: 'ServiceSubscription[]',
            description: 'Active subscriptions',
        },
        orders: {
            type: 'ServiceOrder[]',
            description: 'Order history',
        },
        invoices: {
            type: 'Invoice[]',
            description: 'Invoices',
        },
        entitlements: {
            type: 'ServiceEntitlement[]',
            description: 'Current entitlements',
        },
        tickets: {
            type: 'SupportTicket[]',
            description: 'Support tickets',
        },
        segment: {
            type: 'CustomerSegment',
            required: false,
            description: 'Customer segment',
        },
    },
    actions: [
        'create',
        'update',
        'activate',
        'suspend',
        'reactivate',
        'churn',
        'merge',
        'delete',
    ],
    events: [
        'created',
        'updated',
        'activated',
        'suspended',
        'reactivated',
        'churned',
        'merged',
        'deleted',
    ],
};
// =============================================================================
// ServiceEntitlement
// =============================================================================
/**
 * ServiceEntitlement entity
 *
 * What a customer is entitled to.
 */
export const ServiceEntitlement = {
    singular: 'service-entitlement',
    plural: 'service-entitlements',
    description: 'What a customer is entitled to use or access',
    properties: {
        // Identity
        id: {
            type: 'string',
            description: 'Entitlement ID',
        },
        name: {
            type: 'string',
            description: 'Entitlement name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Entitlement description',
        },
        // Type
        type: {
            type: 'string',
            description: 'Entitlement type',
            examples: ['feature', 'quota', 'access', 'capability', 'addon'],
        },
        code: {
            type: 'string',
            optional: true,
            description: 'Entitlement code for checking',
        },
        // Value
        value: {
            type: 'json',
            optional: true,
            description: 'Entitlement value',
        },
        limit: {
            type: 'number',
            optional: true,
            description: 'Usage limit',
        },
        unlimited: {
            type: 'boolean',
            optional: true,
            description: 'Unlimited access',
        },
        // Usage
        usedAmount: {
            type: 'number',
            optional: true,
            description: 'Amount used',
        },
        remainingAmount: {
            type: 'number',
            optional: true,
            description: 'Amount remaining',
        },
        usagePercent: {
            type: 'number',
            optional: true,
            description: 'Usage percentage',
        },
        // Reset
        resetPeriod: {
            type: 'string',
            optional: true,
            description: 'Reset period',
            examples: ['daily', 'weekly', 'monthly', 'yearly', 'never'],
        },
        resetAt: {
            type: 'date',
            optional: true,
            description: 'Next reset date',
        },
        lastResetAt: {
            type: 'date',
            optional: true,
            description: 'Last reset date',
        },
        // Source
        source: {
            type: 'string',
            optional: true,
            description: 'Entitlement source',
            examples: ['plan', 'addon', 'trial', 'promotion', 'manual'],
        },
        sourceId: {
            type: 'string',
            optional: true,
            description: 'Source ID (plan ID, etc.)',
        },
        // Validity
        validFrom: {
            type: 'date',
            optional: true,
            description: 'Valid from date',
        },
        validUntil: {
            type: 'date',
            optional: true,
            description: 'Valid until date',
        },
        // Status
        status: {
            type: 'string',
            description: 'Entitlement status',
            examples: ['active', 'exhausted', 'expired', 'suspended', 'revoked'],
        },
    },
    relationships: {
        customer: {
            type: 'ServiceCustomer',
            description: 'Customer',
        },
        subscription: {
            type: 'ServiceSubscription',
            required: false,
            description: 'Source subscription',
        },
        plan: {
            type: 'ServicePlan',
            required: false,
            description: 'Source plan',
        },
    },
    actions: [
        'grant',
        'update',
        'consume',
        'reset',
        'suspend',
        'revoke',
    ],
    events: [
        'granted',
        'updated',
        'consumed',
        'reset',
        'exhausted',
        'suspended',
        'revoked',
    ],
};
// =============================================================================
// CustomerUsage
// =============================================================================
/**
 * CustomerUsage entity
 *
 * Aggregated customer usage data.
 */
export const CustomerUsage = {
    singular: 'customer-usage',
    plural: 'customer-usages',
    description: 'Aggregated usage data for a customer',
    properties: {
        // Identity
        id: {
            type: 'string',
            description: 'Usage record ID',
        },
        // Period
        periodType: {
            type: 'string',
            description: 'Period type',
            examples: ['hour', 'day', 'week', 'month', 'quarter', 'year'],
        },
        periodStart: {
            type: 'date',
            description: 'Period start',
        },
        periodEnd: {
            type: 'date',
            description: 'Period end',
        },
        // Metrics
        totalExecutions: {
            type: 'number',
            optional: true,
            description: 'Total service executions',
        },
        successfulExecutions: {
            type: 'number',
            optional: true,
            description: 'Successful executions',
        },
        failedExecutions: {
            type: 'number',
            optional: true,
            description: 'Failed executions',
        },
        escalatedExecutions: {
            type: 'number',
            optional: true,
            description: 'Escalated executions',
        },
        // Resource Usage
        tokensUsed: {
            type: 'number',
            optional: true,
            description: 'AI tokens used',
        },
        computeMinutes: {
            type: 'number',
            optional: true,
            description: 'Compute minutes',
        },
        storageGB: {
            type: 'number',
            optional: true,
            description: 'Storage used (GB)',
        },
        bandwidthGB: {
            type: 'number',
            optional: true,
            description: 'Bandwidth used (GB)',
        },
        // API
        apiCalls: {
            type: 'number',
            optional: true,
            description: 'API calls',
        },
        webhookDeliveries: {
            type: 'number',
            optional: true,
            description: 'Webhook deliveries',
        },
        // By Resource
        usageByResource: {
            type: 'json',
            optional: true,
            description: 'Usage breakdown by resource',
        },
        // Limits
        quotaUsed: {
            type: 'json',
            optional: true,
            description: 'Quota used',
        },
        quotaRemaining: {
            type: 'json',
            optional: true,
            description: 'Quota remaining',
        },
        // Cost
        estimatedCost: {
            type: 'number',
            optional: true,
            description: 'Estimated cost',
        },
        currency: {
            type: 'string',
            optional: true,
            description: 'Currency code',
        },
        // Comparison
        changeFromPrevious: {
            type: 'number',
            optional: true,
            description: 'Change from previous period (%)',
        },
        // Status
        status: {
            type: 'string',
            description: 'Record status',
            examples: ['partial', 'complete', 'finalized'],
        },
    },
    relationships: {
        customer: {
            type: 'ServiceCustomer',
            description: 'Customer',
        },
        subscription: {
            type: 'ServiceSubscription',
            required: false,
            description: 'Related subscription',
        },
    },
    actions: [
        'record',
        'aggregate',
        'finalize',
    ],
    events: [
        'recorded',
        'aggregated',
        'finalized',
    ],
};
// =============================================================================
// CustomerSegment
// =============================================================================
/**
 * CustomerSegment entity
 *
 * Customer segmentation.
 */
export const CustomerSegment = {
    singular: 'customer-segment',
    plural: 'customer-segments',
    description: 'A segment grouping customers with similar characteristics',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Segment name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Segment description',
        },
        // Type
        type: {
            type: 'string',
            description: 'Segment type',
            examples: ['behavioral', 'demographic', 'value', 'engagement', 'lifecycle', 'custom'],
        },
        automated: {
            type: 'boolean',
            optional: true,
            description: 'Automatically maintained',
        },
        // Criteria
        criteria: {
            type: 'json',
            optional: true,
            description: 'Segment criteria/rules',
        },
        criteriaDescription: {
            type: 'string',
            optional: true,
            description: 'Human-readable criteria',
        },
        // Size
        customerCount: {
            type: 'number',
            optional: true,
            description: 'Number of customers',
        },
        percentOfTotal: {
            type: 'number',
            optional: true,
            description: 'Percentage of total customers',
        },
        // Value
        totalRevenue: {
            type: 'number',
            optional: true,
            description: 'Total segment revenue',
        },
        avgRevenue: {
            type: 'number',
            optional: true,
            description: 'Average revenue per customer',
        },
        avgLifetimeValue: {
            type: 'number',
            optional: true,
            description: 'Average LTV',
        },
        // Behavior
        avgEngagementScore: {
            type: 'number',
            optional: true,
            description: 'Average engagement score',
        },
        avgUsage: {
            type: 'number',
            optional: true,
            description: 'Average usage',
        },
        churnRate: {
            type: 'number',
            optional: true,
            description: 'Segment churn rate',
        },
        // Targeting
        targetable: {
            type: 'boolean',
            optional: true,
            description: 'Can be targeted for campaigns',
        },
        priority: {
            type: 'number',
            optional: true,
            description: 'Segment priority',
        },
        // Sync
        lastSyncedAt: {
            type: 'date',
            optional: true,
            description: 'Last membership sync',
        },
        syncFrequency: {
            type: 'string',
            optional: true,
            description: 'Sync frequency',
            examples: ['realtime', 'hourly', 'daily', 'weekly'],
        },
        // Status
        status: {
            type: 'string',
            description: 'Segment status',
            examples: ['active', 'inactive', 'archived'],
        },
    },
    relationships: {
        customers: {
            type: 'ServiceCustomer[]',
            description: 'Customers in segment',
        },
        parentSegment: {
            type: 'CustomerSegment',
            required: false,
            description: 'Parent segment',
        },
        childSegments: {
            type: 'CustomerSegment[]',
            description: 'Child segments',
        },
    },
    actions: [
        'create',
        'update',
        'sync',
        'addCustomer',
        'removeCustomer',
        'archive',
    ],
    events: [
        'created',
        'updated',
        'synced',
        'customerAdded',
        'customerRemoved',
        'archived',
    ],
};
// =============================================================================
// Exports
// =============================================================================
export const CustomerEntities = {
    ServiceCustomer,
    ServiceEntitlement,
    CustomerUsage,
    CustomerSegment,
};
export const CustomerCategories = {
    customers: ['ServiceCustomer'],
    entitlements: ['ServiceEntitlement'],
    usage: ['CustomerUsage'],
    segments: ['CustomerSegment'],
};
