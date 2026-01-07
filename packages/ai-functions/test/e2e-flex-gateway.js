#!/usr/bin/env npx tsx
/**
 * E2E Test for Flex Tier via Cloudflare AI Gateway
 *
 * This test uses the Cloudflare AI Gateway to route requests to OpenAI,
 * using the AI_GATEWAY_TOKEN and AI_GATEWAY_URL environment variables.
 *
 * Run with:
 *   npx tsx test/e2e-flex-gateway.ts
 */
import { configure, resetContext, getExecutionTier, isFlexAvailable, getProvider } from '../src/context.js';
import { configureOpenAI, openaiFlexAdapter } from '../src/batch/openai.js';
async function main() {
    console.log('\n🧪 E2E Flex Tier Test (via Cloudflare AI Gateway)\n');
    // Check for gateway config
    const gatewayUrl = process.env.AI_GATEWAY_URL;
    const gatewayToken = process.env.AI_GATEWAY_TOKEN;
    if (!gatewayUrl || !gatewayToken) {
        console.error('❌ AI_GATEWAY_URL and AI_GATEWAY_TOKEN environment variables are required');
        console.error('   These should be in .env at the repo root');
        process.exit(1);
    }
    console.log(`✅ Gateway URL: ${gatewayUrl}`);
    console.log('✅ Gateway Token found');
    // Configure OpenAI adapter to use the gateway
    // The gateway URL format is: https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}
    // We need to append /openai to route to OpenAI
    const openaiGatewayUrl = `${gatewayUrl}/openai`;
    console.log(`   Using base URL: ${openaiGatewayUrl}`);
    configureOpenAI({
        apiKey: gatewayToken,
        baseUrl: openaiGatewayUrl,
    });
    // Configure context
    configure({
        provider: 'openai',
        model: 'gpt-4o-mini',
        batchMode: 'auto',
        flexThreshold: 3,
        batchThreshold: 500,
    });
    console.log(`✅ Configured: provider=${getProvider()}, flexAvailable=${isFlexAvailable()}`);
    // Test 1: Basic flex processing
    console.log('\n📝 Test 1: Basic Flex Processing');
    console.log('   Creating 3 simple prompts...');
    const items = [
        { id: 'test_1', prompt: 'Say "hello" and nothing else.', status: 'pending' },
        { id: 'test_2', prompt: 'Say "world" and nothing else.', status: 'pending' },
        { id: 'test_3', prompt: 'Say "test" and nothing else.', status: 'pending' },
    ];
    console.log('   Submitting via flex adapter...');
    const startTime = Date.now();
    try {
        const results = await openaiFlexAdapter.submitFlex(items, { model: 'gpt-4o-mini' });
        const duration = Date.now() - startTime;
        console.log(`   ✅ Completed in ${duration}ms`);
        console.log('   Results:');
        results.forEach((result) => {
            const status = result.status === 'completed' ? '✅' : '❌';
            console.log(`     ${status} ${result.id}: "${result.result}"`);
            if (result.error) {
                console.log(`        Error: ${result.error}`);
            }
        });
        const successCount = results.filter((r) => r.status === 'completed').length;
        if (successCount === results.length) {
            console.log(`   ✅ All ${successCount} items completed successfully`);
        }
        else {
            console.log(`   ⚠️  ${successCount}/${results.length} items completed`);
        }
    }
    catch (error) {
        console.error(`   ❌ Error: ${error}`);
        process.exit(1);
    }
    // Test 2: Token usage
    console.log('\n📝 Test 2: Token Usage Tracking');
    const usageItems = [
        { id: 'usage', prompt: 'Count from 1 to 5', status: 'pending' },
    ];
    try {
        const results = await openaiFlexAdapter.submitFlex(usageItems, { model: 'gpt-4o-mini' });
        const usage = results[0].usage;
        if (usage) {
            console.log(`   Prompt tokens: ${usage.promptTokens}`);
            console.log(`   Completion tokens: ${usage.completionTokens}`);
            console.log(`   Total tokens: ${usage.totalTokens}`);
            console.log('   ✅ Token usage tracking works');
        }
        else {
            console.log('   ⚠️  No usage data returned');
        }
    }
    catch (error) {
        console.error(`   ❌ Error: ${error}`);
    }
    // Test 3: Concurrent processing
    console.log('\n📝 Test 3: Concurrent Processing (5 items)');
    const concurrentItems = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent_${i}`,
        prompt: `What is ${i + 1} + ${i + 1}? Reply with just the number.`,
        status: 'pending',
    }));
    try {
        const startTime = Date.now();
        const results = await openaiFlexAdapter.submitFlex(concurrentItems, { model: 'gpt-4o-mini' });
        const duration = Date.now() - startTime;
        const successCount = results.filter((r) => r.status === 'completed').length;
        console.log(`   ✅ Processed ${successCount}/5 items in ${duration}ms`);
        console.log(`   Average: ${Math.round(duration / 5)}ms per item`);
        results.forEach((result) => {
            console.log(`     ${result.id}: "${result.result}"`);
        });
    }
    catch (error) {
        console.error(`   ❌ Error: ${error}`);
    }
    // Test 4: Tier selection
    console.log('\n📝 Test 4: Execution Tier Selection');
    console.log(`   1 item   → ${getExecutionTier(1)} (expected: immediate)`);
    console.log(`   3 items  → ${getExecutionTier(3)} (expected: flex)`);
    console.log(`   10 items → ${getExecutionTier(10)} (expected: flex)`);
    console.log(`   500 items → ${getExecutionTier(500)} (expected: batch)`);
    console.log('\n✨ E2E Tests Complete!\n');
    resetContext();
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
