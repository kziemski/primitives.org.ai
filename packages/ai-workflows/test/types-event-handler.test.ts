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

    it('documents: CURRENT types have input first, output second', () => {
      // CURRENT: EventHandler<Input, Output>
      // data parameter is typed as FIRST generic (Input)
      // return type is typed as SECOND generic (Output)

      // This compiles with CURRENT types because:
      // EventHandler<ProcessResult, OrderInput> means data: ProcessResult
      const currentHandler: EventHandler<ProcessResult, OrderInput> = (data, $) => {
        // With CURRENT types, data is ProcessResult (first generic)
        // @ts-expect-error - This WILL error when types are fixed (data will be OrderInput)
        const _success: boolean = data.success  // Works with current types
        // @ts-expect-error - This WILL error when types are fixed
        const _time: number = data.processedAt  // Works with current types

        // Return type is OrderInput with current types
        // @ts-expect-error - This WILL error when types are fixed (return should be ProcessResult)
        return { orderId: '123', items: [] } as OrderInput
      }

      expect(currentHandler).toBeDefined()
    })

    it('documents: calling handler with "wrong" args works with current types', () => {
      const handler: EventHandler<ProcessResult, OrderInput> = (data, $) => {
        // Current: data is ProcessResult
        return { orderId: '1', items: [] }
      }

      // With CURRENT types, first arg should be ProcessResult
      // @ts-expect-error - This WILL error when types are fixed (should accept OrderInput)
      handler({ success: true, processedAt: 123 }, {} as WorkflowContext)
    })

    it('FAILS: desired behavior - data should be second generic', () => {
      // When types are FIXED to <TOutput, TInput>:
      // EventHandler<ProcessResult, OrderInput> should mean:
      // - data: OrderInput (second generic)
      // - return: ProcessResult (first generic)

      const desiredHandler: EventHandler<ProcessResult, OrderInput> = (data, $) => {
        // These lines test that data is OrderInput
        // With CURRENT types: these will error (data is ProcessResult)
        // With FIXED types: these should compile fine
        // @ts-expect-error - REMOVE when types are fixed
        const orderId: string = data.orderId
        // @ts-expect-error - REMOVE when types are fixed
        const items: string[] = data.items

        return { success: true, processedAt: Date.now() }
      }

      // Calling with OrderInput as data
      // @ts-expect-error - REMOVE when types are fixed (currently expects ProcessResult)
      desiredHandler({ orderId: '123', items: ['a'] }, {} as WorkflowContext)
    })
  })

  describe('WorkflowContext.do<TResult, TInput> order - documents current behavior', () => {
    /**
     * Current $.do signature: <TData, TResult>(event, data: TData) => Promise<TResult>
     * Desired $.do signature: <TResult, TInput>(event, data: TInput) => Promise<TResult>
     *
     * The desired order puts Result first (like Promise<T>)
     */
    it('documents: CURRENT $.do has data first, result second', () => {
      const workflow = Workflow($ => {
        $.on.Order.process(() => ({ success: true, processedAt: Date.now() }))
      })

      // With CURRENT types: $.do<TData, TResult>
      // - First generic (TData) is the data/input type
      // - Second generic (TResult) is the result/output type
      //
      // With FIXED types: $.do<TResult, TInput>
      // - First generic (TResult) is the result/output type
      // - Second generic (TInput) is the data/input type

      // This test documents current behavior using @ts-expect-error
      // When types are fixed, these comments will fail

      // CURRENT: $.do<ProcessResult, OrderInput> means data: ProcessResult, returns Promise<OrderInput>
      // @ts-expect-error - REMOVE when types are fixed (data param type will change)
      workflow.$.do<ProcessResult, OrderInput>('Order.process', { success: true, processedAt: 123 })

      // When FIXED: $.do<ProcessResult, OrderInput> should mean data: OrderInput, returns Promise<ProcessResult>
    })

    it('FAILS: desired - $.do should accept data as second generic type', async () => {
      const workflow = Workflow($ => {
        $.on.Order.process((order: OrderInput) => ({
          success: true,
          processedAt: Date.now()
        }))
      })

      try {
        // With FIXED types, this should compile (data is OrderInput, result is ProcessResult)
        // With CURRENT types, this will error (current expects data to be ProcessResult)
        // @ts-expect-error - REMOVE when types are fixed
        const result: ProcessResult = await workflow.$.do<ProcessResult, OrderInput>(
          'Order.process',
          { orderId: '123', items: ['item1'] }  // OrderInput - should be accepted when fixed
        )
      } catch {
        // Expected to throw - we're testing types, not runtime
      }
    })
  })

  describe('WorkflowContext.try<TResult, TInput> order - documents current behavior', () => {
    it('documents: CURRENT $.try has data first, result second', () => {
      const workflow = Workflow($ => {
        $.on.Test.action(() => ({ orderId: 'x', items: [] }))
      })

      // Same pattern as $.do - don't await to avoid runtime error
      // @ts-expect-error - REMOVE when types are fixed
      const _promise = workflow.$.try<ProcessResult, OrderInput>('Test.action', { success: true, processedAt: 123 })
    })

    it('FAILS: desired - $.try should accept data as second generic type', async () => {
      const workflow = Workflow($ => {
        $.on.Payment.validate((input: { amount: number }) => ({ valid: input.amount > 0 }))
      })

      try {
        // @ts-expect-error - REMOVE when types are fixed
        const result: { valid: boolean } = await workflow.$.try<{ valid: boolean }, { amount: number }>(
          'Payment.validate',
          { amount: 100 }  // Should be accepted when fixed
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
