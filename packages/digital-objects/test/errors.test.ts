import { describe, it, expect } from 'vitest'
import {
  DigitalObjectsError,
  NotFoundError,
  ValidationError,
  ConflictError,
  errorToResponse,
} from '../src/errors.js'
import { MemoryProvider } from '../src/memory-provider.js'

describe('Error Classes', () => {
  describe('DigitalObjectsError', () => {
    it('should create error with message, code, and statusCode', () => {
      const error = new DigitalObjectsError('Something went wrong', 'CUSTOM_ERROR', 503)

      expect(error.message).toBe('Something went wrong')
      expect(error.code).toBe('CUSTOM_ERROR')
      expect(error.statusCode).toBe(503)
      expect(error.name).toBe('DigitalObjectsError')
      expect(error instanceof Error).toBe(true)
    })

    it('should default statusCode to 500', () => {
      const error = new DigitalObjectsError('Server error', 'SERVER_ERROR')

      expect(error.statusCode).toBe(500)
    })
  })

  describe('NotFoundError', () => {
    it('should create error with type and id', () => {
      const error = new NotFoundError('Thing', 'abc-123')

      expect(error.message).toBe('Thing not found: abc-123')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.statusCode).toBe(404)
      expect(error.name).toBe('NotFoundError')
      expect(error instanceof DigitalObjectsError).toBe(true)
    })
  })

  describe('ValidationError', () => {
    it('should create error with message and field errors', () => {
      const fieldErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'age', message: 'Must be a positive number' },
      ]
      const error = new ValidationError('Validation failed', fieldErrors)

      expect(error.message).toBe('Validation failed')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe('ValidationError')
      expect(error.errors).toEqual(fieldErrors)
      expect(error instanceof DigitalObjectsError).toBe(true)
    })
  })

  describe('ConflictError', () => {
    it('should create error with message', () => {
      const error = new ConflictError('Resource already exists')

      expect(error.message).toBe('Resource already exists')
      expect(error.code).toBe('CONFLICT')
      expect(error.statusCode).toBe(409)
      expect(error.name).toBe('ConflictError')
      expect(error instanceof DigitalObjectsError).toBe(true)
    })
  })
})

describe('errorToResponse', () => {
  it('should convert DigitalObjectsError to HTTP response', () => {
    const error = new DigitalObjectsError('Custom error', 'CUSTOM', 422)
    const { body, status } = errorToResponse(error)

    expect(status).toBe(422)
    expect(body).toEqual({
      error: 'CUSTOM',
      message: 'Custom error',
    })
  })

  it('should convert NotFoundError to HTTP response', () => {
    const error = new NotFoundError('User', 'user-123')
    const { body, status } = errorToResponse(error)

    expect(status).toBe(404)
    expect(body).toEqual({
      error: 'NOT_FOUND',
      message: 'User not found: user-123',
    })
  })

  it('should convert ValidationError to HTTP response with field errors', () => {
    const fieldErrors = [{ field: 'name', message: 'Required' }]
    const error = new ValidationError('Invalid input', fieldErrors)
    const { body, status } = errorToResponse(error)

    expect(status).toBe(400)
    expect(body).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      errors: fieldErrors,
    })
  })

  it('should convert unknown errors to generic 500 response', () => {
    const error = new Error('Internal failure')
    const { body, status } = errorToResponse(error)

    expect(status).toBe(500)
    expect(body).toEqual({
      error: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
    })
  })

  it('should convert non-Error values to generic 500 response', () => {
    const { body, status } = errorToResponse('string error')

    expect(status).toBe(500)
    expect(body).toEqual({
      error: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
    })
  })
})

describe('Provider Error Integration', () => {
  describe('MemoryProvider', () => {
    it('should throw NotFoundError when updating non-existent thing', async () => {
      const provider = new MemoryProvider()

      await expect(provider.update('non-existent-id', { name: 'test' })).rejects.toThrow(
        NotFoundError
      )

      try {
        await provider.update('non-existent-id', { name: 'test' })
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError)
        expect((error as NotFoundError).message).toBe('Thing not found: non-existent-id')
        expect((error as NotFoundError).statusCode).toBe(404)
      }
    })
  })
})
