/**
 * Provider Registry Implementation
 *
 * Central registry for discovering and instantiating providers.
 *
 * @packageDocumentation
 */
/**
 * Create a new provider registry
 */
export function createProviderRegistry() {
    const providers = new Map();
    return {
        register(info, factory) {
            if (providers.has(info.id)) {
                throw new Error(`Provider '${info.id}' is already registered`);
            }
            providers.set(info.id, { info, factory });
        },
        get(providerId) {
            return providers.get(providerId);
        },
        list(category) {
            const all = Array.from(providers.values());
            if (category) {
                return all.filter((p) => p.info.category === category);
            }
            return all;
        },
        async create(providerId, config) {
            const registered = providers.get(providerId);
            if (!registered) {
                throw new Error(`Provider '${providerId}' not found. Available: ${Array.from(providers.keys()).join(', ')}`);
            }
            // Validate required config
            const missing = registered.info.requiredConfig.filter((key) => !(key in config));
            if (missing.length > 0) {
                throw new Error(`Provider '${providerId}' missing required config: ${missing.join(', ')}`);
            }
            const provider = await registered.factory(config);
            await provider.initialize(config);
            return provider;
        },
        has(providerId) {
            return providers.has(providerId);
        },
    };
}
/**
 * Global provider registry instance
 */
export const providerRegistry = createProviderRegistry();
/**
 * Register a provider in the global registry
 */
export function registerProvider(info, factory) {
    providerRegistry.register(info, factory);
}
/**
 * Get a provider from the global registry
 */
export function getProvider(providerId) {
    return providerRegistry.get(providerId);
}
/**
 * Create a provider instance from the global registry
 */
export async function createProvider(providerId, config) {
    return providerRegistry.create(providerId, config);
}
/**
 * List providers by category
 */
export function listProviders(category) {
    return providerRegistry.list(category);
}
/**
 * Helper to define a provider with type safety
 */
export function defineProvider(info, factory) {
    return {
        info,
        factory,
        register: () => registerProvider(info, factory),
    };
}
