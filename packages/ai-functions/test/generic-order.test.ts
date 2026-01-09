/**
 * GREEN Phase: Tests for <TOutput, TInput> generic order
 *
 * Issue: primitives.org.ai-z7f
 *
 * These tests verify that the generic type parameters follow
 * the <TOutput, TInput> convention (output first, input second).
 *
 * The types have been fixed to use <TOutput, TInput> order.
 */

import { describe, it, expect } from 'vitest'
import type {
  AIFunctionDefinition,
  BaseFunctionDefinition,
  CodeFunctionDefinition,
  GenerativeFunctionDefinition,
  AgenticFunctionDefinition,
  HumanFunctionDefinition,
  DefinedFunction,
  FunctionDefinition,
} from '../src/types.js'

// ============================================================================
// Test data types
// ============================================================================

interface User {
  id: string
  name: string
  email: string
}

interface CreateUserInput {
  name: string
  email: string
}

// ============================================================================
// AIFunctionDefinition generic order tests
// ============================================================================

describe('AIFunctionDefinition<TOutput, TInput> generic order', () => {
  describe('output-only usage (single generic)', () => {
    it('AIFunctionDefinition<string> - first generic should be OUTPUT', () => {
      // Order: AIFunctionDefinition<TOutput = string, TInput = unknown>
      //   handler: (input: unknown) => string | Promise<string>

      const def: AIFunctionDefinition<string> = {
        name: 'test',
        description: 'test',
        parameters: {},
        // handler accepts unknown, returns string
        handler: (input: unknown) => String(input).toUpperCase(),
      }

      // Get the result - should be string | Promise<string>
      const result = def.handler('test')

      // This should compile - result is string | Promise<string>
      const _s: string | Promise<string> = result
      expect(result).toBe('TEST')
    })
  })

  describe('two-generic usage', () => {
    it('AIFunctionDefinition<string, number> - handler signature test', () => {
      // Order: AIFunctionDefinition<TOutput = string, TInput = number>
      //   handler: (input: number) => string | Promise<string>

      const def: AIFunctionDefinition<string, number> = {
        name: 'test',
        description: 'test',
        parameters: {},
        // handler accepts number, returns string
        handler: (input: number): string => `Value: ${input}`,
      }

      // handler should accept number
      const result = def.handler(42)

      // result should be string | Promise<string>
      const _s: string | Promise<string> = result
      expect(result).toBe('Value: 42')
    })

    it('AIFunctionDefinition<User, CreateUserInput> - real-world example', () => {
      // Order: AIFunctionDefinition<TOutput = User, TInput = CreateUserInput>
      //   handler: (input: CreateUserInput) => User | Promise<User>

      const def: AIFunctionDefinition<User, CreateUserInput> = {
        name: 'createUser',
        description: 'Creates a user',
        parameters: {},
        // handler accepts CreateUserInput, returns User
        handler: (input: CreateUserInput): User => ({
          id: '1',
          name: input.name,
          email: input.email,
        }),
      }

      // Should accept CreateUserInput
      const result = def.handler({ name: 'Alice', email: 'alice@test.com' })

      // Should return User with id
      const _id: string = (result as User).id
      expect((result as User).id).toBe('1')
    })
  })
})

// ============================================================================
// BaseFunctionDefinition generic order tests
// ============================================================================

describe('BaseFunctionDefinition<TOutput, TInput> generic order', () => {
  it('BaseFunctionDefinition<string, number> - args and returnType', () => {
    // Order: BaseFunctionDefinition<TOutput = string, TInput = number>
    //   args: number (TInput)
    //   returnType?: string (TOutput)

    const def: BaseFunctionDefinition<string, number> = {
      name: 'test',
      args: 42, // args is TInput (number)
      returnType: 'result', // returnType is TOutput (string)
    }

    // args should be number
    const _argsNum: number = def.args
    expect(def.args).toBe(42)

    // returnType should be string
    const _retStr: string = def.returnType!
    expect(def.returnType).toBe('result')
  })
})

// ============================================================================
// CodeFunctionDefinition generic order tests
// ============================================================================

describe('CodeFunctionDefinition<TOutput, TInput> generic order', () => {
  it('CodeFunctionDefinition<string, {prompt:string}> - args and returnType', () => {
    // Order: CodeFunctionDefinition<TOutput = string, TInput = {prompt:string}>

    const def: CodeFunctionDefinition<string, { prompt: string }> = {
      type: 'code',
      name: 'test',
      args: { prompt: 'generate code' }, // args is TInput
      returnType: 'generated code', // returnType is TOutput
      language: 'typescript',
    }

    // args should have prompt property
    const _prompt: string = def.args.prompt
    expect(def.args.prompt).toBe('generate code')

    // returnType should be string
    const _ret: string = def.returnType!
    expect(def.returnType).toBe('generated code')
  })
})

// ============================================================================
// GenerativeFunctionDefinition generic order tests
// ============================================================================

describe('GenerativeFunctionDefinition<TOutput, TInput> generic order', () => {
  it('GenerativeFunctionDefinition<Output, Input> - args and returnType', () => {
    interface Output {
      title: string
      content: string
    }
    interface Input {
      topic: string
    }

    // Order: GenerativeFunctionDefinition<TOutput = Output, TInput = Input>

    const def: GenerativeFunctionDefinition<Output, Input> = {
      type: 'generative',
      name: 'test',
      args: { topic: 'AI' }, // args is TInput
      returnType: { title: 'AI Article', content: '...' }, // returnType is TOutput
      output: 'object',
    }

    // args should have topic
    const _topic: string = def.args.topic
    expect(def.args.topic).toBe('AI')

    // returnType should have title
    const _title: string = def.returnType!.title
    expect(def.returnType!.title).toBe('AI Article')
  })
})

// ============================================================================
// AgenticFunctionDefinition generic order tests
// ============================================================================

describe('AgenticFunctionDefinition<TOutput, TInput> generic order', () => {
  it('AgenticFunctionDefinition<Output, Input> - args and returnType', () => {
    interface Output {
      result: string
    }
    interface Input {
      query: string
    }

    // Order: AgenticFunctionDefinition<TOutput = Output, TInput = Input>

    const def: AgenticFunctionDefinition<Output, Input> = {
      type: 'agentic',
      name: 'test',
      args: { query: 'search' }, // args is TInput
      returnType: { result: 'found' }, // returnType is TOutput
      instructions: 'test',
    }

    // args should have query
    const _query: string = def.args.query
    expect(def.args.query).toBe('search')

    // returnType should have result
    const _result: string = def.returnType!.result
    expect(def.returnType!.result).toBe('found')
  })
})

// ============================================================================
// HumanFunctionDefinition generic order tests
// ============================================================================

describe('HumanFunctionDefinition<TOutput, TInput> generic order', () => {
  it('HumanFunctionDefinition<ApprovalResult, ApprovalInput> - args and returnType', () => {
    interface ApprovalResult {
      approved: boolean
    }
    interface ApprovalInput {
      amount: number
    }

    // Order: HumanFunctionDefinition<TOutput = ApprovalResult, TInput = ApprovalInput>

    const def: HumanFunctionDefinition<ApprovalResult, ApprovalInput> = {
      type: 'human',
      name: 'test',
      args: { amount: 100 }, // args is TInput
      returnType: { approved: true }, // returnType is TOutput
      channel: 'workspace',
      instructions: 'test',
    }

    // args should have amount
    const _amount: number = def.args.amount
    expect(def.args.amount).toBe(100)

    // returnType should have approved
    const _approved: boolean = def.returnType!.approved
    expect(def.returnType!.approved).toBe(true)
  })
})

// ============================================================================
// DefinedFunction generic order tests
// ============================================================================

describe('DefinedFunction<TOutput, TInput> generic order', () => {
  it('DefinedFunction<User, CreateUserInput> - call signature', () => {
    // Order: DefinedFunction<TOutput = User, TInput = CreateUserInput>
    //   call: (args: CreateUserInput) => Promise<User>

    const defined: DefinedFunction<User, CreateUserInput> = {
      definition: {} as FunctionDefinition<User, CreateUserInput>,
      // call accepts CreateUserInput, returns Promise<User>
      call: async (args: CreateUserInput): Promise<User> => ({
        id: '1',
        name: args.name,
        email: args.email,
      }),
      asTool: () => ({}) as AIFunctionDefinition<User, CreateUserInput>,
    }

    // call should accept CreateUserInput
    const promise = defined.call({ name: 'Alice', email: 'alice@test.com' })

    // Should return Promise<User>
    promise.then((result) => {
      const _id: string = result.id
      expect(result.id).toBe('1')
    })
  })
})

// ============================================================================
// FunctionDefinition union type tests
// ============================================================================

describe('FunctionDefinition<TOutput, TInput> union type', () => {
  it('FunctionDefinition<string, number> - args and returnType through union', () => {
    // Order: FunctionDefinition<TOutput = string, TInput = number>

    const def: FunctionDefinition<string, number> = {
      type: 'code',
      name: 'test',
      args: 42, // args is TInput (number)
      returnType: 'result', // returnType is TOutput (string)
      language: 'typescript',
    }

    // args should be number
    const _n: number = def.args
    expect(def.args).toBe(42)

    // returnType should be string
    const _s: string = def.returnType!
    expect(def.returnType).toBe('result')
  })
})

// ============================================================================
// Type inference tests
// ============================================================================

describe('type inference in generic contexts', () => {
  it('extracting handler types', () => {
    // Type to extract handler return from definition
    type HandlerReturn<T> = T extends { handler: (...args: unknown[]) => infer R } ? R : never

    // With <TOutput, TInput>: AIFunctionDefinition<string, number>
    //   handler: (number) => string, so HandlerReturn = string | Promise<string>

    type Def = AIFunctionDefinition<string, number>
    type Result = HandlerReturn<Def>

    // Result should be string | Promise<string>
    const _s: Result = 'hello'
    expect('hello').toBe('hello')
  })
})
