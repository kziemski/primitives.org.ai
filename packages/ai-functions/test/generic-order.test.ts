/**
 * TDD RED Phase: Tests for <TOutput, TInput> generic order
 *
 * Issue: primitives.org.ai-z7f
 *
 * These tests verify that the generic type parameters SHOULD follow
 * the <TOutput, TInput> convention (output first, input second).
 *
 * CURRENT code uses <TInput, TOutput> (input first, output second).
 *
 * This test file documents the DESIRED behavior with the new order.
 * The @ts-expect-error comments mark where the CURRENT types conflict
 * with the NEW desired behavior.
 *
 * When types are fixed to <TOutput, TInput>:
 * - Remove all @ts-expect-error comments
 * - All tests should pass with correct types
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
      // CURRENT order: AIFunctionDefinition<TInput = string, TOutput = unknown>
      //   handler: (input: string) => unknown
      //
      // DESIRED order: AIFunctionDefinition<TOutput = string, TInput = unknown>
      //   handler: (input: unknown) => string

      // With CURRENT order, this definition has:
      //   handler: (input: string) => unknown | Promise<unknown>
      const def: AIFunctionDefinition<string> = {
        name: 'test',
        description: 'test',
        parameters: {},
        // CURRENT: expects handler(string) => unknown
        // DESIRED: expects handler(unknown) => string
        // We must satisfy CURRENT types to compile
        handler: (input: string) => input.toUpperCase(), // returns string, but type says unknown
      }

      // Get the result
      const result = def.handler('test')

      // With CURRENT order: result is unknown | Promise<unknown>
      // With DESIRED order: result would be string | Promise<string>

      // This assignment FAILS with current types (unknown not assignable to string)
      // @ts-expect-error - WILL COMPILE AFTER FIX: result should be string
      const _s: string = result
    })
  })

  describe('two-generic usage', () => {
    it('AIFunctionDefinition<string, number> - handler signature test', () => {
      // CURRENT: AIFunctionDefinition<TInput = string, TOutput = number>
      //   handler: (input: string) => number | Promise<number>
      //
      // DESIRED: AIFunctionDefinition<TOutput = string, TInput = number>
      //   handler: (input: number) => string | Promise<string>

      // This definition compiles with CURRENT types
      const def: AIFunctionDefinition<string, number> = {
        name: 'test',
        description: 'test',
        parameters: {},
        // CURRENT expects: (string) => number
        // DESIRED expects: (number) => string
        handler: (input: string): number => input.length, // satisfies CURRENT
      }

      // Test: call handler with number (DESIRED behavior)
      // CURRENT: handler expects string, fails with number
      // @ts-expect-error - WILL COMPILE AFTER FIX: handler should accept number
      def.handler(42)

      // Test: result should be string (DESIRED behavior)
      // CURRENT: result is number
      const result = def.handler('test')
      // @ts-expect-error - WILL COMPILE AFTER FIX: result should be string
      const _s: string = result
    })

    it('AIFunctionDefinition<User, CreateUserInput> - real-world example', () => {
      // CURRENT: AIFunctionDefinition<TInput = User, TOutput = CreateUserInput>
      //   handler: (input: User) => CreateUserInput | Promise<CreateUserInput>
      //
      // DESIRED: AIFunctionDefinition<TOutput = User, TInput = CreateUserInput>
      //   handler: (input: CreateUserInput) => User | Promise<User>

      // This satisfies CURRENT types (takes User, returns CreateUserInput)
      const currentDef: AIFunctionDefinition<User, CreateUserInput> = {
        name: 'createUser',
        description: 'Creates a user',
        parameters: {},
        // CURRENT: (User) => CreateUserInput
        handler: (input: User): CreateUserInput => ({
          name: input.name,
          email: input.email,
        }),
      }

      // Test DESIRED behavior: should accept CreateUserInput, not User
      // @ts-expect-error - WILL COMPILE AFTER FIX: should accept CreateUserInput
      currentDef.handler({ name: 'Alice', email: 'alice@test.com' })

      // Test DESIRED behavior: should return User
      const result = currentDef.handler({
        id: '1',
        name: 'Bob',
        email: 'bob@test.com',
      })
      // @ts-expect-error - WILL COMPILE AFTER FIX: result should be User with id
      const _id: string = result.id
    })
  })
})

// ============================================================================
// BaseFunctionDefinition generic order tests
// ============================================================================

describe('BaseFunctionDefinition<TOutput, TInput> generic order', () => {
  it('BaseFunctionDefinition<string, number> - args and returnType', () => {
    // CURRENT: BaseFunctionDefinition<TArgs = string, TReturn = number>
    //   args: string
    //   returnType?: number
    //
    // DESIRED: BaseFunctionDefinition<TOutput = string, TInput = number>
    //   args: number
    //   returnType?: string

    // This satisfies CURRENT types
    const def: BaseFunctionDefinition<string, number> = {
      name: 'test',
      args: 'string-input', // CURRENT: args is string (first generic)
      returnType: 42, // CURRENT: returnType is number (second generic)
    }

    // Test DESIRED behavior: args should be number
    // @ts-expect-error - WILL COMPILE AFTER FIX: args should be number
    const _argsNum: number = def.args

    // Test DESIRED behavior: returnType should be string
    // @ts-expect-error - WILL COMPILE AFTER FIX: returnType should be string
    const _retStr: string = def.returnType!
  })
})

// ============================================================================
// CodeFunctionDefinition generic order tests
// ============================================================================

describe('CodeFunctionDefinition<TOutput, TInput> generic order', () => {
  it('CodeFunctionDefinition<string, {prompt:string}> - args and returnType', () => {
    // CURRENT: CodeFunctionDefinition<TArgs = string, TReturn = {prompt:string}>
    // DESIRED: CodeFunctionDefinition<TOutput = string, TInput = {prompt:string}>

    // Satisfies CURRENT types
    const def: CodeFunctionDefinition<string, { prompt: string }> = {
      type: 'code',
      name: 'test',
      args: 'input', // CURRENT: args is string
      returnType: { prompt: 'output' }, // CURRENT: returnType is {prompt:string}
      language: 'typescript',
    }

    // Test DESIRED: args should be {prompt:string}
    // @ts-expect-error - WILL COMPILE AFTER FIX: args should have prompt property
    const _prompt: string = def.args.prompt

    // Test DESIRED: returnType should be string
    // @ts-expect-error - WILL COMPILE AFTER FIX: returnType should be string
    const _ret: string = def.returnType!
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

    // CURRENT: GenerativeFunctionDefinition<TArgs = Output, TReturn = Input>
    // DESIRED: GenerativeFunctionDefinition<TOutput = Output, TInput = Input>

    // Satisfies CURRENT types
    const def: GenerativeFunctionDefinition<Output, Input> = {
      type: 'generative',
      name: 'test',
      args: { title: '', content: '' }, // CURRENT: args is Output
      returnType: { topic: '' }, // CURRENT: returnType is Input
      output: 'object',
    }

    // Test DESIRED: args should be Input
    // @ts-expect-error - WILL COMPILE AFTER FIX: args should have topic
    const _topic: string = def.args.topic

    // Test DESIRED: returnType should be Output
    // @ts-expect-error - WILL COMPILE AFTER FIX: returnType should have title
    const _title: string = def.returnType!.title
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

    // Satisfies CURRENT types
    const def: AgenticFunctionDefinition<Output, Input> = {
      type: 'agentic',
      name: 'test',
      args: { result: '' }, // CURRENT: args is Output
      returnType: { query: '' }, // CURRENT: returnType is Input
      instructions: 'test',
    }

    // Test DESIRED: args should be Input
    // @ts-expect-error - WILL COMPILE AFTER FIX: args should have query
    const _query: string = def.args.query

    // Test DESIRED: returnType should be Output
    // @ts-expect-error - WILL COMPILE AFTER FIX: returnType should have result
    const _result: string = def.returnType!.result
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

    // Satisfies CURRENT types
    const def: HumanFunctionDefinition<ApprovalResult, ApprovalInput> = {
      type: 'human',
      name: 'test',
      args: { approved: true }, // CURRENT: args is ApprovalResult
      returnType: { amount: 100 }, // CURRENT: returnType is ApprovalInput
      channel: 'workspace',
      instructions: 'test',
    }

    // Test DESIRED: args should be ApprovalInput
    // @ts-expect-error - WILL COMPILE AFTER FIX: args should have amount
    const _amount: number = def.args.amount

    // Test DESIRED: returnType should be ApprovalResult
    // @ts-expect-error - WILL COMPILE AFTER FIX: returnType should have approved
    const _approved: boolean = def.returnType!.approved
  })
})

// ============================================================================
// DefinedFunction generic order tests
// ============================================================================

describe('DefinedFunction<TOutput, TInput> generic order', () => {
  it('DefinedFunction<User, CreateUserInput> - call signature', () => {
    // CURRENT: DefinedFunction<TArgs = User, TReturn = CreateUserInput>
    //   call: (args: User) => Promise<CreateUserInput>
    //
    // DESIRED: DefinedFunction<TOutput = User, TInput = CreateUserInput>
    //   call: (args: CreateUserInput) => Promise<User>

    // Create mock satisfying CURRENT types
    const defined: DefinedFunction<User, CreateUserInput> = {
      definition: {} as FunctionDefinition<User, CreateUserInput>,
      // CURRENT: call takes User, returns Promise<CreateUserInput>
      call: async (args: User): Promise<CreateUserInput> => ({
        name: args.name,
        email: args.email,
      }),
      asTool: () => ({}) as AIFunctionDefinition<User, CreateUserInput>,
    }

    // Test DESIRED: call should accept CreateUserInput
    // @ts-expect-error - WILL COMPILE AFTER FIX: call should accept CreateUserInput
    defined.call({ name: 'Alice', email: 'alice@test.com' })

    // Test DESIRED: call should return Promise<User>
    const promise = defined.call({ id: '1', name: 'Bob', email: 'bob@test.com' })
    promise.then((result) => {
      // @ts-expect-error - WILL COMPILE AFTER FIX: result should have id
      const _id: string = result.id
    })
  })
})

// ============================================================================
// FunctionDefinition union type tests
// ============================================================================

describe('FunctionDefinition<TOutput, TInput> union type', () => {
  it('FunctionDefinition<string, number> - args and returnType through union', () => {
    // CURRENT: FunctionDefinition<TArgs = string, TReturn = number>
    // DESIRED: FunctionDefinition<TOutput = string, TInput = number>

    // Satisfies CURRENT as CodeFunctionDefinition
    const def: FunctionDefinition<string, number> = {
      type: 'code',
      name: 'test',
      args: 'input', // CURRENT: args is string
      returnType: 123, // CURRENT: returnType is number
      language: 'typescript',
    }

    // Test DESIRED: args should be number
    // @ts-expect-error - WILL COMPILE AFTER FIX: args should be number
    const _n: number = def.args

    // Test DESIRED: returnType should be string
    // @ts-expect-error - WILL COMPILE AFTER FIX: returnType should be string
    const _s: string = def.returnType!
  })
})

// ============================================================================
// Type inference tests
// ============================================================================

describe('type inference in generic contexts', () => {
  it('extracting handler types', () => {
    // Type to extract handler return from definition
    type HandlerReturn<T> = T extends { handler: (...args: unknown[]) => infer R } ? R : never

    // With CURRENT <TInput, TOutput>: AIFunctionDefinition<string, number>
    //   handler: (string) => number, so HandlerReturn = number | Promise<number>
    //
    // With DESIRED <TOutput, TInput>: would be
    //   handler: (number) => string, so HandlerReturn = string | Promise<string>

    type Def = AIFunctionDefinition<string, number>
    type Result = HandlerReturn<Def>

    // Test DESIRED: Result should be string | Promise<string>
    // CURRENT: Result is number | Promise<number>
    const _r: Result = 42 // This compiles with CURRENT (number)

    // @ts-expect-error - WILL COMPILE AFTER FIX: Result should accept string
    const _s: Result = 'hello'
  })
})

// ============================================================================
// Summary of test expectations
// ============================================================================

/**
 * Test Summary:
 *
 * All @ts-expect-error comments mark lines that will TYPE-CHECK correctly
 * after the generic order is changed from <TInput, TOutput> to <TOutput, TInput>.
 *
 * To complete the GREEN phase:
 * 1. Change all type definitions in types.ts:
 *    - AIFunctionDefinition<TOutput, TInput>
 *    - BaseFunctionDefinition<TOutput, TInput>
 *    - CodeFunctionDefinition<TOutput, TInput>
 *    - GenerativeFunctionDefinition<TOutput, TInput>
 *    - AgenticFunctionDefinition<TOutput, TInput>
 *    - HumanFunctionDefinition<TOutput, TInput>
 *    - DefinedFunction<TOutput, TInput>
 *    - FunctionDefinition<TOutput, TInput>
 *
 * 2. Update property mappings:
 *    - handler: (input: TInput) => TOutput | Promise<TOutput>
 *    - args: TInput
 *    - returnType: TOutput
 *    - call: (args: TInput) => Promise<TOutput>
 *
 * 3. Remove all @ts-expect-error comments from this file
 *
 * 4. All tests should pass with correct types
 */
