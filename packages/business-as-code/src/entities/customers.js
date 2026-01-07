/**
 * Customer Entity Types (Nouns)
 *
 * Customer and relationship management: Customer, Account, Contact, Segment, Persona.
 *
 * @packageDocumentation
 */
// =============================================================================
// Customer
// =============================================================================
/**
 * Customer entity
 *
 * Represents a customer (individual or company).
 */
export const Customer = {
    singular: 'customer',
    plural: 'customers',
    description: 'A customer (individual or company)',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Customer name',
        },
        email: {
            type: 'string',
            optional: true,
            description: 'Primary email',
        },
        phone: {
            type: 'string',
            optional: true,
            description: 'Primary phone',
        },
        // Type
        type: {
            type: 'string',
            description: 'Customer type',
            examples: ['individual', 'company', 'nonprofit', 'government'],
        },
        // Classification
        tier: {
            type: 'string',
            optional: true,
            description: 'Customer tier',
            examples: ['free', 'starter', 'pro', 'business', 'enterprise', 'strategic'],
        },
        segment: {
            type: 'string',
            optional: true,
            description: 'Customer segment',
        },
        industry: {
            type: 'string',
            optional: true,
            description: 'Industry',
        },
        // Lifecycle
        stage: {
            type: 'string',
            description: 'Customer lifecycle stage',
            examples: ['prospect', 'trial', 'onboarding', 'active', 'at-risk', 'churned', 'won-back'],
        },
        source: {
            type: 'string',
            optional: true,
            description: 'Acquisition source',
            examples: ['organic', 'paid', 'referral', 'partner', 'outbound', 'event'],
        },
        referredBy: {
            type: 'string',
            optional: true,
            description: 'Referrer ID or name',
        },
        // Dates
        firstContactAt: {
            type: 'datetime',
            optional: true,
            description: 'First contact date',
        },
        convertedAt: {
            type: 'datetime',
            optional: true,
            description: 'Conversion date',
        },
        churnedAt: {
            type: 'datetime',
            optional: true,
            description: 'Churn date',
        },
        // Value
        lifetimeValue: {
            type: 'number',
            optional: true,
            description: 'Customer lifetime value',
        },
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
        currency: {
            type: 'string',
            optional: true,
            description: 'Currency code',
        },
        // Health
        healthScore: {
            type: 'number',
            optional: true,
            description: 'Customer health score (0-100)',
        },
        nps: {
            type: 'number',
            optional: true,
            description: 'Net Promoter Score (-100 to 100)',
        },
        lastActivityAt: {
            type: 'datetime',
            optional: true,
            description: 'Last activity date',
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
        timezone: {
            type: 'string',
            optional: true,
            description: 'Timezone',
        },
        // Company info (for B2B)
        companySize: {
            type: 'string',
            optional: true,
            description: 'Company size',
            examples: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
        },
        annualRevenue: {
            type: 'number',
            optional: true,
            description: 'Annual revenue',
        },
        website: {
            type: 'url',
            optional: true,
            description: 'Website URL',
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
            description: 'Customer status',
            examples: ['active', 'inactive', 'suspended', 'deleted'],
        },
    },
    relationships: {
        account: {
            type: 'Account',
            required: false,
            description: 'Parent account (for B2B)',
        },
        contacts: {
            type: 'Contact[]',
            description: 'Associated contacts',
        },
        owner: {
            type: 'Worker',
            required: false,
            description: 'Account owner/CSM',
        },
        segment: {
            type: 'Segment',
            required: false,
            description: 'Customer segment',
        },
        subscriptions: {
            type: 'Subscription[]',
            description: 'Active subscriptions',
        },
        contracts: {
            type: 'Contract[]',
            description: 'Contracts',
        },
        deals: {
            type: 'Deal[]',
            description: 'Sales deals',
        },
        interactions: {
            type: 'Interaction[]',
            description: 'Interaction history',
        },
    },
    actions: [
        'create',
        'update',
        'qualify',
        'convert',
        'onboard',
        'upgrade',
        'downgrade',
        'renew',
        'markAtRisk',
        'churn',
        'winBack',
        'merge',
        'archive',
    ],
    events: [
        'created',
        'updated',
        'qualified',
        'converted',
        'onboarded',
        'upgraded',
        'downgraded',
        'renewed',
        'markedAtRisk',
        'churned',
        'wonBack',
        'merged',
        'archived',
    ],
};
// =============================================================================
// Account
// =============================================================================
/**
 * Account entity
 *
 * Represents a company account (B2B).
 */
export const Account = {
    singular: 'account',
    plural: 'accounts',
    description: 'A company account (B2B)',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Account/company name',
        },
        legalName: {
            type: 'string',
            optional: true,
            description: 'Legal entity name',
        },
        domain: {
            type: 'string',
            optional: true,
            description: 'Primary domain',
        },
        website: {
            type: 'url',
            optional: true,
            description: 'Website URL',
        },
        // Classification
        type: {
            type: 'string',
            optional: true,
            description: 'Account type',
            examples: ['prospect', 'customer', 'partner', 'competitor'],
        },
        tier: {
            type: 'string',
            optional: true,
            description: 'Account tier',
            examples: ['smb', 'mid-market', 'enterprise', 'strategic'],
        },
        industry: {
            type: 'string',
            optional: true,
            description: 'Industry',
        },
        // Size
        employees: {
            type: 'number',
            optional: true,
            description: 'Employee count',
        },
        annualRevenue: {
            type: 'number',
            optional: true,
            description: 'Annual revenue',
        },
        // Location
        headquarters: {
            type: 'string',
            optional: true,
            description: 'Headquarters location',
        },
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
        // Relationship
        parentAccountId: {
            type: 'string',
            optional: true,
            description: 'Parent account (for subsidiaries)',
        },
        // Value
        totalContractValue: {
            type: 'number',
            optional: true,
            description: 'Total contract value',
        },
        arr: {
            type: 'number',
            optional: true,
            description: 'Annual recurring revenue',
        },
        currency: {
            type: 'string',
            optional: true,
            description: 'Currency code',
        },
        // Health
        healthScore: {
            type: 'number',
            optional: true,
            description: 'Account health score',
        },
        // IDs
        crmId: {
            type: 'string',
            optional: true,
            description: 'External CRM ID',
        },
        // Status
        status: {
            type: 'string',
            description: 'Account status',
            examples: ['active', 'inactive', 'churned', 'archived'],
        },
    },
    relationships: {
        owner: {
            type: 'Worker',
            required: false,
            description: 'Account owner',
        },
        contacts: {
            type: 'Contact[]',
            description: 'Account contacts',
        },
        customers: {
            type: 'Customer[]',
            description: 'Associated customers',
        },
        deals: {
            type: 'Deal[]',
            description: 'Sales deals',
        },
        contracts: {
            type: 'Contract[]',
            description: 'Contracts',
        },
        parent: {
            type: 'Account',
            required: false,
            description: 'Parent account',
        },
        subsidiaries: {
            type: 'Account[]',
            description: 'Subsidiary accounts',
        },
    },
    actions: [
        'create',
        'update',
        'merge',
        'assignOwner',
        'updateTier',
        'addContact',
        'removeContact',
        'archive',
    ],
    events: [
        'created',
        'updated',
        'merged',
        'ownerAssigned',
        'tierUpdated',
        'contactAdded',
        'contactRemoved',
        'archived',
    ],
};
// =============================================================================
// Contact
// =============================================================================
/**
 * Contact entity
 *
 * Represents a person/contact at a customer or account.
 */
export const Contact = {
    singular: 'contact',
    plural: 'contacts',
    description: 'A person/contact at a customer or account',
    properties: {
        // Identity
        firstName: {
            type: 'string',
            description: 'First name',
        },
        lastName: {
            type: 'string',
            description: 'Last name',
        },
        email: {
            type: 'string',
            description: 'Email address',
        },
        phone: {
            type: 'string',
            optional: true,
            description: 'Phone number',
        },
        // Role
        title: {
            type: 'string',
            optional: true,
            description: 'Job title',
        },
        department: {
            type: 'string',
            optional: true,
            description: 'Department',
        },
        role: {
            type: 'string',
            optional: true,
            description: 'Role in buying process',
            examples: ['decision-maker', 'influencer', 'champion', 'blocker', 'end-user', 'economic-buyer', 'technical-buyer'],
        },
        seniority: {
            type: 'string',
            optional: true,
            description: 'Seniority level',
            examples: ['c-level', 'vp', 'director', 'manager', 'individual-contributor'],
        },
        // Contact preferences
        preferredChannel: {
            type: 'string',
            optional: true,
            description: 'Preferred contact channel',
            examples: ['email', 'phone', 'linkedin', 'slack'],
        },
        timezone: {
            type: 'string',
            optional: true,
            description: 'Timezone',
        },
        // Social
        linkedinUrl: {
            type: 'url',
            optional: true,
            description: 'LinkedIn URL',
        },
        twitterHandle: {
            type: 'string',
            optional: true,
            description: 'Twitter handle',
        },
        // Engagement
        lastContactedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last contacted date',
        },
        lastRespondedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last response date',
        },
        // Opt-in
        marketingOptIn: {
            type: 'boolean',
            optional: true,
            description: 'Marketing opt-in',
        },
        salesOptIn: {
            type: 'boolean',
            optional: true,
            description: 'Sales opt-in',
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
            description: 'Contact status',
            examples: ['active', 'inactive', 'bounced', 'unsubscribed', 'archived'],
        },
    },
    relationships: {
        account: {
            type: 'Account',
            required: false,
            description: 'Parent account',
        },
        customer: {
            type: 'Customer',
            required: false,
            description: 'Associated customer',
        },
        owner: {
            type: 'Worker',
            required: false,
            description: 'Contact owner',
        },
        deals: {
            type: 'Deal[]',
            description: 'Associated deals',
        },
        interactions: {
            type: 'Interaction[]',
            description: 'Interaction history',
        },
    },
    actions: [
        'create',
        'update',
        'merge',
        'assignOwner',
        'optIn',
        'optOut',
        'markBounced',
        'archive',
    ],
    events: [
        'created',
        'updated',
        'merged',
        'ownerAssigned',
        'optedIn',
        'optedOut',
        'bounced',
        'archived',
    ],
};
// =============================================================================
// Segment
// =============================================================================
/**
 * Segment entity
 *
 * Represents a customer segment.
 */
export const Segment = {
    singular: 'segment',
    plural: 'segments',
    description: 'A customer segment',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Segment name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Segment description',
        },
        // Type
        type: {
            type: 'string',
            optional: true,
            description: 'Segment type',
            examples: ['demographic', 'behavioral', 'firmographic', 'technographic', 'psychographic'],
        },
        // Criteria
        criteria: {
            type: 'json',
            optional: true,
            description: 'Segment criteria/filters',
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
            description: 'Number of customers in segment',
        },
        // Value
        totalRevenue: {
            type: 'number',
            optional: true,
            description: 'Total revenue from segment',
        },
        avgRevenue: {
            type: 'number',
            optional: true,
            description: 'Average revenue per customer',
        },
        avgLTV: {
            type: 'number',
            optional: true,
            description: 'Average lifetime value',
        },
        // Behavior
        avgChurnRate: {
            type: 'number',
            optional: true,
            description: 'Average churn rate',
        },
        avgNPS: {
            type: 'number',
            optional: true,
            description: 'Average NPS',
        },
        // Dynamic
        isDynamic: {
            type: 'boolean',
            optional: true,
            description: 'Auto-updates based on criteria',
        },
        lastCalculatedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last calculation time',
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
            type: 'Customer[]',
            description: 'Customers in segment',
        },
        campaigns: {
            type: 'Campaign[]',
            description: 'Targeted campaigns',
        },
        persona: {
            type: 'Persona',
            required: false,
            description: 'Associated persona',
        },
    },
    actions: [
        'create',
        'update',
        'refresh',
        'addCustomer',
        'removeCustomer',
        'archive',
    ],
    events: [
        'created',
        'updated',
        'refreshed',
        'customerAdded',
        'customerRemoved',
        'archived',
    ],
};
// =============================================================================
// Persona
// =============================================================================
/**
 * Persona entity
 *
 * Represents a buyer or user persona.
 */
export const Persona = {
    singular: 'persona',
    plural: 'personas',
    description: 'A buyer or user persona',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Persona name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Persona description',
        },
        avatarUrl: {
            type: 'url',
            optional: true,
            description: 'Avatar image URL',
        },
        // Type
        type: {
            type: 'string',
            optional: true,
            description: 'Persona type',
            examples: ['buyer', 'user', 'influencer', 'decision-maker'],
        },
        // Demographics
        jobTitle: {
            type: 'string',
            optional: true,
            description: 'Typical job title',
        },
        department: {
            type: 'string',
            optional: true,
            description: 'Typical department',
        },
        seniority: {
            type: 'string',
            optional: true,
            description: 'Seniority level',
        },
        companySize: {
            type: 'string',
            optional: true,
            description: 'Typical company size',
        },
        industry: {
            type: 'string',
            optional: true,
            description: 'Typical industry',
        },
        // Psychographics
        goals: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Goals and objectives',
        },
        challenges: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Pain points and challenges',
        },
        motivations: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Motivations',
        },
        objections: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Common objections',
        },
        // Behavior
        preferredChannels: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Preferred communication channels',
        },
        contentPreferences: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Content format preferences',
        },
        buyingProcess: {
            type: 'string',
            optional: true,
            description: 'Typical buying process',
        },
        // Messaging
        valueProposition: {
            type: 'string',
            optional: true,
            description: 'Value proposition for this persona',
        },
        messagingGuidelines: {
            type: 'string',
            optional: true,
            description: 'Messaging guidelines',
        },
        keywords: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Keywords/phrases that resonate',
        },
        // Status
        status: {
            type: 'string',
            description: 'Persona status',
            examples: ['active', 'draft', 'archived'],
        },
    },
    relationships: {
        segments: {
            type: 'Segment[]',
            description: 'Associated segments',
        },
        products: {
            type: 'Product[]',
            description: 'Relevant products',
        },
        content: {
            type: 'Content[]',
            description: 'Content for this persona',
        },
        campaigns: {
            type: 'Campaign[]',
            description: 'Targeted campaigns',
        },
    },
    actions: [
        'create',
        'update',
        'validate',
        'archive',
    ],
    events: [
        'created',
        'updated',
        'validated',
        'archived',
    ],
};
// =============================================================================
// Interaction
// =============================================================================
/**
 * Interaction entity
 *
 * Represents a customer interaction/touchpoint.
 */
export const Interaction = {
    singular: 'interaction',
    plural: 'interactions',
    description: 'A customer interaction or touchpoint',
    properties: {
        // Type
        type: {
            type: 'string',
            description: 'Interaction type',
            examples: ['email', 'call', 'meeting', 'chat', 'support-ticket', 'demo', 'webinar', 'event', 'social'],
        },
        direction: {
            type: 'string',
            optional: true,
            description: 'Interaction direction',
            examples: ['inbound', 'outbound'],
        },
        // Content
        subject: {
            type: 'string',
            optional: true,
            description: 'Subject/title',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Description/notes',
        },
        // Timing
        occurredAt: {
            type: 'datetime',
            description: 'When it occurred',
        },
        duration: {
            type: 'number',
            optional: true,
            description: 'Duration in minutes',
        },
        // Outcome
        outcome: {
            type: 'string',
            optional: true,
            description: 'Interaction outcome',
            examples: ['positive', 'neutral', 'negative', 'no-response'],
        },
        sentiment: {
            type: 'string',
            optional: true,
            description: 'Customer sentiment',
            examples: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'],
        },
        nextSteps: {
            type: 'string',
            optional: true,
            description: 'Next steps',
        },
        // Channel
        channel: {
            type: 'string',
            optional: true,
            description: 'Channel used',
        },
        // Attribution
        campaignId: {
            type: 'string',
            optional: true,
            description: 'Associated campaign',
        },
    },
    relationships: {
        customer: {
            type: 'Customer',
            required: false,
            description: 'Customer',
        },
        contact: {
            type: 'Contact',
            required: false,
            description: 'Contact',
        },
        account: {
            type: 'Account',
            required: false,
            description: 'Account',
        },
        createdBy: {
            type: 'Worker',
            required: false,
            description: 'Who logged it',
        },
        deal: {
            type: 'Deal',
            required: false,
            description: 'Associated deal',
        },
    },
    actions: [
        'log',
        'update',
        'delete',
    ],
    events: [
        'logged',
        'updated',
        'deleted',
    ],
};
// =============================================================================
// Exports
// =============================================================================
export const CustomerEntities = {
    Customer,
    Account,
    Contact,
    Segment,
    Persona,
    Interaction,
};
export const CustomerCategories = {
    customers: ['Customer', 'Account', 'Contact'],
    segmentation: ['Segment', 'Persona'],
    engagement: ['Interaction'],
};
