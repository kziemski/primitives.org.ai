/**
 * Cloud Platform Entity Types (Nouns)
 *
 * Entities for cloud platform services like Firebase, Vercel, AWS, etc.
 * Includes serverless functions, hosting, databases, and configuration.
 *
 * @packageDocumentation
 */
// =============================================================================
// Config (Remote Configuration / Feature Flags)
// =============================================================================
/**
 * Config entity
 *
 * Represents remote configuration for feature flags and dynamic settings
 */
export const Config = {
    singular: 'config',
    plural: 'configs',
    description: 'Remote configuration for feature flags and dynamic settings',
    properties: {
        // Identity
        key: {
            type: 'string',
            description: 'Configuration key',
        },
        name: {
            type: 'string',
            optional: true,
            description: 'Human-readable name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Configuration description',
        },
        // Value
        value: {
            type: 'json',
            description: 'Configuration value (string, number, boolean, JSON)',
        },
        valueType: {
            type: 'string',
            description: 'Value type: string, number, boolean, json',
            examples: ['string', 'number', 'boolean', 'json'],
        },
        defaultValue: {
            type: 'json',
            optional: true,
            description: 'Default value if not set',
        },
        // Targeting
        conditions: {
            type: 'json',
            optional: true,
            description: 'Targeting conditions for value variants',
        },
        percentRollout: {
            type: 'number',
            optional: true,
            description: 'Percentage of users to receive this value',
        },
        userSegments: {
            type: 'string',
            array: true,
            optional: true,
            description: 'User segments this applies to',
        },
        // Status
        enabled: {
            type: 'boolean',
            description: 'Whether config is enabled',
        },
        environment: {
            type: 'string',
            optional: true,
            description: 'Environment: development, staging, production',
            examples: ['development', 'staging', 'production'],
        },
        // Audit
        lastUpdatedAt: {
            type: 'datetime',
            optional: true,
            description: 'When config was last updated',
        },
        updatedBy: {
            type: 'string',
            optional: true,
            description: 'Who last updated the config',
        },
    },
    relationships: {
        project: {
            type: 'App',
            description: 'Parent project/app',
        },
        history: {
            type: 'ConfigVersion[]',
            description: 'Version history',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'enable',
        'disable',
        'setConditions',
        'rollout',
        'rollback',
        'publish',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'enabled',
        'disabled',
        'conditionsChanged',
        'rolledOut',
        'rolledBack',
        'published',
        'fetched',
    ],
};
/**
 * Config version entity
 */
export const ConfigVersion = {
    singular: 'config version',
    plural: 'config versions',
    description: 'A historical version of a configuration',
    properties: {
        version: {
            type: 'number',
            description: 'Version number',
        },
        value: {
            type: 'json',
            description: 'Value at this version',
        },
        conditions: {
            type: 'json',
            optional: true,
            description: 'Conditions at this version',
        },
        publishedAt: {
            type: 'datetime',
            description: 'When this version was published',
        },
        publishedBy: {
            type: 'string',
            optional: true,
            description: 'Who published this version',
        },
    },
    relationships: {
        config: {
            type: 'Config',
            backref: 'history',
            description: 'Parent config',
        },
    },
    actions: ['view', 'restore', 'compare'],
    events: ['created', 'restored'],
};
// =============================================================================
// Database (Realtime/Document Database)
// =============================================================================
/**
 * Database entity
 *
 * Represents a cloud database instance
 */
export const Database = {
    singular: 'database',
    plural: 'databases',
    description: 'A cloud database instance',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Database name',
        },
        type: {
            type: 'string',
            description: 'Database type: realtime, firestore, postgres, mysql, mongodb',
            examples: ['realtime', 'firestore', 'postgres', 'mysql', 'mongodb', 'redis'],
        },
        region: {
            type: 'string',
            optional: true,
            description: 'Database region',
        },
        // Configuration
        url: {
            type: 'url',
            optional: true,
            description: 'Database connection URL',
        },
        ssl: {
            type: 'boolean',
            optional: true,
            description: 'Whether SSL is enabled',
        },
        poolSize: {
            type: 'number',
            optional: true,
            description: 'Connection pool size',
        },
        // Status
        status: {
            type: 'string',
            description: 'Database status: available, creating, updating, deleting, failed',
            examples: ['available', 'creating', 'updating', 'deleting', 'failed'],
        },
        // Metrics
        storageUsed: {
            type: 'number',
            optional: true,
            description: 'Storage used in bytes',
        },
        storageLimit: {
            type: 'number',
            optional: true,
            description: 'Storage limit in bytes',
        },
        connections: {
            type: 'number',
            optional: true,
            description: 'Active connections',
        },
        readsPerSecond: {
            type: 'number',
            optional: true,
            description: 'Read operations per second',
        },
        writesPerSecond: {
            type: 'number',
            optional: true,
            description: 'Write operations per second',
        },
        // Security
        publicAccess: {
            type: 'boolean',
            optional: true,
            description: 'Whether public access is enabled',
        },
        ipAllowlist: {
            type: 'string',
            array: true,
            optional: true,
            description: 'IP addresses allowed to connect',
        },
    },
    relationships: {
        project: {
            type: 'App',
            description: 'Parent project/app',
        },
        collections: {
            type: 'Collection[]',
            description: 'Database collections/tables',
        },
        backups: {
            type: 'Backup[]',
            description: 'Database backups',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'backup',
        'restore',
        'scale',
        'enablePublicAccess',
        'disablePublicAccess',
        'setRules',
        'importData',
        'exportData',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'backedUp',
        'restored',
        'scaled',
        'accessChanged',
        'rulesUpdated',
        'imported',
        'exported',
    ],
};
/**
 * Collection entity
 */
export const Collection = {
    singular: 'collection',
    plural: 'collections',
    description: 'A collection or table within a database',
    properties: {
        name: {
            type: 'string',
            description: 'Collection name',
        },
        documentCount: {
            type: 'number',
            optional: true,
            description: 'Number of documents',
        },
        storageSize: {
            type: 'number',
            optional: true,
            description: 'Storage size in bytes',
        },
        indexCount: {
            type: 'number',
            optional: true,
            description: 'Number of indexes',
        },
        schema: {
            type: 'json',
            optional: true,
            description: 'Collection schema definition',
        },
    },
    relationships: {
        database: {
            type: 'Database',
            backref: 'collections',
            description: 'Parent database',
        },
        indexes: {
            type: 'Index[]',
            description: 'Collection indexes',
        },
    },
    actions: [
        'create',
        'delete',
        'rename',
        'createIndex',
        'dropIndex',
        'query',
        'aggregate',
        'watch',
    ],
    events: ['created', 'deleted', 'renamed', 'indexCreated', 'indexDropped', 'modified'],
};
/**
 * Index entity
 */
export const Index = {
    singular: 'index',
    plural: 'indexes',
    description: 'A database index for query optimization',
    properties: {
        name: {
            type: 'string',
            description: 'Index name',
        },
        fields: {
            type: 'json',
            description: 'Indexed fields and their sort order',
        },
        unique: {
            type: 'boolean',
            optional: true,
            description: 'Whether index enforces uniqueness',
        },
        sparse: {
            type: 'boolean',
            optional: true,
            description: 'Whether index is sparse',
        },
        status: {
            type: 'string',
            description: 'Index status: building, ready, failed',
            examples: ['building', 'ready', 'failed'],
        },
    },
    relationships: {
        collection: {
            type: 'Collection',
            backref: 'indexes',
            description: 'Parent collection',
        },
    },
    actions: ['create', 'delete', 'rebuild'],
    events: ['created', 'deleted', 'built', 'failed'],
};
// =============================================================================
// Hosting
// =============================================================================
/**
 * Hosting entity
 *
 * Represents a web hosting deployment
 */
export const Hosting = {
    singular: 'hosting',
    plural: 'hostings',
    description: 'A web hosting deployment',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Site name',
        },
        domain: {
            type: 'string',
            optional: true,
            description: 'Custom domain',
        },
        defaultDomain: {
            type: 'string',
            optional: true,
            description: 'Default provider domain',
        },
        // Deployment
        currentVersion: {
            type: 'string',
            optional: true,
            description: 'Currently deployed version',
        },
        deployedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last deployment time',
        },
        deployedBy: {
            type: 'string',
            optional: true,
            description: 'Who deployed',
        },
        // Configuration
        framework: {
            type: 'string',
            optional: true,
            description: 'Frontend framework detected',
        },
        buildCommand: {
            type: 'string',
            optional: true,
            description: 'Build command',
        },
        outputDirectory: {
            type: 'string',
            optional: true,
            description: 'Build output directory',
        },
        nodeVersion: {
            type: 'string',
            optional: true,
            description: 'Node.js version',
        },
        // Features
        httpsOnly: {
            type: 'boolean',
            optional: true,
            description: 'Whether HTTPS is enforced',
        },
        previewsEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether deploy previews are enabled',
        },
        caching: {
            type: 'json',
            optional: true,
            description: 'Caching configuration',
        },
        headers: {
            type: 'json',
            optional: true,
            description: 'Custom headers configuration',
        },
        redirects: {
            type: 'json',
            optional: true,
            description: 'Redirect rules',
        },
        rewrites: {
            type: 'json',
            optional: true,
            description: 'Rewrite rules',
        },
        // Status
        status: {
            type: 'string',
            description: 'Hosting status: active, building, error',
            examples: ['active', 'building', 'error'],
        },
    },
    relationships: {
        project: {
            type: 'App',
            description: 'Parent project',
        },
        repository: {
            type: 'Repository',
            required: false,
            description: 'Source repository',
        },
        deployments: {
            type: 'Deployment[]',
            description: 'Deployment history',
        },
    },
    actions: [
        'create',
        'configure',
        'deploy',
        'rollback',
        'delete',
        'addDomain',
        'removeDomain',
        'verifySsl',
        'purgeCache',
    ],
    events: [
        'created',
        'configured',
        'deployed',
        'rolledBack',
        'deleted',
        'domainAdded',
        'domainRemoved',
        'sslVerified',
        'cachePurged',
    ],
};
/**
 * Deployment entity
 */
export const Deployment = {
    singular: 'deployment',
    plural: 'deployments',
    description: 'A hosting deployment instance',
    properties: {
        version: {
            type: 'string',
            description: 'Deployment version/ID',
        },
        url: {
            type: 'url',
            optional: true,
            description: 'Deployment URL',
        },
        status: {
            type: 'string',
            description: 'Deployment status: queued, building, ready, error, cancelled',
            examples: ['queued', 'building', 'ready', 'error', 'cancelled'],
        },
        source: {
            type: 'string',
            optional: true,
            description: 'Deployment source: cli, git, api',
            examples: ['cli', 'git', 'api'],
        },
        branch: {
            type: 'string',
            optional: true,
            description: 'Git branch deployed',
        },
        commit: {
            type: 'string',
            optional: true,
            description: 'Git commit SHA',
        },
        buildDuration: {
            type: 'number',
            optional: true,
            description: 'Build duration in seconds',
        },
        size: {
            type: 'number',
            optional: true,
            description: 'Deployment size in bytes',
        },
        isProduction: {
            type: 'boolean',
            optional: true,
            description: 'Whether this is a production deployment',
        },
        isPreview: {
            type: 'boolean',
            optional: true,
            description: 'Whether this is a preview deployment',
        },
    },
    relationships: {
        hosting: {
            type: 'Hosting',
            backref: 'deployments',
            description: 'Parent hosting',
        },
        triggeredBy: {
            type: 'Contact',
            required: false,
            description: 'Who triggered the deployment',
        },
    },
    actions: ['create', 'cancel', 'promote', 'delete', 'viewLogs'],
    events: ['created', 'started', 'completed', 'failed', 'cancelled', 'promoted'],
};
// =============================================================================
// Function (Serverless Functions)
// =============================================================================
/**
 * Function entity
 *
 * Represents a serverless function
 */
export const Function = {
    singular: 'function',
    plural: 'functions',
    description: 'A serverless function',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Function name',
        },
        entryPoint: {
            type: 'string',
            optional: true,
            description: 'Entry point file/handler',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Function description',
        },
        // Runtime
        runtime: {
            type: 'string',
            description: 'Runtime environment: nodejs18, nodejs20, python311, etc.',
            examples: ['nodejs18', 'nodejs20', 'python311', 'go121', 'ruby32'],
        },
        timeout: {
            type: 'number',
            optional: true,
            description: 'Execution timeout in seconds',
        },
        memory: {
            type: 'number',
            optional: true,
            description: 'Memory allocation in MB',
        },
        // Configuration
        environmentVariables: {
            type: 'json',
            optional: true,
            description: 'Environment variables',
        },
        secrets: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Secret references',
        },
        // Trigger
        trigger: {
            type: 'string',
            description: 'Trigger type: http, schedule, pubsub, storage, firestore',
            examples: ['http', 'schedule', 'pubsub', 'storage', 'firestore', 'auth'],
        },
        httpPath: {
            type: 'string',
            optional: true,
            description: 'HTTP endpoint path',
        },
        schedule: {
            type: 'string',
            optional: true,
            description: 'Cron schedule expression',
        },
        // Status
        status: {
            type: 'string',
            description: 'Function status: active, deploying, failed, deleted',
            examples: ['active', 'deploying', 'failed', 'deleted'],
        },
        deployedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last deployment time',
        },
        version: {
            type: 'string',
            optional: true,
            description: 'Deployed version',
        },
        // Metrics
        invocations: {
            type: 'number',
            optional: true,
            description: 'Total invocations',
        },
        errors: {
            type: 'number',
            optional: true,
            description: 'Total errors',
        },
        avgDuration: {
            type: 'number',
            optional: true,
            description: 'Average execution duration in ms',
        },
    },
    relationships: {
        project: {
            type: 'App',
            description: 'Parent project',
        },
        logs: {
            type: 'FunctionLog[]',
            description: 'Execution logs',
        },
    },
    actions: [
        'create',
        'update',
        'deploy',
        'delete',
        'invoke',
        'viewLogs',
        'setEnvironment',
        'addSecret',
        'removeSecret',
    ],
    events: [
        'created',
        'updated',
        'deployed',
        'deleted',
        'invoked',
        'succeeded',
        'failed',
        'timedOut',
    ],
};
/**
 * Function log entity
 */
export const FunctionLog = {
    singular: 'function log',
    plural: 'function logs',
    description: 'A serverless function execution log',
    properties: {
        level: {
            type: 'string',
            description: 'Log level: debug, info, warn, error',
            examples: ['debug', 'info', 'warn', 'error'],
        },
        message: {
            type: 'string',
            description: 'Log message',
        },
        executionId: {
            type: 'string',
            optional: true,
            description: 'Execution/request ID',
        },
        duration: {
            type: 'number',
            optional: true,
            description: 'Execution duration in ms',
        },
        memoryUsed: {
            type: 'number',
            optional: true,
            description: 'Memory used in MB',
        },
        timestamp: {
            type: 'datetime',
            description: 'Log timestamp',
        },
        labels: {
            type: 'json',
            optional: true,
            description: 'Log labels/metadata',
        },
    },
    relationships: {
        function: {
            type: 'Function',
            backref: 'logs',
            description: 'Parent function',
        },
    },
    actions: ['view', 'search', 'export', 'delete'],
    events: ['created'],
};
// =============================================================================
// Auth (Authentication)
// =============================================================================
/**
 * Identity entity
 *
 * Represents a user identity in an auth system
 */
export const Identity = {
    singular: 'identity',
    plural: 'identities',
    description: 'A user identity in an authentication system',
    properties: {
        // Identity
        uid: {
            type: 'string',
            description: 'Unique user ID',
        },
        email: {
            type: 'string',
            optional: true,
            description: 'Email address',
        },
        emailVerified: {
            type: 'boolean',
            optional: true,
            description: 'Whether email is verified',
        },
        phone: {
            type: 'string',
            optional: true,
            description: 'Phone number',
        },
        phoneVerified: {
            type: 'boolean',
            optional: true,
            description: 'Whether phone is verified',
        },
        // Profile
        displayName: {
            type: 'string',
            optional: true,
            description: 'Display name',
        },
        photoUrl: {
            type: 'url',
            optional: true,
            description: 'Profile photo URL',
        },
        // Providers
        providers: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Linked auth providers',
        },
        providerData: {
            type: 'json',
            optional: true,
            description: 'Provider-specific data',
        },
        // Status
        disabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether account is disabled',
        },
        lastSignInAt: {
            type: 'datetime',
            optional: true,
            description: 'Last sign-in time',
        },
        createdAt: {
            type: 'datetime',
            optional: true,
            description: 'Account creation time',
        },
        // Security
        mfaEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether MFA is enabled',
        },
        mfaMethods: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Enabled MFA methods',
        },
        // Claims
        customClaims: {
            type: 'json',
            optional: true,
            description: 'Custom claims/roles',
        },
    },
    relationships: {
        sessions: {
            type: 'Session[]',
            description: 'Active sessions',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'disable',
        'enable',
        'linkProvider',
        'unlinkProvider',
        'setCustomClaims',
        'revokeTokens',
        'sendVerification',
        'resetPassword',
        'enrollMfa',
        'unenrollMfa',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'disabled',
        'enabled',
        'signedIn',
        'signedOut',
        'providerLinked',
        'providerUnlinked',
        'claimsUpdated',
        'tokensRevoked',
        'passwordReset',
        'mfaEnrolled',
    ],
};
// =============================================================================
// Storage (Cloud Storage)
// =============================================================================
/**
 * Bucket entity
 *
 * Represents a cloud storage bucket
 */
export const Bucket = {
    singular: 'bucket',
    plural: 'buckets',
    description: 'A cloud storage bucket',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Bucket name',
        },
        region: {
            type: 'string',
            optional: true,
            description: 'Storage region',
        },
        // Configuration
        storageClass: {
            type: 'string',
            optional: true,
            description: 'Storage class: standard, nearline, coldline, archive',
            examples: ['standard', 'nearline', 'coldline', 'archive'],
        },
        versioning: {
            type: 'boolean',
            optional: true,
            description: 'Whether versioning is enabled',
        },
        lifecycle: {
            type: 'json',
            optional: true,
            description: 'Lifecycle rules',
        },
        cors: {
            type: 'json',
            optional: true,
            description: 'CORS configuration',
        },
        // Access
        publicAccess: {
            type: 'string',
            optional: true,
            description: 'Public access setting: enforced, inherited',
            examples: ['enforced', 'inherited'],
        },
        defaultAcl: {
            type: 'string',
            optional: true,
            description: 'Default ACL for new objects',
        },
        // Metrics
        objectCount: {
            type: 'number',
            optional: true,
            description: 'Number of objects',
        },
        storageUsed: {
            type: 'number',
            optional: true,
            description: 'Storage used in bytes',
        },
    },
    relationships: {
        project: {
            type: 'App',
            description: 'Parent project',
        },
        objects: {
            type: 'StorageObject[]',
            description: 'Objects in bucket',
        },
    },
    actions: [
        'create',
        'delete',
        'setVersioning',
        'setLifecycle',
        'setCors',
        'setPublicAccess',
        'setAcl',
        'empty',
    ],
    events: [
        'created',
        'deleted',
        'versioningChanged',
        'lifecycleChanged',
        'corsChanged',
        'accessChanged',
    ],
};
/**
 * Storage object entity
 */
export const StorageObject = {
    singular: 'storage object',
    plural: 'storage objects',
    description: 'An object stored in cloud storage',
    properties: {
        name: {
            type: 'string',
            description: 'Object name/path',
        },
        contentType: {
            type: 'string',
            optional: true,
            description: 'Content MIME type',
        },
        size: {
            type: 'number',
            description: 'Object size in bytes',
        },
        md5Hash: {
            type: 'string',
            optional: true,
            description: 'MD5 hash',
        },
        crc32c: {
            type: 'string',
            optional: true,
            description: 'CRC32C checksum',
        },
        generation: {
            type: 'string',
            optional: true,
            description: 'Object generation (for versioning)',
        },
        metadata: {
            type: 'json',
            optional: true,
            description: 'Custom metadata',
        },
        cacheControl: {
            type: 'string',
            optional: true,
            description: 'Cache-Control header',
        },
        contentDisposition: {
            type: 'string',
            optional: true,
            description: 'Content-Disposition header',
        },
        downloadUrl: {
            type: 'url',
            optional: true,
            description: 'Public download URL',
        },
    },
    relationships: {
        bucket: {
            type: 'Bucket',
            backref: 'objects',
            description: 'Parent bucket',
        },
    },
    actions: [
        'upload',
        'download',
        'delete',
        'copy',
        'move',
        'setMetadata',
        'setAcl',
        'makePublic',
        'makePrivate',
        'getSignedUrl',
    ],
    events: [
        'uploaded',
        'downloaded',
        'deleted',
        'copied',
        'moved',
        'metadataUpdated',
        'aclChanged',
        'madePublic',
        'madePrivate',
    ],
};
// =============================================================================
// Export all entities as a schema
// =============================================================================
/**
 * All infrastructure platform entity types
 */
export const InfrastructureEntities = {
    // Configuration
    Config,
    ConfigVersion,
    // Database
    Database,
    Collection,
    Index,
    // Hosting
    Hosting,
    Deployment,
    // Functions
    Function,
    FunctionLog,
    // Auth
    Identity,
    // Storage
    Bucket,
    StorageObject,
};
/**
 * Entity categories for organization
 */
export const InfrastructureCategories = {
    config: ['Config', 'ConfigVersion'],
    database: ['Database', 'Collection', 'Index'],
    hosting: ['Hosting', 'Deployment'],
    functions: ['Function', 'FunctionLog'],
    auth: ['Identity'],
    storage: ['Bucket', 'StorageObject'],
};
