/**
 * Higher-Order Component (HOC) for React components
 *
 * Provides withAIProps HOC for wrapping React components
 * with AI-powered prop generation.
 *
 * @packageDocumentation
 */
import { generateProps, mergeWithGenerated } from './generate.js';
/**
 * Create props wrapper that can be used with any component system
 *
 * This is framework-agnostic and returns the enhanced props.
 *
 * @example
 * ```ts
 * const enhancer = createPropsEnhancer({
 *   schema: {
 *     title: 'Page title',
 *     description: 'Page description',
 *   },
 *   defaults: {
 *     title: 'Default Title',
 *   },
 * })
 *
 * // Use with any component
 * const props = await enhancer({ description: 'My page' })
 * // { title: 'Default Title', description: 'My page' }
 *
 * const generatedProps = await enhancer({})
 * // { title: 'AI-generated title', description: 'AI-generated description' }
 * ```
 */
export function createPropsEnhancer(options) {
    const { schema, defaults = {}, required = [], exclude = [], config = {}, fallback } = options;
    return async (partialProps) => {
        try {
            // Merge with defaults
            const propsWithDefaults = { ...defaults, ...partialProps };
            // Check required props
            const missingRequired = required.filter(key => propsWithDefaults[key] === undefined);
            if (missingRequired.length > 0) {
                throw new Error(`Missing required props: ${missingRequired.join(', ')}`);
            }
            // Filter out excluded props from schema
            const filteredSchema = filterSchemaKeys(schema, exclude);
            // Generate missing props
            return await mergeWithGenerated(filteredSchema, propsWithDefaults, {
                model: config.model,
                system: config.system,
            });
        }
        catch (error) {
            if (fallback) {
                return { ...defaults, ...fallback, ...partialProps };
            }
            throw error;
        }
    };
}
/**
 * Filter schema to exclude certain keys
 */
function filterSchemaKeys(schema, exclude) {
    if (typeof schema === 'string' || exclude.length === 0) {
        return schema;
    }
    const filtered = {};
    for (const [key, value] of Object.entries(schema)) {
        if (!exclude.includes(key)) {
            filtered[key] = value;
        }
    }
    return filtered;
}
/**
 * Create an async props provider
 *
 * Returns a function that generates props on each call.
 * Useful for SSR and static generation.
 *
 * @example
 * ```ts
 * const getPageProps = createAsyncPropsProvider({
 *   schema: {
 *     title: 'SEO-optimized page title',
 *     meta: { description: 'Meta description' },
 *   },
 * })
 *
 * // In getStaticProps or getServerSideProps
 * export async function getStaticProps() {
 *   const props = await getPageProps({ slug: 'about' })
 *   return { props }
 * }
 * ```
 */
export function createAsyncPropsProvider(options) {
    const enhancer = createPropsEnhancer(options);
    return {
        /**
         * Get props with AI generation
         */
        getProps: enhancer,
        /**
         * Get props for multiple items
         */
        getManyProps: async (contexts) => {
            return Promise.all(contexts.map(enhancer));
        },
        /**
         * Get props with caching hint
         */
        getCachedProps: async (context, revalidate) => {
            const props = await enhancer(context);
            return { props, revalidate };
        },
    };
}
/**
 * Create a props transformer
 *
 * Transforms existing props by filling in missing values.
 *
 * @example
 * ```ts
 * const transformUserProps = createPropsTransformer({
 *   schema: {
 *     displayName: 'Display name for the user',
 *     initials: 'User initials (2 letters)',
 *   },
 * })
 *
 * const user = await transformUserProps({
 *   username: 'johndoe',
 *   email: 'john@example.com',
 * })
 * // { username: 'johndoe', email: '...', displayName: 'John Doe', initials: 'JD' }
 * ```
 */
export function createPropsTransformer(options) {
    const { schema, transform, config = {} } = options;
    return async (input) => {
        const result = await generateProps({
            schema,
            context: input,
            model: config.model,
            system: config.system,
        });
        const generated = result.props;
        if (transform) {
            return { ...input, ...transform(input, generated) };
        }
        return { ...input, ...generated };
    };
}
/**
 * Create a conditional props generator
 *
 * Only generates props when a condition is met.
 *
 * @example
 * ```ts
 * const maybeGenerateProps = createConditionalGenerator({
 *   schema: { summary: 'Article summary' },
 *   condition: (props) => !props.summary && props.content?.length > 100,
 * })
 * ```
 */
export function createConditionalGenerator(options) {
    const { schema, condition, config = {} } = options;
    return async (props) => {
        if (!condition(props)) {
            return props;
        }
        return mergeWithGenerated(schema, props, {
            model: config.model,
            system: config.system,
        });
    };
}
/**
 * Batch props generator for list rendering
 *
 * Efficiently generates props for multiple items.
 *
 * @example
 * ```ts
 * const batchGenerator = createBatchGenerator({
 *   schema: { title: 'Item title', description: 'Item description' },
 * })
 *
 * const items = await batchGenerator.generate([
 *   { id: 1, category: 'tech' },
 *   { id: 2, category: 'science' },
 *   { id: 3, category: 'art' },
 * ])
 * ```
 */
export function createBatchGenerator(options) {
    const { schema, concurrency = 3, config = {} } = options;
    return {
        /**
         * Generate props for multiple items
         */
        generate: async (items) => {
            const results = [];
            // Process in batches based on concurrency
            for (let i = 0; i < items.length; i += concurrency) {
                const batch = items.slice(i, i + concurrency);
                const batchResults = await Promise.all(batch.map(item => mergeWithGenerated(schema, item, {
                    model: config.model,
                    system: config.system,
                })));
                results.push(...batchResults);
            }
            return results;
        },
        /**
         * Generate props one at a time (for rate limiting)
         */
        generateSequential: async (items) => {
            const results = [];
            for (const item of items) {
                const result = await mergeWithGenerated(schema, item, {
                    model: config.model,
                    system: config.system,
                });
                results.push(result);
            }
            return results;
        },
    };
}
