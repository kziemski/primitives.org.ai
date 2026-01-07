/**
 * Experimentation & Analytics Entity Types (Nouns)
 *
 * Entities for product analytics, feature flags, A/B testing, and user tracking.
 * Covers Google Analytics, PostHog, Mixpanel, LaunchDarkly, etc.
 *
 * @packageDocumentation
 */
// =============================================================================
// Session
// =============================================================================
/**
 * Session entity
 *
 * Represents a user session for analytics tracking
 */
export const Session = {
    singular: 'session',
    plural: 'sessions',
    description: 'A user session for analytics tracking',
    properties: {
        // Identity
        sessionId: {
            type: 'string',
            description: 'Unique session identifier',
        },
        userId: {
            type: 'string',
            optional: true,
            description: 'Identified user ID (if logged in)',
        },
        anonymousId: {
            type: 'string',
            optional: true,
            description: 'Anonymous visitor ID',
        },
        // Timing
        startedAt: {
            type: 'datetime',
            description: 'Session start time',
        },
        endedAt: {
            type: 'datetime',
            optional: true,
            description: 'Session end time',
        },
        duration: {
            type: 'number',
            optional: true,
            description: 'Session duration in seconds',
        },
        // Context
        device: {
            type: 'string',
            optional: true,
            description: 'Device type: desktop, mobile, tablet',
            examples: ['desktop', 'mobile', 'tablet'],
        },
        browser: {
            type: 'string',
            optional: true,
            description: 'Browser name and version',
        },
        os: {
            type: 'string',
            optional: true,
            description: 'Operating system',
        },
        screenResolution: {
            type: 'string',
            optional: true,
            description: 'Screen resolution',
        },
        // Location
        country: {
            type: 'string',
            optional: true,
            description: 'Country code',
        },
        region: {
            type: 'string',
            optional: true,
            description: 'Region/state',
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
        // Source
        referrer: {
            type: 'url',
            optional: true,
            description: 'Referrer URL',
        },
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
        landingPage: {
            type: 'url',
            optional: true,
            description: 'Landing page URL',
        },
        // Engagement
        pageviews: {
            type: 'number',
            optional: true,
            description: 'Number of pageviews',
        },
        events: {
            type: 'number',
            optional: true,
            description: 'Number of events',
        },
        bounced: {
            type: 'boolean',
            optional: true,
            description: 'Whether session bounced',
        },
        converted: {
            type: 'boolean',
            optional: true,
            description: 'Whether session converted',
        },
    },
    relationships: {
        user: {
            type: 'Contact',
            required: false,
            description: 'Identified user',
        },
        events: {
            type: 'AnalyticsEvent[]',
            description: 'Events in this session',
        },
        pageviews: {
            type: 'Pageview[]',
            description: 'Pageviews in this session',
        },
    },
    actions: ['track', 'identify', 'end', 'merge'],
    events: ['started', 'identified', 'ended', 'converted', 'bounced'],
};
// =============================================================================
// Analytics Event
// =============================================================================
/**
 * Analytics event entity
 *
 * Represents a tracked analytics event
 */
export const AnalyticsEvent = {
    singular: 'analytics event',
    plural: 'analytics events',
    description: 'A tracked analytics event',
    properties: {
        // Identity
        eventName: {
            type: 'string',
            description: 'Event name',
        },
        eventType: {
            type: 'string',
            optional: true,
            description: 'Event type: track, page, identify, group',
            examples: ['track', 'page', 'identify', 'group'],
        },
        // Properties
        properties: {
            type: 'json',
            optional: true,
            description: 'Event properties',
        },
        // Context
        timestamp: {
            type: 'datetime',
            description: 'Event timestamp',
        },
        sessionId: {
            type: 'string',
            optional: true,
            description: 'Session ID',
        },
        userId: {
            type: 'string',
            optional: true,
            description: 'User ID',
        },
        anonymousId: {
            type: 'string',
            optional: true,
            description: 'Anonymous ID',
        },
        // Location
        url: {
            type: 'url',
            optional: true,
            description: 'Page URL where event occurred',
        },
        path: {
            type: 'string',
            optional: true,
            description: 'Page path',
        },
        // Device context
        context: {
            type: 'json',
            optional: true,
            description: 'Event context (device, location, etc.)',
        },
        // Value
        value: {
            type: 'number',
            optional: true,
            description: 'Numeric value (e.g., revenue)',
        },
        currency: {
            type: 'string',
            optional: true,
            description: 'Currency code for value',
        },
    },
    relationships: {
        session: {
            type: 'Session',
            required: false,
            backref: 'events',
            description: 'Parent session',
        },
        user: {
            type: 'Contact',
            required: false,
            description: 'User who triggered event',
        },
    },
    actions: ['track', 'query', 'aggregate', 'export'],
    events: ['tracked'],
};
/**
 * Pageview entity
 */
export const Pageview = {
    singular: 'pageview',
    plural: 'pageviews',
    description: 'A page view event',
    properties: {
        url: {
            type: 'url',
            description: 'Page URL',
        },
        path: {
            type: 'string',
            description: 'Page path',
        },
        title: {
            type: 'string',
            optional: true,
            description: 'Page title',
        },
        referrer: {
            type: 'url',
            optional: true,
            description: 'Referrer URL',
        },
        timestamp: {
            type: 'datetime',
            description: 'Pageview timestamp',
        },
        timeOnPage: {
            type: 'number',
            optional: true,
            description: 'Time spent on page in seconds',
        },
        scrollDepth: {
            type: 'number',
            optional: true,
            description: 'Scroll depth percentage',
        },
    },
    relationships: {
        session: {
            type: 'Session',
            backref: 'pageviews',
            description: 'Parent session',
        },
    },
    actions: ['track', 'query'],
    events: ['tracked'],
};
// =============================================================================
// Segment
// =============================================================================
/**
 * Segment entity
 *
 * Represents a user segment for targeting
 */
export const Segment = {
    singular: 'segment',
    plural: 'segments',
    description: 'A user segment for targeting and analysis',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Segment name',
        },
        key: {
            type: 'string',
            optional: true,
            description: 'Segment key/identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Segment description',
        },
        // Definition
        type: {
            type: 'string',
            description: 'Segment type: static, dynamic, computed',
            examples: ['static', 'dynamic', 'computed'],
        },
        rules: {
            type: 'json',
            optional: true,
            description: 'Segment rules/conditions',
        },
        query: {
            type: 'string',
            optional: true,
            description: 'Segment query definition',
        },
        // Membership
        userCount: {
            type: 'number',
            optional: true,
            description: 'Number of users in segment',
        },
        percentOfTotal: {
            type: 'number',
            optional: true,
            description: 'Percentage of total users',
        },
        // Sync
        syncEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether segment syncs to destinations',
        },
        lastSyncedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last sync timestamp',
        },
    },
    relationships: {
        users: {
            type: 'Contact[]',
            description: 'Users in this segment',
        },
        campaigns: {
            type: 'Campaign[]',
            description: 'Campaigns targeting this segment',
        },
        experiments: {
            type: 'Experiment[]',
            description: 'Experiments using this segment',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'addUser',
        'removeUser',
        'sync',
        'refresh',
        'export',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'userAdded',
        'userRemoved',
        'synced',
        'refreshed',
    ],
};
// =============================================================================
// Feature Flag
// =============================================================================
/**
 * Feature flag entity
 *
 * Represents a feature flag for controlled rollouts
 */
export const FeatureFlag = {
    singular: 'feature flag',
    plural: 'feature flags',
    description: 'A feature flag for controlled feature rollouts',
    properties: {
        // Identity
        key: {
            type: 'string',
            description: 'Feature flag key',
        },
        name: {
            type: 'string',
            optional: true,
            description: 'Human-readable name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Flag description',
        },
        // Type
        type: {
            type: 'string',
            description: 'Flag type: boolean, string, number, json',
            examples: ['boolean', 'string', 'number', 'json'],
        },
        defaultValue: {
            type: 'json',
            description: 'Default value when flag is off',
        },
        // Status
        enabled: {
            type: 'boolean',
            description: 'Whether flag is enabled',
        },
        archived: {
            type: 'boolean',
            optional: true,
            description: 'Whether flag is archived',
        },
        // Targeting
        rules: {
            type: 'json',
            optional: true,
            description: 'Targeting rules',
        },
        percentRollout: {
            type: 'number',
            optional: true,
            description: 'Percentage of users to enable',
        },
        userTargets: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Specific user IDs to target',
        },
        segmentTargets: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Segments to target',
        },
        // Variants
        variants: {
            type: 'json',
            optional: true,
            description: 'Flag variants for multivariate flags',
        },
        // Environment
        environments: {
            type: 'json',
            optional: true,
            description: 'Per-environment settings',
        },
        // Tags
        tags: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Tags for organization',
        },
    },
    relationships: {
        experiments: {
            type: 'Experiment[]',
            description: 'Experiments using this flag',
        },
        segments: {
            type: 'Segment[]',
            description: 'Segments targeted by this flag',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'enable',
        'disable',
        'archive',
        'unarchive',
        'setRollout',
        'addRule',
        'removeRule',
        'addUserTarget',
        'removeUserTarget',
        'addVariant',
        'removeVariant',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'enabled',
        'disabled',
        'archived',
        'unarchived',
        'rolloutChanged',
        'ruleAdded',
        'ruleRemoved',
        'evaluated',
    ],
};
// =============================================================================
// Experiment
// =============================================================================
/**
 * Experiment entity
 *
 * Represents an A/B test or experiment
 */
export const Experiment = {
    singular: 'experiment',
    plural: 'experiments',
    description: 'An A/B test or experiment',
    properties: {
        // Identity
        key: {
            type: 'string',
            description: 'Experiment key',
        },
        name: {
            type: 'string',
            description: 'Experiment name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Experiment description',
        },
        hypothesis: {
            type: 'string',
            optional: true,
            description: 'Experiment hypothesis',
        },
        // Type
        type: {
            type: 'string',
            description: 'Experiment type: ab, multivariate, holdout',
            examples: ['ab', 'multivariate', 'holdout'],
        },
        // Status
        status: {
            type: 'string',
            description: 'Experiment status: draft, running, paused, completed, archived',
            examples: ['draft', 'running', 'paused', 'completed', 'archived'],
        },
        // Timing
        startedAt: {
            type: 'datetime',
            optional: true,
            description: 'Experiment start date',
        },
        endedAt: {
            type: 'datetime',
            optional: true,
            description: 'Experiment end date',
        },
        scheduledStart: {
            type: 'datetime',
            optional: true,
            description: 'Scheduled start date',
        },
        scheduledEnd: {
            type: 'datetime',
            optional: true,
            description: 'Scheduled end date',
        },
        // Variants
        variants: {
            type: 'json',
            description: 'Experiment variants with traffic allocation',
        },
        controlVariant: {
            type: 'string',
            optional: true,
            description: 'Control variant key',
        },
        // Targeting
        trafficAllocation: {
            type: 'number',
            optional: true,
            description: 'Percentage of traffic in experiment',
        },
        targetingRules: {
            type: 'json',
            optional: true,
            description: 'Targeting rules',
        },
        // Goals
        primaryMetric: {
            type: 'string',
            optional: true,
            description: 'Primary success metric',
        },
        secondaryMetrics: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Secondary metrics to track',
        },
        minimumDetectableEffect: {
            type: 'number',
            optional: true,
            description: 'Minimum detectable effect size',
        },
        // Results
        sampleSize: {
            type: 'number',
            optional: true,
            description: 'Required sample size',
        },
        currentSampleSize: {
            type: 'number',
            optional: true,
            description: 'Current sample size',
        },
        statisticalSignificance: {
            type: 'number',
            optional: true,
            description: 'Statistical significance level',
        },
        winningVariant: {
            type: 'string',
            optional: true,
            description: 'Winning variant (if determined)',
        },
        lift: {
            type: 'number',
            optional: true,
            description: 'Measured lift percentage',
        },
        pValue: {
            type: 'number',
            optional: true,
            description: 'P-value',
        },
        confidenceInterval: {
            type: 'json',
            optional: true,
            description: 'Confidence interval',
        },
    },
    relationships: {
        featureFlag: {
            type: 'FeatureFlag',
            required: false,
            description: 'Associated feature flag',
        },
        segments: {
            type: 'Segment[]',
            description: 'Target segments',
        },
        results: {
            type: 'ExperimentResult[]',
            description: 'Experiment results',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'start',
        'pause',
        'resume',
        'stop',
        'archive',
        'addVariant',
        'removeVariant',
        'setTraffic',
        'declareWinner',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'started',
        'paused',
        'resumed',
        'stopped',
        'archived',
        'variantAdded',
        'variantRemoved',
        'trafficChanged',
        'winnerDeclared',
        'reachedSignificance',
    ],
};
/**
 * Experiment result entity
 */
export const ExperimentResult = {
    singular: 'experiment result',
    plural: 'experiment results',
    description: 'Results for an experiment variant',
    properties: {
        variantKey: {
            type: 'string',
            description: 'Variant key',
        },
        metricKey: {
            type: 'string',
            description: 'Metric key',
        },
        sampleSize: {
            type: 'number',
            description: 'Number of participants',
        },
        conversionRate: {
            type: 'number',
            optional: true,
            description: 'Conversion rate',
        },
        meanValue: {
            type: 'number',
            optional: true,
            description: 'Mean metric value',
        },
        standardDeviation: {
            type: 'number',
            optional: true,
            description: 'Standard deviation',
        },
        lift: {
            type: 'number',
            optional: true,
            description: 'Lift vs control',
        },
        pValue: {
            type: 'number',
            optional: true,
            description: 'P-value vs control',
        },
        confidenceInterval: {
            type: 'json',
            optional: true,
            description: 'Confidence interval',
        },
        isSignificant: {
            type: 'boolean',
            optional: true,
            description: 'Whether result is statistically significant',
        },
        calculatedAt: {
            type: 'datetime',
            description: 'When results were calculated',
        },
    },
    relationships: {
        experiment: {
            type: 'Experiment',
            backref: 'results',
            description: 'Parent experiment',
        },
    },
    actions: ['calculate', 'refresh', 'export'],
    events: ['calculated', 'refreshed'],
};
// =============================================================================
// Funnel
// =============================================================================
/**
 * Funnel entity
 *
 * Represents a conversion funnel
 */
export const Funnel = {
    singular: 'funnel',
    plural: 'funnels',
    description: 'A conversion funnel for tracking user journeys',
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
        // Steps
        steps: {
            type: 'json',
            description: 'Funnel steps (event definitions)',
        },
        stepCount: {
            type: 'number',
            optional: true,
            description: 'Number of steps',
        },
        // Configuration
        conversionWindow: {
            type: 'number',
            optional: true,
            description: 'Conversion window in days',
        },
        strict: {
            type: 'boolean',
            optional: true,
            description: 'Whether order must be strictly followed',
        },
        // Metrics
        totalEntered: {
            type: 'number',
            optional: true,
            description: 'Total users who entered funnel',
        },
        totalConverted: {
            type: 'number',
            optional: true,
            description: 'Total users who completed funnel',
        },
        overallConversionRate: {
            type: 'number',
            optional: true,
            description: 'Overall conversion rate',
        },
        avgTimeToConvert: {
            type: 'number',
            optional: true,
            description: 'Average time to convert in hours',
        },
    },
    relationships: {
        stepResults: {
            type: 'FunnelStep[]',
            description: 'Step-by-step results',
        },
    },
    actions: ['create', 'update', 'delete', 'calculate', 'compare', 'export'],
    events: ['created', 'updated', 'deleted', 'calculated'],
};
/**
 * Funnel step entity
 */
export const FunnelStep = {
    singular: 'funnel step',
    plural: 'funnel steps',
    description: 'A step in a conversion funnel',
    properties: {
        stepNumber: {
            type: 'number',
            description: 'Step number (1-indexed)',
        },
        name: {
            type: 'string',
            description: 'Step name',
        },
        eventName: {
            type: 'string',
            description: 'Event that triggers this step',
        },
        entered: {
            type: 'number',
            optional: true,
            description: 'Users who entered this step',
        },
        completed: {
            type: 'number',
            optional: true,
            description: 'Users who completed this step',
        },
        droppedOff: {
            type: 'number',
            optional: true,
            description: 'Users who dropped off',
        },
        conversionRate: {
            type: 'number',
            optional: true,
            description: 'Conversion rate from previous step',
        },
        avgTimeInStep: {
            type: 'number',
            optional: true,
            description: 'Average time in step in seconds',
        },
    },
    relationships: {
        funnel: {
            type: 'Funnel',
            backref: 'stepResults',
            description: 'Parent funnel',
        },
    },
    actions: ['view'],
    events: ['entered', 'completed', 'droppedOff'],
};
// =============================================================================
// Cohort
// =============================================================================
/**
 * Cohort entity
 *
 * Represents a user cohort for retention analysis
 */
export const Cohort = {
    singular: 'cohort',
    plural: 'cohorts',
    description: 'A user cohort for retention analysis',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Cohort name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Cohort description',
        },
        // Definition
        cohortType: {
            type: 'string',
            description: 'Cohort type: acquisition, behavioral, custom',
            examples: ['acquisition', 'behavioral', 'custom'],
        },
        startEvent: {
            type: 'string',
            description: 'Event that defines cohort entry',
        },
        returnEvent: {
            type: 'string',
            optional: true,
            description: 'Event that defines retention',
        },
        // Time period
        period: {
            type: 'string',
            description: 'Cohort period: day, week, month',
            examples: ['day', 'week', 'month'],
        },
        startDate: {
            type: 'datetime',
            optional: true,
            description: 'Cohort start date',
        },
        endDate: {
            type: 'datetime',
            optional: true,
            description: 'Cohort end date',
        },
        // Size
        userCount: {
            type: 'number',
            optional: true,
            description: 'Number of users in cohort',
        },
        // Retention
        retentionData: {
            type: 'json',
            optional: true,
            description: 'Retention curve data',
        },
        avgRetention: {
            type: 'number',
            optional: true,
            description: 'Average retention rate',
        },
    },
    relationships: {
        users: {
            type: 'Contact[]',
            description: 'Users in this cohort',
        },
    },
    actions: ['create', 'update', 'delete', 'calculate', 'compare', 'export'],
    events: ['created', 'updated', 'deleted', 'calculated'],
};
// =============================================================================
// Export all entities as a schema
// =============================================================================
/**
 * All experiment entity types
 */
export const ExperimentEntities = {
    // Sessions & Events
    Session,
    AnalyticsEvent,
    Pageview,
    // Segmentation
    Segment,
    // Feature Flags
    FeatureFlag,
    // Experimentation
    Experiment,
    ExperimentResult,
    // Funnels
    Funnel,
    FunnelStep,
    // Cohorts
    Cohort,
};
/**
 * Entity categories for organization
 */
export const ExperimentCategories = {
    tracking: ['Session', 'AnalyticsEvent', 'Pageview'],
    segmentation: ['Segment', 'Cohort'],
    featureFlags: ['FeatureFlag'],
    experimentation: ['Experiment', 'ExperimentResult'],
    funnels: ['Funnel', 'FunnelStep'],
};
