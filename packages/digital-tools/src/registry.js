/**
 * Tool Registry - Registration and discovery for tools
 *
 * Provides a central registry for tools that can be used by
 * both humans and AI agents.
 *
 * @packageDocumentation
 */
/**
 * In-memory tool registry implementation
 */
class InMemoryToolRegistry {
    tools = new Map();
    register(tool) {
        if (this.tools.has(tool.id)) {
            console.warn(`Tool "${tool.id}" already registered, overwriting`);
        }
        this.tools.set(tool.id, tool);
    }
    unregister(id) {
        return this.tools.delete(id);
    }
    get(id) {
        return this.tools.get(id);
    }
    has(id) {
        return this.tools.has(id);
    }
    list() {
        return Array.from(this.tools.keys());
    }
    query(options) {
        let results = Array.from(this.tools.values());
        // Filter by category
        if (options.category) {
            results = results.filter((t) => t.category === options.category);
        }
        // Filter by subcategory
        if (options.subcategory) {
            results = results.filter((t) => t.subcategory === options.subcategory);
        }
        // Filter by tags
        if (options.tags && options.tags.length > 0) {
            results = results.filter((t) => t.tags && options.tags.some((tag) => t.tags.includes(tag)));
        }
        // Filter by audience
        if (options.audience) {
            results = results.filter((t) => t.audience === options.audience ||
                t.audience === 'both' ||
                !t.audience);
        }
        // Text search
        if (options.search) {
            const search = options.search.toLowerCase();
            results = results.filter((t) => t.name.toLowerCase().includes(search) ||
                t.description.toLowerCase().includes(search) ||
                t.id.toLowerCase().includes(search));
        }
        // Pagination
        const offset = options.offset ?? 0;
        const limit = options.limit ?? results.length;
        results = results.slice(offset, offset + limit);
        return results;
    }
    byCategory(category) {
        return this.query({ category });
    }
    clear() {
        this.tools.clear();
    }
}
/**
 * Global tool registry instance
 */
export const registry = new InMemoryToolRegistry();
/**
 * Create a new registry instance (for isolated testing or namespacing)
 */
export function createRegistry() {
    return new InMemoryToolRegistry();
}
/**
 * Convert a Tool to MCP format
 */
export function toMCP(tool) {
    return {
        name: tool.id,
        description: tool.description,
        inputSchema: {
            type: 'object',
            properties: Object.fromEntries(tool.parameters.map((p) => [
                p.name,
                typeof p.schema === 'object' && 'type' in p.schema
                    ? { ...p.schema, description: p.description }
                    : { description: p.description },
            ])),
            required: tool.parameters.filter((p) => p.required).map((p) => p.name),
        },
    };
}
/**
 * Convert all registered tools to MCP format
 */
export function listMCPTools(reg = registry) {
    return reg.list().map((id) => toMCP(reg.get(id)));
}
/**
 * Register a tool in the global registry
 */
export function registerTool(tool) {
    registry.register(tool);
}
/**
 * Get a tool from the global registry
 */
export function getTool(id) {
    return registry.get(id);
}
/**
 * Execute a tool by ID
 */
export async function executeTool(id, input) {
    const tool = registry.get(id);
    if (!tool) {
        throw new Error(`Tool "${id}" not found`);
    }
    return tool.handler(input);
}
