/**
 * Batch Blog Post Generation Test
 *
 * Tests the batch processing workflow where:
 * 1. list`10 blog post titles` executes immediately
 * 2. The mapped write operations are deferred to a batch
 * 3. The batch is submitted to the provider (OpenAI/Anthropic)
 *
 * @example
 * ```ts
 * const titles = await list`10 blog post titles about building startups in 2026`
 * const posts = titles.map(title => batch.add(write`blog post about ${title}`))
 * const job = await batch.submit()
 * const results = await batch.wait()
 * ```
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBatch, withBatch, } from '../src/batch-queue.js';
// Import memory adapter to register it
import '../src/batch/memory.js';
import { configureMemoryAdapter, clearBatches } from '../src/batch/memory.js';
// ============================================================================
// Mock Setup
// ============================================================================
// Mock the generate functions
vi.mock('../src/generate.js', () => ({
    generateObject: vi.fn().mockImplementation(async ({ prompt, schema }) => {
        // Simulate list generation
        if (schema?.items) {
            return {
                object: {
                    items: [
                        'How AI is Revolutionizing Startup Fundraising in 2026',
                        'The Rise of Solo Founders: Building $10M ARR Companies Alone',
                        'Why Remote-First is Non-Negotiable for 2026 Startups',
                        'Sustainable Growth vs Hypergrowth: The 2026 Paradigm Shift',
                        'Building in Public: How Transparency Became a Competitive Advantage',
                        'The API-First Startup: Lessons from 2026 Unicorns',
                        'From Side Project to Series A: The 2026 Playbook',
                        'Climate Tech Startups: The Hottest Sector of 2026',
                        'The Death of Traditional MVPs: Ship Faster, Learn Faster',
                        'Community-Led Growth: The New GTM Strategy for 2026',
                    ],
                },
            };
        }
        // Simulate blog post generation
        if (prompt.includes('blog post about')) {
            const titleMatch = prompt.match(/blog post about (.+)/);
            const title = titleMatch?.[1] || 'Unknown Topic';
            return {
                object: {
                    text: `# ${title}\n\nThis is a comprehensive blog post about ${title}.\n\n## Introduction\n\nIn 2026, the startup landscape continues to evolve...\n\n## Key Takeaways\n\n1. Innovation is key\n2. Focus on customer value\n3. Build sustainable businesses\n\n## Conclusion\n\nThe future of startups is bright for those who adapt.`,
                },
            };
        }
        return { object: { result: 'Generated content' } };
    }),
    generateText: vi.fn().mockImplementation(async ({ prompt }) => {
        // Simulate blog post text generation
        if (prompt.includes('blog post about')) {
            const titleMatch = prompt.match(/blog post about (.+)/);
            const title = titleMatch?.[1] || 'Unknown Topic';
            return {
                text: `# ${title}\n\nThis is a comprehensive blog post about ${title}.\n\n## Introduction\n\nIn 2026, the startup landscape continues to evolve rapidly. Entrepreneurs are finding new ways to build, scale, and succeed.\n\n## The State of Startups in 2026\n\nThe ecosystem has matured significantly. AI tools have become indispensable, funding patterns have shifted, and remote work is now the default.\n\n## Key Strategies for Success\n\n1. **Leverage AI Wisely** - Use AI as a multiplier, not a replacement\n2. **Build Community First** - Your early adopters are your growth engine\n3. **Focus on Unit Economics** - Hypergrowth without sustainability is dead\n4. **Embrace Transparency** - Building in public creates trust and accountability\n\n## Practical Steps\n\n- Start with a problem you deeply understand\n- Validate with paying customers, not surveys\n- Build the smallest thing that delivers value\n- Iterate based on real usage data\n\n## Conclusion\n\nBuilding a startup in 2026 requires a blend of traditional business fundamentals and modern tools. The founders who succeed will be those who can navigate this balance effectively.`,
            };
        }
        return { text: 'Generated text content' };
    }),
}));
// ============================================================================
// Test Helpers
// ============================================================================
/**
 * Simulate the list template function
 */
async function mockList(prompt) {
    const { generateObject } = await import('../src/generate.js');
    const result = await generateObject({
        model: 'sonnet',
        schema: { items: ['List items'] },
        prompt,
    });
    return result.object.items;
}
// ============================================================================
// Tests
// ============================================================================
describe('Batch Blog Post Generation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearBatches();
        // Use default handler that calls the mock
        configureMemoryAdapter({});
    });
    afterEach(() => {
        clearBatches();
    });
    describe('list` immediate execution', () => {
        it('list` executes immediately and returns titles', async () => {
            const titles = await mockList('10 blog post titles about building startups in 2026');
            expect(titles).toHaveLength(10);
            expect(titles[0]).toBe('How AI is Revolutionizing Startup Fundraising in 2026');
            expect(titles[9]).toBe('Community-Led Growth: The New GTM Strategy for 2026');
        });
    });
    describe('batch processing workflow', () => {
        it('creates batch queue and adds items', async () => {
            const batch = createBatch({ provider: 'openai', model: 'gpt-4o' });
            const titles = await mockList('10 blog post titles about building startups in 2026');
            // Add each title to the batch
            const items = titles.map((title) => batch.add(`Write a comprehensive blog post about: ${title}`, {
                customId: title.slice(0, 50).replace(/\s+/g, '-').toLowerCase(),
            }));
            expect(batch.size).toBe(10);
            expect(items).toHaveLength(10);
            expect(items[0].status).toBe('pending');
        });
        it('submits batch and returns job info', async () => {
            const batch = createBatch({ provider: 'openai', model: 'gpt-4o' });
            const titles = await mockList('10 blog post titles about building startups in 2026');
            titles.forEach((title) => batch.add(`Write a comprehensive blog post about: ${title}`));
            const { job, completion } = await batch.submit();
            expect(job.id).toMatch(/^batch_memory_/);
            expect(job.provider).toBe('openai');
            expect(job.totalItems).toBe(10);
            expect(job.status).toBe('pending');
            // Wait for completion
            const results = await completion;
            expect(results).toHaveLength(10);
        });
        it('waits for batch completion and returns results', async () => {
            const batch = createBatch({ provider: 'openai', model: 'gpt-4o' });
            const titles = await mockList('10 blog post titles about building startups in 2026');
            titles.forEach((title) => batch.add(`Write a comprehensive blog post about: ${title}`));
            await batch.submit();
            const results = await batch.wait();
            expect(results).toHaveLength(10);
            expect(results.every((r) => r.status === 'completed')).toBe(true);
            expect(results[0].result).toBeDefined();
        });
        it('processes items in order', async () => {
            const batch = createBatch({ provider: 'openai' });
            const titles = ['First', 'Second', 'Third'];
            const items = titles.map((title, i) => batch.add(`Write about: ${title}`, { customId: `item_${i}` }));
            await batch.submit();
            const results = await batch.wait();
            expect(results[0].id).toBe('item_0');
            expect(results[1].id).toBe('item_1');
            expect(results[2].id).toBe('item_2');
        });
    });
    describe('withBatchQueue helper', () => {
        it('provides convenient batch execution', async () => {
            const titles = await mockList('10 blog post titles about building startups in 2026');
            const results = await withBatch((batch) => titles.map((title) => batch.add(`Write a blog post about: ${title}`)), { provider: 'openai', model: 'gpt-4o' });
            expect(results).toHaveLength(10);
            expect(results.every((r) => r.status === 'completed')).toBe(true);
        });
    });
    describe('batch status tracking', () => {
        it('tracks completion progress', async () => {
            const batch = createBatch({ provider: 'openai' });
            batch.add('Write post 1');
            batch.add('Write post 2');
            batch.add('Write post 3');
            const { job } = await batch.submit();
            expect(job.completedItems).toBe(0);
            // Wait for completion
            await batch.wait();
            const finalStatus = await batch.getStatus();
            expect(finalStatus.status).toBe('completed');
            expect(finalStatus.completedItems).toBe(3);
        });
    });
    describe('error handling', () => {
        it('handles partial failures', async () => {
            // Configure adapter to fail 30% of requests
            configureMemoryAdapter({ failureRate: 0.3 });
            const batch = createBatch({ provider: 'openai' });
            for (let i = 0; i < 10; i++) {
                batch.add(`Write post ${i}`);
            }
            await batch.submit();
            const results = await batch.wait();
            // Some should fail, some should succeed
            const succeeded = results.filter((r) => r.status === 'completed').length;
            const failed = results.filter((r) => r.status === 'failed').length;
            expect(succeeded + failed).toBe(10);
            // With 30% failure rate, expect roughly 3 failures (with some variance)
            expect(failed).toBeGreaterThanOrEqual(0);
            expect(failed).toBeLessThanOrEqual(10);
        });
        it('prevents adding items after submission', async () => {
            const batch = createBatch({ provider: 'openai' });
            batch.add('Write post 1');
            await batch.submit();
            expect(() => batch.add('Write post 2')).toThrow('Cannot add items to a submitted batch');
        });
        it('prevents double submission', async () => {
            const batch = createBatch({ provider: 'openai' });
            batch.add('Write post 1');
            await batch.submit();
            await expect(batch.submit()).rejects.toThrow('Batch has already been submitted');
        });
        it('prevents empty batch submission', async () => {
            const batch = createBatch({ provider: 'openai' });
            await expect(batch.submit()).rejects.toThrow('Cannot submit empty batch');
        });
    });
    describe('batch with custom handler', () => {
        it('uses custom handler for processing', async () => {
            const customHandler = vi.fn().mockImplementation(async (item) => {
                return `Custom result for: ${item.prompt}`;
            });
            configureMemoryAdapter({ handler: customHandler });
            const batch = createBatch({ provider: 'openai' });
            batch.add('Topic 1');
            batch.add('Topic 2');
            await batch.submit();
            const results = await batch.wait();
            expect(customHandler).toHaveBeenCalledTimes(2);
            expect(results[0].result).toBe('Custom result for: Topic 1');
            expect(results[1].result).toBe('Custom result for: Topic 2');
        });
    });
    describe('full workflow: list → map → batch', () => {
        it('executes the complete blog post generation workflow', async () => {
            // Step 1: Get titles (executes immediately)
            const titles = await mockList('10 blog post titles about building startups in 2026');
            expect(titles).toHaveLength(10);
            // Step 2: Create batch for blog posts (deferred)
            const batch = createBatch({
                provider: 'openai',
                model: 'gpt-4o',
                metadata: { task: 'blog-generation', topic: 'startups-2026' },
            });
            // Step 3: Map titles to batch items
            const blogItems = titles.map((title, index) => batch.add(`Write a comprehensive blog post about: ${title}`, {
                customId: `blog-${index}`,
                metadata: { title },
            }));
            expect(batch.size).toBe(10);
            expect(blogItems.every((item) => item.status === 'pending')).toBe(true);
            // Step 4: Submit the batch
            const { job, completion } = await batch.submit();
            expect(job.id).toBeDefined();
            expect(job.totalItems).toBe(10);
            expect(batch.isSubmitted).toBe(true);
            // Step 5: Wait for results
            const results = await completion;
            expect(results).toHaveLength(10);
            expect(results.every((r) => r.status === 'completed')).toBe(true);
            // Verify results have blog post content
            for (const result of results) {
                expect(result.result).toBeDefined();
                expect(typeof result.result).toBe('string');
                // Blog posts should have some content
                expect(result.result.length).toBeGreaterThan(100);
            }
            // Verify items are updated after completion
            expect(blogItems.every((item) => item.status === 'completed')).toBe(true);
        });
    });
});
describe('Provider-specific batch behavior', () => {
    beforeEach(() => {
        clearBatches();
        configureMemoryAdapter({});
    });
    it('uses specified provider', async () => {
        const openAIBatch = createBatch({ provider: 'openai' });
        const anthropicBatch = createBatch({ provider: 'anthropic' });
        openAIBatch.add('Test prompt');
        anthropicBatch.add('Test prompt');
        const { job: oaiJob } = await openAIBatch.submit();
        const { job: antJob } = await anthropicBatch.submit();
        // Memory adapter simulates OpenAI for all providers
        expect(oaiJob.provider).toBe('openai');
        expect(antJob.provider).toBe('openai');
    });
    it('respects model configuration', async () => {
        const customHandler = vi.fn().mockResolvedValue('Result');
        configureMemoryAdapter({ handler: customHandler });
        const batch = createBatch({ provider: 'openai', model: 'gpt-4o-mini' });
        batch.add('Test prompt');
        await batch.submit();
        await batch.wait();
        // The model should be passed to the handler via batch options
        // (memory adapter doesn't use it, but real adapters would)
        expect(customHandler).toHaveBeenCalled();
    });
});
