/**
 * MCP() - Define a Model Context Protocol server
 */
import { registerProduct } from './product.js';
/**
 * Create an MCP server definition
 *
 * @example
 * ```ts
 * const mcpServer = MCP({
 *   id: 'my-mcp',
 *   name: 'My MCP Server',
 *   description: 'Custom MCP server for AI tools',
 *   version: '1.0.0',
 *   transport: 'stdio',
 *   tools: [
 *     Tool('searchFiles', 'Search for files in the project', {
 *       query: 'Search query',
 *       path: 'Directory to search in',
 *     }),
 *     Tool('readFile', 'Read file contents', {
 *       path: 'File path to read',
 *     }),
 *   ],
 *   resources: [
 *     Resource('file://', 'Project Files', 'Access to project files'),
 *   ],
 *   prompts: [
 *     Prompt('codeReview', 'Review code for best practices',
 *       'Review the following code:\n\n{{code}}'),
 *   ],
 * })
 * ```
 */
export function MCP(config) {
    const mcp = {
        type: 'mcp',
        id: config.id,
        name: config.name,
        description: config.description,
        version: config.version,
        transport: config.transport,
        tools: config.tools,
        resources: config.resources,
        prompts: config.prompts,
        config: config.config,
        metadata: config.metadata,
        tags: config.tags,
        status: config.status || 'active',
    };
    return registerProduct(mcp);
}
/**
 * Helper to create an MCP tool
 *
 * @example
 * ```ts
 * const tool = Tool(
 *   'searchCode',
 *   'Search code using regex',
 *   {
 *     pattern: 'Regex pattern to search for',
 *     path: 'Directory to search in',
 *   },
 *   async (input) => {
 *     // Tool implementation
 *     return { matches: [] }
 *   }
 * )
 * ```
 */
export function Tool(name, description, inputSchema, handler) {
    return {
        name,
        description,
        inputSchema,
        handler,
    };
}
/**
 * Helper to create an MCP resource
 *
 * @example
 * ```ts
 * const resource = Resource(
 *   'file://project',
 *   'Project Files',
 *   'Access to all project files',
 *   'application/json'
 * )
 * ```
 */
export function Resource(uri, name, description, mimeType) {
    return {
        uri,
        name,
        description,
        mimeType,
    };
}
/**
 * Helper to create an MCP prompt
 *
 * @example
 * ```ts
 * const prompt = Prompt(
 *   'summarize',
 *   'Summarize text',
 *   'Summarize the following:\n\n{{text}}',
 *   { text: 'Text to summarize' }
 * )
 * ```
 */
export function Prompt(name, description, template, args) {
    return {
        name,
        description,
        template,
        arguments: args,
    };
}
/**
 * Helper to configure MCP server
 *
 * @example
 * ```ts
 * const config = MCPConfig({
 *   port: 3000,
 *   host: 'localhost',
 *   auth: {
 *     type: 'bearer',
 *     token: process.env.MCP_TOKEN,
 *   },
 * })
 * ```
 */
export function MCPConfig(config) {
    return config;
}
