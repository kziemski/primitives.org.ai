/**
 * Mailchimp Marketing Provider
 *
 * Concrete implementation of MarketingProvider using Mailchimp Marketing API v3.
 *
 * @packageDocumentation
 */
import { defineProvider } from '../registry.js';
/**
 * Mailchimp provider info
 */
export const mailchimpInfo = {
    id: 'marketing.mailchimp',
    name: 'Mailchimp',
    description: 'Mailchimp email marketing and automation platform',
    category: 'marketing',
    website: 'https://mailchimp.com',
    docsUrl: 'https://mailchimp.com/developer/marketing/api/',
    requiredConfig: ['apiKey', 'serverPrefix'],
    optionalConfig: [],
};
/**
 * Create Mailchimp marketing provider
 */
export function createMailchimpProvider(config) {
    let apiKey;
    let serverPrefix;
    let baseUrl;
    /**
     * Make authenticated API request
     */
    async function makeRequest(endpoint, options = {}) {
        const url = `${baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                ...options.headers,
            },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Mailchimp API error: ${response.status} - ${errorData?.title || errorData?.detail || response.statusText}`);
        }
        if (response.status === 204) {
            return {};
        }
        return response.json();
    }
    /**
     * Convert Mailchimp subscriber status to standard format
     */
    function mapStatus(status) {
        switch (status) {
            case 'subscribed':
                return 'subscribed';
            case 'unsubscribed':
                return 'unsubscribed';
            case 'cleaned':
            case 'pending':
            case 'transactional':
                return status;
            default:
                return 'unknown';
        }
    }
    return {
        info: mailchimpInfo,
        async initialize(cfg) {
            apiKey = cfg.apiKey;
            serverPrefix = cfg.serverPrefix;
            if (!apiKey) {
                throw new Error('Mailchimp API key is required');
            }
            if (!serverPrefix) {
                throw new Error('Mailchimp server prefix is required (e.g., "us1")');
            }
            baseUrl = `https://${serverPrefix}.api.mailchimp.com/3.0`;
        },
        async healthCheck() {
            const start = Date.now();
            try {
                await makeRequest('/ping');
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
        async listAudiences() {
            const response = await makeRequest('/lists?count=1000');
            return response.lists.map((list) => ({
                id: list.id,
                name: list.name,
                memberCount: list.stats.member_count,
                createdAt: new Date(list.date_created),
            }));
        },
        async getAudience(audienceId) {
            try {
                const response = await makeRequest(`/lists/${audienceId}`);
                return {
                    id: response.id,
                    name: response.name,
                    memberCount: response.stats.member_count,
                    createdAt: new Date(response.date_created),
                };
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('404')) {
                    return null;
                }
                throw error;
            }
        },
        async addSubscriber(audienceId, subscriber) {
            const body = {
                email_address: subscriber.email,
                status: subscriber.status || 'subscribed',
            };
            if (subscriber.firstName || subscriber.lastName) {
                body.merge_fields = {
                    ...(subscriber.firstName && { FNAME: subscriber.firstName }),
                    ...(subscriber.lastName && { LNAME: subscriber.lastName }),
                    ...subscriber.mergeFields,
                };
            }
            else if (subscriber.mergeFields) {
                body.merge_fields = subscriber.mergeFields;
            }
            if (subscriber.tags?.length) {
                body.tags = subscriber.tags;
            }
            const response = await makeRequest(`/lists/${audienceId}/members`, {
                method: 'POST',
                body: JSON.stringify(body),
            });
            return {
                id: response.id,
                email: response.email_address,
                firstName: response.merge_fields?.FNAME,
                lastName: response.merge_fields?.LNAME,
                status: mapStatus(response.status),
                tags: response.tags.map((t) => t.name),
                subscribedAt: response.timestamp_signup
                    ? new Date(response.timestamp_signup)
                    : response.timestamp_opt
                        ? new Date(response.timestamp_opt)
                        : undefined,
            };
        },
        async updateSubscriber(audienceId, email, updates) {
            // Mailchimp uses MD5 hash of lowercase email as subscriber ID
            const crypto = await import('crypto');
            const subscriberId = crypto
                .createHash('md5')
                .update(email.toLowerCase())
                .digest('hex');
            const body = {};
            if (updates.email) {
                body.email_address = updates.email;
            }
            if (updates.status) {
                body.status = updates.status;
            }
            if (updates.firstName || updates.lastName || updates.mergeFields) {
                body.merge_fields = {
                    ...(updates.firstName && { FNAME: updates.firstName }),
                    ...(updates.lastName && { LNAME: updates.lastName }),
                    ...updates.mergeFields,
                };
            }
            if (updates.tags?.length) {
                body.tags = updates.tags;
            }
            const response = await makeRequest(`/lists/${audienceId}/members/${subscriberId}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            return {
                id: response.id,
                email: response.email_address,
                firstName: response.merge_fields?.FNAME,
                lastName: response.merge_fields?.LNAME,
                status: mapStatus(response.status),
                tags: response.tags.map((t) => t.name),
                subscribedAt: response.timestamp_signup
                    ? new Date(response.timestamp_signup)
                    : response.timestamp_opt
                        ? new Date(response.timestamp_opt)
                        : undefined,
            };
        },
        async removeSubscriber(audienceId, email) {
            try {
                const crypto = await import('crypto');
                const subscriberId = crypto
                    .createHash('md5')
                    .update(email.toLowerCase())
                    .digest('hex');
                await makeRequest(`/lists/${audienceId}/members/${subscriberId}`, {
                    method: 'DELETE',
                });
                return true;
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('404')) {
                    return false;
                }
                throw error;
            }
        },
        async listSubscribers(audienceId, options) {
            const params = new URLSearchParams();
            params.set('count', String(options?.limit || 10));
            params.set('offset', String(options?.offset || 0));
            if (options?.status) {
                params.set('status', options.status);
            }
            if (options?.sinceSubscribed) {
                params.set('since_timestamp_opt', options.sinceSubscribed.toISOString());
            }
            const response = await makeRequest(`/lists/${audienceId}/members?${params}`);
            const items = response.members.map((member) => ({
                id: member.id,
                email: member.email_address,
                firstName: member.merge_fields?.FNAME,
                lastName: member.merge_fields?.LNAME,
                status: mapStatus(member.status),
                tags: member.tags.map((t) => t.name),
                subscribedAt: member.timestamp_signup
                    ? new Date(member.timestamp_signup)
                    : member.timestamp_opt
                        ? new Date(member.timestamp_opt)
                        : undefined,
            }));
            const offset = options?.offset || 0;
            const limit = options?.limit || 10;
            return {
                items,
                total: response.total_items,
                hasMore: offset + limit < response.total_items,
            };
        },
        async createCampaign(campaign) {
            const body = {
                type: 'regular',
                recipients: {
                    list_id: campaign.audienceId,
                },
                settings: {
                    subject_line: campaign.subject,
                    title: campaign.name,
                    from_name: campaign.fromName,
                    reply_to: campaign.fromEmail,
                },
            };
            const response = await makeRequest('/campaigns', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            // Set content if provided
            if (campaign.content?.html || campaign.content?.text) {
                const contentBody = {};
                if (campaign.content.html) {
                    contentBody.html = campaign.content.html;
                }
                if (campaign.content.text) {
                    contentBody.plain_text = campaign.content.text;
                }
                await makeRequest(`/campaigns/${response.id}/content`, {
                    method: 'PUT',
                    body: JSON.stringify(contentBody),
                });
            }
            return {
                id: response.id,
                name: response.settings.title,
                status: response.status,
                audienceId: response.recipients.list_id,
                subject: response.settings.subject_line,
                fromName: response.settings.from_name,
                fromEmail: response.settings.reply_to,
                sentAt: response.send_time ? new Date(response.send_time) : undefined,
                createdAt: new Date(response.create_time),
            };
        },
        async getCampaign(campaignId) {
            try {
                const response = await makeRequest(`/campaigns/${campaignId}`);
                return {
                    id: response.id,
                    name: response.settings.title,
                    status: response.status,
                    audienceId: response.recipients.list_id,
                    subject: response.settings.subject_line,
                    fromName: response.settings.from_name,
                    fromEmail: response.settings.reply_to,
                    sentAt: response.send_time ? new Date(response.send_time) : undefined,
                    createdAt: new Date(response.create_time),
                };
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('404')) {
                    return null;
                }
                throw error;
            }
        },
        async updateCampaign(campaignId, updates) {
            const body = {};
            if (updates.name || updates.subject || updates.fromName || updates.fromEmail) {
                body.settings = {
                    ...(updates.name && { title: updates.name }),
                    ...(updates.subject && { subject_line: updates.subject }),
                    ...(updates.fromName && { from_name: updates.fromName }),
                    ...(updates.fromEmail && { reply_to: updates.fromEmail }),
                };
            }
            if (updates.audienceId) {
                body.recipients = { list_id: updates.audienceId };
            }
            const response = await makeRequest(`/campaigns/${campaignId}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            // Update content if provided
            if (updates.content?.html || updates.content?.text) {
                const contentBody = {};
                if (updates.content.html) {
                    contentBody.html = updates.content.html;
                }
                if (updates.content.text) {
                    contentBody.plain_text = updates.content.text;
                }
                await makeRequest(`/campaigns/${response.id}/content`, {
                    method: 'PUT',
                    body: JSON.stringify(contentBody),
                });
            }
            return {
                id: response.id,
                name: response.settings.title,
                status: response.status,
                audienceId: response.recipients.list_id,
                subject: response.settings.subject_line,
                fromName: response.settings.from_name,
                fromEmail: response.settings.reply_to,
                sentAt: response.send_time ? new Date(response.send_time) : undefined,
                createdAt: new Date(response.create_time),
            };
        },
        async listCampaigns(options) {
            const params = new URLSearchParams();
            params.set('count', String(options?.limit || 10));
            params.set('offset', String(options?.offset || 0));
            if (options?.status) {
                params.set('status', options.status);
            }
            if (options?.since) {
                params.set('since_create_time', options.since.toISOString());
            }
            const response = await makeRequest(`/campaigns?${params}`);
            const items = response.campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.settings.title,
                status: campaign.status,
                audienceId: campaign.recipients.list_id,
                subject: campaign.settings.subject_line,
                fromName: campaign.settings.from_name,
                fromEmail: campaign.settings.reply_to,
                sentAt: campaign.send_time ? new Date(campaign.send_time) : undefined,
                createdAt: new Date(campaign.create_time),
            }));
            const offset = options?.offset || 0;
            const limit = options?.limit || 10;
            return {
                items,
                total: response.total_items,
                hasMore: offset + limit < response.total_items,
            };
        },
        async sendCampaign(campaignId) {
            try {
                await makeRequest(`/campaigns/${campaignId}/actions/send`, {
                    method: 'POST',
                });
                return true;
            }
            catch (error) {
                return false;
            }
        },
        async scheduleCampaign(campaignId, sendAt) {
            try {
                await makeRequest(`/campaigns/${campaignId}/actions/schedule`, {
                    method: 'POST',
                    body: JSON.stringify({
                        schedule_time: sendAt.toISOString(),
                    }),
                });
                return true;
            }
            catch (error) {
                return false;
            }
        },
        async getCampaignReport(campaignId) {
            const response = await makeRequest(`/reports/${campaignId}`);
            return {
                campaignId: response.campaign_id,
                sent: response.emails_sent,
                delivered: response.emails_sent - (response.bounces.hard_bounces + response.bounces.soft_bounces),
                opens: response.opens.opens_total,
                uniqueOpens: response.opens.unique_opens,
                clicks: response.clicks.clicks_total,
                uniqueClicks: response.clicks.unique_clicks,
                bounces: response.bounces.hard_bounces + response.bounces.soft_bounces,
                unsubscribes: response.unsubscribed,
                openRate: response.opens.open_rate,
                clickRate: response.clicks.click_rate,
            };
        },
    };
}
/**
 * Mailchimp provider definition
 */
export const mailchimpProvider = defineProvider(mailchimpInfo, async (config) => createMailchimpProvider(config));
