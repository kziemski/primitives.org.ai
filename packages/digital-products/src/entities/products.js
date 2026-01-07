/**
 * Core Product Entity Types (Nouns)
 *
 * Base digital product definitions and primary product types:
 * DigitalProduct, SaaSProduct, App, Platform, Marketplace
 *
 * @packageDocumentation
 */
// =============================================================================
// DigitalProduct
// =============================================================================
/**
 * DigitalProduct entity
 *
 * Base entity for all digital products.
 */
export const DigitalProduct = {
    singular: 'digital-product',
    plural: 'digital-products',
    description: 'A digital product or software offering',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Product name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Product description',
        },
        tagline: {
            type: 'string',
            optional: true,
            description: 'Short marketing tagline',
        },
        // Classification
        type: {
            type: 'string',
            description: 'Product type',
            examples: ['saas', 'app', 'api', 'platform', 'marketplace', 'content', 'data', 'sdk', 'plugin', 'ai'],
        },
        category: {
            type: 'string',
            optional: true,
            description: 'Product category',
        },
        tags: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Product tags',
        },
        // Versioning
        version: {
            type: 'string',
            optional: true,
            description: 'Current version',
        },
        // Market
        targetAudience: {
            type: 'string',
            optional: true,
            description: 'Target audience description',
        },
        valueProposition: {
            type: 'string',
            optional: true,
            description: 'Core value proposition',
        },
        useCases: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Primary use cases',
        },
        // Pricing
        pricingModel: {
            type: 'string',
            optional: true,
            description: 'Pricing model',
            examples: ['free', 'freemium', 'subscription', 'one-time', 'usage-based', 'tiered', 'per-seat'],
        },
        price: {
            type: 'number',
            optional: true,
            description: 'Base price',
        },
        currency: {
            type: 'string',
            optional: true,
            description: 'Currency code (ISO 4217)',
        },
        // Lifecycle
        stage: {
            type: 'string',
            optional: true,
            description: 'Product lifecycle stage',
            examples: ['concept', 'development', 'alpha', 'beta', 'ga', 'growth', 'mature', 'sunset'],
        },
        launchedAt: {
            type: 'date',
            optional: true,
            description: 'Launch date',
        },
        // Status
        status: {
            type: 'string',
            description: 'Product status',
            examples: ['draft', 'active', 'paused', 'deprecated', 'archived'],
        },
        visibility: {
            type: 'string',
            optional: true,
            description: 'Visibility level',
            examples: ['public', 'private', 'unlisted', 'beta', 'waitlist'],
        },
        // URLs
        websiteUrl: {
            type: 'string',
            optional: true,
            description: 'Product website URL',
        },
        documentationUrl: {
            type: 'string',
            optional: true,
            description: 'Documentation URL',
        },
        repositoryUrl: {
            type: 'string',
            optional: true,
            description: 'Source repository URL',
        },
    },
    relationships: {
        owner: {
            type: 'Organization',
            required: false,
            description: 'Owning organization',
        },
        team: {
            type: 'Team',
            required: false,
            description: 'Product team',
        },
        features: {
            type: 'Feature[]',
            description: 'Product features',
        },
        versions: {
            type: 'Version[]',
            description: 'Product versions',
        },
        deployments: {
            type: 'Deployment[]',
            description: 'Active deployments',
        },
    },
    actions: [
        'create',
        'update',
        'launch',
        'release',
        'deploy',
        'pause',
        'resume',
        'deprecate',
        'archive',
    ],
    events: [
        'created',
        'updated',
        'launched',
        'released',
        'deployed',
        'paused',
        'resumed',
        'deprecated',
        'archived',
    ],
};
// =============================================================================
// SaaSProduct
// =============================================================================
/**
 * SaaSProduct entity
 *
 * Software-as-a-Service product with subscription model.
 */
export const SaaSProduct = {
    singular: 'saas-product',
    plural: 'saas-products',
    description: 'A Software-as-a-Service product',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Product name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Product description',
        },
        // SaaS Specific
        multiTenant: {
            type: 'boolean',
            optional: true,
            description: 'Multi-tenant architecture',
        },
        selfService: {
            type: 'boolean',
            optional: true,
            description: 'Self-service signup available',
        },
        trialDays: {
            type: 'number',
            optional: true,
            description: 'Free trial period in days',
        },
        // Infrastructure
        hostingModel: {
            type: 'string',
            optional: true,
            description: 'Hosting model',
            examples: ['cloud', 'hybrid', 'on-premise', 'self-hosted'],
        },
        regions: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Available regions',
        },
        // Compliance
        certifications: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Security certifications',
            examples: ['SOC2', 'HIPAA', 'GDPR', 'ISO27001', 'PCI-DSS'],
        },
        dataResidency: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Data residency options',
        },
        // Usage
        activeUsers: {
            type: 'number',
            optional: true,
            description: 'Active user count',
        },
        monthlyActiveUsers: {
            type: 'number',
            optional: true,
            description: 'Monthly active users',
        },
        // Revenue
        mrr: {
            type: 'number',
            optional: true,
            description: 'Monthly recurring revenue',
        },
        arr: {
            type: 'number',
            optional: true,
            description: 'Annual recurring revenue',
        },
        churnRate: {
            type: 'number',
            optional: true,
            description: 'Monthly churn rate',
        },
        // Status
        status: {
            type: 'string',
            description: 'Product status',
            examples: ['draft', 'beta', 'active', 'paused', 'sunset'],
        },
    },
    relationships: {
        product: {
            type: 'DigitalProduct',
            description: 'Parent digital product',
        },
        plans: {
            type: 'PricingPlan[]',
            description: 'Subscription plans',
        },
        tenants: {
            type: 'Tenant[]',
            description: 'Customer tenants',
        },
        integrations: {
            type: 'Integration[]',
            description: 'Available integrations',
        },
    },
    actions: [
        'create',
        'update',
        'launch',
        'addPlan',
        'removePlan',
        'provisionTenant',
        'deprovisionTenant',
        'pause',
        'sunset',
    ],
    events: [
        'created',
        'updated',
        'launched',
        'planAdded',
        'planRemoved',
        'tenantProvisioned',
        'tenantDeprovisioned',
        'paused',
        'sunset',
    ],
};
// =============================================================================
// App
// =============================================================================
/**
 * App entity
 *
 * Interactive user-facing application.
 */
export const App = {
    singular: 'app',
    plural: 'apps',
    description: 'An interactive user-facing application',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'App name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'App description',
        },
        // Classification
        type: {
            type: 'string',
            description: 'App type',
            examples: ['web', 'mobile', 'desktop', 'cli', 'pwa', 'native', 'hybrid'],
        },
        platform: {
            type: 'string',
            optional: true,
            description: 'Target platform',
            examples: ['browser', 'ios', 'android', 'macos', 'windows', 'linux', 'cross-platform'],
        },
        // Technology
        framework: {
            type: 'string',
            optional: true,
            description: 'Primary framework',
            examples: ['react', 'vue', 'svelte', 'solid', 'angular', 'next', 'nuxt', 'native', 'flutter', 'electron'],
        },
        language: {
            type: 'string',
            optional: true,
            description: 'Primary language',
            examples: ['typescript', 'javascript', 'swift', 'kotlin', 'dart', 'rust'],
        },
        runtime: {
            type: 'string',
            optional: true,
            description: 'Runtime environment',
            examples: ['browser', 'node', 'bun', 'deno', 'native'],
        },
        // Configuration
        entryPoint: {
            type: 'string',
            optional: true,
            description: 'Application entry point',
        },
        routes: {
            type: 'json',
            optional: true,
            description: 'Application routes',
        },
        // Features
        offlineCapable: {
            type: 'boolean',
            optional: true,
            description: 'Works offline',
        },
        pushNotifications: {
            type: 'boolean',
            optional: true,
            description: 'Push notification support',
        },
        // Distribution
        appStoreUrl: {
            type: 'string',
            optional: true,
            description: 'App store URL',
        },
        playStoreUrl: {
            type: 'string',
            optional: true,
            description: 'Play store URL',
        },
        // Status
        status: {
            type: 'string',
            description: 'App status',
            examples: ['draft', 'development', 'testing', 'beta', 'production', 'deprecated'],
        },
    },
    relationships: {
        product: {
            type: 'DigitalProduct',
            description: 'Parent product',
        },
        features: {
            type: 'Feature[]',
            description: 'App features',
        },
        releases: {
            type: 'Release[]',
            description: 'App releases',
        },
        deployments: {
            type: 'Deployment[]',
            description: 'Active deployments',
        },
        components: {
            type: 'Component[]',
            description: 'UI components',
        },
    },
    actions: [
        'create',
        'update',
        'build',
        'test',
        'deploy',
        'release',
        'rollback',
        'pause',
        'deprecate',
    ],
    events: [
        'created',
        'updated',
        'built',
        'tested',
        'deployed',
        'released',
        'rolledBack',
        'paused',
        'deprecated',
    ],
};
// =============================================================================
// Platform
// =============================================================================
/**
 * Platform entity
 *
 * Multi-sided platform connecting different user groups.
 */
export const Platform = {
    singular: 'platform',
    plural: 'platforms',
    description: 'A multi-sided platform connecting users and providers',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Platform name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Platform description',
        },
        // Platform Type
        type: {
            type: 'string',
            description: 'Platform type',
            examples: ['marketplace', 'social', 'developer', 'content', 'service', 'data', 'ai'],
        },
        // Sides/Participants
        sides: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Platform sides (e.g., buyers, sellers)',
        },
        // Network Effects
        networkEffectType: {
            type: 'string',
            optional: true,
            description: 'Type of network effect',
            examples: ['same-side', 'cross-side', 'data', 'none'],
        },
        // Openness
        openness: {
            type: 'string',
            optional: true,
            description: 'Platform openness level',
            examples: ['open', 'semi-open', 'closed', 'invite-only'],
        },
        apiAccess: {
            type: 'boolean',
            optional: true,
            description: 'API access available',
        },
        developerProgram: {
            type: 'boolean',
            optional: true,
            description: 'Developer program available',
        },
        // Governance
        governanceModel: {
            type: 'string',
            optional: true,
            description: 'Platform governance model',
            examples: ['centralized', 'federated', 'decentralized', 'hybrid'],
        },
        // Economics
        revenueModel: {
            type: 'string',
            optional: true,
            description: 'Revenue model',
            examples: ['commission', 'subscription', 'advertising', 'freemium', 'data', 'hybrid'],
        },
        takeRate: {
            type: 'number',
            optional: true,
            description: 'Platform take rate percentage',
        },
        // Metrics
        totalUsers: {
            type: 'number',
            optional: true,
            description: 'Total registered users',
        },
        gmv: {
            type: 'number',
            optional: true,
            description: 'Gross merchandise value',
        },
        // Status
        status: {
            type: 'string',
            description: 'Platform status',
            examples: ['draft', 'beta', 'active', 'scaling', 'mature'],
        },
    },
    relationships: {
        product: {
            type: 'DigitalProduct',
            description: 'Parent product',
        },
        apis: {
            type: 'API[]',
            description: 'Platform APIs',
        },
        plugins: {
            type: 'Plugin[]',
            description: 'Available plugins',
        },
        integrations: {
            type: 'Integration[]',
            description: 'Platform integrations',
        },
    },
    actions: [
        'create',
        'update',
        'launch',
        'openAPI',
        'closeAPI',
        'addSide',
        'removeSide',
        'updateGovernance',
        'scale',
    ],
    events: [
        'created',
        'updated',
        'launched',
        'apiOpened',
        'apiClosed',
        'sideAdded',
        'sideRemoved',
        'governanceUpdated',
        'scaled',
    ],
};
// =============================================================================
// Marketplace
// =============================================================================
/**
 * Marketplace entity
 *
 * Platform for buying and selling products or services.
 */
export const Marketplace = {
    singular: 'marketplace',
    plural: 'marketplaces',
    description: 'A platform for buying and selling products or services',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Marketplace name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Marketplace description',
        },
        // Type
        type: {
            type: 'string',
            description: 'Marketplace type',
            examples: ['b2b', 'b2c', 'c2c', 'p2p', 'vertical', 'horizontal'],
        },
        vertical: {
            type: 'string',
            optional: true,
            description: 'Industry vertical',
        },
        // What's Traded
        itemType: {
            type: 'string',
            description: 'Type of items traded',
            examples: ['products', 'services', 'digital-goods', 'subscriptions', 'labor', 'data'],
        },
        // Matching
        matchingModel: {
            type: 'string',
            optional: true,
            description: 'How buyers and sellers are matched',
            examples: ['search', 'browse', 'auction', 'rfq', 'algorithmic', 'ai-powered'],
        },
        // Trust & Safety
        trustModel: {
            type: 'string',
            optional: true,
            description: 'Trust and safety model',
            examples: ['reviews', 'verification', 'escrow', 'insurance', 'guarantee'],
        },
        disputeResolution: {
            type: 'string',
            optional: true,
            description: 'Dispute resolution method',
            examples: ['platform', 'arbitration', 'mediation', 'legal'],
        },
        // Transactions
        paymentMethods: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Supported payment methods',
        },
        escrowEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Escrow payments supported',
        },
        // Economics
        commissionRate: {
            type: 'number',
            optional: true,
            description: 'Commission rate percentage',
        },
        listingFee: {
            type: 'number',
            optional: true,
            description: 'Fee per listing',
        },
        transactionFee: {
            type: 'number',
            optional: true,
            description: 'Per-transaction fee',
        },
        // Metrics
        totalListings: {
            type: 'number',
            optional: true,
            description: 'Total active listings',
        },
        totalSellers: {
            type: 'number',
            optional: true,
            description: 'Total registered sellers',
        },
        totalBuyers: {
            type: 'number',
            optional: true,
            description: 'Total registered buyers',
        },
        gmv: {
            type: 'number',
            optional: true,
            description: 'Gross merchandise value',
        },
        // Status
        status: {
            type: 'string',
            description: 'Marketplace status',
            examples: ['draft', 'beta', 'active', 'scaling', 'mature'],
        },
    },
    relationships: {
        platform: {
            type: 'Platform',
            description: 'Parent platform',
        },
        categories: {
            type: 'Category[]',
            description: 'Product categories',
        },
        sellers: {
            type: 'Seller[]',
            description: 'Marketplace sellers',
        },
        listings: {
            type: 'Listing[]',
            description: 'Active listings',
        },
    },
    actions: [
        'create',
        'update',
        'launch',
        'addCategory',
        'removeCategory',
        'approveSeller',
        'suspendSeller',
        'updateFees',
        'resolveDispute',
    ],
    events: [
        'created',
        'updated',
        'launched',
        'categoryAdded',
        'categoryRemoved',
        'sellerApproved',
        'sellerSuspended',
        'feesUpdated',
        'disputeResolved',
    ],
};
// =============================================================================
// Exports
// =============================================================================
export const ProductEntities = {
    DigitalProduct,
    SaaSProduct,
    App,
    Platform,
    Marketplace,
};
export const ProductCategories = {
    core: ['DigitalProduct'],
    saas: ['SaaSProduct'],
    apps: ['App'],
    platforms: ['Platform', 'Marketplace'],
};
