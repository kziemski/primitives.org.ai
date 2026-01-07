#!/usr/bin/env npx tsx
/**
 * Manual E2E Test for Flex Tier Processing
 *
 * Run this script manually with your OpenAI API key:
 *
 *   OPENAI_API_KEY=sk-... npx tsx test/e2e-flex-manual.ts
 *
 * Or if you have the key in your environment:
 *
 *   npx tsx test/e2e-flex-manual.ts
 */
import { configure, resetContext, getExecutionTier, isFlexAvailable, getProvider } from '../src/context.js';
import { getFlexAdapter } from '../src/batch-queue.js';
// Import the OpenAI adapter to register it
import '../src/batch/openai.js';
async function main() {
    console.log('\n🧪 E2E Flex Tier Test\n');
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY environment variable is required');
        console.error('   Run with: OPENAI_API_KEY=sk-... npx tsx test/e2e-flex-manual.ts');
        process.exit(1);
    }
    console.log('✅ OpenAI API key found');
    // Configure
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
    console.log('   Creating 5 simple math prompts...');
    const adapter = getFlexAdapter('openai');
    const items = [
        { id: 'math_1', prompt: 'What is 2 + 2? Reply with just the number.', status: 'pending' },
        { id: 'math_2', prompt: 'What is 3 + 3? Reply with just the number.', status: 'pending' },
        { id: 'math_3', prompt: 'What is 4 + 4? Reply with just the number.', status: 'pending' },
        { id: 'math_4', prompt: 'What is 5 + 5? Reply with just the number.', status: 'pending' },
        { id: 'math_5', prompt: 'What is 6 + 6? Reply with just the number.', status: 'pending' },
    ];
    console.log('   Submitting via flex adapter...');
    const startTime = Date.now();
    try {
        const results = await adapter.submitFlex(items, { model: 'gpt-4o-mini' });
        const duration = Date.now() - startTime;
        console.log(`   ✅ Completed in ${duration}ms`);
        console.log('   Results:');
        let allPassed = true;
        const expected = ['4', '6', '8', '10', '12'];
        results.forEach((result, i) => {
            const passed = result.status === 'completed' && result.result?.toString().includes(expected[i]);
            const icon = passed ? '✅' : '❌';
            console.log(`     ${icon} ${result.id}: "${result.result}" (expected: ${expected[i]})`);
            if (!passed)
                allPassed = false;
        });
        if (!allPassed) {
            console.log('\n⚠️  Some results did not match expected values');
        }
    }
    catch (error) {
        console.error(`   ❌ Error: ${error}`);
        process.exit(1);
    }
    // Test 2: Structured output
    console.log('\n📝 Test 2: Structured Output (JSON Schema)');
    const structuredItems = [
        {
            id: 'person_1',
            prompt: 'Generate a JSON object with name "Alice" and age 30. Format: {"name": "...", "age": ...}',
            schema: { name: 'string', age: 'number' },
            status: 'pending',
        },
        {
            id: 'person_2',
            prompt: 'Generate a JSON object with name "Bob" and age 25. Format: {"name": "...", "age": ...}',
            schema: { name: 'string', age: 'number' },
            status: 'pending',
        },
    ];
    try {
        const results = await adapter.submitFlex(structuredItems, { model: 'gpt-4o-mini' });
        console.log('   Results:');
        results.forEach((result) => {
            const obj = result.result;
            console.log(`     ${result.id}: name="${obj?.name}", age=${obj?.age}`);
        });
        console.log('   ✅ Structured output works');
    }
    catch (error) {
        console.error(`   ❌ Error: ${error}`);
    }
    // Test 3: Token usage
    console.log('\n📝 Test 3: Token Usage Tracking');
    const usageItems = [
        { id: 'usage', prompt: 'Count from 1 to 10', status: 'pending' },
    ];
    try {
        const results = await adapter.submitFlex(usageItems, { model: 'gpt-4o-mini' });
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
    // Test 4: Concurrent processing performance
    console.log('\n📝 Test 4: Concurrent Processing Performance');
    console.log('   Creating 10 items to test concurrency...');
    const concurrentItems = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent_${i}`,
        prompt: `What is ${i + 1} * 2? Reply with just the number.`,
        status: 'pending',
    }));
    try {
        const startTime = Date.now();
        const results = await adapter.submitFlex(concurrentItems, { model: 'gpt-4o-mini' });
        const duration = Date.now() - startTime;
        const successCount = results.filter((r) => r.status === 'completed').length;
        console.log(`   ✅ Processed ${successCount}/10 items in ${duration}ms`);
        console.log(`   Average: ${Math.round(duration / 10)}ms per item`);
        if (duration < 10000) {
            console.log('   ✅ Concurrent processing is working (< 10s for 10 items)');
        }
        else {
            console.log('   ⚠️  Slower than expected, may not be fully concurrent');
        }
    }
    catch (error) {
        console.error(`   ❌ Error: ${error}`);
    }
    // Test 5: Tier selection
    console.log('\n📝 Test 5: Execution Tier Selection');
    console.log(`   1 item  → ${getExecutionTier(1)} (expected: immediate)`);
    console.log(`   3 item  → ${getExecutionTier(3)} (expected: flex, threshold=3)`);
    console.log(`   10 items → ${getExecutionTier(10)} (expected: flex)`);
    console.log(`   500 items → ${getExecutionTier(500)} (expected: batch)`);
    console.log('\n✨ E2E Tests Complete!\n');
    resetContext();
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
