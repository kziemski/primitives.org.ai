import { describe, it, expect } from 'vitest'
import {
  NounDefinitionSchema,
  VerbDefinitionSchema,
  CreateThingSchema,
  UpdateThingSchema,
  PerformActionSchema,
  BatchCreateThingsSchema,
  BatchUpdateThingsSchema,
  BatchDeleteThingsSchema,
  BatchPerformActionsSchema,
} from '../src/http-schemas.js'
import { ZodError } from 'zod'

describe('HTTP Request Body Validation', () => {
  describe('NounDefinitionSchema', () => {
    it('should accept valid noun definition', () => {
      const result = NounDefinitionSchema.parse({
        name: 'User',
        singular: 'user',
        plural: 'users',
        description: 'A user account',
        schema: { email: 'string' },
      })

      expect(result.name).toBe('User')
      expect(result.singular).toBe('user')
      expect(result.plural).toBe('users')
    })

    it('should accept minimal noun definition', () => {
      const result = NounDefinitionSchema.parse({ name: 'Post' })

      expect(result.name).toBe('Post')
      expect(result.singular).toBeUndefined()
    })

    it('should reject empty name', () => {
      expect(() => NounDefinitionSchema.parse({ name: '' })).toThrow(ZodError)
    })

    it('should reject missing name', () => {
      expect(() => NounDefinitionSchema.parse({})).toThrow(ZodError)
    })

    it('should reject wrong type for name', () => {
      expect(() => NounDefinitionSchema.parse({ name: 123 })).toThrow(ZodError)
    })

    it('should provide detailed error for missing name', () => {
      try {
        NounDefinitionSchema.parse({})
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError)
        const zodError = error as ZodError
        expect(zodError.errors[0].path).toContain('name')
      }
    })
  })

  describe('VerbDefinitionSchema', () => {
    it('should accept valid verb definition', () => {
      const result = VerbDefinitionSchema.parse({
        name: 'create',
        action: 'create',
        act: 'creates',
        activity: 'creating',
        event: 'created',
      })

      expect(result.name).toBe('create')
      expect(result.action).toBe('create')
    })

    it('should accept minimal verb definition', () => {
      const result = VerbDefinitionSchema.parse({ name: 'follow' })

      expect(result.name).toBe('follow')
    })

    it('should reject empty name', () => {
      expect(() => VerbDefinitionSchema.parse({ name: '' })).toThrow(ZodError)
    })

    it('should reject missing name', () => {
      expect(() => VerbDefinitionSchema.parse({})).toThrow(ZodError)
    })
  })

  describe('CreateThingSchema', () => {
    it('should accept valid thing creation', () => {
      const result = CreateThingSchema.parse({
        noun: 'User',
        data: { name: 'Alice', email: 'alice@example.com' },
      })

      expect(result.noun).toBe('User')
      expect(result.data.name).toBe('Alice')
    })

    it('should accept thing creation with custom id', () => {
      const result = CreateThingSchema.parse({
        noun: 'User',
        data: { name: 'Bob' },
        id: 'user-123',
      })

      expect(result.id).toBe('user-123')
    })

    it('should reject empty noun', () => {
      expect(() =>
        CreateThingSchema.parse({
          noun: '',
          data: { name: 'Alice' },
        })
      ).toThrow(ZodError)
    })

    it('should reject missing noun', () => {
      expect(() =>
        CreateThingSchema.parse({
          data: { name: 'Alice' },
        })
      ).toThrow(ZodError)
    })

    it('should reject missing data', () => {
      expect(() =>
        CreateThingSchema.parse({
          noun: 'User',
        })
      ).toThrow(ZodError)
    })

    it('should reject non-object data', () => {
      expect(() =>
        CreateThingSchema.parse({
          noun: 'User',
          data: 'not an object',
        })
      ).toThrow(ZodError)
    })
  })

  describe('UpdateThingSchema', () => {
    it('should accept valid update', () => {
      const result = UpdateThingSchema.parse({
        data: { name: 'Updated Name' },
      })

      expect(result.data.name).toBe('Updated Name')
    })

    it('should accept empty data object', () => {
      const result = UpdateThingSchema.parse({ data: {} })

      expect(result.data).toEqual({})
    })

    it('should reject missing data', () => {
      expect(() => UpdateThingSchema.parse({})).toThrow(ZodError)
    })

    it('should reject non-object data', () => {
      expect(() =>
        UpdateThingSchema.parse({
          data: ['array', 'not', 'object'],
        })
      ).toThrow(ZodError)
    })
  })

  describe('PerformActionSchema', () => {
    it('should accept valid action', () => {
      const result = PerformActionSchema.parse({
        verb: 'follow',
        subject: 'user-1',
        object: 'user-2',
        data: { timestamp: Date.now() },
      })

      expect(result.verb).toBe('follow')
      expect(result.subject).toBe('user-1')
      expect(result.object).toBe('user-2')
    })

    it('should accept action without subject/object', () => {
      const result = PerformActionSchema.parse({
        verb: 'ping',
      })

      expect(result.verb).toBe('ping')
      expect(result.subject).toBeUndefined()
    })

    it('should reject empty verb', () => {
      expect(() =>
        PerformActionSchema.parse({
          verb: '',
        })
      ).toThrow(ZodError)
    })

    it('should reject missing verb', () => {
      expect(() =>
        PerformActionSchema.parse({
          subject: 'user-1',
        })
      ).toThrow(ZodError)
    })
  })

  describe('BatchCreateThingsSchema', () => {
    it('should accept valid batch create', () => {
      const result = BatchCreateThingsSchema.parse({
        noun: 'User',
        items: [{ name: 'Alice' }, { name: 'Bob' }],
      })

      expect(result.noun).toBe('User')
      expect(result.items).toHaveLength(2)
    })

    it('should accept empty items array', () => {
      const result = BatchCreateThingsSchema.parse({
        noun: 'User',
        items: [],
      })

      expect(result.items).toHaveLength(0)
    })

    it('should reject missing noun', () => {
      expect(() =>
        BatchCreateThingsSchema.parse({
          items: [{ name: 'Alice' }],
        })
      ).toThrow(ZodError)
    })

    it('should reject missing items', () => {
      expect(() =>
        BatchCreateThingsSchema.parse({
          noun: 'User',
        })
      ).toThrow(ZodError)
    })

    it('should reject non-array items', () => {
      expect(() =>
        BatchCreateThingsSchema.parse({
          noun: 'User',
          items: { name: 'Alice' },
        })
      ).toThrow(ZodError)
    })
  })

  describe('BatchUpdateThingsSchema', () => {
    it('should accept valid batch update', () => {
      const result = BatchUpdateThingsSchema.parse({
        updates: [
          { id: 'user-1', data: { name: 'Updated Alice' } },
          { id: 'user-2', data: { name: 'Updated Bob' } },
        ],
      })

      expect(result.updates).toHaveLength(2)
      expect(result.updates[0].id).toBe('user-1')
    })

    it('should reject missing updates', () => {
      expect(() => BatchUpdateThingsSchema.parse({})).toThrow(ZodError)
    })

    it('should reject updates with empty id', () => {
      expect(() =>
        BatchUpdateThingsSchema.parse({
          updates: [{ id: '', data: { name: 'Test' } }],
        })
      ).toThrow(ZodError)
    })

    it('should reject updates missing data', () => {
      expect(() =>
        BatchUpdateThingsSchema.parse({
          updates: [{ id: 'user-1' }],
        })
      ).toThrow(ZodError)
    })
  })

  describe('BatchDeleteThingsSchema', () => {
    it('should accept valid batch delete', () => {
      const result = BatchDeleteThingsSchema.parse({
        ids: ['user-1', 'user-2', 'user-3'],
      })

      expect(result.ids).toHaveLength(3)
    })

    it('should reject missing ids', () => {
      expect(() => BatchDeleteThingsSchema.parse({})).toThrow(ZodError)
    })

    it('should reject ids with empty strings', () => {
      expect(() =>
        BatchDeleteThingsSchema.parse({
          ids: ['user-1', ''],
        })
      ).toThrow(ZodError)
    })

    it('should reject non-array ids', () => {
      expect(() =>
        BatchDeleteThingsSchema.parse({
          ids: 'user-1',
        })
      ).toThrow(ZodError)
    })
  })

  describe('BatchPerformActionsSchema', () => {
    it('should accept valid batch actions', () => {
      const result = BatchPerformActionsSchema.parse({
        actions: [
          { verb: 'follow', subject: 'user-1', object: 'user-2' },
          { verb: 'like', subject: 'user-1', object: 'post-1' },
        ],
      })

      expect(result.actions).toHaveLength(2)
      expect(result.actions[0].verb).toBe('follow')
    })

    it('should reject missing actions', () => {
      expect(() => BatchPerformActionsSchema.parse({})).toThrow(ZodError)
    })

    it('should reject actions with empty verb', () => {
      expect(() =>
        BatchPerformActionsSchema.parse({
          actions: [{ verb: '' }],
        })
      ).toThrow(ZodError)
    })

    it('should reject non-array actions', () => {
      expect(() =>
        BatchPerformActionsSchema.parse({
          actions: { verb: 'follow' },
        })
      ).toThrow(ZodError)
    })
  })

  describe('Error Message Format', () => {
    it('should provide path to invalid field', () => {
      try {
        CreateThingSchema.parse({
          noun: 'User',
          data: 'invalid',
        })
        expect.fail('Should have thrown')
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.errors[0].path).toContain('data')
      }
    })

    it('should provide helpful error codes', () => {
      try {
        NounDefinitionSchema.parse({ name: '' })
        expect.fail('Should have thrown')
      } catch (error) {
        const zodError = error as ZodError
        expect(zodError.errors[0].code).toBe('too_small')
      }
    })

    it('should provide error for nested batch update issues', () => {
      try {
        BatchUpdateThingsSchema.parse({
          updates: [
            { id: 'valid', data: { name: 'test' } },
            { id: '', data: { name: 'test' } },
          ],
        })
        expect.fail('Should have thrown')
      } catch (error) {
        const zodError = error as ZodError
        // Should indicate the path to the invalid nested field
        expect(zodError.errors[0].path).toContain('updates')
        expect(zodError.errors[0].path).toContain(1) // index of invalid item
        expect(zodError.errors[0].path).toContain('id')
      }
    })
  })
})
