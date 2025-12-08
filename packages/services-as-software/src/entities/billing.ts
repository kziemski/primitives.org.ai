/**
 * Billing Entity Types (Nouns)
 *
 * Billing & commerce: ServiceQuote, ServiceOrder, ServiceSubscription, Usage, Invoice, Payment
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// ServiceQuote
// =============================================================================

/**
 * ServiceQuote entity
 *
 * Price quote for a service.
 */
export const ServiceQuote: Noun = {
  singular: 'service-quote',
  plural: 'service-quotes',
  description: 'A price quote for a service',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Quote ID',
    },
    number: {
      type: 'string',
      optional: true,
      description: 'Quote number',
    },

    // Details
    title: {
      type: 'string',
      optional: true,
      description: 'Quote title',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Quote description',
    },
    scope: {
      type: 'string',
      optional: true,
      description: 'Scope of work',
    },

    // Line Items
    lineItems: {
      type: 'json',
      optional: true,
      description: 'Quote line items',
    },

    // Pricing
    subtotal: {
      type: 'number',
      optional: true,
      description: 'Subtotal before tax/discount',
    },
    discount: {
      type: 'number',
      optional: true,
      description: 'Discount amount',
    },
    discountPercent: {
      type: 'number',
      optional: true,
      description: 'Discount percentage',
    },
    tax: {
      type: 'number',
      optional: true,
      description: 'Tax amount',
    },
    total: {
      type: 'number',
      description: 'Total quoted amount',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },

    // Terms
    paymentTerms: {
      type: 'string',
      optional: true,
      description: 'Payment terms',
      examples: ['net-30', 'net-60', 'due-on-receipt', 'milestone', 'upfront'],
    },
    deliveryTerms: {
      type: 'string',
      optional: true,
      description: 'Delivery terms',
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

    // Acceptance
    acceptedAt: {
      type: 'date',
      optional: true,
      description: 'Acceptance date',
    },
    acceptedBy: {
      type: 'string',
      optional: true,
      description: 'Accepted by',
    },

    // Status
    status: {
      type: 'string',
      description: 'Quote status',
      examples: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'superseded'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Quoted service',
    },
    offering: {
      type: 'ServiceOffering',
      required: false,
      description: 'Service offering',
    },
    customer: {
      type: 'ServiceCustomer',
      description: 'Customer',
    },
    order: {
      type: 'ServiceOrder',
      required: false,
      description: 'Resulting order',
    },
  },

  actions: [
    'create',
    'update',
    'send',
    'resend',
    'accept',
    'reject',
    'expire',
    'supersede',
  ],

  events: [
    'created',
    'updated',
    'sent',
    'viewed',
    'accepted',
    'rejected',
    'expired',
    'superseded',
  ],
}

// =============================================================================
// ServiceOrder
// =============================================================================

/**
 * ServiceOrder entity
 *
 * Customer order for a service.
 */
export const ServiceOrder: Noun = {
  singular: 'service-order',
  plural: 'service-orders',
  description: 'A customer order for a service',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Order ID',
    },
    orderNumber: {
      type: 'string',
      optional: true,
      description: 'Order number',
    },

    // Details
    description: {
      type: 'string',
      optional: true,
      description: 'Order description',
    },
    requirements: {
      type: 'json',
      optional: true,
      description: 'Customer requirements',
    },
    notes: {
      type: 'string',
      optional: true,
      description: 'Order notes',
    },

    // Line Items
    lineItems: {
      type: 'json',
      optional: true,
      description: 'Order line items',
    },
    quantity: {
      type: 'number',
      optional: true,
      description: 'Quantity ordered',
    },

    // Pricing
    subtotal: {
      type: 'number',
      optional: true,
      description: 'Subtotal',
    },
    discount: {
      type: 'number',
      optional: true,
      description: 'Discount amount',
    },
    tax: {
      type: 'number',
      optional: true,
      description: 'Tax amount',
    },
    total: {
      type: 'number',
      description: 'Total amount',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },

    // Delivery
    deliveryMethod: {
      type: 'string',
      optional: true,
      description: 'Delivery method',
    },
    expectedDelivery: {
      type: 'date',
      optional: true,
      description: 'Expected delivery date',
    },
    actualDelivery: {
      type: 'date',
      optional: true,
      description: 'Actual delivery date',
    },

    // Priority
    priority: {
      type: 'string',
      optional: true,
      description: 'Order priority',
      examples: ['standard', 'rush', 'express', 'critical'],
    },

    // Dates
    orderedAt: {
      type: 'date',
      optional: true,
      description: 'Order date',
    },
    completedAt: {
      type: 'date',
      optional: true,
      description: 'Completion date',
    },

    // Status
    status: {
      type: 'string',
      description: 'Order status',
      examples: ['pending', 'confirmed', 'processing', 'in-progress', 'review', 'completed', 'delivered', 'cancelled', 'refunded'],
    },
    fulfillmentStatus: {
      type: 'string',
      optional: true,
      description: 'Fulfillment status',
      examples: ['unfulfilled', 'partial', 'fulfilled'],
    },
    paymentStatus: {
      type: 'string',
      optional: true,
      description: 'Payment status',
      examples: ['unpaid', 'partial', 'paid', 'refunded'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Service ordered',
    },
    offering: {
      type: 'ServiceOffering',
      required: false,
      description: 'Service offering',
    },
    customer: {
      type: 'ServiceCustomer',
      description: 'Customer',
    },
    quote: {
      type: 'ServiceQuote',
      required: false,
      description: 'Source quote',
    },
    executions: {
      type: 'ServiceExecution[]',
      description: 'Service executions',
    },
    invoices: {
      type: 'Invoice[]',
      description: 'Related invoices',
    },
  },

  actions: [
    'create',
    'confirm',
    'process',
    'start',
    'complete',
    'deliver',
    'cancel',
    'refund',
  ],

  events: [
    'created',
    'confirmed',
    'processing',
    'started',
    'completed',
    'delivered',
    'cancelled',
    'refunded',
  ],
}

// =============================================================================
// ServiceSubscription
// =============================================================================

/**
 * ServiceSubscription entity
 *
 * Recurring service subscription.
 */
export const ServiceSubscription: Noun = {
  singular: 'service-subscription',
  plural: 'service-subscriptions',
  description: 'A recurring subscription to a service',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Subscription ID',
    },

    // Billing
    billingCycle: {
      type: 'string',
      description: 'Billing cycle',
      examples: ['monthly', 'quarterly', 'yearly'],
    },
    price: {
      type: 'number',
      description: 'Subscription price',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },

    // Period
    currentPeriodStart: {
      type: 'date',
      optional: true,
      description: 'Current period start',
    },
    currentPeriodEnd: {
      type: 'date',
      optional: true,
      description: 'Current period end',
    },
    nextBillingDate: {
      type: 'date',
      optional: true,
      description: 'Next billing date',
    },

    // Trial
    trialStart: {
      type: 'date',
      optional: true,
      description: 'Trial start date',
    },
    trialEnd: {
      type: 'date',
      optional: true,
      description: 'Trial end date',
    },
    onTrial: {
      type: 'boolean',
      optional: true,
      description: 'Currently on trial',
    },

    // Usage
    usageThisPeriod: {
      type: 'json',
      optional: true,
      description: 'Usage in current period',
    },
    usageLimits: {
      type: 'json',
      optional: true,
      description: 'Usage limits',
    },

    // Entitlements
    entitlements: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Active entitlements',
    },

    // Cancellation
    cancelAtPeriodEnd: {
      type: 'boolean',
      optional: true,
      description: 'Cancel at period end',
    },
    cancelledAt: {
      type: 'date',
      optional: true,
      description: 'Cancellation date',
    },
    cancellationReason: {
      type: 'string',
      optional: true,
      description: 'Cancellation reason',
    },

    // Dates
    startedAt: {
      type: 'date',
      optional: true,
      description: 'Subscription start',
    },
    endedAt: {
      type: 'date',
      optional: true,
      description: 'Subscription end',
    },

    // Status
    status: {
      type: 'string',
      description: 'Subscription status',
      examples: ['trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Service subscribed to',
    },
    plan: {
      type: 'ServicePlan',
      description: 'Subscription plan',
    },
    customer: {
      type: 'ServiceCustomer',
      description: 'Customer',
    },
    invoices: {
      type: 'Invoice[]',
      description: 'Subscription invoices',
    },
    payments: {
      type: 'Payment[]',
      description: 'Subscription payments',
    },
  },

  actions: [
    'create',
    'activate',
    'pause',
    'resume',
    'upgrade',
    'downgrade',
    'cancel',
    'renew',
  ],

  events: [
    'created',
    'activated',
    'paused',
    'resumed',
    'upgraded',
    'downgraded',
    'cancelled',
    'renewed',
    'trialEnded',
  ],
}

// =============================================================================
// Usage
// =============================================================================

/**
 * Usage entity
 *
 * Service usage tracking record.
 */
export const Usage: Noun = {
  singular: 'usage',
  plural: 'usages',
  description: 'A service usage tracking record',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Usage record ID',
    },

    // Resource
    resource: {
      type: 'string',
      description: 'Resource used',
    },
    resourceType: {
      type: 'string',
      optional: true,
      description: 'Resource type',
      examples: ['api-call', 'execution', 'storage', 'compute', 'tokens', 'bandwidth'],
    },

    // Quantity
    quantity: {
      type: 'number',
      description: 'Usage quantity',
    },
    unit: {
      type: 'string',
      optional: true,
      description: 'Unit of measure',
      examples: ['requests', 'minutes', 'gb', 'tokens', 'executions'],
    },

    // Time
    timestamp: {
      type: 'date',
      description: 'Usage timestamp',
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

    // Cost
    unitCost: {
      type: 'number',
      optional: true,
      description: 'Cost per unit',
    },
    totalCost: {
      type: 'number',
      optional: true,
      description: 'Total cost',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },

    // Context
    metadata: {
      type: 'json',
      optional: true,
      description: 'Usage metadata',
    },
    requestId: {
      type: 'string',
      optional: true,
      description: 'Related request ID',
    },

    // Billing
    billed: {
      type: 'boolean',
      optional: true,
      description: 'Has been billed',
    },
    invoiceId: {
      type: 'string',
      optional: true,
      description: 'Related invoice ID',
    },

    // Status
    status: {
      type: 'string',
      description: 'Usage status',
      examples: ['recorded', 'aggregated', 'billed', 'disputed'],
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
    execution: {
      type: 'ServiceExecution',
      required: false,
      description: 'Related execution',
    },
  },

  actions: [
    'record',
    'aggregate',
    'bill',
    'dispute',
    'adjust',
  ],

  events: [
    'recorded',
    'aggregated',
    'billed',
    'disputed',
    'adjusted',
  ],
}

// =============================================================================
// Invoice
// =============================================================================

/**
 * Invoice entity
 *
 * Billing invoice.
 */
export const Invoice: Noun = {
  singular: 'invoice',
  plural: 'invoices',
  description: 'A billing invoice',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Invoice ID',
    },
    number: {
      type: 'string',
      optional: true,
      description: 'Invoice number',
    },

    // Details
    description: {
      type: 'string',
      optional: true,
      description: 'Invoice description',
    },
    lineItems: {
      type: 'json',
      optional: true,
      description: 'Invoice line items',
    },

    // Amounts
    subtotal: {
      type: 'number',
      optional: true,
      description: 'Subtotal',
    },
    discount: {
      type: 'number',
      optional: true,
      description: 'Discount amount',
    },
    tax: {
      type: 'number',
      optional: true,
      description: 'Tax amount',
    },
    total: {
      type: 'number',
      description: 'Total amount',
    },
    amountDue: {
      type: 'number',
      optional: true,
      description: 'Amount due',
    },
    amountPaid: {
      type: 'number',
      optional: true,
      description: 'Amount paid',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },

    // Period
    periodStart: {
      type: 'date',
      optional: true,
      description: 'Billing period start',
    },
    periodEnd: {
      type: 'date',
      optional: true,
      description: 'Billing period end',
    },

    // Dates
    issuedAt: {
      type: 'date',
      optional: true,
      description: 'Issue date',
    },
    dueDate: {
      type: 'date',
      optional: true,
      description: 'Due date',
    },
    paidAt: {
      type: 'date',
      optional: true,
      description: 'Payment date',
    },

    // Delivery
    sentAt: {
      type: 'date',
      optional: true,
      description: 'Sent date',
    },
    sentTo: {
      type: 'string',
      optional: true,
      description: 'Sent to email',
    },

    // PDF
    pdfUrl: {
      type: 'string',
      optional: true,
      description: 'PDF download URL',
    },

    // Status
    status: {
      type: 'string',
      description: 'Invoice status',
      examples: ['draft', 'open', 'sent', 'paid', 'partial', 'overdue', 'void', 'uncollectible'],
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
    order: {
      type: 'ServiceOrder',
      required: false,
      description: 'Related order',
    },
    payments: {
      type: 'Payment[]',
      description: 'Invoice payments',
    },
  },

  actions: [
    'create',
    'finalize',
    'send',
    'pay',
    'void',
    'markUncollectible',
    'refund',
  ],

  events: [
    'created',
    'finalized',
    'sent',
    'paid',
    'voided',
    'markedUncollectible',
    'refunded',
  ],
}

// =============================================================================
// Payment
// =============================================================================

/**
 * Payment entity
 *
 * Payment record.
 */
export const Payment: Noun = {
  singular: 'payment',
  plural: 'payments',
  description: 'A payment record',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Payment ID',
    },
    externalId: {
      type: 'string',
      optional: true,
      description: 'External payment ID (Stripe, etc.)',
    },

    // Amount
    amount: {
      type: 'number',
      description: 'Payment amount',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency code',
    },
    fee: {
      type: 'number',
      optional: true,
      description: 'Processing fee',
    },
    netAmount: {
      type: 'number',
      optional: true,
      description: 'Net amount after fees',
    },

    // Method
    method: {
      type: 'string',
      description: 'Payment method',
      examples: ['card', 'bank_transfer', 'paypal', 'crypto', 'invoice', 'check'],
    },
    methodDetails: {
      type: 'json',
      optional: true,
      description: 'Method details (card last 4, etc.)',
    },

    // Provider
    provider: {
      type: 'string',
      optional: true,
      description: 'Payment provider',
      examples: ['stripe', 'paypal', 'square', 'manual'],
    },

    // Timing
    createdAt: {
      type: 'date',
      optional: true,
      description: 'Creation date',
    },
    processedAt: {
      type: 'date',
      optional: true,
      description: 'Processing date',
    },
    settledAt: {
      type: 'date',
      optional: true,
      description: 'Settlement date',
    },

    // Refund
    refundedAmount: {
      type: 'number',
      optional: true,
      description: 'Amount refunded',
    },
    refundedAt: {
      type: 'date',
      optional: true,
      description: 'Refund date',
    },
    refundReason: {
      type: 'string',
      optional: true,
      description: 'Refund reason',
    },

    // Failure
    failureCode: {
      type: 'string',
      optional: true,
      description: 'Failure code',
    },
    failureMessage: {
      type: 'string',
      optional: true,
      description: 'Failure message',
    },

    // Status
    status: {
      type: 'string',
      description: 'Payment status',
      examples: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'disputed'],
    },
  },

  relationships: {
    customer: {
      type: 'ServiceCustomer',
      description: 'Customer',
    },
    invoice: {
      type: 'Invoice',
      required: false,
      description: 'Related invoice',
    },
    subscription: {
      type: 'ServiceSubscription',
      required: false,
      description: 'Related subscription',
    },
  },

  actions: [
    'create',
    'process',
    'capture',
    'refund',
    'dispute',
  ],

  events: [
    'created',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'disputed',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const BillingEntities = {
  ServiceQuote,
  ServiceOrder,
  ServiceSubscription,
  Usage,
  Invoice,
  Payment,
}

export const BillingCategories = {
  quotes: ['ServiceQuote'],
  orders: ['ServiceOrder'],
  subscriptions: ['ServiceSubscription'],
  usage: ['Usage'],
  invoicing: ['Invoice', 'Payment'],
} as const
