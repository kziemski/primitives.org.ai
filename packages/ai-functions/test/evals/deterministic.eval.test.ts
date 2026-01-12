/**
 * Deterministic AI Eval Suite
 *
 * These tests are designed to be truly deterministic by following these principles:
 *
 * 1. **AI Gateway Caching**: All requests go through Cloudflare AI Gateway with
 *    caching enabled. Same prompt = same cached result = deterministic.
 *
 * 2. **Self-Validating Pattern**: Generate content, then verify each item matches
 *    the criteria using `is()`. This validates the AI output against itself.
 *    ```ts
 *    const colors = await list`5 colors`
 *    for (const color of colors) {
 *      expect(await is`${color} a color`).toBe(true)
 *    }
 *    ```
 *
 * 3. **Exact Count Validation**: When asking for N items, expect exactly N items.
 *    No "greater than 3" or "between 5 and 10" - if we ask for 5, we get 5.
 *
 * 4. **Objectively Deterministic Questions**: Use questions with unambiguous answers:
 *    - `is`red a color`` → always true
 *    - `is`JavaScript a programming language`` → always true
 *    - `is`banana a programming language`` → always false
 *
 * Run with: pnpm test -- test/evals/deterministic.eval.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { list, is, extract } from '../../src/primitives.js'

// Skip if no API access
const hasAPI = !!(
  process.env.AI_GATEWAY_URL ||
  process.env.ANTHROPIC_API_KEY ||
  process.env.OPENAI_API_KEY
)

// Test timeout for AI calls
const AI_TIMEOUT = 30000

// Use a fast, cheap model for deterministic tests (caching makes model choice less important)
const TEST_MODEL = process.env.TEST_MODEL || 'haiku'

describe.skipIf(!hasAPI)('Deterministic AI Evals', () => {
  beforeAll(() => {
    console.log(`\nRunning deterministic evals with model: ${TEST_MODEL}`)
    if (process.env.AI_GATEWAY_URL) {
      console.log('✓ AI Gateway caching enabled')
    } else {
      console.log('⚠ AI Gateway not configured - results may vary')
    }
    console.log('')
  })

  // ==========================================================================
  // is() - Objectively Deterministic Boolean Classification
  // ==========================================================================
  describe('is() - objectively deterministic questions', () => {
    describe('colors', () => {
      const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white']
      // Avoid abstract concepts that could be interpreted metaphorically (e.g., "happiness" = golden)
      const notColors = ['democracy', 'algorithm', 'photosynthesis', 'recursion', 'multiplication']

      it.each(colors)('correctly identifies "%s" as a color', async (color) => {
        const result = await is(`${color} a color`, { model: TEST_MODEL })
        expect(result).toBe(true)
      }, AI_TIMEOUT)

      it.each(notColors)('correctly identifies "%s" as NOT a color', async (word) => {
        const result = await is(`${word} a color`, { model: TEST_MODEL })
        expect(result).toBe(false)
      }, AI_TIMEOUT)
    })

    describe('programming languages', () => {
      const languages = ['JavaScript', 'Python', 'TypeScript', 'Rust', 'Go', 'Java', 'C++', 'Ruby']
      const notLanguages = ['banana', 'elephant', 'democracy', 'sunset', 'happiness']

      it.each(languages)('correctly identifies "%s" as a programming language', async (lang) => {
        const result = await is(`${lang} a programming language`, { model: TEST_MODEL })
        expect(result).toBe(true)
      }, AI_TIMEOUT)

      it.each(notLanguages)('correctly identifies "%s" as NOT a programming language', async (word) => {
        const result = await is(`${word} a programming language`, { model: TEST_MODEL })
        expect(result).toBe(false)
      }, AI_TIMEOUT)
    })

    describe('numbers', () => {
      const evenNumbers = [2, 4, 6, 8, 10, 100, 1000]
      const oddNumbers = [1, 3, 5, 7, 9, 11, 99]

      it.each(evenNumbers)('correctly identifies %d as even', async (num) => {
        const result = await is(`${num} an even number`, { model: TEST_MODEL })
        expect(result).toBe(true)
      }, AI_TIMEOUT)

      it.each(oddNumbers)('correctly identifies %d as odd', async (num) => {
        const result = await is(`${num} an odd number`, { model: TEST_MODEL })
        expect(result).toBe(true)
      }, AI_TIMEOUT)
    })

    describe('countries and capitals', () => {
      const validPairs = [
        ['Paris', 'France'],
        ['Tokyo', 'Japan'],
        ['London', 'United Kingdom'],
        ['Berlin', 'Germany'],
        ['Rome', 'Italy'],
      ]

      const invalidPairs = [
        ['Paris', 'Germany'],
        ['Tokyo', 'China'],
        ['London', 'France'],
      ]

      it.each(validPairs)('correctly identifies %s as capital of %s', async (city, country) => {
        const result = await is(`${city} the capital of ${country}`, { model: TEST_MODEL })
        expect(result).toBe(true)
      }, AI_TIMEOUT)

      it.each(invalidPairs)('correctly identifies %s is NOT capital of %s', async (city, country) => {
        const result = await is(`${city} the capital of ${country}`, { model: TEST_MODEL })
        expect(result).toBe(false)
      }, AI_TIMEOUT)
    })

    describe('email validation', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'hello@company.co.uk',
      ]

      const invalidEmails = [
        'not-an-email',
        'missing@',
        '@nodomain.com',
        'spaces in@email.com',
      ]

      it.each(validEmails)('correctly identifies "%s" as valid email format', async (email) => {
        const result = await is(`"${email}" a valid email address format`, { model: TEST_MODEL })
        expect(result).toBe(true)
      }, AI_TIMEOUT)

      it.each(invalidEmails)('correctly identifies "%s" as invalid email format', async (email) => {
        const result = await is(`"${email}" a valid email address format`, { model: TEST_MODEL })
        expect(result).toBe(false)
      }, AI_TIMEOUT)
    })
  })

  // ==========================================================================
  // list() - Self-Validating Pattern with Exact Counts
  // ==========================================================================
  describe('list() - self-validating with exact counts', () => {
    describe('colors', () => {
      it('generates exactly 5 colors and validates each', async () => {
        const colors = await list('exactly 5 distinct colors', { model: TEST_MODEL })

        // Exact count validation
        expect(colors).toHaveLength(5)

        // Self-validation: each item should be a color
        for (const color of colors) {
          const isColor = await is(`${color} a color`, { model: TEST_MODEL })
          expect(isColor).toBe(true)
        }
      }, AI_TIMEOUT * 2)

      it('generates exactly 10 colors and validates each', async () => {
        const colors = await list('exactly 10 distinct colors', { model: TEST_MODEL })

        expect(colors).toHaveLength(10)

        for (const color of colors) {
          const isColor = await is(`${color} a color`, { model: TEST_MODEL })
          expect(isColor).toBe(true)
        }
      }, AI_TIMEOUT * 3)
    })

    describe('programming languages', () => {
      it('generates exactly 5 programming languages and validates each', async () => {
        const languages = await list('exactly 5 programming languages', { model: TEST_MODEL })

        expect(languages).toHaveLength(5)

        for (const lang of languages) {
          const isLang = await is(`${lang} a programming language`, { model: TEST_MODEL })
          expect(isLang).toBe(true)
        }
      }, AI_TIMEOUT * 2)
    })

    describe('countries', () => {
      it('generates exactly 7 countries and validates each', async () => {
        const countries = await list('exactly 7 countries in the world', { model: TEST_MODEL })

        expect(countries).toHaveLength(7)

        for (const country of countries) {
          const isCountry = await is(`${country} a country`, { model: TEST_MODEL })
          expect(isCountry).toBe(true)
        }
      }, AI_TIMEOUT * 2)
    })

    describe('fruits', () => {
      it('generates exactly 6 fruits and validates each', async () => {
        const fruits = await list('exactly 6 fruits', { model: TEST_MODEL })

        expect(fruits).toHaveLength(6)

        for (const fruit of fruits) {
          const isFruit = await is(`${fruit} a fruit`, { model: TEST_MODEL })
          expect(isFruit).toBe(true)
        }
      }, AI_TIMEOUT * 2)
    })

    describe('animals', () => {
      it('generates exactly 8 animals and validates each', async () => {
        const animals = await list('exactly 8 animals', { model: TEST_MODEL })

        expect(animals).toHaveLength(8)

        for (const animal of animals) {
          const isAnimal = await is(`${animal} an animal`, { model: TEST_MODEL })
          expect(isAnimal).toBe(true)
        }
      }, AI_TIMEOUT * 2)
    })
  })

  // ==========================================================================
  // list() - Constrained Lists (verifiable subcategories)
  // ==========================================================================
  describe('list() - constrained categories', () => {
    it('generates primary colors only', async () => {
      const colors = await list('exactly 3 primary colors (red, blue, yellow)', { model: TEST_MODEL })

      expect(colors).toHaveLength(3)

      // Primary colors are a known finite set
      const primaryColors = ['red', 'blue', 'yellow']
      for (const color of colors) {
        expect(primaryColors).toContain(color.toLowerCase())
      }
    }, AI_TIMEOUT)

    it('generates days of the week', async () => {
      const days = await list('exactly 7 days of the week', { model: TEST_MODEL })

      expect(days).toHaveLength(7)

      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      for (const day of days) {
        expect(validDays).toContain(day.toLowerCase())
      }
    }, AI_TIMEOUT)

    it('generates months of the year', async () => {
      const months = await list('exactly 12 months of the year', { model: TEST_MODEL })

      expect(months).toHaveLength(12)

      const validMonths = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ]
      for (const month of months) {
        expect(validMonths).toContain(month.toLowerCase())
      }
    }, AI_TIMEOUT)

    it('generates continents', async () => {
      const continents = await list('exactly 7 continents', { model: TEST_MODEL })

      expect(continents).toHaveLength(7)

      // Use known finite set validation (handles Oceania/Australia naming variations)
      const validContinents = [
        'africa', 'antarctica', 'asia', 'australia', 'oceania',
        'europe', 'north america', 'south america'
      ]
      for (const continent of continents) {
        const normalized = continent.toLowerCase().trim()
        const isValid = validContinents.some(v => normalized.includes(v) || v.includes(normalized))
        expect(isValid).toBe(true)
      }
    }, AI_TIMEOUT)
  })

  // ==========================================================================
  // extract() - Deterministic Extraction from Known Text
  // ==========================================================================
  describe('extract() - deterministic from known text', () => {
    it('extracts email addresses from text', async () => {
      const text = 'Contact support@example.com or sales@company.org for help'
      const emails = await extract(`email addresses from "${text}"`, { model: TEST_MODEL })

      expect(emails).toHaveLength(2)
      expect(emails).toContain('support@example.com')
      expect(emails).toContain('sales@company.org')
    }, AI_TIMEOUT)

    it('extracts numbers from text', async () => {
      const text = 'The product costs $50 and we sold 100 units'
      const numbers = await extract(`numbers from "${text}"`, { model: TEST_MODEL })

      expect(numbers.length).toBeGreaterThanOrEqual(2)
      // Should contain 50 and 100 (as strings or numbers)
      const numStrings = numbers.map(n => String(n))
      expect(numStrings.some(n => n.includes('50'))).toBe(true)
      expect(numStrings.some(n => n.includes('100'))).toBe(true)
    }, AI_TIMEOUT)

    it('extracts names from text', async () => {
      const text = 'John Smith and Jane Doe attended the meeting'
      const names = await extract(`person names from "${text}"`, { model: TEST_MODEL })

      expect(names.length).toBeGreaterThanOrEqual(2)
      const nameStrings = names.map(n => String(n).toLowerCase())
      expect(nameStrings.some(n => n.includes('john'))).toBe(true)
      expect(nameStrings.some(n => n.includes('jane'))).toBe(true)
    }, AI_TIMEOUT)
  })

  // ==========================================================================
  // Chained Self-Validation (Advanced Pattern)
  // ==========================================================================
  describe('chained self-validation', () => {
    it('blog post titles about a topic validate as being about that topic', async () => {
      const topic = 'artificial intelligence'
      const titles = await list(`exactly 5 blog post titles about ${topic}`, { model: TEST_MODEL })

      expect(titles).toHaveLength(5)

      // Each title should be about the topic
      for (const title of titles) {
        const isAboutTopic = await is(`"${title}" a blog post title about ${topic}`, { model: TEST_MODEL })
        expect(isAboutTopic).toBe(true)
      }
    }, AI_TIMEOUT * 2)

    it('company names in an industry validate as being in that industry', async () => {
      const industry = 'technology'
      const companies = await list(`exactly 5 well-known ${industry} companies`, { model: TEST_MODEL })

      expect(companies).toHaveLength(5)

      for (const company of companies) {
        const isInIndustry = await is(`${company} a ${industry} company`, { model: TEST_MODEL })
        expect(isInIndustry).toBe(true)
      }
    }, AI_TIMEOUT * 2)

    it('cities in a country validate as being in that country', async () => {
      const country = 'Japan'
      const cities = await list(`exactly 5 cities in ${country}`, { model: TEST_MODEL })

      expect(cities).toHaveLength(5)

      for (const city of cities) {
        const isInCountry = await is(`${city} a city in ${country}`, { model: TEST_MODEL })
        expect(isInCountry).toBe(true)
      }
    }, AI_TIMEOUT * 2)
  })
})
