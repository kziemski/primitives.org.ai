/**
 * TDD RED Phase Tests: EventHandler generic order
 * Issue: primitives.org.ai-01s
 *
 * These tests verify that EventHandler uses <TOutput, TInput> order
 * (output first, then input), consistent with Promise<T> patterns.
 *
 * Current implementation uses <T, R> where T is input, R is output.
 * These tests should FAIL until the type order is fixed.
 *
 * The current signature is:
 *   EventHandler<T = unknown, R = unknown> = (data: T, $) => R | void | Promise<R | void>
 *
 * The desired signature is:
 *   EventHandler<TOutput = unknown, TInput = unknown> = (data: TInput, $) => TOutput | void | Promise<TOutput | void>
 *
 * TEST STRATEGY:
 * - Tests use @ts-expect-error to mark lines that SHOULD error with CURRENT types
 * - When types are FIXED, these @ts-expect-error comments will become errors
 *   (because the expected error won't occur)
 * - This makes the test file fail to compile when types are correct = TDD RED
 */
import { describe, it, expect, expectTypeOf, assertType } from 'vitest'
import type { EventHandler, WorkflowContext } from '../src/types.js'
import { Workflow } from '../src/workflow.js'

describe('EventHandler generic order - TDD RED', () => {
  // Test data types
  interface CustomerData {
    id: string
    name: string
    email: string
  }

  interface ProcessResult {
    success: boolean
    processedAt: number
  }

  interface OrderInput {
    orderId: string
    items: string[]
  }

  describe('EventHandler<TOutput, TInput> order - documents current behavior', () => {
    /**
     * This test documents the CURRENT behavior:
     * - EventHandler<T, R> where T is INPUT (first), R is OUTPUT (second)
     *
     * When we CHANGE to <TOutput, TInput>:
     * - The @ts-expect-error comments below will fail (no error to expect)
     * - The test file won't compile until @ts-expect-error is removed
     */

    it('documents: FIXED types have output first, input second', () => {
      // FIXED: EventHandler<Output, Input>
      // - First generic (TOutput) is the return type
      // - Second generic (TInput) is the data parameter type
      //
      // EventHandler<ProcessResult, OrderInput> means:
      // - data: OrderInput (second generic)
      // - returns: ProcessResult (first generic)
      const handler: EventHandler<ProcessResult, OrderInput> = (data, $) => {
        // With FIXED types, data is OrderInput (second generic)
        const _orderId: string = data.orderId
        const _items: string[] = data.items

        // Return type is ProcessResult (first generic)
        return { success: true, processedAt: Date.now() }
      }

      expect(handler).toBeDefined()
    })

    it('documents: calling handler with correct args works with fixed types', () => {
      const handler: EventHandler<ProcessResult, OrderInput> = (data, $) => {
        // Fixed: data is OrderInput, returns ProcessResult
        return { success: true, processedAt: Date.now() }
      }

      // With FIXED types, first arg should be OrderInput
      handler({ orderId: '1', items: [] }, {} as WorkflowContext)
    })

    it('PASSES: data is second generic with fixed types', () => {
      // With FIXED types <TOutput, TInput>:
      // EventHandler<ProcessResult, OrderInput> means:
      // - data: OrderInput (second generic)
      // - return: ProcessResult (first generic)

      const handler: EventHandler<ProcessResult, OrderInput> = (data, $) => {
        // Data is correctly typed as OrderInput (second generic)
        const orderId: string = data.orderId
        const items: string[] = data.items

        return { success: true, processedAt: Date.now() }
      }

      // Calling with OrderInput as data - now works correctly
      handler({ orderId: '123', items: ['a'] }, {} as WorkflowContext)
    })
  })

  describe('WorkflowContext.do<TResult, TInput> order - FIXED types', () => {
    /**
     * FIXED $.do signature: <TResult, TInput>(event, data: TInput) => Promise<TResult>
     *
     * The order puts Result first (like Promise<T>)
     */
    it('documents: FIXED $.do has result first, input second', () => {
      const workflow = Workflow($ => {
        $.on.Order.process(() => ({ success: true, processedAt: Date.now() }))
      })

      // With FIXED types: $.do<TResult, TInput>
      // - First generic (TResult) is the result/output type
      // - Second generic (TInput) is the data/input type

      // $.do<ProcessResult, OrderInput> means data: OrderInput, returns Promise<ProcessResult>
      workflow.$.do<ProcessResult, OrderInput>('Order.process', { orderId: '123', items: [] })
    })

    it('PASSES: $.do accepts data as second generic type', async () => {
      const workflow = Workflow($ => {
        $.on.Order.process((order: OrderInput) => ({
          success: true,
          processedAt: Date.now()
        }))
      })

      try {
        // With FIXED types, data is OrderInput (second generic), result is ProcessResult (first generic)
        const result: ProcessResult = await workflow.$.do<ProcessResult, OrderInput>(
          'Order.process',
          { orderId: '123', items: ['item1'] }  // OrderInput - accepted with fixed types
        )
      } catch {
        // Expected to throw - we're testing types, not runtime
      }
    })
  })

  describe('WorkflowContext.try<TResult, TInput> order - FIXED types', () => {
    it('documents: FIXED $.try has result first, input second', () => {
      const workflow = Workflow($ => {
        $.on.Test.action(() => ({ orderId: 'x', items: [] }))
      })

      // Same pattern as $.do - don't await to avoid runtime error
      // $.try<ProcessResult, OrderInput> means data: OrderInput, returns Promise<ProcessResult>
      const _promise = workflow.$.try<ProcessResult, OrderInput>('Test.action', { orderId: 'x', items: [] })
    })

    it('PASSES: $.try accepts data as second generic type', async () => {
      const workflow = Workflow($ => {
        $.on.Payment.validate((input: { amount: number }) => ({ valid: input.amount > 0 }))
      })

      try {
        // With FIXED types, data is { amount: number }, result is { valid: boolean }
        const result: { valid: boolean } = await workflow.$.try<{ valid: boolean }, { amount: number }>(
          'Payment.validate',
          { amount: 100 }  // Accepted with fixed types
        )
      } catch {
        // Expected
      }
    })
  })

  describe('Type inference consistency', () => {
    /**
     * When the generic order is fixed, these patterns should all work:
     *
     * EventHandler<void, CustomerData>     - fire and forget with CustomerData input
     * EventHandler<ProcessResult, void>    - returns ProcessResult, no input needed
     * EventHandler<string, number>         - takes number, returns string
     *
     * Like Promise<T> where T is what you get, not what you put in
     */

    it('should support EventHandler<void, InputType> for fire-and-forget handlers', () => {
      // A handler that receives data but returns nothing
      type FireForgetHandler = EventHandler<void, CustomerData>

      const handler: FireForgetHandler = (customer, $) => {
        // customer should be CustomerData (second generic = input)
        // Note: we don't call $.log here to avoid runtime issues with mock context
        console.log(`Processing ${customer.name} (${customer.email})`)
        // Returns void (first generic = output)
      }

      // Should be callable with CustomerData - using real workflow context
      const workflow = Workflow(_ => {})
      handler({ id: '1', name: 'John', email: 'john@example.com' }, workflow.$)
    })

    it('should support EventHandler<OutputType, void> for parameterless handlers', () => {
      // A handler that takes no data but returns a result
      // This is less common but should be expressible
      type NoInputHandler = EventHandler<ProcessResult, void>

      // Note: This is a stretch case - handlers always receive data param
      // but we should be able to type it as void/undefined
    })

    it('should mirror Promise<T> convention where T is the resolved value', () => {
      // Just as Promise<string> means "will resolve to string"
      // EventHandler<string, number> should mean "will return string (given number input)"

      // Test that first generic controls return type
      type StringReturningHandler = EventHandler<string, number>

      const handler: StringReturningHandler = (num, $) => {
        return `The number is ${num}`
      }

      const result = handler(42, {} as WorkflowContext)
      // With correct types, result should be string | void | Promise<...>
      if (typeof result === 'string') {
        expect(result).toBe('The number is 42')
      }
    })
  })
})
