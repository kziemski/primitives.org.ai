#!/usr/bin/env npx tsx
/**
 * Manual E2E Test for Google GenAI (Gemini) Flex Tier Processing
 *
 * Run with your Google API key:
 *
 *   GOOGLE_API_KEY=... npx tsx test/e2e-google-manual.ts
 *
 * Or:
 *
 *   GEMINI_API_KEY=... npx tsx test/e2e-google-manual.ts
 */

import { configure, resetContext, getExecutionTier, isFlexAvailable, getProvider } from '../src/context.js'
import { type BatchItem } from '../src/batch-queue.js'
import { configureGoogleGenAI, googleFlexAdapter } from '../src/batch/google.js'

// Gemini models
const GEMINI_FLASH = 'gemini-2.0-flash'
const GEMINI_PRO = 'gemini-1.5-pro'

async function main() {
  console.log('\n🧪 E2E Google GenAI (Gemini) Flex Tier Test\n')

  // Check for API key
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('❌ Google API key required')
    console.error('   Set GOOGLE_API_KEY or GEMINI_API_KEY')
    console.error('   Get one at: https://aistudio.google.com/app/apikey')
    process.exit(1)
  }

  console.log('✅ Google API key found')

  // Configure
  configure({
    provider: 'google',
    model: GEMINI_FLASH,
    batchMode: 'auto',
    flexThreshold: 3,
    batchThreshold: 500,
  })

  console.log(`✅ Configured: provider=${getProvider()}, flexAvailable=${isFlexAvailable()}`)

  // Test 1: Basic flex processing with Gemini 2.0 Flash
  console.log('\n📝 Test 1: Basic Flex Processing (Gemini 2.0 Flash)')
  console.log('   Creating 3 simple prompts...')

  const items: BatchItem[] = [
    { id: 'test_1', prompt: 'What is 2 + 2? Reply with just the number.', status: 'pending' },
    { id: 'test_2', prompt: 'What is 3 + 3? Reply with just the number.', status: 'pending' },
    { id: 'test_3', prompt: 'What is 4 + 4? Reply with just the number.', status: 'pending' },
  ]

  console.log('   Submitting via flex adapter...')
  const startTime = Date.now()

  try {
    const results = await googleFlexAdapter.submitFlex(items, { model: GEMINI_FLASH })
    const duration = Date.now() - startTime

    console.log(`   ✅ Completed in ${duration}ms`)
    console.log('   Results:')

    results.forEach((result) => {
      const status = result.status === 'completed' ? '✅' : '❌'
      console.log(`     ${status} ${result.id}: "${result.result}"`)
      if (result.error) {
        console.log(`        Error: ${result.error}`)
      }
    })
  } catch (error) {
    console.error(`   ❌ Error: ${error}`)
    process.exit(1)
  }

  // Test 2: Token usage
  console.log('\n📝 Test 2: Token Usage Tracking')

  const usageItems: BatchItem[] = [
    { id: 'usage', prompt: 'Count from 1 to 5', status: 'pending' },
  ]

  try {
    const results = await googleFlexAdapter.submitFlex(usageItems, { model: GEMINI_FLASH })
    const usage = results[0].usage

    if (usage) {
      console.log(`   Prompt tokens: ${usage.promptTokens}`)
      console.log(`   Completion tokens: ${usage.completionTokens}`)
      console.log(`   Total tokens: ${usage.totalTokens}`)
      console.log('   ✅ Token usage tracking works')
    } else {
      console.log('   ⚠️  No usage data returned')
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error}`)
  }

  // Test 3: Structured output (JSON)
  console.log('\n📝 Test 3: Structured Output (JSON)')

  const jsonItems: BatchItem[] = [
    {
      id: 'json_test',
      prompt: 'Generate a JSON object with name "Alice" and age 30. Return only valid JSON, no markdown.',
      schema: { name: 'string', age: 'number' },
      status: 'pending',
    },
  ]

  try {
    const results = await googleFlexAdapter.submitFlex(jsonItems, { model: GEMINI_FLASH })
    console.log(`   Result: ${JSON.stringify(results[0].result)}`)
    console.log('   ✅ Structured output works')
  } catch (error) {
    console.error(`   ❌ Error: ${error}`)
  }

  // Test 4: Concurrent processing
  console.log('\n📝 Test 4: Concurrent Processing (10 items)')

  const concurrentItems: BatchItem[] = Array.from({ length: 10 }, (_, i) => ({
    id: `concurrent_${i}`,
    prompt: `What is ${i + 1} * 2? Reply with just the number.`,
    status: 'pending' as const,
  }))

  try {
    const startTime = Date.now()
    const results = await googleFlexAdapter.submitFlex(concurrentItems, { model: GEMINI_FLASH })
    const duration = Date.now() - startTime

    const successCount = results.filter((r) => r.status === 'completed').length
    console.log(`   ✅ Processed ${successCount}/10 items in ${duration}ms`)
    console.log(`   Average: ${Math.round(duration / 10)}ms per item`)

    results.forEach((result) => {
      console.log(`     ${result.id}: "${result.result}"`)
    })
  } catch (error) {
    console.error(`   ❌ Error: ${error}`)
  }

  // Test 5: Gemini 1.5 Pro
  console.log('\n📝 Test 5: Gemini 1.5 Pro')

  const proItems: BatchItem[] = [
    { id: 'pro_test', prompt: 'Write a haiku about AI.', status: 'pending' },
  ]

  try {
    const results = await googleFlexAdapter.submitFlex(proItems, { model: GEMINI_PRO })
    console.log(`   ✅ Gemini 1.5 Pro response:`)
    console.log(`   ${results[0].result}`)
  } catch (error) {
    console.error(`   ❌ Error: ${error}`)
  }

  // Test 6: Tier selection
  console.log('\n📝 Test 6: Execution Tier Selection')

  console.log(`   1 item   → ${getExecutionTier(1)} (expected: immediate)`)
  console.log(`   3 items  → ${getExecutionTier(3)} (expected: flex)`)
  console.log(`   10 items → ${getExecutionTier(10)} (expected: flex)`)
  console.log(`   500 items → ${getExecutionTier(500)} (expected: batch)`)

  console.log('\n✨ E2E Tests Complete!\n')

  resetContext()
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
