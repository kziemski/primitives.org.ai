/**
 * Stripe Finance Provider
 *
 * Concrete implementation of FinanceProvider using Stripe API.
 *
 * @packageDocumentation
 */
import { defineProvider } from '../registry.js';
const STRIPE_API_URL = 'https://api.stripe.com/v1';
/**
 * Stripe provider info
 */
export const stripeInfo = {
    id: 'finance.stripe',
    name: 'Stripe',
    description: 'Stripe payment processing and invoicing platform',
    category: 'finance',
    website: 'https://stripe.com',
    docsUrl: 'https://stripe.com/docs/api',
    requiredConfig: ['apiKey'],
    optionalConfig: ['webhookSecret'],
};
/**
 * Create Stripe finance provider
 */
export function createStripeProvider(config) {
    let apiKey;
    /**
     * Helper to make Stripe API requests
     */
    async function stripeRequest(endpoint, options = {}) {
        const { method = 'GET', body, params } = options;
        const url = new URL(`${STRIPE_API_URL}${endpoint}`);
        // Add query params for GET requests
        if (params && method === 'GET') {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value);
                }
            });
        }
        const headers = {
            Authorization: `Bearer ${apiKey}`,
        };
        let requestBody;
        if (body && method !== 'GET') {
            // Stripe uses form-encoded data
            const params = new URLSearchParams();
            Object.entries(body).forEach(([key, value]) => {
                params.append(key, String(value));
            });
            requestBody = params.toString();
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        const response = await fetch(url.toString(), {
            method,
            headers,
            body: requestBody,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error?.error?.message || `Stripe API error: ${response.status}`);
        }
        return response.json();
    }
    /**
     * Convert Stripe nested params to form format
     */
    function flattenParams(obj, prefix = '') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}[${key}]` : key;
            if (value === null || value === undefined) {
                continue;
            }
            else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        Object.assign(result, flattenParams(item, `${fullKey}[${index}]`));
                    }
                    else {
                        result[`${fullKey}[${index}]`] = String(item);
                    }
                });
            }
            else if (typeof value === 'object') {
                Object.assign(result, flattenParams(value, fullKey));
            }
            else {
                result[fullKey] = String(value);
            }
        }
        return result;
    }
    /**
     * Make Stripe API request with nested params support
     */
    async function stripeRequestWithParams(endpoint, options = {}) {
        const { method = 'GET', data, params } = options;
        const url = new URL(`${STRIPE_API_URL}${endpoint}`);
        // Add query params for GET requests
        if (params && method === 'GET') {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value);
                }
            });
        }
        const headers = {
            Authorization: `Bearer ${apiKey}`,
        };
        let requestBody;
        if (data && method !== 'GET') {
            // Flatten nested objects for Stripe's form format
            const flatParams = flattenParams(data);
            requestBody = new URLSearchParams(flatParams).toString();
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        const response = await fetch(url.toString(), {
            method,
            headers,
            body: requestBody,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error?.error?.message || `Stripe API error: ${response.status}`);
        }
        return response.json();
    }
    return {
        info: stripeInfo,
        async initialize(cfg) {
            apiKey = cfg.apiKey;
            if (!apiKey) {
                throw new Error('Stripe API key is required');
            }
        },
        async healthCheck() {
            const start = Date.now();
            try {
                // Use balance endpoint to verify API key
                await stripeRequest('/balance');
                return {
                    healthy: true,
                    latencyMs: Date.now() - start,
                    message: 'Connected',
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
        async createInvoice(invoice) {
            const data = {
                customer: invoice.customerId,
                currency: invoice.currency || 'usd',
                auto_advance: false, // Don't auto-finalize
            };
            if (invoice.dueDate) {
                data.due_date = Math.floor(invoice.dueDate.getTime() / 1000);
            }
            if (invoice.memo) {
                data.description = invoice.memo;
            }
            // Create the invoice
            const stripeInvoice = await stripeRequestWithParams('/invoices', {
                method: 'POST',
                data,
            });
            // Add line items
            for (const item of invoice.lineItems) {
                await stripeRequestWithParams('/invoiceitems', {
                    method: 'POST',
                    data: {
                        customer: invoice.customerId,
                        invoice: stripeInvoice.id,
                        description: item.description,
                        quantity: item.quantity,
                        unit_amount: Math.round(item.unitPrice * 100), // Convert to cents
                        currency: invoice.currency || 'usd',
                    },
                });
            }
            // Retrieve updated invoice with line items
            const updatedInvoice = await stripeRequest(`/invoices/${stripeInvoice.id}`);
            return {
                id: updatedInvoice.id,
                number: updatedInvoice.number || updatedInvoice.id,
                customerId: updatedInvoice.customer,
                status: mapStripeInvoiceStatus(updatedInvoice.status),
                currency: updatedInvoice.currency,
                subtotal: updatedInvoice.subtotal / 100,
                tax: updatedInvoice.tax ? updatedInvoice.tax / 100 : undefined,
                total: updatedInvoice.total / 100,
                amountDue: updatedInvoice.amount_due / 100,
                amountPaid: updatedInvoice.amount_paid / 100,
                dueDate: updatedInvoice.due_date ? new Date(updatedInvoice.due_date * 1000) : undefined,
                paidAt: updatedInvoice.status_transitions?.paid_at
                    ? new Date(updatedInvoice.status_transitions.paid_at * 1000)
                    : undefined,
                url: updatedInvoice.hosted_invoice_url,
                createdAt: new Date(updatedInvoice.created * 1000),
            };
        },
        async getInvoice(invoiceId) {
            try {
                const invoice = await stripeRequest(`/invoices/${invoiceId}`);
                return {
                    id: invoice.id,
                    number: invoice.number || invoice.id,
                    customerId: invoice.customer,
                    status: mapStripeInvoiceStatus(invoice.status),
                    currency: invoice.currency,
                    subtotal: invoice.subtotal / 100,
                    tax: invoice.tax ? invoice.tax / 100 : undefined,
                    total: invoice.total / 100,
                    amountDue: invoice.amount_due / 100,
                    amountPaid: invoice.amount_paid / 100,
                    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
                    paidAt: invoice.status_transitions?.paid_at
                        ? new Date(invoice.status_transitions.paid_at * 1000)
                        : undefined,
                    url: invoice.hosted_invoice_url,
                    createdAt: new Date(invoice.created * 1000),
                };
            }
            catch (error) {
                return null;
            }
        },
        async updateInvoice(invoiceId, updates) {
            const data = {};
            if (updates.dueDate) {
                data.due_date = Math.floor(updates.dueDate.getTime() / 1000);
            }
            if (updates.memo) {
                data.description = updates.memo;
            }
            const invoice = await stripeRequestWithParams(`/invoices/${invoiceId}`, {
                method: 'POST',
                data,
            });
            return {
                id: invoice.id,
                number: invoice.number || invoice.id,
                customerId: invoice.customer,
                status: mapStripeInvoiceStatus(invoice.status),
                currency: invoice.currency,
                subtotal: invoice.subtotal / 100,
                tax: invoice.tax ? invoice.tax / 100 : undefined,
                total: invoice.total / 100,
                amountDue: invoice.amount_due / 100,
                amountPaid: invoice.amount_paid / 100,
                dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
                paidAt: invoice.status_transitions?.paid_at
                    ? new Date(invoice.status_transitions.paid_at * 1000)
                    : undefined,
                url: invoice.hosted_invoice_url,
                createdAt: new Date(invoice.created * 1000),
            };
        },
        async listInvoices(options = {}) {
            const params = {};
            if (options.limit) {
                params.limit = String(options.limit);
            }
            if (options.cursor) {
                params.starting_after = options.cursor;
            }
            if (options.customerId) {
                params.customer = options.customerId;
            }
            if (options.status) {
                params.status = options.status;
            }
            const response = await stripeRequest('/invoices', { params });
            return {
                items: response.data.map((invoice) => ({
                    id: invoice.id,
                    number: invoice.number || invoice.id,
                    customerId: invoice.customer,
                    status: mapStripeInvoiceStatus(invoice.status),
                    currency: invoice.currency,
                    subtotal: invoice.subtotal / 100,
                    tax: invoice.tax ? invoice.tax / 100 : undefined,
                    total: invoice.total / 100,
                    amountDue: invoice.amount_due / 100,
                    amountPaid: invoice.amount_paid / 100,
                    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
                    paidAt: invoice.status_transitions?.paid_at
                        ? new Date(invoice.status_transitions.paid_at * 1000)
                        : undefined,
                    url: invoice.hosted_invoice_url,
                    createdAt: new Date(invoice.created * 1000),
                })),
                hasMore: response.has_more,
                nextCursor: response.has_more ? response.data[response.data.length - 1]?.id : undefined,
            };
        },
        async sendInvoice(invoiceId) {
            try {
                // First finalize the invoice if it's a draft
                const invoice = await stripeRequest(`/invoices/${invoiceId}`);
                if (invoice.status === 'draft') {
                    await stripeRequestWithParams(`/invoices/${invoiceId}/finalize`, {
                        method: 'POST',
                    });
                }
                // Send the invoice
                await stripeRequestWithParams(`/invoices/${invoiceId}/send`, {
                    method: 'POST',
                });
                return true;
            }
            catch (error) {
                return false;
            }
        },
        async voidInvoice(invoiceId) {
            try {
                await stripeRequestWithParams(`/invoices/${invoiceId}/void`, {
                    method: 'POST',
                });
                return true;
            }
            catch (error) {
                return false;
            }
        },
        async createPayment(payment) {
            const data = {
                amount: Math.round(payment.amount * 100), // Convert to cents
                currency: payment.currency,
                payment_method: payment.paymentMethod,
                confirm: true,
            };
            if (payment.customerId) {
                data.customer = payment.customerId;
            }
            if (payment.description) {
                data.description = payment.description;
            }
            // For Stripe, we create a PaymentIntent
            const intent = await stripeRequestWithParams('/payment_intents', {
                method: 'POST',
                data,
            });
            return {
                id: intent.id,
                amount: intent.amount / 100,
                currency: intent.currency,
                status: mapStripePaymentStatus(intent.status),
                customerId: intent.customer || undefined,
                invoiceId: intent.invoice || undefined,
                paymentMethod: payment.paymentMethod,
                description: intent.description,
                createdAt: new Date(intent.created * 1000),
            };
        },
        async getPayment(paymentId) {
            try {
                const intent = await stripeRequest(`/payment_intents/${paymentId}`);
                return {
                    id: intent.id,
                    amount: intent.amount / 100,
                    currency: intent.currency,
                    status: mapStripePaymentStatus(intent.status),
                    customerId: intent.customer || undefined,
                    invoiceId: intent.invoice || undefined,
                    paymentMethod: intent.payment_method || 'unknown',
                    description: intent.description,
                    createdAt: new Date(intent.created * 1000),
                };
            }
            catch (error) {
                return null;
            }
        },
        async listPayments(options = {}) {
            const params = {};
            if (options.limit) {
                params.limit = String(options.limit);
            }
            if (options.cursor) {
                params.starting_after = options.cursor;
            }
            if (options.customerId) {
                params.customer = options.customerId;
            }
            const response = await stripeRequest('/payment_intents', { params });
            return {
                items: response.data.map((intent) => ({
                    id: intent.id,
                    amount: intent.amount / 100,
                    currency: intent.currency,
                    status: mapStripePaymentStatus(intent.status),
                    customerId: intent.customer || undefined,
                    invoiceId: intent.invoice || undefined,
                    paymentMethod: intent.payment_method || 'unknown',
                    description: intent.description,
                    createdAt: new Date(intent.created * 1000),
                })),
                hasMore: response.has_more,
                nextCursor: response.has_more ? response.data[response.data.length - 1]?.id : undefined,
            };
        },
        async refundPayment(paymentId, amount) {
            const data = {
                payment_intent: paymentId,
            };
            if (amount !== undefined) {
                data.amount = Math.round(amount * 100);
            }
            const refund = await stripeRequestWithParams('/refunds', {
                method: 'POST',
                data,
            });
            return {
                id: refund.id,
                paymentId: refund.payment_intent,
                amount: refund.amount / 100,
                status: refund.status,
                createdAt: new Date(refund.created * 1000),
            };
        },
        async createCustomer(customer) {
            const data = {
                name: customer.name,
            };
            if (customer.email) {
                data.email = customer.email;
            }
            if (customer.phone) {
                data.phone = customer.phone;
            }
            if (customer.address) {
                data.address = {
                    line1: customer.address.line1,
                    line2: customer.address.line2,
                    city: customer.address.city,
                    state: customer.address.state,
                    postal_code: customer.address.postalCode,
                    country: customer.address.country,
                };
            }
            const stripeCustomer = await stripeRequestWithParams('/customers', {
                method: 'POST',
                data,
            });
            return {
                id: stripeCustomer.id,
                name: stripeCustomer.name,
                email: stripeCustomer.email,
                phone: stripeCustomer.phone,
                balance: stripeCustomer.balance ? stripeCustomer.balance / 100 : undefined,
                createdAt: new Date(stripeCustomer.created * 1000),
            };
        },
        async getCustomer(customerId) {
            try {
                const customer = await stripeRequest(`/customers/${customerId}`);
                return {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    balance: customer.balance ? customer.balance / 100 : undefined,
                    createdAt: new Date(customer.created * 1000),
                };
            }
            catch (error) {
                return null;
            }
        },
        async listCustomers(options = {}) {
            const params = {};
            if (options.limit) {
                params.limit = String(options.limit);
            }
            if (options.cursor) {
                params.starting_after = options.cursor;
            }
            const response = await stripeRequest('/customers', { params });
            return {
                items: response.data.map((customer) => ({
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    balance: customer.balance ? customer.balance / 100 : undefined,
                    createdAt: new Date(customer.created * 1000),
                })),
                hasMore: response.has_more,
                nextCursor: response.has_more ? response.data[response.data.length - 1]?.id : undefined,
            };
        },
    };
}
/**
 * Map Stripe invoice status to standard status
 */
function mapStripeInvoiceStatus(status) {
    switch (status) {
        case 'draft':
            return 'draft';
        case 'open':
            return 'open';
        case 'paid':
            return 'paid';
        case 'void':
            return 'void';
        case 'uncollectible':
            return 'uncollectible';
        default:
            return 'draft';
    }
}
/**
 * Map Stripe payment status to standard status
 */
function mapStripePaymentStatus(status) {
    switch (status) {
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
        case 'processing':
            return 'pending';
        case 'succeeded':
            return 'succeeded';
        case 'canceled':
        case 'requires_capture':
            return 'failed';
        default:
            return 'pending';
    }
}
/**
 * Stripe provider definition
 */
export const stripeProvider = defineProvider(stripeInfo, async (config) => createStripeProvider(config));
