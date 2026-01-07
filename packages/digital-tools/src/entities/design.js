/**
 * Design Entity Types (Nouns)
 *
 * Design tool entities for files, components, design systems,
 * and collaboration (Figma, Sketch, etc.).
 *
 * @packageDocumentation
 */
// =============================================================================
// DesignFile
// =============================================================================
/**
 * DesignFile entity
 *
 * Represents a design file (Figma, Sketch, etc.).
 */
export const DesignFile = {
    singular: 'design-file',
    plural: 'design-files',
    description: 'A design file',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'File name',
        },
        key: {
            type: 'string',
            optional: true,
            description: 'Unique file key',
        },
        thumbnailUrl: {
            type: 'url',
            optional: true,
            description: 'Thumbnail URL',
        },
        // Type
        type: {
            type: 'string',
            optional: true,
            description: 'File type',
            examples: ['figma', 'sketch', 'xd', 'psd', 'ai', 'svg'],
        },
        // Version
        version: {
            type: 'string',
            optional: true,
            description: 'Current version',
        },
        lastModified: {
            type: 'datetime',
            optional: true,
            description: 'Last modified date',
        },
        // Content
        pageCount: {
            type: 'number',
            optional: true,
            description: 'Number of pages',
        },
        componentCount: {
            type: 'number',
            optional: true,
            description: 'Number of components',
        },
        // URLs
        editorUrl: {
            type: 'url',
            optional: true,
            description: 'Editor URL',
        },
        embedUrl: {
            type: 'url',
            optional: true,
            description: 'Embed URL',
        },
    },
    relationships: {
        project: {
            type: 'Project',
            required: false,
            description: 'Parent project',
        },
        owner: {
            type: 'User',
            description: 'File owner',
        },
        collaborators: {
            type: 'User[]',
            description: 'Collaborators',
        },
        components: {
            type: 'Component[]',
            description: 'Components in file',
        },
    },
    actions: [
        'create',
        'update',
        'rename',
        'duplicate',
        'delete',
        'share',
        'export',
        'version',
    ],
    events: [
        'created',
        'updated',
        'renamed',
        'duplicated',
        'deleted',
        'shared',
        'exported',
        'versioned',
    ],
};
// =============================================================================
// Component
// =============================================================================
/**
 * Component entity
 *
 * Represents a reusable design component.
 */
export const Component = {
    singular: 'component',
    plural: 'components',
    description: 'A reusable design component',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Component name',
        },
        key: {
            type: 'string',
            optional: true,
            description: 'Unique component key',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Component description',
        },
        // Categorization
        category: {
            type: 'string',
            optional: true,
            description: 'Component category',
        },
        tags: {
            type: 'string',
            array: true,
            optional: true,
            description: 'Tags',
        },
        // Properties
        properties: {
            type: 'json',
            optional: true,
            description: 'Component properties/variants',
        },
        // Visual
        thumbnailUrl: {
            type: 'url',
            optional: true,
            description: 'Thumbnail URL',
        },
        // Status
        status: {
            type: 'string',
            optional: true,
            description: 'Component status',
            examples: ['draft', 'review', 'approved', 'deprecated'],
        },
        isPublished: {
            type: 'boolean',
            optional: true,
            description: 'Whether published to library',
        },
    },
    relationships: {
        file: {
            type: 'DesignFile',
            description: 'Source file',
        },
        designSystem: {
            type: 'DesignSystem',
            required: false,
            description: 'Parent design system',
        },
        variants: {
            type: 'Component[]',
            description: 'Component variants',
        },
    },
    actions: [
        'create',
        'update',
        'publish',
        'unpublish',
        'deprecate',
        'delete',
    ],
    events: [
        'created',
        'updated',
        'published',
        'unpublished',
        'deprecated',
        'deleted',
    ],
};
// =============================================================================
// DesignSystem
// =============================================================================
/**
 * DesignSystem entity
 *
 * Represents a design system or component library.
 */
export const DesignSystem = {
    singular: 'design-system',
    plural: 'design-systems',
    description: 'A design system or component library',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Design system name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Description',
        },
        version: {
            type: 'string',
            optional: true,
            description: 'Current version',
        },
        // Content
        componentCount: {
            type: 'number',
            optional: true,
            description: 'Number of components',
        },
        styleCount: {
            type: 'number',
            optional: true,
            description: 'Number of styles',
        },
        // URLs
        documentationUrl: {
            type: 'url',
            optional: true,
            description: 'Documentation URL',
        },
        // Status
        status: {
            type: 'string',
            optional: true,
            description: 'System status',
            examples: ['development', 'beta', 'stable', 'deprecated'],
        },
    },
    relationships: {
        components: {
            type: 'Component[]',
            description: 'Components in system',
        },
        styles: {
            type: 'Style[]',
            description: 'Styles in system',
        },
        maintainers: {
            type: 'User[]',
            description: 'System maintainers',
        },
    },
    actions: [
        'create',
        'update',
        'publish',
        'deprecate',
    ],
    events: [
        'created',
        'updated',
        'published',
        'versionReleased',
        'deprecated',
    ],
};
// =============================================================================
// Style
// =============================================================================
/**
 * Style entity
 *
 * Represents a design style (color, typography, effect).
 */
export const Style = {
    singular: 'style',
    plural: 'styles',
    description: 'A design style (color, typography, effect)',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Style name',
        },
        key: {
            type: 'string',
            optional: true,
            description: 'Unique style key',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Style description',
        },
        // Type
        type: {
            type: 'string',
            description: 'Style type',
            examples: ['color', 'typography', 'effect', 'grid'],
        },
        // Value
        value: {
            type: 'json',
            description: 'Style value/definition',
        },
        // Categorization
        category: {
            type: 'string',
            optional: true,
            description: 'Category (e.g., primary, semantic)',
        },
    },
    relationships: {
        designSystem: {
            type: 'DesignSystem',
            required: false,
            description: 'Parent design system',
        },
        file: {
            type: 'DesignFile',
            required: false,
            description: 'Source file',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'publish',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'published',
    ],
};
// =============================================================================
// Prototype
// =============================================================================
/**
 * Prototype entity
 *
 * Represents an interactive prototype.
 */
export const Prototype = {
    singular: 'prototype',
    plural: 'prototypes',
    description: 'An interactive prototype',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Prototype name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Prototype description',
        },
        // Configuration
        startingFrame: {
            type: 'string',
            optional: true,
            description: 'Starting frame/screen',
        },
        device: {
            type: 'string',
            optional: true,
            description: 'Target device',
            examples: ['desktop', 'tablet', 'mobile', 'watch'],
        },
        // URLs
        previewUrl: {
            type: 'url',
            optional: true,
            description: 'Preview URL',
        },
        embedUrl: {
            type: 'url',
            optional: true,
            description: 'Embed URL',
        },
        // Status
        status: {
            type: 'string',
            optional: true,
            description: 'Prototype status',
            examples: ['draft', 'review', 'approved'],
        },
    },
    relationships: {
        file: {
            type: 'DesignFile',
            description: 'Source file',
        },
    },
    actions: [
        'create',
        'update',
        'share',
        'present',
    ],
    events: [
        'created',
        'updated',
        'shared',
        'presented',
        'viewed',
    ],
};
// =============================================================================
// DesignComment
// =============================================================================
/**
 * DesignComment entity
 *
 * Represents a comment on a design.
 */
export const DesignComment = {
    singular: 'design-comment',
    plural: 'design-comments',
    description: 'A comment on a design',
    properties: {
        // Content
        message: {
            type: 'string',
            description: 'Comment text',
        },
        // Position
        x: {
            type: 'number',
            optional: true,
            description: 'X coordinate',
        },
        y: {
            type: 'number',
            optional: true,
            description: 'Y coordinate',
        },
        frameId: {
            type: 'string',
            optional: true,
            description: 'Frame/artboard ID',
        },
        // Status
        status: {
            type: 'string',
            optional: true,
            description: 'Comment status',
            examples: ['open', 'resolved'],
        },
        resolvedAt: {
            type: 'datetime',
            optional: true,
            description: 'When resolved',
        },
    },
    relationships: {
        file: {
            type: 'DesignFile',
            description: 'Design file',
        },
        author: {
            type: 'User',
            description: 'Comment author',
        },
        parent: {
            type: 'DesignComment',
            required: false,
            description: 'Parent comment (for replies)',
        },
        replies: {
            type: 'DesignComment[]',
            description: 'Replies',
        },
        resolvedBy: {
            type: 'User',
            required: false,
            description: 'Who resolved',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'resolve',
        'reopen',
        'reply',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'resolved',
        'reopened',
        'replied',
    ],
};
// =============================================================================
// Exports
// =============================================================================
export const DesignEntities = {
    DesignFile,
    Component,
    DesignSystem,
    Style,
    Prototype,
    DesignComment,
};
export const DesignCategories = {
    files: ['DesignFile'],
    components: ['Component', 'DesignSystem'],
    styles: ['Style'],
    prototypes: ['Prototype'],
    collaboration: ['DesignComment'],
};
