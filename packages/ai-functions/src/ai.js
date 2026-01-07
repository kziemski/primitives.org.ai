/**
 * AI() and ai() - Core AI function constructors
 *
 * These provide the main entry points for AI-powered functions,
 * with full RPC promise pipelining support via rpc.do.
 */
import { RPC, http, ws } from 'rpc.do';
/**
 * Base class for RPC service targets
 * This is a placeholder for services that want to expose methods over RPC
 */
export class RpcTarget {
}
import { generateObject } from './generate.js';
export function AI(schemasOrOptions, defaultOptions) {
    // Check if this is RPC client mode
    if (isAIClientOptions(schemasOrOptions)) {
        const { model, temperature, maxTokens, functions, wsUrl, httpUrl, token } = schemasOrOptions;
        // Create transport based on provided URLs
        let transport;
        if (wsUrl) {
            transport = ws(wsUrl, token ? () => token : undefined);
        }
        else if (httpUrl) {
            transport = http(httpUrl, token ? () => token : undefined);
        }
        else {
            throw new Error('AI client requires either wsUrl or httpUrl');
        }
        // Create RPC client
        const rpcClient = RPC(transport);
        // Create a proxy that handles both defined methods and dynamic function calls
        return new Proxy(rpcClient, {
            get(target, prop) {
                // Return existing methods
                if (prop in target) {
                    return target[prop];
                }
                // Handle dynamic function calls (ai.functionName())
                return (...args) => {
                    const client = target;
                    return client.do(prop, args.length === 1 ? args[0] : args);
                };
            }
        });
    }
    // Schema functions mode - create a function for each schema
    return createSchemaFunctions(schemasOrOptions, defaultOptions);
}
/**
 * Check if options are AI client options vs schemas
 */
function isAIClientOptions(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const obj = value;
    return 'wsUrl' in obj || 'httpUrl' in obj || 'functions' in obj;
}
/**
 * Create schema-based functions from a map of schemas
 */
function createSchemaFunctions(schemas, defaultOptions = {}) {
    const functions = {};
    for (const [name, schema] of Object.entries(schemas)) {
        functions[name] = async (prompt, options) => {
            const mergedOptions = { ...defaultOptions, ...options };
            const { model = 'sonnet', system, ...rest } = mergedOptions;
            // Build prompt from schema descriptions if none provided
            const schemaPrompt = prompt || buildPromptFromSchema(schema);
            const result = await generateObject({
                model,
                schema,
                prompt: schemaPrompt,
                system,
                ...rest,
            });
            return result.object;
        };
    }
    return functions;
}
/**
 * Build a prompt by extracting descriptions from the schema
 */
function buildPromptFromSchema(schema, path = '') {
    if (typeof schema === 'string') {
        return schema;
    }
    if (Array.isArray(schema)) {
        return schema[0] || 'Generate items';
    }
    if (typeof schema === 'object' && schema !== null) {
        const descriptions = [];
        for (const [key, value] of Object.entries(schema)) {
            const subPrompt = buildPromptFromSchema(value, path ? `${path}.${key}` : key);
            if (subPrompt) {
                descriptions.push(`${key}: ${subPrompt}`);
            }
        }
        return descriptions.length > 0 ? `Generate the following:\n${descriptions.join('\n')}` : '';
    }
    return '';
}
/**
 * Create a defined function from a function definition
 */
function createDefinedFunction(definition) {
    const call = async (args) => {
        switch (definition.type) {
            case 'code':
                return executeCodeFunction(definition, args);
            case 'generative':
                return executeGenerativeFunction(definition, args);
            case 'agentic':
                return executeAgenticFunction(definition, args);
            case 'human':
                return executeHumanFunction(definition, args);
            default:
                throw new Error(`Unknown function type: ${definition.type}`);
        }
    };
    const asTool = () => {
        return {
            name: definition.name,
            description: definition.description || `Execute ${definition.name}`,
            parameters: convertArgsToJSONSchema(definition.args),
            handler: call,
        };
    };
    return { definition, call, asTool };
}
/**
 * Convert args schema to JSON Schema
 */
function convertArgsToJSONSchema(args) {
    // If it's already a JSON schema-like object
    if (typeof args === 'object' && args !== null && 'type' in args) {
        return args;
    }
    // Convert SimpleSchema to JSON Schema
    const properties = {};
    const required = [];
    if (typeof args === 'object' && args !== null) {
        for (const [key, value] of Object.entries(args)) {
            required.push(key); // All properties required for cross-provider compatibility
            properties[key] = convertValueToJSONSchema(value);
        }
    }
    return {
        type: 'object',
        properties,
        required,
        additionalProperties: false, // Required for OpenAI compatibility
    };
}
/**
 * Convert a single value to JSON Schema
 */
function convertValueToJSONSchema(value) {
    if (typeof value === 'string') {
        // Check for type hints: 'description (number)', 'description (boolean)', etc.
        const typeMatch = value.match(/^(.+?)\s*\((number|boolean|integer|date)\)$/i);
        if (typeMatch) {
            const description = typeMatch[1];
            const type = typeMatch[2];
            switch (type.toLowerCase()) {
                case 'number':
                    return { type: 'number', description: description.trim() };
                case 'integer':
                    return { type: 'integer', description: description.trim() };
                case 'boolean':
                    return { type: 'boolean', description: description.trim() };
                case 'date':
                    return { type: 'string', format: 'date-time', description: description.trim() };
            }
        }
        // Check for enum: 'option1 | option2 | option3'
        if (value.includes(' | ')) {
            const options = value.split(' | ').map(s => s.trim());
            return { type: 'string', enum: options };
        }
        return { type: 'string', description: value };
    }
    if (Array.isArray(value) && value.length === 1) {
        const [desc] = value;
        if (typeof desc === 'string') {
            return { type: 'array', items: { type: 'string' }, description: desc };
        }
        if (typeof desc === 'number') {
            return { type: 'array', items: { type: 'number' } };
        }
        return { type: 'array', items: convertValueToJSONSchema(desc) };
    }
    if (typeof value === 'object' && value !== null) {
        return convertArgsToJSONSchema(value);
    }
    return { type: 'string' };
}
/**
 * Fill template with values
 */
function fillTemplate(template, args) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(args[key] ?? ''));
}
/**
 * Execute a code function - generates code with tests and examples
 */
async function executeCodeFunction(definition, args) {
    const { name, description, language = 'typescript', instructions, includeTests = true, includeExamples = true } = definition;
    const argsDescription = JSON.stringify(args, null, 2);
    const result = await generateObject({
        model: 'sonnet',
        schema: {
            code: 'The complete implementation code with JSDoc comments',
            tests: includeTests ? 'Vitest test code for the implementation' : undefined,
            examples: includeExamples ? 'Example usage code' : undefined,
            documentation: 'JSDoc or equivalent documentation string',
        },
        system: `You are an expert ${language} developer. Generate clean, well-documented, production-ready code.`,
        prompt: `Generate a ${language} function with the following specification:

Name: ${name}
Description: ${description || 'No description provided'}
Arguments: ${argsDescription}
Return Type: ${JSON.stringify(definition.returnType)}

${instructions ? `Additional Instructions: ${instructions}` : ''}

Requirements:
- Include comprehensive JSDoc comments
- Follow best practices for ${language}
- Handle edge cases appropriately
${includeTests ? '- Include vitest tests that cover main functionality and edge cases' : ''}
${includeExamples ? '- Include example usage showing how to call the function' : ''}`,
    });
    const obj = result.object;
    return {
        code: obj.code,
        tests: obj.tests,
        examples: obj.examples,
        language,
        documentation: obj.documentation,
    };
}
/**
 * Execute a generative function - uses AI to generate content
 */
async function executeGenerativeFunction(definition, args) {
    const { output, system, promptTemplate, model = 'sonnet', temperature, returnType } = definition;
    const prompt = promptTemplate
        ? fillTemplate(promptTemplate, args)
        : JSON.stringify(args);
    switch (output) {
        case 'string': {
            const result = await generateObject({
                model,
                schema: { text: 'The generated text response' },
                system,
                prompt,
                temperature,
            });
            return result.object.text;
        }
        case 'object': {
            const objectSchema = returnType || { result: 'The generated result' };
            const result = await generateObject({
                model,
                schema: objectSchema,
                system,
                prompt,
                temperature,
            });
            return result.object;
        }
        case 'image': {
            const client = getDefaultAIClient();
            return client.image(prompt);
        }
        case 'video': {
            const client = getDefaultAIClient();
            return client.video(prompt);
        }
        case 'audio': {
            // Audio generation would need a specific implementation
            throw new Error('Audio generation not yet implemented');
        }
        default:
            throw new Error(`Unknown output type: ${output}`);
    }
}
/**
 * Execute an agentic function - runs in a loop with tools
 */
async function executeAgenticFunction(definition, args) {
    const { instructions, promptTemplate, tools = [], maxIterations = 10, model = 'sonnet', returnType } = definition;
    const prompt = promptTemplate
        ? fillTemplate(promptTemplate, args)
        : JSON.stringify(args);
    // Build system prompt with tool descriptions
    const toolDescriptions = tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
    const systemPrompt = `${instructions}

Available tools:
${toolDescriptions || 'No tools available'}

Work step by step to accomplish the task. When you have completed the task, provide your final result.`;
    let iteration = 0;
    const toolResults = [];
    // Simple agent loop
    while (iteration < maxIterations) {
        iteration++;
        const result = await generateObject({
            model,
            schema: {
                thinking: 'Your step-by-step reasoning',
                toolCall: {
                    name: 'Tool to call (or "done" if finished)',
                    arguments: 'Arguments for the tool as JSON string',
                },
                finalResult: returnType || 'The final result if done',
            },
            system: systemPrompt,
            prompt: `Task: ${prompt}

Previous tool results:
${toolResults.map((r, i) => `Step ${i + 1}: ${JSON.stringify(r)}`).join('\n') || 'None yet'}

What is your next step?`,
        });
        const response = result.object;
        if (response.toolCall.name === 'done' || response.finalResult) {
            return response.finalResult;
        }
        // Execute tool call
        const tool = tools.find(t => t.name === response.toolCall.name);
        if (tool) {
            const toolArgs = JSON.parse(response.toolCall.arguments || '{}');
            const toolResult = await tool.handler(toolArgs);
            toolResults.push({ tool: response.toolCall.name, result: toolResult });
        }
        else {
            toolResults.push({ error: `Tool not found: ${response.toolCall.name}` });
        }
    }
    throw new Error(`Agent exceeded maximum iterations (${maxIterations})`);
}
/**
 * Execute a human function - generates UI and waits for human input
 */
async function executeHumanFunction(definition, args) {
    const { channel, instructions, promptTemplate, returnType } = definition;
    const prompt = promptTemplate
        ? fillTemplate(promptTemplate, args)
        : JSON.stringify(args);
    // Generate channel-specific UI
    const uiSchema = {
        // New HumanChannel types
        chat: {
            message: 'Chat message to send',
            options: ['Response options if applicable'],
        },
        email: {
            subject: 'Email subject',
            html: 'Email HTML body',
            text: 'Plain text fallback',
        },
        phone: {
            script: 'Phone call script',
            keyPoints: ['Key points to cover'],
        },
        sms: {
            text: 'SMS message text (max 160 chars)',
        },
        workspace: {
            blocks: ['Workspace/Slack BlockKit blocks as JSON array'],
            text: 'Plain text fallback',
        },
        web: {
            component: 'React component code for the form',
            schema: 'JSON schema for the form fields',
        },
        // Legacy fallback
        custom: {
            data: 'Structured data for custom implementation',
            instructions: 'Instructions for the human',
        },
    };
    const result = await generateObject({
        model: 'sonnet',
        schema: uiSchema[channel] ?? uiSchema.custom,
        system: `Generate ${channel} UI/content for a human-in-the-loop task.`,
        prompt: `Task: ${instructions}

Input data:
${prompt}

Expected response format:
${JSON.stringify(returnType)}

Generate the appropriate ${channel} UI/content to collect this response from a human.`,
    });
    // In a real implementation, this would:
    // 1. Send the generated UI to the appropriate channel
    // 2. Wait for human response
    // 3. Return the validated response
    // For now, return the generated artifacts as a placeholder
    return {
        _pending: true,
        channel,
        artifacts: result.object,
        expectedResponseType: returnType,
    };
}
/**
 * Helper to create a function that supports both regular calls and tagged template literals
 * @example
 * const fn = withTemplate((prompt) => doSomething(prompt))
 * fn('hello')      // regular call
 * fn`hello ${name}` // tagged template literal
 */
export function withTemplate(fn) {
    return function (promptOrStrings, ...args) {
        if (Array.isArray(promptOrStrings) && 'raw' in promptOrStrings) {
            // Tagged template literal call - pass empty args for optional params
            const strings = promptOrStrings;
            const values = args;
            const prompt = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
            return fn(prompt, ...[]);
        }
        // Regular function call
        return fn(promptOrStrings, ...args);
    };
}
// Default client management
let defaultClient = null;
/**
 * Configure the default AI client
 */
export function configureAI(options) {
    defaultClient = AI(options);
}
/**
 * Get the default AI client, throwing if not configured
 */
function getDefaultAIClient() {
    if (!defaultClient) {
        // Try to auto-configure from environment
        const wsUrl = typeof process !== 'undefined' ? process.env?.AI_WS_URL : undefined;
        const httpUrl = typeof process !== 'undefined' ? process.env?.AI_HTTP_URL : undefined;
        if (wsUrl) {
            defaultClient = AI({ wsUrl });
        }
        else if (httpUrl) {
            defaultClient = AI({ httpUrl });
        }
        else {
            throw new Error('AI client not configured. Call configureAI() first or set AI_WS_URL/AI_HTTP_URL environment variables.');
        }
    }
    return defaultClient;
}
/**
 * Base class for implementing AI services
 *
 * Extend this class to create your own AI service implementation.
 *
 * @example
 * ```ts
 * class MyAIService extends AIServiceTarget {
 *   async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
 *     // Your implementation
 *   }
 * }
 * ```
 */
export class AIServiceTarget extends RpcTarget {
}
/**
 * Standalone function for defining AI functions
 *
 * @example
 * ```ts
 * import { defineFunction } from 'ai-functions'
 *
 * const summarize = defineFunction({
 *   type: 'generative',
 *   name: 'summarize',
 *   args: { text: 'Text to summarize' },
 *   output: 'string',
 *   promptTemplate: 'Summarize: {{text}}',
 * })
 *
 * const result = await summarize.call({ text: 'Long article...' })
 * ```
 */
export function defineFunction(definition) {
    return createDefinedFunction(definition);
}
// ============================================================================
// Function Registry
// ============================================================================
/**
 * In-memory function registry
 */
class InMemoryFunctionRegistry {
    functions = new Map();
    get(name) {
        return this.functions.get(name);
    }
    set(name, fn) {
        this.functions.set(name, fn);
    }
    has(name) {
        return this.functions.has(name);
    }
    list() {
        return Array.from(this.functions.keys());
    }
    delete(name) {
        return this.functions.delete(name);
    }
    clear() {
        this.functions.clear();
    }
}
/**
 * Global function registry
 *
 * Note: This is in-memory only. For persistence, use mdxai or mdxdb packages.
 */
export const functions = new InMemoryFunctionRegistry();
// ============================================================================
// Auto-Define Functions
// ============================================================================
/**
 * Analyze a function call and determine what type of function it should be
 */
async function analyzeFunction(name, args) {
    // Convert camelCase/snake_case to readable name
    const readableName = name
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .toLowerCase()
        .trim();
    const argDescriptions = Object.entries(args)
        .map(([key, value]) => {
        const type = Array.isArray(value) ? 'array' : typeof value;
        return `  - ${key}: ${type} (example: ${JSON.stringify(value).slice(0, 50)})`;
    })
        .join('\n');
    const result = await generateObject({
        model: 'sonnet',
        schema: {
            type: 'code | generative | agentic | human',
            reasoning: 'Why this function type is appropriate (1-2 sentences)',
            description: 'What this function does',
            output: 'string | object | image | video | audio',
            returnType: 'Schema for the return type as a SimpleSchema object',
            system: 'System prompt for the AI (if generative/agentic)',
            promptTemplate: 'Prompt template with {{arg}} placeholders',
            instructions: 'Instructions for agentic/human functions',
            needsTools: 'true | false',
            suggestedTools: ['Names of tools that might be needed'],
            channel: 'slack | email | web | sms | custom',
        },
        system: `You are an expert at designing AI functions. Analyze the function name and arguments to determine the best function type.

Function Types:
- "code": For generating executable code (calculations, algorithms, data transformations)
- "generative": For generating content (text, summaries, translations, creative writing, structured data)
- "agentic": For complex tasks requiring multiple steps, research, or tool use (research, planning, multi-step workflows)
- "human": For tasks requiring human judgment, approval, or input (approvals, reviews, decisions)

Guidelines:
- Most functions should be "generative" - they generate content or structured data
- Use "code" only when actual executable code needs to be generated
- Use "agentic" when the task requires research, multiple steps, or external tool use
- Use "human" when human judgment/approval is essential`,
        prompt: `Analyze this function call and determine how to define it:

Function Name: ${name}
Readable Name: ${readableName}
Arguments:
${argDescriptions || '  (no arguments)'}

Determine:
1. What type of function this should be
2. What it should return
3. How it should be implemented`,
    });
    const analysis = result.object;
    // Build the function definition based on the analysis
    let definition;
    const baseDefinition = {
        name,
        description: analysis.description,
        args: inferArgsSchema(args),
        returnType: analysis.returnType,
    };
    switch (analysis.type) {
        case 'code':
            definition = {
                ...baseDefinition,
                type: 'code',
                language: 'typescript',
                instructions: analysis.instructions,
            };
            break;
        case 'agentic':
            definition = {
                ...baseDefinition,
                type: 'agentic',
                instructions: analysis.instructions || `Complete the ${readableName} task`,
                promptTemplate: analysis.promptTemplate,
                tools: [], // Tools would need to be provided separately
                maxIterations: 10,
            };
            break;
        case 'human':
            definition = {
                ...baseDefinition,
                type: 'human',
                channel: (analysis.channel || 'web'),
                instructions: analysis.instructions || `Please review and respond to this ${readableName} request`,
                promptTemplate: analysis.promptTemplate,
            };
            break;
        case 'generative':
        default:
            definition = {
                ...baseDefinition,
                type: 'generative',
                output: (analysis.output || 'object'),
                system: analysis.system,
                promptTemplate: analysis.promptTemplate || `{{${Object.keys(args)[0] || 'input'}}}`,
            };
            break;
    }
    return {
        type: analysis.type,
        reasoning: analysis.reasoning,
        definition,
    };
}
/**
 * Infer a schema from example arguments
 */
function inferArgsSchema(args) {
    const schema = {};
    for (const [key, value] of Object.entries(args)) {
        if (typeof value === 'string') {
            schema[key] = `The ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
        }
        else if (typeof value === 'number') {
            schema[key] = `The ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} (number)`;
        }
        else if (typeof value === 'boolean') {
            schema[key] = `Whether ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} (boolean)`;
        }
        else if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'string') {
                schema[key] = [`List of ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`];
            }
            else {
                schema[key] = [`Items for ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`];
            }
        }
        else if (typeof value === 'object' && value !== null) {
            schema[key] = inferArgsSchema(value);
        }
        else {
            schema[key] = `The ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
        }
    }
    return schema;
}
/**
 * Auto-define a function based on its name and arguments, or define with explicit definition
 *
 * When called with (name, args), uses AI to analyze and determine:
 * - What type of function it should be (code, generative, agentic, human)
 * - What it should return
 * - How it should be implemented
 *
 * When called with a FunctionDefinition, creates the function directly.
 *
 * @example
 * ```ts
 * // Auto-define from name and example args
 * const planTrip = await define('planTrip', { destination: 'Tokyo', travelers: 2 })
 *
 * // Or define explicitly
 * const summarize = define.generative({
 *   name: 'summarize',
 *   args: { text: 'Text to summarize' },
 *   output: 'string',
 * })
 *
 * // Or with full definition
 * const fn = defineFunction({
 *   type: 'generative',
 *   name: 'translate',
 *   args: { text: 'Text', lang: 'Target language' },
 *   output: 'string',
 * })
 * ```
 */
async function autoDefineImpl(name, args) {
    // Check if already defined
    const existing = functions.get(name);
    if (existing) {
        return existing;
    }
    // Analyze and define the function
    const { definition } = await analyzeFunction(name, args);
    // Create the defined function
    const definedFn = createDefinedFunction(definition);
    // Store in registry
    functions.set(name, definedFn);
    return definedFn;
}
/**
 * Define functions - auto-define or use typed helpers
 */
export const define = Object.assign(autoDefineImpl, {
    /**
     * Define a code generation function
     */
    code: (definition) => {
        const fn = defineFunction({ type: 'code', ...definition });
        functions.set(definition.name, fn);
        return fn;
    },
    /**
     * Define a generative function
     */
    generative: (definition) => {
        const fn = defineFunction({ type: 'generative', ...definition });
        functions.set(definition.name, fn);
        return fn;
    },
    /**
     * Define an agentic function
     */
    agentic: (definition) => {
        const fn = defineFunction({ type: 'agentic', ...definition });
        functions.set(definition.name, fn);
        return fn;
    },
    /**
     * Define a human-in-the-loop function
     */
    human: (definition) => {
        const fn = defineFunction({ type: 'human', ...definition });
        functions.set(definition.name, fn);
        return fn;
    },
});
// ============================================================================
// AI() - Smart AI Client with Auto-Definition
// ============================================================================
/** Known built-in method names that should not be auto-defined */
const BUILTIN_METHODS = new Set([
    'do', 'is', 'code', 'decide', 'diagram', 'generate', 'image', 'video', 'write', 'list', 'lists',
    'functions', 'define', 'defineFunction', 'then', 'catch', 'finally',
]);
/**
 * Create a smart AI client that auto-defines functions on first call
 *
 * @example
 * ```ts
 * const ai = AI()
 *
 * // First call - auto-defines the function
 * const trip = await ai.planTrip({
 *   destination: 'Tokyo',
 *   dates: { start: '2024-03-01', end: '2024-03-10' },
 *   travelers: 2,
 * })
 *
 * // Second call - uses cached definition (in-memory)
 * const trip2 = await ai.planTrip({
 *   destination: 'Paris',
 *   dates: { start: '2024-06-01', end: '2024-06-07' },
 *   travelers: 4,
 * })
 *
 * // Access registry and define
 * console.log(ai.functions.list()) // ['planTrip']
 * ai.define.generative({ name: 'summarize', ... })
 * ```
 */
function createSmartAI() {
    const base = {
        functions,
        define,
        defineFunction,
    };
    return new Proxy(base, {
        get(target, prop) {
            // Return built-in properties
            if (prop in target) {
                return target[prop];
            }
            // Skip internal properties
            if (typeof prop === 'symbol' || prop.startsWith('_') || BUILTIN_METHODS.has(prop)) {
                return undefined;
            }
            // Return a function that auto-defines and calls
            return async (args = {}) => {
                // Check if function is already defined
                let fn = functions.get(prop);
                if (!fn) {
                    // Auto-define the function
                    fn = await define(prop, args);
                }
                // Call the function
                return fn.call(args);
            };
        },
    });
}
/**
 * Default AI instance with auto-define capability
 *
 * @example
 * ```ts
 * import { ai } from 'ai-functions'
 *
 * // Auto-define and call
 * const result = await ai.summarize({ text: 'Long article...' })
 *
 * // Access functions registry
 * ai.functions.list()
 *
 * // Define explicitly
 * ai.define.generative({ name: 'translate', ... })
 * ```
 */
export const ai = createSmartAI();
