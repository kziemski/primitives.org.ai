/**
 * Core Type Definitions
 *
 * Contains all foundational types for ai-database:
 * - Thing types (mdxld-based entity structure)
 * - Schema definition types
 * - Parsed schema types
 * - Noun & Verb semantic types
 *
 * @packageDocumentation
 */
/**
 * Convert flat thing to expanded format
 */
export function toExpanded(flat) {
    const { $id, $type, $context, ...rest } = flat;
    return {
        id: $id,
        type: $type,
        context: $context,
        data: rest,
        content: typeof rest.content === 'string' ? rest.content : '',
    };
}
/**
 * Convert expanded thing to flat format
 */
export function toFlat(expanded) {
    const { id, type, context, data, content, ...rest } = expanded;
    return {
        $id: id,
        $type: type,
        $context: context,
        ...data,
        ...rest,
        ...(content ? { content } : {}),
    };
}
/**
 * Standard CRUD verbs with pre-defined conjugations
 */
export const Verbs = {
    create: {
        action: 'create',
        actor: 'creator',
        act: 'creates',
        activity: 'creating',
        result: 'creation',
        reverse: { at: 'createdAt', by: 'createdBy', in: 'createdIn', for: 'createdFor' },
        inverse: 'delete',
    },
    update: {
        action: 'update',
        actor: 'updater',
        act: 'updates',
        activity: 'updating',
        result: 'update',
        reverse: { at: 'updatedAt', by: 'updatedBy' },
    },
    delete: {
        action: 'delete',
        actor: 'deleter',
        act: 'deletes',
        activity: 'deleting',
        result: 'deletion',
        reverse: { at: 'deletedAt', by: 'deletedBy' },
        inverse: 'create',
    },
    publish: {
        action: 'publish',
        actor: 'publisher',
        act: 'publishes',
        activity: 'publishing',
        result: 'publication',
        reverse: { at: 'publishedAt', by: 'publishedBy' },
        inverse: 'unpublish',
    },
    archive: {
        action: 'archive',
        actor: 'archiver',
        act: 'archives',
        activity: 'archiving',
        result: 'archive',
        reverse: { at: 'archivedAt', by: 'archivedBy' },
        inverse: 'unarchive',
    },
};
/**
 * Resolve the URL for an entity
 */
export function resolveUrl(entity) {
    if (entity.url)
        return entity.url;
    return `https://${entity.ns}/${entity.type}/${entity.id}`;
}
/**
 * Resolve URL with just ns/id (no type in path)
 */
export function resolveShortUrl(entity) {
    return `https://${entity.ns}/${entity.id}`;
}
/**
 * Parse a URL into EntityId components
 */
export function parseUrl(url) {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length === 1) {
        return {
            ns: parsed.host,
            type: '',
            id: parts[0],
            url
        };
    }
    if (parts.length >= 2) {
        return {
            ns: parsed.host,
            type: parts[0],
            id: parts.slice(1).join('/'),
            url
        };
    }
    throw new Error(`Invalid entity URL: ${url}`);
}
