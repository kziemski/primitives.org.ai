#!/usr/bin/env npx tsx
/**
 * Manual E2E Test for AWS Bedrock Flex Tier Processing
 *
 * Run with your AWS credentials:
 *
 *   AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... npx tsx test/e2e-bedrock-manual.ts
 *
 * Or if using AWS SSO/profiles:
 *
 *   AWS_PROFILE=your-profile npx tsx test/e2e-bedrock-manual.ts
 */

import { configure, resetContext, getExecutionTier, isFlexAvailable, getProvider } from '../src/context.js'
import { type BatchItem } from '../src/batch-queue.js'
import { configureAWSBedrock, bedrockFlexAdapter } from '../src/batch/bedrock.js'

// Model IDs on Bedrock
const CLAUDE_OPUS_MODEL = 'anthropic.claude-opus-4-20250514-v1:0'
const CLAUDE_SONNET_MODEL = 'anthropic.claude-sonnet-4-20250514-v1:0'

async function main() {
  console.log('\n🧪 E2E AWS Bedrock Flex Tier Test\n')

  // Check for AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
    console.error('❌ AWS credentials required')
    console.error('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
    console.error('   Or use AWS_PROFILE for SSO/credential profiles')
    process.exit(1)
  }

  console.log('✅ AWS credentials found')
  console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`)

  // Configure Bedrock
  configureAWSBedrock({
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: 'dummy-bucket', // Flex mode doesn't use S3
  })

  configure({
    provider: 'bedrock',
    model: CLAUDE_SONNET_MODEL,
    batchMode: 'auto',
    flexThreshold: 3,
    batchThreshold: 500,
  })

  console.log(`✅ Configured: provider=${getProvider()}, flexAvailable=${isFlexAvailable()}`)

  // Test 1: Basic flex processing with Claude Sonnet
  console.log('\n📝 Test 1: Basic Flex Processing (Claude Sonnet)')
  console.log('   Creating 3 simple prompts...')

  const items: BatchItem[] = [
    { id: 'test_1', prompt: 'What is 2 + 2? Reply with just the number.', status: 'pending' },
    { id: 'test_2', prompt: 'What is 3 + 3? Reply with just the number.', status: 'pending' },
    { id: 'test_3', prompt: 'What is 4 + 4? Reply with just the number.', status: 'pending' },
  ]

  console.log('   Submitting via flex adapter...')
  const startTime = Date.now()

  try {
    const results = await bedrockFlexAdapter.submitFlex(items, { model: CLAUDE_SONNET_MODEL })
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
    const results = await bedrockFlexAdapter.submitFlex(usageItems, { model: CLAUDE_SONNET_MODEL })
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

  // Test 3: Try Claude Opus 4.5 (may not be available)
  console.log('\n📝 Test 3: Claude Opus 4.5 (optional)')

  const opusItems: BatchItem[] = [
    { id: 'opus', prompt: 'Write a haiku about AI.', status: 'pending' },
  ]

  try {
    const results = await bedrockFlexAdapter.submitFlex(opusItems, { model: CLAUDE_OPUS_MODEL })
    console.log(`   ✅ Claude Opus 4.5 response:`)
    console.log(`   ${results[0].result}`)
  } catch (error) {
    console.log(`   ⚠️  Claude Opus 4.5 not available: ${error}`)
    console.log('   (This is expected if Opus is not enabled in your AWS account)')
  }

  // Test 4: Concurrent processing
  console.log('\n📝 Test 4: Concurrent Processing (5 items)')

  const concurrentItems: BatchItem[] = Array.from({ length: 5 }, (_, i) => ({
    id: `concurrent_${i}`,
    prompt: `What is ${i + 1} * 2? Reply with just the number.`,
    status: 'pending' as const,
  }))

  try {
    const startTime = Date.now()
    const results = await bedrockFlexAdapter.submitFlex(concurrentItems, { model: CLAUDE_SONNET_MODEL })
    const duration = Date.now() - startTime

    const successCount = results.filter((r) => r.status === 'completed').length
    console.log(`   ✅ Processed ${successCount}/5 items in ${duration}ms`)

    results.forEach((result) => {
      console.log(`     ${result.id}: "${result.result}"`)
    })
  } catch (error) {
    console.error(`   ❌ Error: ${error}`)
  }

  // Test 5: Tier selection
  console.log('\n📝 Test 5: Execution Tier Selection')

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
