/**
 * Lifecycle Entity Types (Nouns)
 *
 * Product lifecycle: Version, Release, Deployment, Environment, Feature
 *
 * @packageDocumentation
 */
// =============================================================================
// Version
// =============================================================================
/**
 * Version entity
 *
 * Product version.
 */
export const Version = {
    singular: 'version',
    plural: 'versions',
    description: 'A version of a digital product',
    properties: {
        // Identity
        number: {
            type: 'string',
            description: 'Version number (semver)',
        },
        name: {
            type: 'string',
            optional: true,
            description: 'Version name/codename',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Version description',
        },
        // Semver
        major: {
            type: 'number',
            optional: true,
            description: 'Major version',
        },
        minor: {
            type: 'number',
            optional: true,
            description: 'Minor version',
        },
        patch: {
            type: 'number',
            optional: true,
            description: 'Patch version',
        },
        prerelease: {
            type: 'string',
            optional: true,
            description: 'Prerelease identifier',
            examples: ['alpha', 'beta', 'rc'],
        },
        // Changes
        changelog: {
            type: 'string',
            optional: true,
            description: 'Changelog content',
        },
        breakingChanges: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Breaking changes',
        },
        features: {
            type: 'string',
            array: true,
            optional: true,
            description: 'New features',
        },
        fixes: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Bug fixes',
        },
        // Source
        commitHash: {
            type: 'string',
            optional: true,
            description: 'Git commit hash',
        },
        branch: {
            type: 'string',
            optional: true,
            description: 'Git branch',
        },
        tag: {
            type: 'string',
            optional: true,
            description: 'Git tag',
        },
        // Artifacts
        artifactUrl: {
            type: 'string',
            optional: true,
            description: 'Build artifact URL',
        },
        checksum: {
            type: 'string',
            optional: true,
            description: 'Artifact checksum',
        },
        // Dates
        createdAt: {
            type: 'date',
            optional: true,
            description: 'Creation date',
        },
        releasedAt: {
            type: 'date',
            optional: true,
            description: 'Release date',
        },
        deprecatedAt: {
            type: 'date',
            optional: true,
            description: 'Deprecation date',
        },
        // Status
        status: {
            type: 'string',
            description: 'Version status',
            examples: ['draft', 'prerelease', 'released', 'deprecated', 'yanked'],
        },
        stability: {
            type: 'string',
            optional: true,
            description: 'Stability level',
            examples: ['experimental', 'unstable', 'stable', 'lts'],
        },
    },
    relationships: {
        product: {
            type: 'DigitalProduct',
            description: 'Parent product',
        },
        releases: {
            type: 'Release[]',
            description: 'Releases of this version',
        },
        previousVersion: {
            type: 'Version',
            required: false,
            description: 'Previous version',
        },
    },
    actions: [
        'create',
        'update',
        'release',
        'deprecate',
        'yank',
    ],
    events: [
        'created',
        'updated',
        'released',
        'deprecated',
        'yanked',
    ],
};
// =============================================================================
// Release
// =============================================================================
/**
 * Release entity
 *
 * Published release of a version.
 */
export const Release = {
    singular: 'release',
    plural: 'releases',
    description: 'A published release of a product version',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Release name',
        },
        tag: {
            type: 'string',
            optional: true,
            description: 'Release tag',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Release description',
        },
        // Type
        type: {
            type: 'string',
            description: 'Release type',
            examples: ['major', 'minor', 'patch', 'hotfix', 'prerelease', 'rc'],
        },
        channel: {
            type: 'string',
            optional: true,
            description: 'Release channel',
            examples: ['stable', 'beta', 'alpha', 'canary', 'nightly'],
        },
        // Notes
        releaseNotes: {
            type: 'string',
            optional: true,
            description: 'Release notes (markdown)',
        },
        highlights: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Release highlights',
        },
        // Assets
        assets: {
            type: 'json',
            optional: true,
            description: 'Release assets',
        },
        downloadUrl: {
            type: 'string',
            optional: true,
            description: 'Download URL',
        },
        downloadCount: {
            type: 'number',
            optional: true,
            description: 'Download count',
        },
        // Compatibility
        minPlatformVersion: {
            type: 'string',
            optional: true,
            description: 'Minimum platform version',
        },
        maxPlatformVersion: {
            type: 'string',
            optional: true,
            description: 'Maximum platform version',
        },
        supportedPlatforms: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Supported platforms',
        },
        // Dates
        publishedAt: {
            type: 'date',
            optional: true,
            description: 'Publication date',
        },
        endOfLifeAt: {
            type: 'date',
            optional: true,
            description: 'End of life date',
        },
        // Status
        status: {
            type: 'string',
            description: 'Release status',
            examples: ['draft', 'published', 'latest', 'superseded', 'retracted'],
        },
        isLatest: {
            type: 'boolean',
            optional: true,
            description: 'Is latest release',
        },
    },
    relationships: {
        version: {
            type: 'Version',
            description: 'Product version',
        },
        deployments: {
            type: 'Deployment[]',
            description: 'Release deployments',
        },
    },
    actions: [
        'create',
        'update',
        'publish',
        'unpublish',
        'setLatest',
        'retract',
    ],
    events: [
        'created',
        'updated',
        'published',
        'unpublished',
        'setAsLatest',
        'retracted',
    ],
};
// =============================================================================
// Deployment
// =============================================================================
/**
 * Deployment entity
 *
 * Deployment instance.
 */
export const Deployment = {
    singular: 'deployment',
    plural: 'deployments',
    description: 'A deployment of a product release',
    properties: {
        // Identity
        id: {
            type: 'string',
            description: 'Deployment ID',
        },
        name: {
            type: 'string',
            optional: true,
            description: 'Deployment name',
        },
        // Target
        environment: {
            type: 'string',
            description: 'Target environment',
            examples: ['production', 'staging', 'preview', 'development'],
        },
        region: {
            type: 'string',
            optional: true,
            description: 'Deployment region',
        },
        // Platform
        platform: {
            type: 'string',
            optional: true,
            description: 'Deployment platform',
            examples: ['vercel', 'netlify', 'cloudflare', 'aws', 'gcp', 'azure', 'kubernetes', 'custom'],
        },
        provider: {
            type: 'string',
            optional: true,
            description: 'Cloud provider',
        },
        // Configuration
        config: {
            type: 'json',
            optional: true,
            description: 'Deployment configuration',
        },
        envVars: {
            type: 'json',
            optional: true,
            description: 'Environment variables (non-sensitive)',
        },
        // URLs
        url: {
            type: 'string',
            optional: true,
            description: 'Deployment URL',
        },
        previewUrl: {
            type: 'string',
            optional: true,
            description: 'Preview URL',
        },
        customDomain: {
            type: 'string',
            optional: true,
            description: 'Custom domain',
        },
        // Resources
        instanceCount: {
            type: 'number',
            optional: true,
            description: 'Number of instances',
        },
        memory: {
            type: 'string',
            optional: true,
            description: 'Memory allocation',
        },
        cpu: {
            type: 'string',
            optional: true,
            description: 'CPU allocation',
        },
        // Build
        buildId: {
            type: 'string',
            optional: true,
            description: 'Build ID',
        },
        buildDurationMs: {
            type: 'number',
            optional: true,
            description: 'Build duration',
        },
        artifactSize: {
            type: 'number',
            optional: true,
            description: 'Artifact size in bytes',
        },
        // Dates
        createdAt: {
            type: 'date',
            optional: true,
            description: 'Creation date',
        },
        deployedAt: {
            type: 'date',
            optional: true,
            description: 'Deployment date',
        },
        expiresAt: {
            type: 'date',
            optional: true,
            description: 'Expiration date (for previews)',
        },
        // Status
        status: {
            type: 'string',
            description: 'Deployment status',
            examples: ['queued', 'building', 'deploying', 'ready', 'failed', 'cancelled', 'expired'],
        },
        isProduction: {
            type: 'boolean',
            optional: true,
            description: 'Is production deployment',
        },
    },
    relationships: {
        product: {
            type: 'DigitalProduct',
            description: 'Product deployed',
        },
        release: {
            type: 'Release',
            required: false,
            description: 'Release deployed',
        },
        environmentRef: {
            type: 'Environment',
            required: false,
            description: 'Target environment',
        },
    },
    actions: [
        'create',
        'build',
        'deploy',
        'promote',
        'rollback',
        'scale',
        'pause',
        'resume',
        'terminate',
    ],
    events: [
        'created',
        'built',
        'deployed',
        'promoted',
        'rolledBack',
        'scaled',
        'paused',
        'resumed',
        'terminated',
    ],
};
// =============================================================================
// Environment
// =============================================================================
/**
 * Environment entity
 *
 * Deployment environment.
 */
export const Environment = {
    singular: 'environment',
    plural: 'environments',
    description: 'A deployment environment',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Environment name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Environment description',
        },
        // Type
        type: {
            type: 'string',
            description: 'Environment type',
            examples: ['production', 'staging', 'preview', 'development', 'testing', 'demo'],
        },
        tier: {
            type: 'string',
            optional: true,
            description: 'Environment tier',
            examples: ['production', 'non-production'],
        },
        // Configuration
        config: {
            type: 'json',
            optional: true,
            description: 'Environment configuration',
        },
        variables: {
            type: 'json',
            optional: true,
            description: 'Environment variables',
        },
        secrets: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Secret names (not values)',
        },
        // Access
        url: {
            type: 'string',
            optional: true,
            description: 'Environment URL',
        },
        protected: {
            type: 'boolean',
            optional: true,
            description: 'Requires authentication',
        },
        allowedIPs: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Allowed IP addresses',
        },
        // Promotion
        promotesTo: {
            type: 'string',
            optional: true,
            description: 'Environment to promote to',
        },
        promotesFrom: {
            type: 'string',
            optional: true,
            description: 'Environment promoted from',
        },
        autoPromote: {
            type: 'boolean',
            optional: true,
            description: 'Auto-promote on success',
        },
        // Resources
        resourceQuota: {
            type: 'json',
            optional: true,
            description: 'Resource quotas',
        },
        scaling: {
            type: 'json',
            optional: true,
            description: 'Scaling configuration',
        },
        // Status
        status: {
            type: 'string',
            description: 'Environment status',
            examples: ['active', 'inactive', 'maintenance', 'deprecated'],
        },
        healthStatus: {
            type: 'string',
            optional: true,
            description: 'Health status',
            examples: ['healthy', 'degraded', 'unhealthy', 'unknown'],
        },
    },
    relationships: {
        product: {
            type: 'DigitalProduct',
            description: 'Parent product',
        },
        deployments: {
            type: 'Deployment[]',
            description: 'Environment deployments',
        },
        currentDeployment: {
            type: 'Deployment',
            required: false,
            description: 'Current active deployment',
        },
    },
    actions: [
        'create',
        'update',
        'configure',
        'activate',
        'deactivate',
        'promote',
        'lock',
        'unlock',
    ],
    events: [
        'created',
        'updated',
        'configured',
        'activated',
        'deactivated',
        'promoted',
        'locked',
        'unlocked',
    ],
};
// =============================================================================
// Feature
// =============================================================================
/**
 * Feature entity
 *
 * Product feature.
 */
export const Feature = {
    singular: 'feature',
    plural: 'features',
    description: 'A product feature or capability',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Feature name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly identifier',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Feature description',
        },
        // Classification
        type: {
            type: 'string',
            description: 'Feature type',
            examples: ['core', 'premium', 'addon', 'beta', 'experimental', 'deprecated'],
        },
        category: {
            type: 'string',
            optional: true,
            description: 'Feature category',
        },
        // Value
        benefit: {
            type: 'string',
            optional: true,
            description: 'User benefit',
        },
        valueProposition: {
            type: 'string',
            optional: true,
            description: 'Value proposition',
        },
        // Feature Flag
        flagKey: {
            type: 'string',
            optional: true,
            description: 'Feature flag key',
        },
        defaultEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Enabled by default',
        },
        rolloutPercentage: {
            type: 'number',
            optional: true,
            description: 'Rollout percentage (0-100)',
        },
        // Availability
        availability: {
            type: 'string',
            optional: true,
            description: 'Availability',
            examples: ['all', 'paid', 'enterprise', 'beta', 'internal'],
        },
        requiredPlan: {
            type: 'string',
            optional: true,
            description: 'Minimum required plan',
        },
        addOnPrice: {
            type: 'number',
            optional: true,
            description: 'Add-on price if separate',
        },
        // Dependencies
        dependsOn: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Dependent features',
        },
        conflictsWith: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Conflicting features',
        },
        // Lifecycle
        introducedIn: {
            type: 'string',
            optional: true,
            description: 'Version introduced',
        },
        deprecatedIn: {
            type: 'string',
            optional: true,
            description: 'Version deprecated',
        },
        removedIn: {
            type: 'string',
            optional: true,
            description: 'Version removed',
        },
        // Metrics
        adoptionRate: {
            type: 'number',
            optional: true,
            description: 'Adoption rate (0-1)',
        },
        usageCount: {
            type: 'number',
            optional: true,
            description: 'Total usage count',
        },
        // Status
        status: {
            type: 'string',
            description: 'Feature status',
            examples: ['planned', 'development', 'beta', 'ga', 'deprecated', 'removed'],
        },
    },
    relationships: {
        product: {
            type: 'DigitalProduct',
            description: 'Parent product',
        },
        dependentFeatures: {
            type: 'Feature[]',
            description: 'Features that depend on this',
        },
        roadmapItem: {
            type: 'RoadmapItem',
            required: false,
            description: 'Associated roadmap item',
        },
    },
    actions: [
        'create',
        'update',
        'enable',
        'disable',
        'rollout',
        'deprecate',
        'remove',
    ],
    events: [
        'created',
        'updated',
        'enabled',
        'disabled',
        'rolledOut',
        'deprecated',
        'removed',
    ],
};
// =============================================================================
// Exports
// =============================================================================
export const LifecycleEntities = {
    Version,
    Release,
    Deployment,
    Environment,
    Feature,
};
export const LifecycleCategories = {
    versioning: ['Version', 'Release'],
    deployment: ['Deployment', 'Environment'],
    features: ['Feature'],
};
