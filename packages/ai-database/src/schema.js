/**
 * Schema-first Database Definition
 *
 * Declarative schema with automatic bi-directional relationships.
 * Uses mdxld conventions for entity structure.
 *
 * @example
 * ```ts
 * const { db } = DB({
 *   Post: {
 *     title: 'string',
 *     author: 'Author.posts',     // one-to-many: Post.author -> Author, Author.posts -> Post[]
 *     tags: ['Tag.posts'],        // many-to-many: Post.tags -> Tag[], Tag.posts -> Post[]
 *   },
 *   Author: {
 *     name: 'string',
 *     // posts: Post[] auto-created from backref
 *   },
 *   Tag: {
 *     name: 'string',
 *     // posts: Post[] auto-created from backref
 *   }
 * })
 *
 * // Typed access
 * const post = await db.Post.get('123')
 * post.author  // Author (single)
 * post.tags    // Tag[] (array)
 * ```
 */
import { wrapEntityOperations } from './ai-promise-db.js';
export { toExpanded, toFlat, Verbs, resolveUrl, resolveShortUrl, parseUrl } from './types.js';
// Re-export linguistic utilities from linguistic.ts
export { conjugate, pluralize, singularize, inferNoun, createTypeMeta, getTypeMeta, Type, getVerbFields, } from './linguistic.js';
import { Verbs } from './types.js';
import { inferNoun, getTypeMeta, conjugate, } from './linguistic.js';
/**
 * Create a Noun definition with type inference
 *
 * @example
 * ```ts
 * const Post = defineNoun({
 *   singular: 'post',
 *   plural: 'posts',
 *   description: 'A blog post',
 *   properties: {
 *     title: { type: 'string', description: 'Post title' },
 *     content: { type: 'markdown' },
 *   },
 *   relationships: {
 *     author: { type: 'Author', backref: 'posts' },
 *   },
 * })
 * ```
 */
export function defineNoun(noun) {
    return noun;
}
/**
 * Create a Verb definition with type inference
 *
 * @example
 * ```ts
 * const publish = defineVerb({
 *   action: 'publish',
 *   actor: 'publisher',
 *   act: 'publishes',
 *   activity: 'publishing',
 *   result: 'publication',
 *   reverse: { at: 'publishedAt', by: 'publishedBy' },
 *   inverse: 'unpublish',
 * })
 * ```
 */
export function defineVerb(verb) {
    return verb;
}
/**
 * Convert a Noun to an EntitySchema for use with DB()
 *
 * @example
 * ```ts
 * const postNoun = defineNoun({
 *   singular: 'post',
 *   plural: 'posts',
 *   properties: { title: { type: 'string' } },
 *   relationships: { author: { type: 'Author', backref: 'posts' } },
 * })
 *
 * const db = DB({
 *   Post: nounToSchema(postNoun),
 * })
 * ```
 */
export function nounToSchema(noun) {
    const schema = {};
    // Add properties
    if (noun.properties) {
        for (const [name, prop] of Object.entries(noun.properties)) {
            let type = prop.type;
            if (prop.array)
                type = `${type}[]`;
            if (prop.optional)
                type = `${type}?`;
            schema[name] = type;
        }
    }
    // Add relationships
    if (noun.relationships) {
        for (const [name, rel] of Object.entries(noun.relationships)) {
            const baseType = rel.type.replace('[]', '');
            const isArray = rel.type.endsWith('[]');
            if (rel.backref) {
                schema[name] = isArray ? [`${baseType}.${rel.backref}`] : `${baseType}.${rel.backref}`;
            }
            else {
                schema[name] = rel.type;
            }
        }
    }
    return schema;
}
// =============================================================================
// Built-in Schema Types - Self-Describing Database
// =============================================================================
/**
 * Built-in Thing schema - base type for all entities
 *
 * Every entity instance is a Thing with a relationship to its Noun.
 * This creates a complete graph: Thing.type -> Noun.things
 *
 * @example
 * ```ts
 * // Every post instance:
 * post.$type   // 'Post' (string)
 * post.type    // -> Noun('Post') (relationship)
 *
 * // From Noun, get all instances:
 * const postNoun = await db.Noun.get('Post')
 * const allPosts = await postNoun.things  // -> Post[]
 * ```
 */
export const ThingSchema = {
    // Every Thing has a type that links to its Noun
    type: 'Noun.things', // Thing.type -> Noun, Noun.things -> Thing[]
};
/**
 * Built-in Noun schema for storing type definitions
 *
 * Every Type/Collection automatically gets a Noun record stored in the database.
 * This enables introspection and self-describing schemas.
 *
 * @example
 * ```ts
 * // When you define:
 * const db = DB({ Post: { title: 'string' } })
 *
 * // The database auto-creates:
 * // db.Noun.get('Post') => { singular: 'post', plural: 'posts', ... }
 *
 * // Query all types:
 * const types = await db.Noun.list()
 *
 * // Get all instances of a type:
 * const postNoun = await db.Noun.get('Post')
 * const allPosts = await postNoun.things
 *
 * // Listen for new types:
 * on.Noun.created(noun => console.log(`New type: ${noun.name}`))
 * ```
 */
export const NounSchema = {
    // Identity
    name: 'string', // 'Post', 'BlogPost'
    singular: 'string', // 'post', 'blog post'
    plural: 'string', // 'posts', 'blog posts'
    slug: 'string', // 'post', 'blog-post'
    slugPlural: 'string', // 'posts', 'blog-posts'
    description: 'string?', // Human description
    // Schema
    properties: 'json?', // Property definitions
    relationships: 'json?', // Relationship definitions
    // Behavior
    actions: 'json?', // Available actions (verbs)
    events: 'json?', // Event types
    // Metadata
    metadata: 'json?', // Additional metadata
    // Relationships - auto-created by bi-directional system
    // things: Thing[]        // All instances of this type (backref from Thing.type)
};
/**
 * Built-in Verb schema for storing action definitions
 */
export const VerbSchema = {
    action: 'string', // 'create', 'publish'
    actor: 'string?', // 'creator', 'publisher'
    act: 'string?', // 'creates', 'publishes'
    activity: 'string?', // 'creating', 'publishing'
    result: 'string?', // 'creation', 'publication'
    reverse: 'json?', // { at, by, in, for }
    inverse: 'string?', // 'delete', 'unpublish'
    description: 'string?',
};
/**
 * Built-in Edge schema for relationships between types
 *
 * Every relationship in a schema creates an Edge record.
 * This enables graph queries across the type system.
 *
 * @example
 * ```ts
 * // Post.author -> Author creates:
 * // Edge { from: 'Post', name: 'author', to: 'Author', backref: 'posts', cardinality: 'many-to-one' }
 *
 * // Query the graph:
 * const edges = await db.Edge.find({ to: 'Author' })
 * // => [{ from: 'Post', name: 'author' }, { from: 'Comment', name: 'author' }]
 *
 * // What types reference Author?
 * const referencing = edges.map(e => e.from)  // ['Post', 'Comment']
 * ```
 */
export const EdgeSchema = {
    from: 'string', // Source type: 'Post'
    name: 'string', // Field name: 'author'
    to: 'string', // Target type: 'Author'
    backref: 'string?', // Inverse field: 'posts'
    cardinality: 'string', // 'one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'
    required: 'boolean?', // Is this relationship required?
    description: 'string?', // Human description
};
/**
 * System types that are auto-created in every database
 *
 * The graph structure:
 * - Thing.type -> Noun (every instance links to its type)
 * - Noun.things -> Thing[] (every type has its instances)
 * - Edge connects Nouns (relationships between types)
 * - Verb describes actions on Nouns
 */
export const SystemSchema = {
    Thing: ThingSchema,
    Noun: NounSchema,
    Verb: VerbSchema,
    Edge: EdgeSchema,
};
/**
 * Create Edge records from schema relationships
 *
 * @internal Used by DB() to auto-populate Edge records
 */
export function createEdgeRecords(typeName, schema, parsedEntity) {
    const edges = [];
    for (const [fieldName, field] of parsedEntity.fields) {
        if (field.isRelation && field.relatedType) {
            const cardinality = field.isArray
                ? field.backref ? 'many-to-many' : 'one-to-many'
                : field.backref ? 'many-to-one' : 'one-to-one';
            edges.push({
                from: typeName,
                name: fieldName,
                to: field.relatedType,
                backref: field.backref,
                cardinality,
            });
        }
    }
    return edges;
}
/**
 * Create a Noun record from a type name and optional schema
 *
 * @internal Used by DB() to auto-populate Noun records
 */
export function createNounRecord(typeName, schema, nounDef) {
    const meta = getTypeMeta(typeName);
    const inferred = inferNoun(typeName);
    return {
        name: typeName,
        singular: nounDef?.singular ?? meta.singular,
        plural: nounDef?.plural ?? meta.plural,
        slug: meta.slug,
        slugPlural: meta.slugPlural,
        description: nounDef?.description,
        properties: nounDef?.properties ?? (schema ? schemaToProperties(schema) : undefined),
        relationships: nounDef?.relationships,
        actions: nounDef?.actions ?? inferred.actions,
        events: nounDef?.events ?? inferred.events,
        metadata: nounDef?.metadata,
    };
}
/**
 * Convert EntitySchema to NounProperty format
 */
function schemaToProperties(schema) {
    const properties = {};
    for (const [name, def] of Object.entries(schema)) {
        const defStr = Array.isArray(def) ? def[0] : def;
        const isOptional = defStr.endsWith('?');
        const isArray = defStr.endsWith('[]') || Array.isArray(def);
        const baseType = defStr.replace(/[\?\[\]]/g, '').split('.')[0];
        properties[name] = {
            type: baseType,
            optional: isOptional,
            array: isArray,
        };
    }
    return properties;
}
// =============================================================================
// Schema Parsing
// =============================================================================
/**
 * Parse a single field definition
 */
function parseField(name, definition) {
    // Handle array literal syntax: ['Author.posts']
    if (Array.isArray(definition)) {
        const inner = parseField(name, definition[0]);
        return { ...inner, isArray: true };
    }
    let type = definition;
    let isArray = false;
    let isOptional = false;
    let isRelation = false;
    let relatedType;
    let backref;
    // Check for optional modifier
    if (type.endsWith('?')) {
        isOptional = true;
        type = type.slice(0, -1);
    }
    // Check for array modifier (string syntax)
    if (type.endsWith('[]')) {
        isArray = true;
        type = type.slice(0, -2);
    }
    // Check for relation (contains a dot for backref)
    if (type.includes('.')) {
        isRelation = true;
        const [entityName, backrefName] = type.split('.');
        relatedType = entityName;
        backref = backrefName;
        type = entityName;
    }
    else if (type[0] === type[0]?.toUpperCase() && !isPrimitiveType(type)) {
        // PascalCase non-primitive = relation without explicit backref
        isRelation = true;
        relatedType = type;
    }
    return {
        name,
        type,
        isArray,
        isOptional,
        isRelation,
        relatedType,
        backref,
    };
}
/**
 * Check if a type is a primitive
 */
function isPrimitiveType(type) {
    const primitives = [
        'string',
        'number',
        'boolean',
        'date',
        'datetime',
        'json',
        'markdown',
        'url',
    ];
    return primitives.includes(type);
}
/**
 * Parse a database schema and resolve bi-directional relationships
 */
export function parseSchema(schema) {
    const entities = new Map();
    // First pass: parse all entities and their fields
    for (const [entityName, entitySchema] of Object.entries(schema)) {
        const fields = new Map();
        for (const [fieldName, fieldDef] of Object.entries(entitySchema)) {
            fields.set(fieldName, parseField(fieldName, fieldDef));
        }
        entities.set(entityName, { name: entityName, fields });
    }
    // Second pass: create bi-directional relationships
    for (const [entityName, entity] of entities) {
        for (const [fieldName, field] of entity.fields) {
            if (field.isRelation && field.relatedType && field.backref) {
                const relatedEntity = entities.get(field.relatedType);
                if (relatedEntity && !relatedEntity.fields.has(field.backref)) {
                    // Auto-create the inverse relation
                    // If Post.author -> Author.posts, then Author.posts -> Post[]
                    relatedEntity.fields.set(field.backref, {
                        name: field.backref,
                        type: entityName,
                        isArray: true, // Backref is always an array
                        isOptional: false,
                        isRelation: true,
                        relatedType: entityName,
                        backref: fieldName, // Points back to the original field
                    });
                }
            }
        }
    }
    return { entities };
}
let nlQueryGenerator = null;
/**
 * Set the AI generator for natural language queries
 *
 * @example
 * ```ts
 * import { generate } from 'ai-functions'
 *
 * setNLQueryGenerator(async (prompt, context) => {
 *   return generate({
 *     prompt: `Given this schema: ${JSON.stringify(context.types)}
 *              Answer this question: ${prompt}
 *              Return a query plan as JSON.`,
 *     schema: NLQueryPlanSchema
 *   })
 * })
 * ```
 */
export function setNLQueryGenerator(generator) {
    nlQueryGenerator = generator;
}
/**
 * Build schema context for NL queries
 */
function buildNLQueryContext(schema, targetType) {
    const types = [];
    for (const [name, entity] of schema.entities) {
        const fields = [];
        const relationships = [];
        for (const [fieldName, field] of entity.fields) {
            if (field.isRelation && field.relatedType) {
                relationships.push({
                    name: fieldName,
                    to: field.relatedType,
                    cardinality: field.isArray ? 'many' : 'one',
                });
            }
            else {
                fields.push(fieldName);
            }
        }
        const meta = getTypeMeta(name);
        types.push({
            name,
            singular: meta.singular,
            plural: meta.plural,
            fields,
            relationships,
        });
    }
    return { types, targetType };
}
/**
 * Execute a natural language query
 */
async function executeNLQuery(question, schema, targetType) {
    // If no AI generator configured, fall back to search
    if (!nlQueryGenerator) {
        // Simple fallback: search across all types or target type
        const provider = await resolveProvider();
        const results = [];
        if (targetType) {
            const searchResults = await provider.search(targetType, question);
            results.push(...searchResults);
        }
        else {
            for (const [typeName] of schema.entities) {
                const searchResults = await provider.search(typeName, question);
                results.push(...searchResults);
            }
        }
        return {
            interpretation: `Search for "${question}"`,
            confidence: 0.5,
            results,
            explanation: 'Fallback to keyword search (no AI generator configured)',
        };
    }
    // Build context and get AI-generated query plan
    const context = buildNLQueryContext(schema, targetType);
    const plan = await nlQueryGenerator(question, context);
    // Execute the plan
    const provider = await resolveProvider();
    const results = [];
    for (const typeName of plan.types) {
        let typeResults;
        if (plan.search) {
            typeResults = await provider.search(typeName, plan.search, {
                where: plan.filters,
            });
        }
        else {
            typeResults = await provider.list(typeName, {
                where: plan.filters,
            });
        }
        results.push(...typeResults);
    }
    return {
        interpretation: plan.interpretation,
        confidence: plan.confidence,
        results,
        query: JSON.stringify({ types: plan.types, filters: plan.filters, search: plan.search }),
    };
}
/**
 * Create a natural language query function for a specific type
 */
function createNLQueryFn(schema, typeName) {
    return async (strings, ...values) => {
        // Interpolate the template
        const question = strings.reduce((acc, str, i) => {
            return acc + str + (values[i] !== undefined ? String(values[i]) : '');
        }, '');
        return executeNLQuery(question, schema, typeName);
    };
}
// =============================================================================
// Provider Resolution
// =============================================================================
let globalProvider = null;
let providerPromise = null;
/** File count threshold for suggesting ClickHouse upgrade */
const FILE_COUNT_THRESHOLD = 10_000;
/**
 * Set the global database provider
 */
export function setProvider(provider) {
    globalProvider = provider;
    providerPromise = null;
}
/**
 * Parse DATABASE_URL into provider type and paths
 *
 * Local storage (all use .db/ folder):
 * - `./content` → fs (default)
 * - `sqlite://./content` → sqlite stored in ./content/.db/index.sqlite
 * - `chdb://./content` → clickhouse stored in ./content/.db/clickhouse/
 *
 * Remote:
 * - `libsql://your-db.turso.io` → Turso SQLite
 * - `clickhouse://host:8123` → ClickHouse HTTP
 * - `:memory:` → in-memory
 */
function parseDatabaseUrl(url) {
    if (!url)
        return { provider: 'fs', root: './content' };
    // In-memory
    if (url === ':memory:') {
        return { provider: 'memory', root: '' };
    }
    // Remote Turso
    if (url.startsWith('libsql://') || url.includes('.turso.io')) {
        return { provider: 'sqlite', root: '', remoteUrl: url };
    }
    // Remote ClickHouse
    if (url.startsWith('clickhouse://') && url.includes(':')) {
        // clickhouse://host:port/db
        return { provider: 'clickhouse', root: '', remoteUrl: url.replace('clickhouse://', 'https://') };
    }
    // Local SQLite: sqlite://./content → ./content/.db/index.sqlite
    if (url.startsWith('sqlite://')) {
        const root = url.replace('sqlite://', '') || './content';
        return { provider: 'sqlite', root };
    }
    // Local ClickHouse (chDB): chdb://./content → ./content/.db/clickhouse/
    if (url.startsWith('chdb://')) {
        const root = url.replace('chdb://', '') || './content';
        return { provider: 'clickhouse', root };
    }
    // Default: filesystem
    return { provider: 'fs', root: url };
}
/**
 * Resolve provider from DATABASE_URL environment variable
 *
 * @example
 * ```bash
 * # Filesystem (default) - stores in ./content with .db/ metadata
 * DATABASE_URL=./content
 *
 * # Local SQLite - stores in ./content/.db/index.sqlite
 * DATABASE_URL=sqlite://./content
 *
 * # Remote Turso
 * DATABASE_URL=libsql://your-db.turso.io
 *
 * # Local ClickHouse (chDB) - stores in ./content/.db/clickhouse/
 * DATABASE_URL=chdb://./content
 *
 * # Remote ClickHouse
 * DATABASE_URL=clickhouse://localhost:8123
 *
 * # In-memory (testing)
 * DATABASE_URL=:memory:
 * ```
 */
async function resolveProvider() {
    if (globalProvider)
        return globalProvider;
    if (providerPromise)
        return providerPromise;
    providerPromise = (async () => {
        const databaseUrl = (typeof process !== 'undefined' && process.env?.DATABASE_URL) || './content';
        const parsed = parseDatabaseUrl(databaseUrl);
        switch (parsed.provider) {
            case 'memory': {
                const { createMemoryProvider } = await import('./memory-provider.js');
                globalProvider = createMemoryProvider();
                break;
            }
            case 'fs': {
                try {
                    const { createFsProvider } = await import('@mdxdb/fs');
                    globalProvider = createFsProvider({ root: parsed.root });
                    // Check file count and warn if approaching threshold
                    checkFileCountThreshold(parsed.root);
                }
                catch (err) {
                    console.warn('@mdxdb/fs not available, falling back to memory provider');
                    const { createMemoryProvider } = await import('./memory-provider.js');
                    globalProvider = createMemoryProvider();
                }
                break;
            }
            case 'sqlite': {
                try {
                    const { createSqliteProvider } = await import('@mdxdb/sqlite');
                    if (parsed.remoteUrl) {
                        // Remote Turso
                        globalProvider = await createSqliteProvider({ url: parsed.remoteUrl });
                    }
                    else {
                        // Local SQLite in .db folder
                        const dbPath = `${parsed.root}/.db/index.sqlite`;
                        globalProvider = await createSqliteProvider({ url: `file:${dbPath}` });
                    }
                }
                catch (err) {
                    console.warn('@mdxdb/sqlite not available, falling back to memory provider');
                    const { createMemoryProvider } = await import('./memory-provider.js');
                    globalProvider = createMemoryProvider();
                }
                break;
            }
            case 'clickhouse': {
                try {
                    const { createClickhouseProvider } = await import('@mdxdb/clickhouse');
                    if (parsed.remoteUrl) {
                        // Remote ClickHouse
                        globalProvider = await createClickhouseProvider({
                            mode: 'http',
                            url: parsed.remoteUrl,
                        });
                    }
                    else {
                        // Local chDB in .db folder
                        const dbPath = `${parsed.root}/.db/clickhouse`;
                        globalProvider = await createClickhouseProvider({
                            mode: 'chdb',
                            url: dbPath,
                        });
                    }
                }
                catch (err) {
                    console.warn('@mdxdb/clickhouse not available, falling back to memory provider');
                    const { createMemoryProvider } = await import('./memory-provider.js');
                    globalProvider = createMemoryProvider();
                }
                break;
            }
            default: {
                const { createMemoryProvider } = await import('./memory-provider.js');
                globalProvider = createMemoryProvider();
            }
        }
        return globalProvider;
    })();
    return providerPromise;
}
/**
 * Check file count and warn if approaching threshold
 */
async function checkFileCountThreshold(root) {
    try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        async function countFiles(dir) {
            let count = 0;
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.name.startsWith('.'))
                        continue;
                    if (entry.isDirectory()) {
                        count += await countFiles(path.join(dir, entry.name));
                    }
                    else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
                        count++;
                    }
                }
            }
            catch {
                // Directory doesn't exist yet
            }
            return count;
        }
        const count = await countFiles(root);
        if (count > FILE_COUNT_THRESHOLD) {
            console.warn(`\n⚠️  You have ${count.toLocaleString()} MDX files. ` +
                `Consider upgrading to ClickHouse for better performance:\n` +
                `   DATABASE_URL=chdb://./data/clickhouse\n`);
        }
    }
    catch {
        // Ignore errors in file counting
    }
}
// =============================================================================
// DB Factory
// =============================================================================
/**
 * Create a typed database from a schema definition
 *
 * Supports both direct usage and destructuring for flexibility:
 *
 * @example Direct usage - everything on one object
 * ```ts
 * const db = DB({
 *   Post: { title: 'string', author: 'Author.posts' },
 *   Author: { name: 'string' },
 * })
 *
 * // Entity operations
 * const post = await db.Post.create({ title: 'Hello' })
 *
 * // Events, actions, etc. are also available directly
 * db.events.on('Post.created', (event) => console.log(event))
 * db.actions.create({ type: 'generate', data: {} })
 * ```
 *
 * @example Destructured usage - cleaner separation
 * ```ts
 * const { db, events, actions, artifacts, nouns, verbs } = DB({
 *   Post: { title: 'string', author: 'Author.posts' },
 *   Author: { name: 'string' },
 * })
 *
 * // CRUD operations on db
 * const post = await db.Post.create({ title: 'Hello' })
 * await db.Post.update(post.$id, { title: 'Updated' })
 *
 * // Separate events API
 * events.on('Post.created', (event) => console.log(event))
 *
 * // Separate actions API
 * const action = await actions.create({ type: 'generate', data: {} })
 * ```
 */
export function DB(schema) {
    const parsedSchema = parseSchema(schema);
    // Create Actions API early so it can be injected into entity operations
    const actionsAPI = {
        async create(options) {
            const provider = await resolveProvider();
            if ('createAction' in provider) {
                return provider.createAction(options);
            }
            throw new Error('Provider does not support actions');
        },
        async get(id) {
            const provider = await resolveProvider();
            if ('getAction' in provider) {
                return provider.getAction(id);
            }
            return null;
        },
        async update(id, updates) {
            const provider = await resolveProvider();
            if ('updateAction' in provider) {
                return provider.updateAction(id, updates);
            }
            throw new Error('Provider does not support actions');
        },
    };
    // Create entity operations for each type with promise pipelining
    const entityOperations = {};
    for (const [entityName, entity] of parsedSchema.entities) {
        const baseOps = createEntityOperations(entityName, entity, parsedSchema);
        // Wrap with DBPromise for chainable queries, inject actions for forEach persistence
        entityOperations[entityName] = wrapEntityOperations(entityName, baseOps, actionsAPI);
    }
    // Noun definitions cache
    const nounDefinitions = new Map();
    // Initialize nouns from schema
    for (const [entityName] of parsedSchema.entities) {
        const noun = inferNoun(entityName);
        nounDefinitions.set(entityName, noun);
    }
    // Verb definitions cache
    const verbDefinitions = new Map(Object.entries(Verbs).map(([k, v]) => [k, v]));
    // Create the typed DB object
    const db = {
        $schema: parsedSchema,
        async get(url) {
            const provider = await resolveProvider();
            const parsed = parseUrl(url);
            return provider.get(parsed.type, parsed.id);
        },
        async search(query, options) {
            const provider = await resolveProvider();
            const results = [];
            for (const [typeName] of parsedSchema.entities) {
                const typeResults = await provider.search(typeName, query, options);
                results.push(...typeResults);
            }
            return results;
        },
        async count(type, where) {
            const provider = await resolveProvider();
            const results = await provider.list(type, { where });
            return results.length;
        },
        async forEach(options, callback) {
            const provider = await resolveProvider();
            const results = await provider.list(options.type, { where: options.where });
            const concurrency = options.concurrency ?? 1;
            if (concurrency === 1) {
                for (const entity of results) {
                    await callback(entity);
                }
            }
            else {
                // Process in batches with concurrency
                const { Semaphore } = await import('./memory-provider.js');
                const semaphore = new Semaphore(concurrency);
                await semaphore.map(results, callback);
            }
        },
        async set(type, id, data) {
            const provider = await resolveProvider();
            const existing = await provider.get(type, id);
            if (existing) {
                // Replace entirely (not merge)
                return provider.update(type, id, data);
            }
            return provider.create(type, id, data);
        },
        async generate(options) {
            // Placeholder - actual AI generation would be implemented here
            // For now, just create with provided data
            const provider = await resolveProvider();
            if (options.mode === 'background') {
                // Return action ID for tracking
                const { createMemoryProvider } = await import('./memory-provider.js');
                const memProvider = provider;
                if ('createAction' in memProvider) {
                    return memProvider.createAction({
                        type: 'generate',
                        data: options,
                        total: options.count ?? 1,
                    });
                }
            }
            // Sync mode - create single entity
            return provider.create(options.type, undefined, options.data ?? {});
        },
        ask: createNLQueryFn(parsedSchema),
        ...entityOperations,
    };
    // Create Events API
    const events = {
        on(pattern, handler) {
            // Get provider and delegate - need async resolution
            let unsubscribe = () => { };
            resolveProvider().then((provider) => {
                if ('on' in provider) {
                    unsubscribe = provider.on(pattern, handler);
                }
            });
            return () => unsubscribe();
        },
        async emit(optionsOrType, data) {
            const provider = await resolveProvider();
            if ('emit' in provider) {
                return provider.emit(optionsOrType, data);
            }
            // Return minimal event if provider doesn't support emit
            const now = new Date();
            if (typeof optionsOrType === 'string') {
                return {
                    id: crypto.randomUUID(),
                    actor: 'system',
                    event: optionsOrType,
                    objectData: data,
                    timestamp: now,
                };
            }
            return {
                id: crypto.randomUUID(),
                actor: optionsOrType.actor,
                actorData: optionsOrType.actorData,
                event: optionsOrType.event,
                object: optionsOrType.object,
                objectData: optionsOrType.objectData,
                result: optionsOrType.result,
                resultData: optionsOrType.resultData,
                meta: optionsOrType.meta,
                timestamp: now,
            };
        },
        async list(options) {
            const provider = await resolveProvider();
            if ('listEvents' in provider) {
                return provider.listEvents(options);
            }
            return [];
        },
        async replay(options) {
            const provider = await resolveProvider();
            if ('replayEvents' in provider) {
                await provider.replayEvents(options);
            }
        },
    };
    // Create Actions API (extends actionsAPI with list, retry, cancel)
    const actions = {
        ...actionsAPI,
        async list(options) {
            const provider = await resolveProvider();
            if ('listActions' in provider) {
                return provider.listActions(options);
            }
            return [];
        },
        async retry(id) {
            const provider = await resolveProvider();
            if ('retryAction' in provider) {
                return provider.retryAction(id);
            }
            throw new Error('Provider does not support actions');
        },
        async cancel(id) {
            const provider = await resolveProvider();
            if ('cancelAction' in provider) {
                await provider.cancelAction(id);
            }
        },
        conjugate,
    };
    // Create Artifacts API
    const artifacts = {
        async get(url, type) {
            const provider = await resolveProvider();
            if ('getArtifact' in provider) {
                return provider.getArtifact(url, type);
            }
            return null;
        },
        async set(url, type, data) {
            const provider = await resolveProvider();
            if ('setArtifact' in provider) {
                await provider.setArtifact(url, type, data);
            }
        },
        async delete(url, type) {
            const provider = await resolveProvider();
            if ('deleteArtifact' in provider) {
                await provider.deleteArtifact(url, type);
            }
        },
        async list(url) {
            const provider = await resolveProvider();
            if ('listArtifacts' in provider) {
                return provider.listArtifacts(url);
            }
            return [];
        },
    };
    // Create Nouns API
    const nouns = {
        async get(name) {
            return nounDefinitions.get(name) ?? null;
        },
        async list() {
            return Array.from(nounDefinitions.values());
        },
        async define(noun) {
            nounDefinitions.set(noun.singular, noun);
        },
    };
    // Create Verbs API
    const verbs = {
        get(action) {
            return verbDefinitions.get(action) ?? null;
        },
        list() {
            return Array.from(verbDefinitions.values());
        },
        define(verb) {
            verbDefinitions.set(verb.action, verb);
        },
        conjugate,
    };
    // Return combined object that supports both direct usage and destructuring
    // db.User.create() works, db.events.on() works
    // const { db, events } = DB(...) also works
    return Object.assign(db, {
        db, // self-reference for destructuring
        events,
        actions,
        artifacts,
        nouns,
        verbs,
    });
}
/**
 * Parse a URL into type and id
 */
function parseUrl(url) {
    // Handle full URLs
    if (url.includes('://')) {
        const parsed = new URL(url);
        const parts = parsed.pathname.split('/').filter(Boolean);
        return {
            type: parts[0] || '',
            id: parts.slice(1).join('/'),
        };
    }
    // Handle type/id format
    if (url.includes('/')) {
        const parts = url.split('/');
        return {
            type: parts[0],
            id: parts.slice(1).join('/'),
        };
    }
    // Just id
    return { type: '', id: url };
}
/**
 * Create operations for a single entity type
 */
function createEntityOperations(typeName, entity, schema) {
    return {
        async get(id) {
            const provider = await resolveProvider();
            const result = await provider.get(typeName, id);
            if (!result)
                return null;
            return hydrateEntity(result, entity, schema);
        },
        async list(options) {
            const provider = await resolveProvider();
            const results = await provider.list(typeName, options);
            return Promise.all(results.map((r) => hydrateEntity(r, entity, schema)));
        },
        async find(where) {
            const provider = await resolveProvider();
            const results = await provider.list(typeName, {
                where: where,
            });
            return Promise.all(results.map((r) => hydrateEntity(r, entity, schema)));
        },
        async search(query, options) {
            const provider = await resolveProvider();
            const results = await provider.search(typeName, query, options);
            return Promise.all(results.map((r) => hydrateEntity(r, entity, schema)));
        },
        async create(idOrData, maybeData) {
            const provider = await resolveProvider();
            const id = typeof idOrData === 'string' ? idOrData : undefined;
            const data = typeof idOrData === 'string'
                ? maybeData
                : idOrData;
            const result = await provider.create(typeName, id, data);
            return hydrateEntity(result, entity, schema);
        },
        async update(id, data) {
            const provider = await resolveProvider();
            const result = await provider.update(typeName, id, data);
            return hydrateEntity(result, entity, schema);
        },
        async upsert(id, data) {
            const provider = await resolveProvider();
            const existing = await provider.get(typeName, id);
            if (existing) {
                const result = await provider.update(typeName, id, data);
                return hydrateEntity(result, entity, schema);
            }
            const result = await provider.create(typeName, id, data);
            return hydrateEntity(result, entity, schema);
        },
        async delete(id) {
            const provider = await resolveProvider();
            return provider.delete(typeName, id);
        },
        async forEach(optionsOrCallback, maybeCallback) {
            const options = typeof optionsOrCallback === 'function' ? undefined : optionsOrCallback;
            const callback = typeof optionsOrCallback === 'function'
                ? optionsOrCallback
                : maybeCallback;
            const items = await this.list(options);
            for (const item of items) {
                await callback(item);
            }
        },
    };
}
/**
 * Hydrate an entity with lazy-loaded relations
 */
function hydrateEntity(data, entity, schema) {
    const hydrated = { ...data };
    const id = (data.$id || data.id);
    // Add lazy getters for relations
    for (const [fieldName, field] of entity.fields) {
        if (field.isRelation && field.relatedType) {
            const relatedEntity = schema.entities.get(field.relatedType);
            if (!relatedEntity)
                continue;
            // Define lazy getter
            Object.defineProperty(hydrated, fieldName, {
                get: async () => {
                    const provider = await resolveProvider();
                    if (field.isArray) {
                        // Array relation - get related entities
                        const results = await provider.related(entity.name, id, fieldName);
                        return Promise.all(results.map((r) => hydrateEntity(r, relatedEntity, schema)));
                    }
                    else {
                        // Single relation - get the stored ID and fetch
                        const relatedId = data[fieldName];
                        if (!relatedId)
                            return null;
                        const result = await provider.get(field.relatedType, relatedId);
                        return result
                            ? hydrateEntity(result, relatedEntity, schema)
                            : null;
                    }
                },
                enumerable: true,
                configurable: true,
            });
        }
    }
    return hydrated;
}
// =============================================================================
// Re-export for convenience
// =============================================================================
export { parseSchema as parse };
