/**
 * AI() wrapper for components with intelligent prop generation
 *
 * The AI() function wraps a component definition and automatically
 * generates missing props using AI when the component is rendered.
 *
 * @packageDocumentation
 */
import { mergeWithGenerated } from './generate.js';
/**
 * Create an AI-powered component wrapper
 *
 * The returned function accepts partial props and generates
 * any missing props using AI based on the schema.
 *
 * @example
 * ```ts
 * const UserCard = AI({
 *   schema: {
 *     name: 'Full name of the user',
 *     bio: 'A short biography',
 *     avatar: 'URL to avatar image',
 *   },
 *   defaults: {
 *     avatar: 'https://example.com/default-avatar.png',
 *   },
 * })
 *
 * // Generate all props
 * const props = await UserCard({})
 *
 * // Generate only missing props
 * const props2 = await UserCard({ name: 'John Doe' })
 * ```
 */
export function AI(options) {
    const { schema, defaults = {}, required = [], exclude = [], config = {} } = options;
    // Build filtered schema (exclude specified props)
    const filteredSchema = filterSchema(schema, exclude);
    /**
     * The AI component function
     */
    const aiComponent = async (partialProps) => {
        // Merge with defaults
        const propsWithDefaults = { ...defaults, ...partialProps };
        // Check if all required props are provided
        const missingRequired = required.filter(key => propsWithDefaults[key] === undefined);
        if (missingRequired.length > 0) {
            throw new Error(`Missing required props: ${missingRequired.join(', ')}`);
        }
        // Generate missing props
        const fullProps = await mergeWithGenerated(filteredSchema, propsWithDefaults, {
            model: config.model,
            system: config.system,
        });
        return fullProps;
    };
    // Attach metadata
    aiComponent.schema = schema;
    aiComponent.config = config;
    // Attach helper method
    aiComponent.generateProps = async (context) => {
        return aiComponent(context || {});
    };
    return aiComponent;
}
/**
 * Filter schema to exclude certain keys
 */
function filterSchema(schema, exclude) {
    if (typeof schema === 'string') {
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
 * Create a typed AI component with inference
 *
 * @example
 * ```ts
 * const ProductCard = createAIComponent<{
 *   title: string
 *   price: number
 *   description: string
 * }>({
 *   schema: {
 *     title: 'Product title',
 *     price: 'Price in USD (number)',
 *     description: 'Product description',
 *   },
 * })
 * ```
 */
export function createAIComponent(options) {
    return AI(options);
}
/**
 * Define props schema with type inference
 *
 * @example
 * ```ts
 * const userSchema = definePropsSchema({
 *   name: 'User name',
 *   email: 'Email address',
 *   age: 'Age (number)',
 * })
 * ```
 */
export function definePropsSchema(schema) {
    return schema;
}
/**
 * Create a component factory for generating multiple instances
 *
 * @example
 * ```ts
 * const factory = createComponentFactory({
 *   schema: { name: 'Product name', price: 'Price (number)' },
 * })
 *
 * const products = await factory.generateMany([
 *   { category: 'electronics' },
 *   { category: 'clothing' },
 *   { category: 'food' },
 * ])
 * ```
 */
export function createComponentFactory(options) {
    const component = AI(options);
    return {
        component,
        schema: options.schema,
        /**
         * Generate a single instance
         */
        generate: (context) => component(context || {}),
        /**
         * Generate multiple instances
         */
        generateMany: async (contexts) => {
            return Promise.all(contexts.map(ctx => component(ctx)));
        },
        /**
         * Generate with specific overrides
         */
        generateWith: async (context, overrides) => {
            const generated = await component(context);
            return { ...generated, ...overrides };
        },
    };
}
/**
 * Compose multiple AI components
 *
 * Creates a component that combines props from multiple schemas.
 *
 * @example
 * ```ts
 * const FullProfile = composeAIComponents({
 *   user: userSchema,
 *   settings: settingsSchema,
 *   preferences: preferencesSchema,
 * })
 *
 * const profile = await FullProfile({
 *   user: { name: 'John' },
 *   settings: {},
 *   preferences: { theme: 'dark' },
 * })
 * ```
 */
export function composeAIComponents(components) {
    const aiComponent = async (partialProps) => {
        const results = {};
        // Generate each component's props
        await Promise.all(Object.entries(components).map(async ([key, options]) => {
            const component = AI(options);
            const partial = partialProps[key] || {};
            results[key] = await component(partial);
        }));
        return results;
    };
    // Compose schemas
    const composedSchema = {};
    for (const [key, options] of Object.entries(components)) {
        composedSchema[key] = options.schema;
    }
    aiComponent.schema = composedSchema;
    aiComponent.config = {};
    aiComponent.generateProps = (context) => aiComponent(context || {});
    return aiComponent;
}
