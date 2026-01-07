/**
 * Notion Knowledge Provider
 *
 * Concrete implementation of KnowledgeProvider using Notion API v1.
 *
 * @packageDocumentation
 */
import { defineProvider } from '../registry.js';
const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
/**
 * Notion provider info
 */
export const notionInfo = {
    id: 'knowledge.notion',
    name: 'Notion',
    description: 'Notion workspace and knowledge management platform',
    category: 'knowledge',
    website: 'https://notion.so',
    docsUrl: 'https://developers.notion.com',
    requiredConfig: ['integrationToken'],
    optionalConfig: ['defaultParentId', 'defaultDatabaseId'],
};
/**
 * Create Notion knowledge provider
 */
export function createNotionProvider(config) {
    let integrationToken;
    let defaultParentId;
    let defaultDatabaseId;
    /**
     * Make authenticated request to Notion API
     */
    async function notionRequest(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${NOTION_API_URL}${endpoint}`;
        return fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${integrationToken}`,
                'Notion-Version': NOTION_VERSION,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    }
    /**
     * Convert Notion page to PageData
     */
    function convertNotionPage(notionPage) {
        const title = extractTitle(notionPage);
        const parentId = notionPage.parent?.page_id || notionPage.parent?.database_id || undefined;
        return {
            id: notionPage.id,
            title,
            content: undefined, // Content requires separate API call
            parentId,
            spaceId: notionPage.parent?.workspace ? 'workspace' : parentId,
            url: notionPage.url,
            icon: notionPage.icon?.emoji || notionPage.icon?.external?.url || undefined,
            cover: notionPage.cover?.external?.url || notionPage.cover?.file?.url || undefined,
            createdAt: new Date(notionPage.created_time),
            updatedAt: new Date(notionPage.last_edited_time),
            createdBy: notionPage.created_by?.id,
            updatedBy: notionPage.last_edited_by?.id,
        };
    }
    /**
     * Extract title from Notion page properties
     */
    function extractTitle(notionPage) {
        // Check for title property
        const properties = notionPage.properties || {};
        // Look for title or Name property
        for (const [key, value] of Object.entries(properties)) {
            const prop = value;
            if (prop.type === 'title' && prop.title?.length > 0) {
                return prop.title.map((t) => t.plain_text).join('');
            }
        }
        // Fallback to page title in child_page parent
        if (notionPage.child_page?.title) {
            return notionPage.child_page.title;
        }
        return 'Untitled';
    }
    /**
     * Build page properties for creation/update
     */
    function buildPageProperties(title) {
        return {
            title: [
                {
                    text: {
                        content: title,
                    },
                },
            ],
        };
    }
    /**
     * Build parent object for page creation
     */
    function buildParent(parentId, spaceId) {
        const targetParent = parentId || spaceId || defaultParentId || defaultDatabaseId;
        if (!targetParent) {
            throw new Error('Parent ID, space ID, or default parent/database must be provided');
        }
        // Determine if this is a page or database parent
        // UUIDs with dashes are typically pages, without dashes or starting with certain patterns are databases
        if (targetParent.includes('-')) {
            return { page_id: targetParent };
        }
        else {
            return { database_id: targetParent };
        }
    }
    return {
        info: notionInfo,
        async initialize(cfg) {
            integrationToken = cfg.integrationToken;
            defaultParentId = cfg.defaultParentId;
            defaultDatabaseId = cfg.defaultDatabaseId;
            if (!integrationToken) {
                throw new Error('Notion integration token is required');
            }
        },
        async healthCheck() {
            const start = Date.now();
            try {
                const response = await notionRequest('/users/me');
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
        async createPage(page) {
            const parent = buildParent(page.parentId, page.spaceId);
            const body = {
                parent,
                properties: buildPageProperties(page.title),
            };
            if (page.icon) {
                body.icon = { emoji: page.icon };
            }
            if (page.cover) {
                body.cover = { external: { url: page.cover } };
            }
            if (page.content) {
                // Convert simple content to Notion blocks
                body.children = [
                    {
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [
                                {
                                    type: 'text',
                                    text: { content: page.content },
                                },
                            ],
                        },
                    },
                ];
            }
            try {
                const response = await notionRequest('/pages', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to create page: ${errorData?.message || response.statusText}`);
                }
                const notionPage = await response.json();
                return convertNotionPage(notionPage);
            }
            catch (error) {
                throw new Error(`Failed to create Notion page: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async getPage(pageId) {
            try {
                const response = await notionRequest(`/pages/${pageId}`);
                if (response.status === 404) {
                    return null;
                }
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to get page: ${errorData?.message || response.statusText}`);
                }
                const notionPage = await response.json();
                return convertNotionPage(notionPage);
            }
            catch (error) {
                if (error?.message?.includes('404')) {
                    return null;
                }
                throw new Error(`Failed to get Notion page: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async updatePage(pageId, updates) {
            const body = {
                properties: {},
            };
            if (updates.title) {
                body.properties.title = buildPageProperties(updates.title).title;
            }
            if (updates.icon !== undefined) {
                body.icon = updates.icon ? { emoji: updates.icon } : null;
            }
            if (updates.cover !== undefined) {
                body.cover = updates.cover ? { external: { url: updates.cover } } : null;
            }
            try {
                const response = await notionRequest(`/pages/${pageId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to update page: ${errorData?.message || response.statusText}`);
                }
                const notionPage = await response.json();
                return convertNotionPage(notionPage);
            }
            catch (error) {
                throw new Error(`Failed to update Notion page: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async deletePage(pageId) {
            try {
                const response = await notionRequest(`/pages/${pageId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ archived: true }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to delete page: ${errorData?.message || response.statusText}`);
                }
                return true;
            }
            catch (error) {
                throw new Error(`Failed to delete Notion page: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async listPages(options) {
            // If parentId or spaceId is provided, use it; otherwise use defaults
            const parentId = options?.parentId || options?.spaceId || defaultDatabaseId;
            if (!parentId) {
                throw new Error('Parent ID, space ID, or default database must be provided for listing pages');
            }
            try {
                const body = {
                    page_size: options?.limit || 100,
                };
                if (options?.cursor) {
                    body.start_cursor = options.cursor;
                }
                const response = await notionRequest(`/databases/${parentId}/query`, {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to list pages: ${errorData?.message || response.statusText}`);
                }
                const data = await response.json();
                const pages = data.results.map(convertNotionPage);
                return {
                    items: pages,
                    hasMore: data.has_more,
                    nextCursor: data.next_cursor || undefined,
                };
            }
            catch (error) {
                throw new Error(`Failed to list Notion pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async searchPages(query, options) {
            try {
                const body = {
                    query,
                    page_size: options?.limit || 100,
                    filter: {
                        property: 'object',
                        value: 'page',
                    },
                };
                if (options?.cursor) {
                    body.start_cursor = options.cursor;
                }
                const response = await notionRequest('/search', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to search pages: ${errorData?.message || response.statusText}`);
                }
                const data = await response.json();
                const pages = data.results.map(convertNotionPage);
                return {
                    items: pages,
                    hasMore: data.has_more,
                    nextCursor: data.next_cursor || undefined,
                };
            }
            catch (error) {
                throw new Error(`Failed to search Notion pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async listSpaces() {
            try {
                // List databases as "spaces"
                const body = {
                    filter: {
                        property: 'object',
                        value: 'database',
                    },
                    page_size: 100,
                };
                const response = await notionRequest('/search', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to list spaces: ${errorData?.message || response.statusText}`);
                }
                const data = await response.json();
                return data.results.map((db) => ({
                    id: db.id,
                    name: extractTitle(db),
                    description: db.description?.[0]?.plain_text,
                    icon: db.icon?.emoji || db.icon?.external?.url || undefined,
                    url: db.url,
                }));
            }
            catch (error) {
                throw new Error(`Failed to list Notion spaces: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async getSpace(spaceId) {
            try {
                // Get database as "space"
                const response = await notionRequest(`/databases/${spaceId}`);
                if (response.status === 404) {
                    return null;
                }
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to get space: ${errorData?.message || response.statusText}`);
                }
                const db = await response.json();
                return {
                    id: db.id,
                    name: extractTitle(db),
                    description: db.description?.[0]?.plain_text,
                    icon: db.icon?.emoji || db.icon?.external?.url || undefined,
                    url: db.url,
                };
            }
            catch (error) {
                if (error?.message?.includes('404')) {
                    return null;
                }
                throw new Error(`Failed to get Notion space: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
    };
}
/**
 * Notion provider definition
 */
export const notionProvider = defineProvider(notionInfo, async (config) => createNotionProvider(config));
