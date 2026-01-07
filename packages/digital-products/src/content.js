/**
 * Content() - Define content
 */
import { registerProduct } from './product.js';
/**
 * Create a content definition
 *
 * @example
 * ```ts
 * const blogContent = Content({
 *   id: 'blog',
 *   name: 'Blog Posts',
 *   description: 'Blog content for the website',
 *   version: '1.0.0',
 *   format: 'mdx',
 *   source: './content/blog',
 *   frontmatter: {
 *     title: 'Post title',
 *     author: 'Author name',
 *     date: 'Publication date (date)',
 *     tags: ['Array of tags'],
 *   },
 *   categories: ['Technology', 'Business', 'Design'],
 *   workflow: Workflow({
 *     states: ['draft', 'review', 'published'],
 *     initialState: 'draft',
 *     transitions: [
 *       { from: 'draft', to: 'review', action: 'submit' },
 *       { from: 'review', to: 'published', action: 'approve' },
 *       { from: 'review', to: 'draft', action: 'reject' },
 *     ],
 *   }),
 * })
 * ```
 */
export function Content(config) {
    const content = {
        type: 'content',
        id: config.id,
        name: config.name,
        description: config.description,
        version: config.version,
        format: config.format || 'markdown',
        source: config.source,
        schema: config.schema,
        frontmatter: config.frontmatter,
        categories: config.categories,
        workflow: config.workflow,
        metadata: config.metadata,
        tags: config.tags,
        status: config.status || 'active',
    };
    return registerProduct(content);
}
/**
 * Helper to create a workflow definition
 *
 * @example
 * ```ts
 * const workflow = Workflow({
 *   states: ['draft', 'review', 'published', 'archived'],
 *   initialState: 'draft',
 *   transitions: [
 *     { from: 'draft', to: 'review', action: 'submit' },
 *     { from: 'review', to: 'published', action: 'approve' },
 *     { from: 'review', to: 'draft', action: 'reject' },
 *     { from: 'published', to: 'archived', action: 'archive' },
 *   ],
 *   approvals: [
 *     { state: 'review', roles: ['editor', 'admin'] },
 *   ],
 * })
 * ```
 */
export function Workflow(config) {
    return config;
}
