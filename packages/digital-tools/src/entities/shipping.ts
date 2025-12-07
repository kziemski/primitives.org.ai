/**
 * Shipping Entity Types (Nouns)
 *
 * Shipping and logistics entities for shipments, packages,
 * carriers, tracking, and fulfillment.
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// Shipment
// =============================================================================

/**
 * Shipment entity
 *
 * Represents a shipment of one or more packages.
 */
export const Shipment: Noun = {
  singular: 'shipment',
  plural: 'shipments',
  description: 'A shipment of one or more packages',

  properties: {
    // Identity
    trackingNumber: {
      type: 'string',
      description: 'Master tracking number',
    },
    referenceNumber: {
      type: 'string',
      optional: true,
      description: 'Internal reference number',
    },

    // Status
    status: {
      type: 'string',
      description: 'Shipment status',
      examples: ['pending', 'processing', 'shipped', 'in-transit', 'out-for-delivery', 'delivered', 'failed', 'returned'],
    },

    // Carrier
    carrier: {
      type: 'string',
      description: 'Carrier name',
      examples: ['ups', 'fedex', 'usps', 'dhl', 'amazon'],
    },
    service: {
      type: 'string',
      optional: true,
      description: 'Service level',
      examples: ['ground', 'express', '2-day', 'overnight', 'freight'],
    },

    // Origin
    originAddress: {
      type: 'json',
      description: 'Origin address',
    },
    originName: {
      type: 'string',
      optional: true,
      description: 'Origin contact name',
    },

    // Destination
    destinationAddress: {
      type: 'json',
      description: 'Destination address',
    },
    destinationName: {
      type: 'string',
      optional: true,
      description: 'Recipient name',
    },
    destinationPhone: {
      type: 'string',
      optional: true,
      description: 'Recipient phone',
    },
    destinationEmail: {
      type: 'string',
      optional: true,
      description: 'Recipient email',
    },

    // Dates
    shipDate: {
      type: 'datetime',
      optional: true,
      description: 'Ship date',
    },
    estimatedDelivery: {
      type: 'datetime',
      optional: true,
      description: 'Estimated delivery date',
    },
    actualDelivery: {
      type: 'datetime',
      optional: true,
      description: 'Actual delivery date',
    },

    // Cost
    shippingCost: {
      type: 'number',
      optional: true,
      description: 'Shipping cost',
    },
    insuranceValue: {
      type: 'number',
      optional: true,
      description: 'Declared value for insurance',
    },
    currency: {
      type: 'string',
      optional: true,
      description: 'Currency',
    },

    // Options
    signatureRequired: {
      type: 'boolean',
      optional: true,
      description: 'Signature required',
    },
    saturdayDelivery: {
      type: 'boolean',
      optional: true,
      description: 'Saturday delivery',
    },

    // Documents
    labelUrl: {
      type: 'url',
      optional: true,
      description: 'Shipping label URL',
    },
    commercialInvoiceUrl: {
      type: 'url',
      optional: true,
      description: 'Commercial invoice URL',
    },
  },

  relationships: {
    packages: {
      type: 'Package[]',
      description: 'Packages in shipment',
    },
    order: {
      type: 'Order',
      required: false,
      description: 'Related order',
    },
    events: {
      type: 'TrackingEvent[]',
      description: 'Tracking events',
    },
  },

  actions: [
    'create',
    'update',
    'ship',
    'cancel',
    'track',
    'requestReturn',
  ],

  events: [
    'created',
    'shipped',
    'inTransit',
    'outForDelivery',
    'delivered',
    'failed',
    'returned',
    'cancelled',
  ],
}

// =============================================================================
// Package
// =============================================================================

/**
 * Package entity
 *
 * Represents a single package within a shipment.
 */
export const Package: Noun = {
  singular: 'package',
  plural: 'packages',
  description: 'A single package within a shipment',

  properties: {
    // Identity
    trackingNumber: {
      type: 'string',
      optional: true,
      description: 'Package tracking number',
    },

    // Dimensions
    weight: {
      type: 'number',
      optional: true,
      description: 'Weight',
    },
    weightUnit: {
      type: 'string',
      optional: true,
      description: 'Weight unit',
      examples: ['lb', 'oz', 'kg', 'g'],
    },
    length: {
      type: 'number',
      optional: true,
      description: 'Length',
    },
    width: {
      type: 'number',
      optional: true,
      description: 'Width',
    },
    height: {
      type: 'number',
      optional: true,
      description: 'Height',
    },
    dimensionUnit: {
      type: 'string',
      optional: true,
      description: 'Dimension unit',
      examples: ['in', 'cm'],
    },

    // Packaging
    packageType: {
      type: 'string',
      optional: true,
      description: 'Package type',
      examples: ['box', 'envelope', 'tube', 'pallet', 'custom'],
    },

    // Contents
    contents: {
      type: 'string',
      optional: true,
      description: 'Package contents description',
    },
    declaredValue: {
      type: 'number',
      optional: true,
      description: 'Declared value',
    },

    // Status
    status: {
      type: 'string',
      optional: true,
      description: 'Package status',
    },
  },

  relationships: {
    shipment: {
      type: 'Shipment',
      description: 'Parent shipment',
    },
    items: {
      type: 'OrderItem[]',
      description: 'Items in package',
    },
  },

  actions: [
    'create',
    'update',
    'weigh',
    'measure',
  ],

  events: [
    'created',
    'updated',
    'weighed',
    'measured',
  ],
}

// =============================================================================
// TrackingEvent
// =============================================================================

/**
 * TrackingEvent entity
 *
 * Represents a tracking event/scan.
 */
export const TrackingEvent: Noun = {
  singular: 'tracking-event',
  plural: 'tracking-events',
  description: 'A tracking event or scan',

  properties: {
    // Status
    status: {
      type: 'string',
      description: 'Event status',
      examples: ['picked-up', 'in-transit', 'arrived', 'departed', 'out-for-delivery', 'delivered', 'exception'],
    },
    statusDetail: {
      type: 'string',
      optional: true,
      description: 'Detailed status',
    },
    message: {
      type: 'string',
      optional: true,
      description: 'Event message',
    },

    // Location
    location: {
      type: 'string',
      optional: true,
      description: 'Event location',
    },
    city: {
      type: 'string',
      optional: true,
      description: 'City',
    },
    state: {
      type: 'string',
      optional: true,
      description: 'State/province',
    },
    country: {
      type: 'string',
      optional: true,
      description: 'Country',
    },
    postalCode: {
      type: 'string',
      optional: true,
      description: 'Postal code',
    },

    // Time
    timestamp: {
      type: 'datetime',
      description: 'Event timestamp',
    },

    // Delivery details
    signedBy: {
      type: 'string',
      optional: true,
      description: 'Signature name',
    },
    proofOfDeliveryUrl: {
      type: 'url',
      optional: true,
      description: 'Proof of delivery image URL',
    },
  },

  relationships: {
    shipment: {
      type: 'Shipment',
      description: 'Related shipment',
    },
    package: {
      type: 'Package',
      required: false,
      description: 'Related package',
    },
  },

  actions: ['create'],

  events: ['created'],
}

// =============================================================================
// Carrier
// =============================================================================

/**
 * Carrier entity
 *
 * Represents a shipping carrier configuration.
 */
export const Carrier: Noun = {
  singular: 'carrier',
  plural: 'carriers',
  description: 'A shipping carrier configuration',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Carrier name',
    },
    code: {
      type: 'string',
      description: 'Carrier code',
      examples: ['ups', 'fedex', 'usps', 'dhl'],
    },

    // Status
    isActive: {
      type: 'boolean',
      description: 'Whether carrier is active',
    },

    // Account
    accountNumber: {
      type: 'string',
      optional: true,
      description: 'Account number',
    },

    // Services
    services: {
      type: 'json',
      optional: true,
      description: 'Available services',
    },

    // Settings
    defaultService: {
      type: 'string',
      optional: true,
      description: 'Default service',
    },
    defaultPackageType: {
      type: 'string',
      optional: true,
      description: 'Default package type',
    },
  },

  relationships: {
    shipments: {
      type: 'Shipment[]',
      description: 'Shipments using this carrier',
    },
  },

  actions: [
    'create',
    'update',
    'activate',
    'deactivate',
    'getRates',
  ],

  events: [
    'created',
    'updated',
    'activated',
    'deactivated',
  ],
}

// =============================================================================
// Rate
// =============================================================================

/**
 * Rate entity
 *
 * Represents a shipping rate quote.
 */
export const Rate: Noun = {
  singular: 'rate',
  plural: 'rates',
  description: 'A shipping rate quote',

  properties: {
    // Carrier/Service
    carrier: {
      type: 'string',
      description: 'Carrier code',
    },
    service: {
      type: 'string',
      description: 'Service name',
    },
    serviceCode: {
      type: 'string',
      optional: true,
      description: 'Service code',
    },

    // Cost
    rate: {
      type: 'number',
      description: 'Shipping rate',
    },
    currency: {
      type: 'string',
      description: 'Currency',
    },
    retailRate: {
      type: 'number',
      optional: true,
      description: 'Retail rate',
    },

    // Delivery
    deliveryDays: {
      type: 'number',
      optional: true,
      description: 'Estimated delivery days',
    },
    estimatedDelivery: {
      type: 'datetime',
      optional: true,
      description: 'Estimated delivery date',
    },
    guaranteed: {
      type: 'boolean',
      optional: true,
      description: 'Delivery guaranteed',
    },

    // Validity
    expiresAt: {
      type: 'datetime',
      optional: true,
      description: 'Quote expiration',
    },
  },

  relationships: {},

  actions: ['get', 'select'],

  events: ['retrieved', 'selected'],
}

// =============================================================================
// Exports
// =============================================================================

export const ShippingEntities = {
  Shipment,
  Package,
  TrackingEvent,
  Carrier,
  Rate,
}

export const ShippingCategories = {
  shipments: ['Shipment', 'Package'],
  tracking: ['TrackingEvent'],
  carriers: ['Carrier', 'Rate'],
} as const
