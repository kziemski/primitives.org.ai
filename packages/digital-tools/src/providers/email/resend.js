/**
 * Resend Email Provider
 *
 * Concrete implementation of EmailProvider using Resend API.
 *
 * @packageDocumentation
 */
import { defineProvider } from '../registry.js';
const RESEND_API_URL = 'https://api.resend.com';
/**
 * Resend provider info
 */
export const resendInfo = {
    id: 'email.resend',
    name: 'Resend',
    description: 'Modern email API for developers',
    category: 'email',
    website: 'https://resend.com',
    docsUrl: 'https://resend.com/docs',
    requiredConfig: ['apiKey'],
    optionalConfig: ['defaultFrom'],
};
/**
 * Create Resend email provider
 */
export function createResendProvider(config) {
    let apiKey;
    let defaultFrom;
    return {
        info: resendInfo,
        async initialize(cfg) {
            apiKey = cfg.apiKey;
            defaultFrom = cfg.defaultFrom;
            if (!apiKey) {
                throw new Error('Resend API key is required');
            }
        },
        async healthCheck() {
            const start = Date.now();
            try {
                const response = await fetch(`${RESEND_API_URL}/domains`, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                });
                return {
                    healthy: response.ok,
                    latencyMs: Date.now() - start,
                    message: response.ok ? 'Connected' : `HTTP ${response.status}`,
                    checkedAt: new Date(),
                };
            }
            catch (error) {
                return {
                    healthy: false,
                    latencyMs: Date.now() - start,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    checkedAt: new Date(),
                };
            }
        },
        async dispose() {
            // No cleanup needed
        },
        async send(options) {
            const from = options.from || defaultFrom;
            if (!from) {
                return {
                    success: false,
                    error: { code: 'MISSING_FROM', message: 'From address is required' },
                };
            }
            const body = {
                from,
                to: options.to,
                subject: options.subject,
                ...(options.cc && { cc: options.cc }),
                ...(options.bcc && { bcc: options.bcc }),
                ...(options.replyTo && { reply_to: options.replyTo }),
                ...(options.text && { text: options.text }),
                ...(options.html && { html: options.html }),
                ...(options.headers && { headers: options.headers }),
                ...(options.tags && { tags: options.tags.map((name) => ({ name })) }),
            };
            if (options.attachments?.length) {
                body.attachments = options.attachments.map((att) => ({
                    filename: att.filename,
                    content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
                    content_type: att.contentType,
                }));
            }
            if (options.sendAt) {
                body.scheduled_at = options.sendAt.toISOString();
            }
            try {
                const response = await fetch(`${RESEND_API_URL}/emails`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(body),
                });
                const data = await response.json();
                if (response.ok) {
                    return {
                        success: true,
                        messageId: data.id,
                    };
                }
                return {
                    success: false,
                    error: {
                        code: data.name || `HTTP_${response.status}`,
                        message: data.message || response.statusText,
                    },
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: {
                        code: 'NETWORK_ERROR',
                        message: error instanceof Error ? error.message : 'Unknown error',
                    },
                };
            }
        },
        async sendBatch(emails) {
            // Resend has a batch endpoint
            const from = defaultFrom;
            const batch = emails.map((options) => ({
                from: options.from || from,
                to: options.to,
                subject: options.subject,
                ...(options.cc && { cc: options.cc }),
                ...(options.bcc && { bcc: options.bcc }),
                ...(options.replyTo && { reply_to: options.replyTo }),
                ...(options.text && { text: options.text }),
                ...(options.html && { html: options.html }),
            }));
            try {
                const response = await fetch(`${RESEND_API_URL}/emails/batch`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(batch),
                });
                const data = await response.json();
                if (response.ok) {
                    return data.data.map((item) => ({
                        success: true,
                        messageId: item.id,
                    }));
                }
                // If batch fails, return error for all
                return emails.map(() => ({
                    success: false,
                    error: {
                        code: data.name || `HTTP_${response.status}`,
                        message: data.message || response.statusText,
                    },
                }));
            }
            catch (error) {
                return emails.map(() => ({
                    success: false,
                    error: {
                        code: 'NETWORK_ERROR',
                        message: error instanceof Error ? error.message : 'Unknown error',
                    },
                }));
            }
        },
        async get(messageId) {
            try {
                const response = await fetch(`${RESEND_API_URL}/emails/${messageId}`, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                });
                if (!response.ok) {
                    if (response.status === 404)
                        return null;
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = (await response.json());
                return {
                    id: data.id,
                    from: data.from,
                    to: Array.isArray(data.to) ? data.to : [data.to],
                    cc: data.cc,
                    bcc: data.bcc,
                    subject: data.subject,
                    text: data.text,
                    html: data.html,
                    status: mapResendStatus(data.last_event),
                    sentAt: data.created_at ? new Date(data.created_at) : undefined,
                };
            }
            catch {
                return null;
            }
        },
        async verifyDomain(domain) {
            const response = await fetch(`${RESEND_API_URL}/domains`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ name: domain }),
            });
            const data = (await response.json());
            return {
                domain: data.name,
                verified: data.status === 'verified',
                dnsRecords: data.records?.map((r) => ({
                    type: r.type,
                    name: r.name,
                    value: r.value,
                    verified: r.status === 'verified',
                })) || [],
            };
        },
        async listDomains() {
            const response = await fetch(`${RESEND_API_URL}/domains`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            const data = (await response.json());
            return data.data?.map((d) => ({
                domain: d.name,
                verified: d.status === 'verified',
                createdAt: new Date(d.created_at),
            })) || [];
        },
    };
}
function mapResendStatus(event) {
    switch (event) {
        case 'delivered':
            return 'delivered';
        case 'bounced':
            return 'bounced';
        case 'complained':
            return 'failed';
        default:
            return 'sent';
    }
}
/**
 * Resend provider definition
 */
export const resendProvider = defineProvider(resendInfo, async (config) => createResendProvider(config));
