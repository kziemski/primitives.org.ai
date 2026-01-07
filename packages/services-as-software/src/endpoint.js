/**
 * Endpoint helper for defining service endpoints
 */
/**
 * Create an endpoint definition
 *
 * @example
 * ```ts
 * const translateEndpoint = Endpoint({
 *   name: 'translate',
 *   description: 'Translate text between languages',
 *   method: 'POST',
 *   path: '/translate',
 *   input: {
 *     type: 'object',
 *     properties: {
 *       text: { type: 'string', description: 'Text to translate' },
 *       from: { type: 'string', description: 'Source language code' },
 *       to: { type: 'string', description: 'Target language code' },
 *     },
 *     required: ['text', 'to'],
 *     additionalProperties: false,
 *   },
 *   output: {
 *     type: 'object',
 *     properties: {
 *       translatedText: { type: 'string' },
 *       confidence: { type: 'number' },
 *     },
 *     required: ['translatedText'],
 *     additionalProperties: false,
 *   },
 *   handler: async (input, context) => {
 *     // Translation logic here
 *     return {
 *       translatedText: `Translated: ${input.text}`,
 *       confidence: 0.95,
 *     }
 *   },
 *   pricing: {
 *     model: 'per-use',
 *     pricePerUnit: 0.01,
 *     currency: 'USD',
 *   },
 *   rateLimit: {
 *     requests: 100,
 *     window: 60000, // 1 minute
 *   },
 * })
 * ```
 */
export function Endpoint(config) {
    return {
        name: config.name,
        description: config.description,
        method: config.method || 'POST',
        path: config.path || `/${config.name}`,
        input: config.input,
        output: config.output,
        handler: config.handler,
        pricing: config.pricing,
        rateLimit: config.rateLimit,
        requiresAuth: config.requiresAuth !== false, // Default to true
    };
}
/**
 * Create a GET endpoint
 */
export function GET(config) {
    return Endpoint({ ...config, method: 'GET' });
}
/**
 * Create a POST endpoint
 */
export function POST(config) {
    return Endpoint({ ...config, method: 'POST' });
}
/**
 * Create a PUT endpoint
 */
export function PUT(config) {
    return Endpoint({ ...config, method: 'PUT' });
}
/**
 * Create a DELETE endpoint
 */
export function DELETE(config) {
    return Endpoint({ ...config, method: 'DELETE' });
}
/**
 * Create a PATCH endpoint
 */
export function PATCH(config) {
    return Endpoint({ ...config, method: 'PATCH' });
}
