/**
 * AI Function Primitives with Promise Pipelining
 *
 * All functions return AIPromise for:
 * - Dynamic schema inference from destructuring
 * - Promise pipelining without await
 * - Magical .map() for batch processing
 * - Dependency graph resolution
 *
 * @example
 * ```ts
 * // No await needed until the end!
 * const { summary, keyPoints, conclusion } = ai`write about ${topic}`
 * const isValid = is`${conclusion} is solid given ${keyPoints}`
 * const improved = ai`improve ${conclusion} using ${keyPoints}`
 *
 * // Batch processing with map
 * const ideas = list`startup ideas`
 * const evaluated = await ideas.map(idea => ({
 *   idea,
 *   viable: is`${idea} is viable`,
 *   market: ai`market size for ${idea}`,
 * }))
 *
 * // Only await at the end
 * if (await isValid) {
 *   console.log(await improved)
 * }
 * ```
 *
 * @packageDocumentation
 */
import { AIPromise, createAITemplateFunction, parseTemplateWithDependencies, } from './ai-promise.js';
import { generateObject, generateText } from './generate.js';
// ============================================================================
// Core generate() primitive
// ============================================================================
/**
 * Core generate primitive - all other functions use this under the hood
 */
export async function generate(type, prompt, options) {
    const { model = 'sonnet', schema, language, format, slides: slideCount, ...rest } = options || {};
    switch (type) {
        case 'text':
        case 'markdown':
            return generateTextContent(prompt, model, rest);
        case 'json':
            return generateJsonContent(prompt, model, schema, rest);
        case 'code':
            return generateCodeContent(prompt, model, language || 'typescript', rest);
        case 'list':
            return generateListContent(prompt, model, rest);
        case 'lists':
            return generateListsContent(prompt, model, rest);
        case 'boolean':
            return generateBooleanContent(prompt, model, rest);
        case 'summary':
            return generateSummaryContent(prompt, model, rest);
        case 'extract':
            return generateExtractContent(prompt, model, schema, rest);
        case 'yaml':
            return generateYamlContent(prompt, model, rest);
        case 'diagram':
            return generateDiagramContent(prompt, model, format || 'mermaid', rest);
        case 'slides':
            return generateSlidesContent(prompt, model, slideCount || 10, rest);
        default:
            throw new Error(`Unknown generate type: ${type}`);
    }
}
// Helper functions
async function generateTextContent(prompt, model, options) {
    const result = await generateText({ model, prompt, system: options.system, temperature: options.temperature, maxTokens: options.maxTokens });
    return result.text;
}
async function generateJsonContent(prompt, model, schema, options) {
    const effectiveSchema = schema || { result: 'The generated result' };
    const result = await generateObject({ model, schema: effectiveSchema, prompt, system: options.system, temperature: options.temperature, maxTokens: options.maxTokens });
    return result.object;
}
async function generateCodeContent(prompt, model, language, options) {
    const result = await generateObject({
        model,
        schema: { code: `The ${language} implementation code` },
        prompt: `Generate ${language} code for: ${prompt}`,
        system: `You are an expert ${language} developer. Generate clean, well-documented code.`,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
    });
    return result.object.code;
}
async function generateListContent(prompt, model, options) {
    const result = await generateObject({
        model,
        schema: { items: ['List items'] },
        prompt,
        system: options.system || 'Generate a list of items based on the prompt.',
        temperature: options.temperature,
        maxTokens: options.maxTokens,
    });
    return result.object.items;
}
async function generateListsContent(prompt, model, options) {
    const result = await generateObject({
        model,
        schema: {
            categories: ['Category names as strings'],
            data: 'JSON string containing the categorized lists',
        },
        prompt: `Generate categorized lists for: ${prompt}\n\nFirst identify appropriate category names, then provide the lists as a JSON object.`,
        system: options.system || 'Generate multiple categorized lists. Determine appropriate categories based on the prompt.',
        temperature: options.temperature,
        maxTokens: options.maxTokens,
    });
    const obj = result.object;
    try {
        return JSON.parse(obj.data);
    }
    catch {
        const lists = {};
        for (const cat of obj.categories || []) {
            lists[cat] = [];
        }
        return lists;
    }
}
async function generateBooleanContent(prompt, model, options) {
    const result = await generateObject({
        model,
        schema: { answer: 'true | false' },
        prompt,
        system: options.system || 'Answer the question with true or false.',
        temperature: options.temperature ?? 0,
        maxTokens: options.maxTokens,
    });
    return result.object.answer === 'true';
}
async function generateSummaryContent(prompt, model, options) {
    const result = await generateObject({
        model,
        schema: { summary: 'A concise summary of the content' },
        prompt: `Summarize the following:\n\n${prompt}`,
        system: options.system || 'Create a clear, concise summary.',
        temperature: options.temperature,
        maxTokens: options.maxTokens,
    });
    return result.object.summary;
}
async function generateExtractContent(prompt, model, schema, options) {
    const effectiveSchema = schema || { items: ['Extracted items'] };
    const result = await generateObject({
        model,
        schema: effectiveSchema,
        prompt: `Extract from the following:\n\n${prompt}`,
        system: options.system || 'Extract the requested information.',
        temperature: options.temperature,
        maxTokens: options.maxTokens,
    });
    const obj = result.object;
    if ('items' in obj && Array.isArray(obj.items)) {
        return obj.items;
    }
    return Object.values(obj).flat();
}
async function generateYamlContent(prompt, model, options) {
    const result = await generateObject({
        model,
        schema: { yaml: 'The YAML content' },
        prompt: `Generate YAML for: ${prompt}`,
        system: options.system || 'Generate valid YAML content.',
        temperature: options.temperature,
        maxTokens: options.maxTokens,
    });
    return result.object.yaml;
}
async function generateDiagramContent(prompt, model, format, options) {
    const result = await generateObject({
        model,
        schema: { diagram: `The ${format} diagram code` },
        prompt: `Generate a ${format} diagram for: ${prompt}`,
        system: options.system || `Generate ${format} diagram syntax.`,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
    });
    return result.object.diagram;
}
async function generateSlidesContent(prompt, model, slideCount, options) {
    const result = await generateObject({
        model,
        schema: { slides: `Slidev/Marp markdown with ${slideCount} slides` },
        prompt: `Generate a ${slideCount}-slide presentation about: ${prompt}`,
        system: options.system || 'Generate markdown slides in Slidev/Marp format.',
        temperature: options.temperature,
        maxTokens: options.maxTokens,
    });
    return result.object.slides;
}
// ============================================================================
// AIPromise-based Functions
// ============================================================================
/**
 * General-purpose AI function with dynamic schema inference
 *
 * @example
 * ```ts
 * // Simple text generation
 * const text = await ai`write a poem about ${topic}`
 *
 * // Dynamic schema from destructuring - no await needed!
 * const { summary, keyPoints, conclusion } = ai`write about ${topic}`
 * console.log(await summary)
 *
 * // Chain with other functions
 * const isValid = is`${conclusion} is solid`
 * const improved = ai`improve ${conclusion}`
 * ```
 */
export const ai = createAITemplateFunction('object');
/**
 * Generate text content
 *
 * @example
 * ```ts
 * const post = await write`blog post about ${topic}`
 * ```
 */
export const write = createAITemplateFunction('text');
/**
 * Generate code
 *
 * @example
 * ```ts
 * const code = await code`email validation function`
 * ```
 */
export const code = createAITemplateFunction('text', {
    system: 'You are an expert programmer. Generate clean, well-documented code.',
});
/**
 * Generate a list of items with .map() support
 *
 * @example
 * ```ts
 * // Simple list
 * const ideas = await list`startup ideas`
 *
 * // With map - batch processes in ONE call!
 * const evaluated = await list`startup ideas`.map(idea => ({
 *   idea,
 *   viable: is`${idea} is viable`,
 *   market: ai`market size for ${idea}`,
 * }))
 *
 * // Async iteration
 * for await (const idea of list`startup ideas`) {
 *   console.log(idea)
 * }
 * ```
 */
export const list = createAITemplateFunction('list');
/**
 * Generate multiple named lists with dynamic schema
 *
 * @example
 * ```ts
 * // Destructuring infers the schema!
 * const { pros, cons } = await lists`pros and cons of ${topic}`
 *
 * // No await - pipeline with other functions
 * const { benefits, risks, costs } = lists`analysis of ${project}`
 * const summary = ai`summarize: benefits=${benefits}, risks=${risks}`
 * console.log(await summary)
 * ```
 */
export const lists = createAITemplateFunction('lists');
/**
 * Extract structured data with dynamic schema
 *
 * @example
 * ```ts
 * // Dynamic schema from destructuring
 * const { name, email, phone } = await extract`contact info from ${document}`
 *
 * // As array
 * const emails = await extract`email addresses from ${text}`
 * ```
 */
export const extract = createAITemplateFunction('extract');
/**
 * Summarize text
 *
 * @example
 * ```ts
 * const summary = await summarize`${longArticle}`
 * ```
 */
export const summarize = createAITemplateFunction('text', {
    system: 'Create a clear, concise summary.',
});
/**
 * Check if something is true/false
 *
 * @example
 * ```ts
 * // Simple check
 * const isColor = await is`${topic} a color`
 *
 * // Pipeline - no await needed!
 * const { conclusion } = ai`write about ${topic}`
 * const isValid = is`${conclusion} is well-argued`
 * if (await isValid) { ... }
 * ```
 */
export const is = createAITemplateFunction('boolean');
/**
 * Generate a diagram
 *
 * @example
 * ```ts
 * const diagram = await diagram`user authentication flow`
 * ```
 */
export const diagram = createAITemplateFunction('text', {
    system: 'Generate a Mermaid diagram.',
});
/**
 * Generate presentation slides
 *
 * @example
 * ```ts
 * const slides = await slides`quarterly review`
 * ```
 */
export const slides = createAITemplateFunction('text', {
    system: 'Generate markdown slides in Slidev/Marp format.',
});
/**
 * Generate an image
 */
export const image = createAITemplateFunction('text');
/**
 * Generate a video
 */
export const video = createAITemplateFunction('text');
// ============================================================================
// Agentic Functions
// ============================================================================
/**
 * Execute a task
 *
 * @example
 * ```ts
 * const { summary, actions } = await do`send welcome email to ${user}`
 * ```
 */
function doImpl(promptOrStrings, ...args) {
    let prompt;
    let dependencies = [];
    if (Array.isArray(promptOrStrings) && 'raw' in promptOrStrings) {
        const parsed = parseTemplateWithDependencies(promptOrStrings, ...args);
        prompt = parsed.prompt;
        dependencies = parsed.dependencies;
    }
    else {
        prompt = promptOrStrings;
    }
    const promise = new AIPromise(prompt, {
        type: 'object',
        baseSchema: {
            summary: 'Summary of what was done',
            actions: ['List of actions taken'],
        },
        system: 'You are a task executor. Describe what actions you would take.',
    });
    for (const dep of dependencies) {
        promise.addDependency(dep.promise, dep.path);
    }
    return promise;
}
export { doImpl as do };
/**
 * Conduct research on a topic
 *
 * @example
 * ```ts
 * const { summary, findings, sources } = await research`${competitor} vs our product`
 * ```
 */
export const research = createAITemplateFunction('object', {
    system: 'You are a research analyst. Provide thorough research.',
});
// ============================================================================
// Web Functions
// ============================================================================
/**
 * Read a URL and convert to markdown
 */
export const read = createAITemplateFunction('text');
/**
 * Browse a URL with browser automation
 */
export async function browse(urlOrStrings, ...args) {
    // Placeholder - actual implementation would use Stagehand or Playwright
    return {
        do: async () => { },
        extract: async () => ({}),
        screenshot: async () => Buffer.from('screenshot'),
        close: async () => { },
    };
}
// ============================================================================
// Decision Functions
// ============================================================================
/**
 * LLM as judge - compare options and pick the best
 *
 * @example
 * ```ts
 * const winner = await decide`higher click-through rate`(headlineA, headlineB)
 * ```
 */
export function decide(criteriaOrStrings, ...templateArgs) {
    let criteria;
    if (Array.isArray(criteriaOrStrings) && 'raw' in criteriaOrStrings) {
        criteria = criteriaOrStrings.reduce((acc, str, i) => acc + str + (templateArgs[i] ?? ''), '');
    }
    else {
        criteria = criteriaOrStrings;
    }
    return (...options) => {
        const optionDescriptions = options
            .map((opt, i) => `Option ${i + 1}: ${JSON.stringify(opt)}`)
            .join('\n');
        const promise = new AIPromise(`Given these options:\n${optionDescriptions}\n\nChoose the best option based on: ${criteria}`, {
            type: 'object',
            baseSchema: {
                chosenIndex: 'The index (1-based) of the best option as a number',
                reasoning: 'Brief explanation of why this option is best',
            },
        });
        // Override resolve to return the actual option
        const originalResolve = promise.resolve.bind(promise);
        promise.resolve = async () => {
            const result = await originalResolve();
            const index = typeof result.chosenIndex === 'string'
                ? parseInt(result.chosenIndex, 10)
                : result.chosenIndex;
            return options[index - 1];
        };
        return promise;
    };
}
/**
 * Ask a human for input
 */
export const ask = createAITemplateFunction('object', {
    system: 'Generate content for human interaction.',
});
/**
 * Request human approval
 */
export const approve = createAITemplateFunction('object', {
    system: 'Generate an approval request.',
});
/**
 * Request human review
 */
export const review = createAITemplateFunction('object', {
    system: 'Generate a review request.',
});
