/**
 * Identity & Security Entity Types (Nouns)
 *
 * Entities for identity management, authentication, and security.
 * Covers WorkOS, Auth0, Okta, and similar identity platforms.
 *
 * @packageDocumentation
 */
// =============================================================================
// Vault (Secret Management)
// =============================================================================
/**
 * Vault entity
 *
 * Represents a secure vault for storing secrets and credentials
 */
export const Vault = {
    singular: 'vault',
    plural: 'vaults',
    description: 'A secure vault for storing secrets and credentials',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Vault name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Vault description',
        },
        // Configuration
        type: {
            type: 'string',
            description: 'Vault type: secrets, credentials, keys, certificates',
            examples: ['secrets', 'credentials', 'keys', 'certificates'],
        },
        engine: {
            type: 'string',
            optional: true,
            description: 'Secrets engine: kv, transit, pki, database',
            examples: ['kv', 'transit', 'pki', 'database'],
        },
        // Status
        sealed: {
            type: 'boolean',
            optional: true,
            description: 'Whether vault is sealed',
        },
        initialized: {
            type: 'boolean',
            optional: true,
            description: 'Whether vault is initialized',
        },
        // Metrics
        secretCount: {
            type: 'number',
            optional: true,
            description: 'Number of secrets stored',
        },
        version: {
            type: 'number',
            optional: true,
            description: 'Vault version',
        },
        // Access
        accessPolicy: {
            type: 'json',
            optional: true,
            description: 'Access policy configuration',
        },
    },
    relationships: {
        secrets: {
            type: 'VaultSecret[]',
            backref: 'vault',
            description: 'Secrets in this vault',
        },
        policies: {
            type: 'VaultPolicy[]',
            description: 'Access policies',
        },
    },
    actions: [
        'create',
        'delete',
        'seal',
        'unseal',
        'addSecret',
        'removeSecret',
        'rotateSecrets',
        'setPolicy',
        'backup',
        'restore',
    ],
    events: [
        'created',
        'deleted',
        'sealed',
        'unsealed',
        'secretAdded',
        'secretRemoved',
        'secretsRotated',
        'policySet',
        'backedUp',
        'restored',
    ],
};
/**
 * Vault secret entity
 */
export const VaultSecret = {
    singular: 'vault secret',
    plural: 'vault secrets',
    description: 'A secret stored in a vault',
    properties: {
        // Identity
        key: {
            type: 'string',
            description: 'Secret key/path',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Secret description',
        },
        // Metadata
        version: {
            type: 'number',
            optional: true,
            description: 'Secret version',
        },
        type: {
            type: 'string',
            optional: true,
            description: 'Secret type: password, api_key, token, certificate, connection_string',
            examples: ['password', 'api_key', 'token', 'certificate', 'connection_string'],
        },
        // Rotation
        rotationEnabled: {
            type: 'boolean',
            optional: true,
            description: 'Whether auto-rotation is enabled',
        },
        rotationInterval: {
            type: 'number',
            optional: true,
            description: 'Rotation interval in days',
        },
        lastRotatedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last rotation timestamp',
        },
        nextRotationAt: {
            type: 'datetime',
            optional: true,
            description: 'Next scheduled rotation',
        },
        // Expiration
        expiresAt: {
            type: 'datetime',
            optional: true,
            description: 'Secret expiration date',
        },
        expired: {
            type: 'boolean',
            optional: true,
            description: 'Whether secret has expired',
        },
        // Access
        accessCount: {
            type: 'number',
            optional: true,
            description: 'Number of times accessed',
        },
        lastAccessedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last access timestamp',
        },
        lastAccessedBy: {
            type: 'string',
            optional: true,
            description: 'Last accessor',
        },
    },
    relationships: {
        vault: {
            type: 'Vault',
            backref: 'secrets',
            description: 'Parent vault',
        },
        versions: {
            type: 'SecretVersion[]',
            description: 'Version history',
        },
    },
    actions: ['create', 'update', 'delete', 'rotate', 'access', 'revoke'],
    events: [
        'created',
        'updated',
        'deleted',
        'rotated',
        'accessed',
        'revoked',
        'expired',
    ],
};
/**
 * Secret version entity
 */
export const SecretVersion = {
    singular: 'secret version',
    plural: 'secret versions',
    description: 'A version of a vault secret',
    properties: {
        version: {
            type: 'number',
            description: 'Version number',
        },
        createdAt: {
            type: 'datetime',
            description: 'When version was created',
        },
        createdBy: {
            type: 'string',
            optional: true,
            description: 'Who created this version',
        },
        destroyed: {
            type: 'boolean',
            optional: true,
            description: 'Whether version is destroyed',
        },
        destroyedAt: {
            type: 'datetime',
            optional: true,
            description: 'When version was destroyed',
        },
    },
    relationships: {
        secret: {
            type: 'VaultSecret',
            backref: 'versions',
            description: 'Parent secret',
        },
    },
    actions: ['create', 'destroy', 'restore'],
    events: ['created', 'destroyed', 'restored'],
};
/**
 * Vault policy entity
 */
export const VaultPolicy = {
    singular: 'vault policy',
    plural: 'vault policies',
    description: 'An access policy for a vault',
    properties: {
        name: {
            type: 'string',
            description: 'Policy name',
        },
        rules: {
            type: 'json',
            description: 'Policy rules',
        },
        type: {
            type: 'string',
            optional: true,
            description: 'Policy type: acl, rbac',
            examples: ['acl', 'rbac'],
        },
    },
    relationships: {
        vault: {
            type: 'Vault',
            description: 'Associated vault',
        },
    },
    actions: ['create', 'update', 'delete', 'assign', 'revoke'],
    events: ['created', 'updated', 'deleted', 'assigned', 'revoked'],
};
// =============================================================================
// SSO Connection
// =============================================================================
/**
 * SSO connection entity
 *
 * Represents a Single Sign-On connection
 */
export const SSOConnection = {
    singular: 'sso connection',
    plural: 'sso connections',
    description: 'A Single Sign-On connection',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Connection name',
        },
        type: {
            type: 'string',
            description: 'SSO type: saml, oidc, oauth2',
            examples: ['saml', 'oidc', 'oauth2'],
        },
        provider: {
            type: 'string',
            optional: true,
            description: 'Identity provider: okta, azure_ad, google, onelogin',
            examples: ['okta', 'azure_ad', 'google', 'onelogin', 'custom'],
        },
        // Configuration - SAML
        entityId: {
            type: 'string',
            optional: true,
            description: 'SAML Entity ID',
        },
        acsUrl: {
            type: 'url',
            optional: true,
            description: 'Assertion Consumer Service URL',
        },
        sloUrl: {
            type: 'url',
            optional: true,
            description: 'Single Logout URL',
        },
        idpMetadataUrl: {
            type: 'url',
            optional: true,
            description: 'IdP Metadata URL',
        },
        certificate: {
            type: 'string',
            optional: true,
            description: 'X.509 certificate',
        },
        // Configuration - OIDC
        clientId: {
            type: 'string',
            optional: true,
            description: 'OIDC Client ID',
        },
        issuer: {
            type: 'url',
            optional: true,
            description: 'OIDC Issuer URL',
        },
        authorizationUrl: {
            type: 'url',
            optional: true,
            description: 'Authorization endpoint URL',
        },
        tokenUrl: {
            type: 'url',
            optional: true,
            description: 'Token endpoint URL',
        },
        userInfoUrl: {
            type: 'url',
            optional: true,
            description: 'User info endpoint URL',
        },
        // Status
        status: {
            type: 'string',
            description: 'Connection status: active, inactive, pending, error',
            examples: ['active', 'inactive', 'pending', 'error'],
        },
        verified: {
            type: 'boolean',
            optional: true,
            description: 'Whether connection is verified',
        },
        // Domains
        domains: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Associated email domains',
        },
        // Settings
        jitProvisioning: {
            type: 'boolean',
            optional: true,
            description: 'Whether JIT provisioning is enabled',
        },
        defaultRole: {
            type: 'string',
            optional: true,
            description: 'Default role for new users',
        },
        attributeMapping: {
            type: 'json',
            optional: true,
            description: 'Attribute mapping configuration',
        },
    },
    relationships: {
        organization: {
            type: 'Organization',
            description: 'Organization this connection belongs to',
        },
        users: {
            type: 'Identity[]',
            description: 'Users authenticated via this connection',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'activate',
        'deactivate',
        'verify',
        'test',
        'addDomain',
        'removeDomain',
        'setAttributeMapping',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'activated',
        'deactivated',
        'verified',
        'tested',
        'domainAdded',
        'domainRemoved',
        'loginSucceeded',
        'loginFailed',
    ],
};
// =============================================================================
// Directory
// =============================================================================
/**
 * Directory entity
 *
 * Represents an identity directory (SCIM, LDAP, etc.)
 */
export const Directory = {
    singular: 'directory',
    plural: 'directories',
    description: 'An identity directory for user/group synchronization',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Directory sync name',
        },
        type: {
            type: 'string',
            description: 'Directory type: scim, ldap, azure_ad, okta, google',
            examples: ['scim', 'ldap', 'azure_ad', 'okta', 'google'],
        },
        // Configuration
        endpoint: {
            type: 'url',
            optional: true,
            description: 'SCIM endpoint URL',
        },
        bearerToken: {
            type: 'string',
            optional: true,
            description: 'Bearer token for authentication',
        },
        // Status
        status: {
            type: 'string',
            description: 'Sync status: active, inactive, syncing, error',
            examples: ['active', 'inactive', 'syncing', 'error'],
        },
        lastSyncAt: {
            type: 'datetime',
            optional: true,
            description: 'Last sync timestamp',
        },
        lastSyncStatus: {
            type: 'string',
            optional: true,
            description: 'Last sync status',
        },
        // Sync settings
        syncInterval: {
            type: 'number',
            optional: true,
            description: 'Sync interval in minutes',
        },
        autoProvision: {
            type: 'boolean',
            optional: true,
            description: 'Whether to auto-provision users',
        },
        autoDeprovision: {
            type: 'boolean',
            optional: true,
            description: 'Whether to auto-deprovision users',
        },
        // Metrics
        userCount: {
            type: 'number',
            optional: true,
            description: 'Number of synced users',
        },
        groupCount: {
            type: 'number',
            optional: true,
            description: 'Number of synced groups',
        },
    },
    relationships: {
        organization: {
            type: 'Organization',
            description: 'Organization this sync belongs to',
        },
        users: {
            type: 'DirectoryUser[]',
            description: 'Synced users',
        },
        groups: {
            type: 'DirectoryGroup[]',
            description: 'Synced groups',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'activate',
        'deactivate',
        'sync',
        'forceSync',
        'regenerateToken',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'activated',
        'deactivated',
        'syncStarted',
        'syncCompleted',
        'syncFailed',
        'userProvisioned',
        'userDeprovisioned',
        'groupCreated',
        'groupDeleted',
    ],
};
/**
 * Directory user entity
 */
export const DirectoryUser = {
    singular: 'directory user',
    plural: 'directory users',
    description: 'A user synced from a directory',
    properties: {
        externalId: {
            type: 'string',
            description: 'External ID from directory',
        },
        email: {
            type: 'string',
            description: 'User email',
        },
        firstName: {
            type: 'string',
            optional: true,
            description: 'First name',
        },
        lastName: {
            type: 'string',
            optional: true,
            description: 'Last name',
        },
        username: {
            type: 'string',
            optional: true,
            description: 'Username',
        },
        state: {
            type: 'string',
            description: 'User state: active, suspended, deleted',
            examples: ['active', 'suspended', 'deleted'],
        },
        customAttributes: {
            type: 'json',
            optional: true,
            description: 'Custom attributes from directory',
        },
        lastSyncedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last sync timestamp',
        },
    },
    relationships: {
        directory: {
            type: 'Directory',
            backref: 'users',
            description: 'Parent directory sync',
        },
        groups: {
            type: 'DirectoryGroup[]',
            description: 'Groups this user belongs to',
        },
        identity: {
            type: 'Identity',
            required: false,
            description: 'Linked identity',
        },
    },
    actions: ['provision', 'deprovision', 'suspend', 'reactivate', 'sync'],
    events: ['provisioned', 'deprovisioned', 'suspended', 'reactivated', 'synced'],
};
/**
 * Directory group entity
 */
export const DirectoryGroup = {
    singular: 'directory group',
    plural: 'directory groups',
    description: 'A group synced from a directory',
    properties: {
        externalId: {
            type: 'string',
            description: 'External ID from directory',
        },
        name: {
            type: 'string',
            description: 'Group name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Group description',
        },
        memberCount: {
            type: 'number',
            optional: true,
            description: 'Number of members',
        },
        lastSyncedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last sync timestamp',
        },
    },
    relationships: {
        directory: {
            type: 'Directory',
            backref: 'groups',
            description: 'Parent directory sync',
        },
        members: {
            type: 'DirectoryUser[]',
            description: 'Group members',
        },
    },
    actions: ['create', 'delete', 'addMember', 'removeMember', 'sync'],
    events: ['created', 'deleted', 'memberAdded', 'memberRemoved', 'synced'],
};
// =============================================================================
// Audit Log
// =============================================================================
/**
 * Audit log entity
 *
 * Represents an audit log entry
 */
export const AuditLog = {
    singular: 'audit log',
    plural: 'audit logs',
    description: 'An audit log entry for security and compliance',
    properties: {
        // Event
        action: {
            type: 'string',
            description: 'Action performed',
        },
        category: {
            type: 'string',
            description: 'Event category: auth, access, data, admin, system',
            examples: ['auth', 'access', 'data', 'admin', 'system'],
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Event description',
        },
        // Actor
        actorId: {
            type: 'string',
            optional: true,
            description: 'Actor user ID',
        },
        actorEmail: {
            type: 'string',
            optional: true,
            description: 'Actor email',
        },
        actorName: {
            type: 'string',
            optional: true,
            description: 'Actor name',
        },
        actorType: {
            type: 'string',
            optional: true,
            description: 'Actor type: user, service, system',
            examples: ['user', 'service', 'system'],
        },
        // Target
        targetId: {
            type: 'string',
            optional: true,
            description: 'Target resource ID',
        },
        targetType: {
            type: 'string',
            optional: true,
            description: 'Target resource type',
        },
        targetName: {
            type: 'string',
            optional: true,
            description: 'Target resource name',
        },
        // Context
        ipAddress: {
            type: 'string',
            optional: true,
            description: 'IP address',
        },
        userAgent: {
            type: 'string',
            optional: true,
            description: 'User agent string',
        },
        location: {
            type: 'json',
            optional: true,
            description: 'Geographic location',
        },
        sessionId: {
            type: 'string',
            optional: true,
            description: 'Session ID',
        },
        // Result
        outcome: {
            type: 'string',
            description: 'Outcome: success, failure, error',
            examples: ['success', 'failure', 'error'],
        },
        errorCode: {
            type: 'string',
            optional: true,
            description: 'Error code if failed',
        },
        errorMessage: {
            type: 'string',
            optional: true,
            description: 'Error message if failed',
        },
        // Changes
        changes: {
            type: 'json',
            optional: true,
            description: 'Changes made (before/after)',
        },
        // Metadata
        timestamp: {
            type: 'datetime',
            description: 'Event timestamp',
        },
        metadata: {
            type: 'json',
            optional: true,
            description: 'Additional metadata',
        },
    },
    relationships: {
        actor: {
            type: 'Identity',
            required: false,
            description: 'Actor identity',
        },
        organization: {
            type: 'Organization',
            required: false,
            description: 'Organization context',
        },
    },
    actions: ['log', 'query', 'export', 'archive'],
    events: ['logged'],
};
// =============================================================================
// Organization
// =============================================================================
/**
 * Organization entity
 *
 * Represents an organization for multi-tenancy
 */
export const Organization = {
    singular: 'organization',
    plural: 'organizations',
    description: 'An organization for multi-tenant identity management',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Organization name',
        },
        slug: {
            type: 'string',
            optional: true,
            description: 'URL-friendly slug',
        },
        domain: {
            type: 'string',
            optional: true,
            description: 'Primary domain',
        },
        domains: {
            type: 'string',
            array: true,
            optional: true,
            description: 'All verified domains',
        },
        // Branding
        logo: {
            type: 'url',
            optional: true,
            description: 'Organization logo',
        },
        // Settings
        allowedAuthMethods: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Allowed authentication methods',
        },
        mfaRequired: {
            type: 'boolean',
            optional: true,
            description: 'Whether MFA is required',
        },
        sessionTimeout: {
            type: 'number',
            optional: true,
            description: 'Session timeout in minutes',
        },
        // Status
        status: {
            type: 'string',
            description: 'Organization status: active, suspended, deleted',
            examples: ['active', 'suspended', 'deleted'],
        },
        // Metrics
        memberCount: {
            type: 'number',
            optional: true,
            description: 'Number of members',
        },
    },
    relationships: {
        members: {
            type: 'OrganizationMember[]',
            backref: 'organization',
            description: 'Organization members',
        },
        ssoConnections: {
            type: 'SSOConnection[]',
            description: 'SSO connections',
        },
        directorySyncs: {
            type: 'Directory[]',
            description: 'Directory syncs',
        },
        auditLogs: {
            type: 'AuditLog[]',
            description: 'Audit logs',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'suspend',
        'reactivate',
        'addMember',
        'removeMember',
        'verifyDomain',
        'removeDomain',
        'setMfaRequired',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'suspended',
        'reactivated',
        'memberAdded',
        'memberRemoved',
        'domainVerified',
        'domainRemoved',
        'mfaRequirementChanged',
    ],
};
/**
 * Organization member entity
 */
export const OrganizationMember = {
    singular: 'organization member',
    plural: 'organization members',
    description: 'A member of an organization',
    properties: {
        role: {
            type: 'string',
            description: 'Member role: owner, admin, member, guest',
            examples: ['owner', 'admin', 'member', 'guest'],
        },
        status: {
            type: 'string',
            description: 'Membership status: active, invited, suspended',
            examples: ['active', 'invited', 'suspended'],
        },
        invitedAt: {
            type: 'datetime',
            optional: true,
            description: 'When member was invited',
        },
        joinedAt: {
            type: 'datetime',
            optional: true,
            description: 'When member joined',
        },
    },
    relationships: {
        organization: {
            type: 'Organization',
            backref: 'members',
            description: 'Parent organization',
        },
        identity: {
            type: 'Identity',
            description: 'Member identity',
        },
    },
    actions: ['invite', 'accept', 'remove', 'setRole', 'suspend', 'reactivate'],
    events: [
        'invited',
        'accepted',
        'removed',
        'roleChanged',
        'suspended',
        'reactivated',
    ],
};
// =============================================================================
// Export all entities as a schema
// =============================================================================
/**
 * All identity entity types
 */
export const IdentityEntities = {
    // Vault
    Vault,
    VaultSecret,
    SecretVersion,
    VaultPolicy,
    // SSO
    SSOConnection,
    // Directory Sync
    Directory,
    DirectoryUser,
    DirectoryGroup,
    // Audit
    AuditLog,
    // Organizations
    Organization,
    OrganizationMember,
};
/**
 * Entity categories for organization
 */
export const IdentityCategories = {
    vault: ['Vault', 'VaultSecret', 'SecretVersion', 'VaultPolicy'],
    sso: ['SSOConnection'],
    directory: ['Directory', 'DirectoryUser', 'DirectoryGroup'],
    audit: ['AuditLog'],
    organization: ['Organization', 'OrganizationMember'],
};
