/**
 * Service client for connecting to remote services
 */
/**
 * Create a client to connect to a remote service
 *
 * @example
 * ```ts
 * const client = Client({
 *   url: 'https://api.example.com/translation',
 *   auth: {
 *     type: 'api-key',
 *     credentials: { apiKey: process.env.API_KEY },
 *   },
 * })
 *
 * const result = await client.do('translate', {
 *   text: 'Hello world',
 *   to: 'es',
 * })
 * ```
 */
export function Client(config) {
    const baseUrl = config.url || '';
    const headers = {
        'Content-Type': 'application/json',
        ...config.headers,
    };
    // Add auth headers
    if (config.auth) {
        switch (config.auth.type) {
            case 'api-key':
                headers['Authorization'] = `Bearer ${config.auth.credentials.apiKey || config.auth.credentials.token}`;
                break;
            case 'basic':
                const basicAuth = Buffer.from(`${config.auth.credentials.username}:${config.auth.credentials.password}`).toString('base64');
                headers['Authorization'] = `Basic ${basicAuth}`;
                break;
            case 'jwt':
                headers['Authorization'] = `Bearer ${config.auth.credentials.token}`;
                break;
            // OAuth would require more complex flow
        }
    }
    /**
     * Make an HTTP request to the service
     */
    async function request(endpoint, body) {
        const url = `${baseUrl}/${endpoint.replace(/^\//, '')}`;
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: config.timeout ? AbortSignal.timeout(config.timeout) : undefined,
        });
        if (!response.ok) {
            throw new Error(`Service request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    return {
        async ask(question, context) {
            const result = await request('ask', { question, context });
            return result.answer;
        },
        async deliver(orderId, results) {
            await request('deliver', { orderId, results });
        },
        async do(action, input) {
            return request('do', { action, input });
        },
        async generate(prompt, options) {
            return request('generate', { prompt, options });
        },
        async is(value, type) {
            const result = await request('is', { value, type });
            return result.result;
        },
        async notify(notification) {
            await request('notify', notification);
        },
        async order(product, quantity) {
            return request('order', { product, quantity });
        },
        async quote(product, quantity) {
            return request('quote', { product, quantity });
        },
        async subscribe(planId) {
            return request('subscribe', { planId });
        },
        async entitlements() {
            const result = await request('entitlements', {});
            return result.entitlements;
        },
        async kpis() {
            return request('kpis', {});
        },
        async okrs() {
            return request('okrs', {});
        },
    };
}
