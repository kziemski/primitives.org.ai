/**
 * Service provider for managing multiple services
 */
import { Client } from './client.js';
/**
 * Create a service provider
 *
 * @example
 * ```ts
 * const provider = Provider({
 *   name: 'AWS',
 *   baseUrl: 'https://api.aws.amazon.com',
 *   auth: {
 *     type: 'api-key',
 *     credentials: { apiKey: process.env.AWS_API_KEY },
 *   },
 *   services: ['translate', 'comprehend', 'polly'],
 * })
 *
 * // Get a service client
 * const translate = provider.service('translate')
 * const result = await translate.do('translate', {
 *   text: 'Hello',
 *   to: 'es',
 * })
 * ```
 */
export function Provider(config) {
    return {
        name: config.name,
        baseUrl: config.baseUrl,
        auth: config.auth,
        services: config.services || [],
        service(serviceName) {
            // Construct service URL
            const serviceUrl = `${config.baseUrl}/${serviceName}`;
            // Create a client for this service
            const client = Client({
                url: serviceUrl,
                auth: config.auth,
            });
            return client;
        },
    };
}
/**
 * Common cloud providers
 */
export const providers = {
    /**
     * AWS provider
     */
    aws(credentials) {
        return Provider({
            name: 'AWS',
            baseUrl: `https://api.${credentials.region || 'us-east-1'}.amazonaws.com`,
            auth: {
                type: 'api-key',
                credentials: {
                    apiKey: credentials.accessKeyId,
                    secret: credentials.secretAccessKey,
                },
            },
            services: [
                'translate',
                'comprehend',
                'polly',
                'rekognition',
                'textract',
                'transcribe',
            ],
        });
    },
    /**
     * Google Cloud provider
     */
    gcp(credentials) {
        return Provider({
            name: 'Google Cloud',
            baseUrl: 'https://api.googleapis.com',
            auth: {
                type: 'api-key',
                credentials: { apiKey: credentials.apiKey },
            },
            services: [
                'translate',
                'language',
                'speech',
                'texttospeech',
                'vision',
            ],
        });
    },
    /**
     * Azure provider
     */
    azure(credentials) {
        return Provider({
            name: 'Azure',
            baseUrl: `https://${credentials.region || 'eastus'}.api.cognitive.microsoft.com`,
            auth: {
                type: 'api-key',
                credentials: { apiKey: credentials.subscriptionKey },
            },
            services: [
                'translator',
                'language',
                'speech',
                'vision',
                'form-recognizer',
            ],
        });
    },
    /**
     * OpenAI provider
     */
    openai(credentials) {
        return Provider({
            name: 'OpenAI',
            baseUrl: 'https://api.openai.com/v1',
            auth: {
                type: 'api-key',
                credentials: { apiKey: credentials.apiKey },
            },
            services: [
                'chat',
                'completions',
                'embeddings',
                'images',
                'audio',
            ],
        });
    },
    /**
     * Anthropic provider
     */
    anthropic(credentials) {
        return Provider({
            name: 'Anthropic',
            baseUrl: 'https://api.anthropic.com/v1',
            auth: {
                type: 'api-key',
                credentials: { apiKey: credentials.apiKey },
            },
            services: [
                'messages',
                'completions',
            ],
        });
    },
    /**
     * Custom provider
     */
    custom(config) {
        return Provider(config);
    },
};
