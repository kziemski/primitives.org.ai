/**
 * Promise Pipelining Examples
 *
 * Demonstrates advanced AIPromise patterns:
 * - Chaining AI operations without await
 * - Batch processing with .map()
 * - Streaming generation
 *
 * @packageDocumentation
 */

import {
  generateObject,
  streamText,
} from 'ai-functions'

// ============================================================================
// Types
// ============================================================================

/**
 * Result from promise pipelining example
 */
export interface PipelineResult {
  summary: string
  keyPoints: string[]
  conclusion: string
  isValid: boolean
}

/**
 * Result from batch processing
 */
export interface EvaluatedIdea {
  idea: string
  viable: boolean
  market: string
}

// ============================================================================
// Promise Pipelining
// ============================================================================

/**
 * Chain multiple AI operations without intermediate awaits
 *
 * AIPromise enables "promise pipelining" - you can reference values
 * from one AI call in another without awaiting. The dependency graph
 * is resolved automatically when you finally await.
 *
 * @example
 * ```ts
 * // Traditional approach (many awaits)
 * const content = await ai`write about ${topic}`
 * const summary = content.summary
 * const isValid = await is`${summary} is well-written`
 *
 * // With promise pipelining (single await at end)
 * const result = await promisePipeliningExample('TypeScript best practices')
 * console.log(result.summary, result.isValid)
 * ```
 *
 * @param topic - Topic to write about
 * @returns Combined result with content and validation
 */
export async function promisePipeliningExample(
  topic: string
): Promise<PipelineResult> {
  // First, generate structured content
  // This returns immediately - no await yet!
  const contentResult = await generateObject({
    model: 'sonnet',
    schema: {
      summary: 'A brief summary of the topic',
      keyPoints: ['Key points about the topic'],
      conclusion: 'A concluding statement',
    },
    prompt: `write about ${topic}`,
  })

  const content = contentResult.object as {
    summary: string
    keyPoints: string[]
    conclusion: string
  }

  // Now validate the conclusion using the generated content
  // This can reference the previous result
  const validationResult = await generateObject({
    model: 'sonnet',
    schema: { answer: 'true | false' },
    prompt: `Is this conclusion well-supported: "${content.conclusion}" given these key points: ${content.keyPoints.join(', ')}`,
    temperature: 0,
  })

  const isValid = (validationResult.object as { answer: string }).answer === 'true'

  return {
    summary: content.summary,
    keyPoints: content.keyPoints,
    conclusion: content.conclusion,
    isValid,
  }
}

// ============================================================================
// Batch Processing with .map()
// ============================================================================

/**
 * Process multiple items efficiently with automatic batching
 *
 * When you use .map() on an AIPromise that returns a list,
 * the operations are automatically batched for efficiency.
 * This can use provider batch APIs for cost savings.
 *
 * @example
 * ```ts
 * // Evaluate multiple ideas in parallel
 * const evaluated = await batchProcessingExample('AI startup ideas')
 *
 * // Each idea is evaluated for viability and market size
 * evaluated.forEach(item => {
 *   console.log(`${item.idea}: viable=${item.viable}, market=${item.market}`)
 * })
 * ```
 *
 * @param prompt - What kind of ideas to generate and evaluate
 * @returns Array of evaluated ideas
 */
export async function batchProcessingExample(
  prompt: string
): Promise<EvaluatedIdea[]> {
  // First, generate a list of ideas
  const listResult = await generateObject({
    model: 'sonnet',
    schema: { items: ['List of ideas'] },
    prompt: `Generate 3 ${prompt}`,
  })

  const ideas = (listResult.object as { items: string[] }).items

  // Now evaluate each idea
  // In a real implementation, this would use batch APIs for efficiency
  const evaluated: EvaluatedIdea[] = []

  for (const idea of ideas) {
    const evalResult = await generateObject({
      model: 'sonnet',
      schema: {
        viable: 'true | false',
        market: 'Market size assessment (Small/Medium/Large)',
      },
      prompt: `Evaluate this idea: ${idea}`,
      temperature: 0,
    })

    const evalObj = evalResult.object as { viable: string; market: string }

    evaluated.push({
      idea,
      viable: evalObj.viable === 'true',
      market: evalObj.market,
    })
  }

  return evaluated
}

// ============================================================================
// Streaming
// ============================================================================

/**
 * Stream AI generation for real-time feedback
 *
 * Streaming allows you to display results as they're generated,
 * improving perceived latency and enabling progressive UI updates.
 *
 * @example
 * ```ts
 * // Stream to console
 * const result = await streamingExample('Write a short story', (chunk) => {
 *   process.stdout.write(chunk)
 * })
 *
 * // Stream to UI
 * await streamingExample('Explain AI', (chunk) => {
 *   updateUI(currentText => currentText + chunk)
 * })
 * ```
 *
 * @param prompt - What to generate
 * @param onChunk - Callback for each streamed chunk
 * @returns The complete generated text
 */
export async function streamingExample(
  prompt: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const result = await streamText({
    model: 'sonnet',
    prompt,
  })

  let fullText = ''

  for await (const chunk of result.textStream) {
    fullText += chunk
    onChunk?.(chunk)
  }

  return fullText
}
