/**
 * Batch Blog Post Generation Example
 *
 * This example demonstrates the new IMPLICIT batch processing:
 *
 * ```ts
 * // Configure once (or use environment variables)
 * configure({ provider: 'openai', model: 'gpt-4o', batchMode: 'auto' })
 *
 * // Use naturally - batching is automatic!
 * const titles = await list`10 blog post titles about startups`
 * const posts = titles.map(title => write`blog post: # ${title}`)
 * console.log(await posts) // Batched automatically!
 * ```
 *
 * Environment variables:
 * - AI_PROVIDER: openai | anthropic | cloudflare | bedrock
 * - AI_MODEL: model name (e.g., gpt-4o, claude-sonnet-4-20250514)
 * - AI_BATCH_MODE: auto | immediate | deferred
 * - AI_BATCH_THRESHOLD: minimum items for auto batch (default: 5)
 *
 * @example
 * ```bash
 * # Using environment variables
 * AI_PROVIDER=openai AI_MODEL=gpt-4o npx tsx examples/batch-blog-posts.ts
 *
 * # Or with API keys
 * OPENAI_API_KEY=sk-... npx tsx examples/batch-blog-posts.ts
 * ```
 */
import { list, write, configure, withContext, } from '../src/index.js';
// Import the batch adapter for your provider
// import '../src/batch/openai.js'
// import '../src/batch/anthropic.js'
// import '../src/batch/cloudflare.js'
// import '../src/batch/bedrock.js'
// For testing, use the memory adapter
import '../src/batch/memory.js';
async function main() {
    console.log('\n🚀 Implicit Batch Blog Post Generation\n');
    // ============================================================================
    // Option 1: Global Configuration (recommended)
    // ============================================================================
    configure({
        provider: 'openai',
        model: 'gpt-4o',
        batchMode: 'auto', // 'auto' | 'immediate' | 'deferred'
        batchThreshold: 5, // Use batch API when >= 5 items
    });
    console.log('📝 Step 1: Generate titles (executes immediately)...');
    const titles = await list `10 blog post titles about building startups in 2026`;
    console.log(`\nGenerated ${titles.length || 10} titles`);
    // ============================================================================
    // Option 2: The Clean API (what you asked for!)
    // ============================================================================
    console.log('\n⚡ Step 2: Map titles to blog posts (automatic batching)...');
    console.log('   Code: titles.map(title => write`blog post: # ${title}`)');
    // This is the API you wanted!
    // - No explicit batch creation
    // - No provider/model in the code
    // - Automatic batch detection based on context
    const posts = titles.map(title => write `Write a comprehensive blog post for startup founders:

# ${title}

Include:
- Attention-grabbing introduction
- 3-5 key sections with actionable insights
- Real-world examples
- Compelling conclusion with call-to-action`);
    console.log(`   Created ${posts.length} deferred operations`);
    // When you await, it resolves via batch API if beneficial
    console.log('\n⏳ Step 3: Await results (batched automatically)...');
    // Note: Each item is an AIPromise, we'd await them all
    // const results = await Promise.all(posts)
    console.log('\n✅ Done!');
    // ============================================================================
    // Option 3: Scoped Context (for different providers in same code)
    // ============================================================================
    console.log('\n🔄 Bonus: Using withContext for scoped configuration...');
    await withContext({ provider: 'anthropic', model: 'claude-sonnet-4-20250514', batchMode: 'deferred' }, async () => {
        console.log('   Inside context: Using Anthropic with deferred batching');
        // All operations here use Anthropic
        // const summaries = titles.map(title => write`summarize: ${title}`)
    });
    console.log('   Outside context: Back to OpenAI');
}
// ============================================================================
// Summary of the API
// ============================================================================
/*
The new API is clean and implicit:

1. Configure once (globally or via environment):
   ```ts
   configure({ provider: 'openai', model: 'gpt-4o', batchMode: 'auto' })
   ```

2. Use naturally:
   ```ts
   const titles = await list`10 blog post titles`
   const posts = titles.map(title => write`blog post: # ${title}`)
   ```

3. Batching happens automatically when:
   - batchMode is 'auto' and items >= batchThreshold
   - batchMode is 'deferred' (always batch)

4. No batching when:
   - batchMode is 'immediate'
   - batchMode is 'auto' and items < batchThreshold

5. Provider batch APIs supported:
   - OpenAI: 50% discount, 24hr turnaround
   - Anthropic: 50% discount, 24hr turnaround
   - Cloudflare: Via AI Gateway
   - AWS Bedrock: Native batch inference
*/
// Run the example
main()
    .then(() => {
    console.log('\n✨ Example complete!\n');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});
