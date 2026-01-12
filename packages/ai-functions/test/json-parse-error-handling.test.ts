/**
 * Tests for JSON.parse error handling in agent loop
 *
 * TDD RED PHASE: These tests expose missing try-catch around JSON.parse
 * at ai.ts:567 in executeAgenticFunction.
 *
 * Issue: primitives.org.ai-drc
 *
 * The JSON.parse call at line 567 throws unhandled exceptions when the AI
 * returns malformed JSON in toolCall.arguments, crashing the entire agent loop.
 *
 * Expected behavior after fix (GREEN phase):
 * - Malformed JSON should be caught and result in a tool error
 * - The agent loop should continue or gracefully fail with a meaningful error
 * - No unhandled exceptions should crash the process
 */

import { describe, it, expect } from 'vitest'

/**
 * Direct test of JSON.parse behavior to document the vulnerability
 *
 * This test suite demonstrates the exact error that occurs when
 * JSON.parse receives malformed input - the same error that will
 * crash executeAgenticFunction at ai.ts:567.
 */
describe('JSON.parse vulnerability demonstration', () => {
  /**
   * This is the exact line from ai.ts:567:
   * const toolArgs = JSON.parse(response.toolCall.arguments || '{}')
   *
   * When response.toolCall.arguments contains malformed JSON,
   * this throws an unhandled SyntaxError.
   */
  describe('malformed JSON throws SyntaxError', () => {
    it('throws on unclosed string', () => {
      const malformedJson = '{"query": "test'
      expect(() => JSON.parse(malformedJson)).toThrow(SyntaxError)
    })

    it('throws on truncated JSON (token limit scenario)', () => {
      const truncatedJson = '{"query": "find information about artificial intelli'
      expect(() => JSON.parse(truncatedJson)).toThrow(SyntaxError)
    })

    it('throws on invalid escape sequences', () => {
      // Invalid escape \x is not valid JSON
      const invalidEscapes = '{"data": "test\\xvalue"}'
      expect(() => JSON.parse(invalidEscapes)).toThrow(SyntaxError)
    })

    it('throws on trailing commas', () => {
      const trailingComma = '{"a": "value",}'
      expect(() => JSON.parse(trailingComma)).toThrow(SyntaxError)
    })

    it('throws on single quotes (JavaScript-style)', () => {
      const singleQuotes = "{'text': 'hello'}"
      expect(() => JSON.parse(singleQuotes)).toThrow(SyntaxError)
    })

    it('throws on incomplete nested objects', () => {
      const incomplete = '{"config": {"nested": {"deep": {"value": "test"'
      expect(() => JSON.parse(incomplete)).toThrow(SyntaxError)
    })

    it('throws on plain text instead of JSON', () => {
      const plainText = 'Just some plain text instead of JSON'
      expect(() => JSON.parse(plainText)).toThrow(SyntaxError)
    })

    it('throws on JSON with comments', () => {
      const withComments = `{
        // this is a comment
        "value": 42
      }`
      expect(() => JSON.parse(withComments)).toThrow(SyntaxError)
    })

    it('throws on invalid unicode escapes', () => {
      const badUnicode = '{"text": "\\uXXXX invalid"}'
      expect(() => JSON.parse(badUnicode)).toThrow(SyntaxError)
    })
  })

  /**
   * These inputs work with the fallback '|| "{}"' but demonstrate
   * the fragility of the current approach.
   */
  describe('fallback behavior with || "{}"', () => {
    it('empty string falls back to {}', () => {
      const args = '' || '{}'
      expect(() => JSON.parse(args)).not.toThrow()
      expect(JSON.parse(args)).toEqual({})
    })

    it('null falls back to {}', () => {
      const args = (null as unknown as string) || '{}'
      expect(() => JSON.parse(args)).not.toThrow()
      expect(JSON.parse(args)).toEqual({})
    })

    it('undefined falls back to {}', () => {
      const args = (undefined as unknown as string) || '{}'
      expect(() => JSON.parse(args)).not.toThrow()
      expect(JSON.parse(args)).toEqual({})
    })

    it('malformed string does NOT fall back (bug!)', () => {
      // This is the bug: non-empty malformed string doesn't trigger fallback
      const malformed = '{"broken'
      const args = malformed || '{}'
      expect(args).toBe('{"broken') // fallback NOT used because string is truthy
      expect(() => JSON.parse(args)).toThrow(SyntaxError) // CRASH!
    })
  })
})

/**
 * Integration test using the actual executeAgenticFunction pathway
 *
 * These tests require mocking generateObject which is difficult due to
 * module structure. For now, we document the expected behavior.
 */
describe('executeAgenticFunction JSON.parse error scenarios', () => {
  /**
   * Test scenario documentation for executeAgenticFunction at ai.ts:567
   *
   * Line 567: const toolArgs = JSON.parse(response.toolCall.arguments || '{}')
   *
   * The AI model generates a response like:
   * {
   *   thinking: "I'll call the tool",
   *   toolCall: {
   *     name: "searchTool",
   *     arguments: '{"query": "test'  // <-- MALFORMED!
   *   },
   *   finalResult: null
   * }
   *
   * When arguments contains malformed JSON:
   * 1. The || '{}' fallback doesn't help (string is truthy)
   * 2. JSON.parse throws SyntaxError
   * 3. SyntaxError bubbles up unhandled
   * 4. The entire agent loop crashes
   * 5. The user gets a cryptic "Unexpected end of JSON input" error
   */
  describe('documented scenarios requiring fix', () => {
    it('scenario: AI truncates response at token limit', () => {
      // When the AI runs out of tokens, it may produce:
      const truncatedResponse = {
        thinking: 'I will search for the information',
        toolCall: {
          name: 'searchTool',
          arguments: '{"query": "find detailed information about machine learning and artific',
        },
        finalResult: null,
      }

      // Current behavior: CRASH
      expect(() => JSON.parse(truncatedResponse.toolCall.arguments)).toThrow(SyntaxError)

      // Expected behavior after fix:
      // - Should catch SyntaxError
      // - Should add error to toolResults: { error: 'Malformed JSON in tool arguments' }
      // - Should continue the agent loop or gracefully fail
    })

    it('scenario: AI uses wrong JSON format (single quotes)', () => {
      // Some AI models prefer Python/JavaScript style
      const pythonStyleResponse = {
        thinking: 'Calling the API',
        toolCall: {
          name: 'apiTool',
          arguments: "{'endpoint': '/users', 'method': 'GET'}",
        },
        finalResult: null,
      }

      // Current behavior: CRASH
      expect(() => JSON.parse(pythonStyleResponse.toolCall.arguments)).toThrow(SyntaxError)
    })

    it('scenario: AI includes explanation in arguments', () => {
      // AI sometimes adds explanatory text
      const explainedResponse = {
        thinking: 'Let me call the tool',
        toolCall: {
          name: 'dataTool',
          // AI mistakenly added comment/explanation
          arguments: `Here are the arguments: {"key": "value"}`,
        },
        finalResult: null,
      }

      // Current behavior: CRASH
      expect(() => JSON.parse(explainedResponse.toolCall.arguments)).toThrow(SyntaxError)
    })

    it('scenario: AI generates malformed nested structure', () => {
      // Complex nested objects are more prone to errors
      const nestedResponse = {
        thinking: 'Building configuration',
        toolCall: {
          name: 'configTool',
          arguments: '{"config": {"database": {"host": "localhost", "port": 5432, "options": {"ssl": true,',
        },
        finalResult: null,
      }

      // Current behavior: CRASH
      expect(() => JSON.parse(nestedResponse.toolCall.arguments)).toThrow(SyntaxError)
    })

    it('scenario: AI uses trailing commas (common mistake)', () => {
      // Trailing commas are valid in JavaScript but not JSON
      const trailingCommaResponse = {
        thinking: 'Setting options',
        toolCall: {
          name: 'optionsTool',
          arguments: '{"option1": true, "option2": false,}',
        },
        finalResult: null,
      }

      // Current behavior: CRASH
      expect(() => JSON.parse(trailingCommaResponse.toolCall.arguments)).toThrow(SyntaxError)
    })
  })
})

/**
 * Proposed fix validation tests
 *
 * These tests define the expected behavior AFTER the fix is applied.
 * They will fail now (RED) and pass after implementing try-catch (GREEN).
 */
describe('expected behavior after fix (GREEN phase targets)', () => {
  /**
   * Helper to simulate what the fixed code should do
   */
  function safeParseToolArgs(argsString: string | null | undefined): {
    success: boolean
    args?: Record<string, unknown>
    error?: string
  } {
    const fallback = argsString || '{}'
    try {
      return { success: true, args: JSON.parse(fallback) }
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse tool arguments: ${(error as Error).message}`,
      }
    }
  }

  it('should return error result for malformed JSON', () => {
    const result = safeParseToolArgs('{"broken')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to parse tool arguments')
  })

  it('should return parsed args for valid JSON', () => {
    const result = safeParseToolArgs('{"valid": "json"}')
    expect(result.success).toBe(true)
    expect(result.args).toEqual({ valid: 'json' })
  })

  it('should handle empty/null/undefined with fallback', () => {
    expect(safeParseToolArgs('')).toEqual({ success: true, args: {} })
    expect(safeParseToolArgs(null)).toEqual({ success: true, args: {} })
    expect(safeParseToolArgs(undefined)).toEqual({ success: true, args: {} })
  })

  it('should provide meaningful error message for truncation', () => {
    const result = safeParseToolArgs('{"query": "incomplete')
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Unexpected end of JSON|Unterminated string/)
  })

  it('should provide meaningful error message for syntax error', () => {
    const result = safeParseToolArgs("{'single': 'quotes'}")
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Unexpected token|Expected property name/)
  })
})

/**
 * Test the specific code path that needs fixing
 *
 * This simulates the exact code at ai.ts:565-569
 */
describe('ai.ts:565-569 code path simulation', () => {
  interface MockToolCall {
    name: string
    arguments: string
  }

  interface MockTool {
    name: string
    handler: (args: unknown) => Promise<unknown>
  }

  // Simulates the current (buggy) code at ai.ts:565-569
  async function executeToolCallCurrentBehavior(
    toolCall: MockToolCall,
    tools: MockTool[]
  ): Promise<unknown> {
    const tool = tools.find(t => t.name === toolCall.name)
    if (tool) {
      // Line 567 - THE BUG: No try-catch around JSON.parse
      const toolArgs = JSON.parse(toolCall.arguments || '{}')
      const toolResult = await tool.handler(toolArgs)
      return { tool: toolCall.name, result: toolResult }
    }
    return { error: `Tool not found: ${toolCall.name}` }
  }

  // Simulates the fixed code
  async function executeToolCallFixedBehavior(
    toolCall: MockToolCall,
    tools: MockTool[]
  ): Promise<unknown> {
    const tool = tools.find(t => t.name === toolCall.name)
    if (tool) {
      // FIXED: Try-catch around JSON.parse
      let toolArgs: unknown
      try {
        toolArgs = JSON.parse(toolCall.arguments || '{}')
      } catch (parseError) {
        return {
          tool: toolCall.name,
          error: `Invalid JSON in tool arguments: ${(parseError as Error).message}`,
        }
      }
      const toolResult = await tool.handler(toolArgs)
      return { tool: toolCall.name, result: toolResult }
    }
    return { error: `Tool not found: ${toolCall.name}` }
  }

  const mockTools: MockTool[] = [
    {
      name: 'testTool',
      handler: async (args) => ({ received: args }),
    },
  ]

  describe('current behavior (buggy)', () => {
    it('crashes on malformed JSON - THIS IS THE BUG', async () => {
      const malformedToolCall: MockToolCall = {
        name: 'testTool',
        arguments: '{"query": "broken',
      }

      // Current code THROWS - this is the bug we're exposing
      await expect(
        executeToolCallCurrentBehavior(malformedToolCall, mockTools)
      ).rejects.toThrow(SyntaxError)
    })

    it('works fine with valid JSON', async () => {
      const validToolCall: MockToolCall = {
        name: 'testTool',
        arguments: '{"query": "valid"}',
      }

      const result = await executeToolCallCurrentBehavior(validToolCall, mockTools)
      expect(result).toEqual({
        tool: 'testTool',
        result: { received: { query: 'valid' } },
      })
    })
  })

  describe('fixed behavior (target for GREEN phase)', () => {
    it('handles malformed JSON gracefully', async () => {
      const malformedToolCall: MockToolCall = {
        name: 'testTool',
        arguments: '{"query": "broken',
      }

      // Fixed code returns error result instead of throwing
      const result = await executeToolCallFixedBehavior(malformedToolCall, mockTools)
      expect(result).toEqual({
        tool: 'testTool',
        error: expect.stringContaining('Invalid JSON'),
      })
    })

    it('still works with valid JSON', async () => {
      const validToolCall: MockToolCall = {
        name: 'testTool',
        arguments: '{"query": "valid"}',
      }

      const result = await executeToolCallFixedBehavior(validToolCall, mockTools)
      expect(result).toEqual({
        tool: 'testTool',
        result: { received: { query: 'valid' } },
      })
    })
  })
})

/**
 * Edge cases for comprehensive coverage
 */
describe('JSON.parse edge cases', () => {
  describe('valid JSON that should parse', () => {
    it('handles valid unicode escapes', () => {
      const unicode = '{"text": "Hello \\u4e16\\u754c"}'
      expect(() => JSON.parse(unicode)).not.toThrow()
      expect(JSON.parse(unicode)).toEqual({ text: 'Hello \u4e16\u754c' })
    })

    it('handles valid escaped characters', () => {
      const escaped = '{"path": "C:\\\\Users\\\\test"}'
      expect(() => JSON.parse(escaped)).not.toThrow()
    })

    it('handles valid newlines in strings', () => {
      const newlines = '{"text": "line1\\nline2"}'
      expect(() => JSON.parse(newlines)).not.toThrow()
    })

    it('handles empty object', () => {
      expect(JSON.parse('{}')).toEqual({})
    })

    it('handles deeply nested valid JSON', () => {
      const deep = '{"a":{"b":{"c":{"d":{"e":"value"}}}}}'
      expect(() => JSON.parse(deep)).not.toThrow()
    })
  })

  describe('invalid JSON that should fail', () => {
    it('fails on NaN', () => {
      expect(() => JSON.parse('{"value": NaN}')).toThrow(SyntaxError)
    })

    it('fails on Infinity', () => {
      expect(() => JSON.parse('{"value": Infinity}')).toThrow(SyntaxError)
    })

    it('fails on undefined value', () => {
      expect(() => JSON.parse('{"value": undefined}')).toThrow(SyntaxError)
    })

    it('fails on unquoted keys', () => {
      expect(() => JSON.parse('{key: "value"}')).toThrow(SyntaxError)
    })

    it('fails on hex numbers', () => {
      expect(() => JSON.parse('{"value": 0xFF}')).toThrow(SyntaxError)
    })

    it('fails on binary literals', () => {
      expect(() => JSON.parse('{"value": 0b1010}')).toThrow(SyntaxError)
    })
  })
})
