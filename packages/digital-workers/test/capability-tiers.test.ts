/**
 * Capability Tiers Tests
 *
 * TDD tests for agent capability tiers with complexity levels and toolsets.
 * Following the cascade pattern: code < generative < agentic < human
 */

import { describe, it, expect, expectTypeOf } from 'vitest'
import type {
  CapabilityTier,
  CapabilityProfile,
  TierConfig,
  TierToolset,
  TaskComplexity,
  TierMatchResult,
  TierEscalation,
} from '../src/capability-tiers.js'
import {
  CAPABILITY_TIERS,
  TIER_ORDER,
  createCapabilityProfile,
  compareTiers,
  isHigherTier,
  isLowerTier,
  getNextTier,
  getPreviousTier,
  matchTierToComplexity,
  canExecuteAtTier,
  getToolsForTier,
  getTierConfig,
  validateTierEscalation,
  TierRegistry,
} from '../src/capability-tiers.js'

// ============================================================================
// Capability Tier Definition Tests
// ============================================================================

describe('CapabilityTier', () => {
  describe('tier values', () => {
    it('should define the four core tiers', () => {
      expect(CAPABILITY_TIERS).toContain('code')
      expect(CAPABILITY_TIERS).toContain('generative')
      expect(CAPABILITY_TIERS).toContain('agentic')
      expect(CAPABILITY_TIERS).toContain('human')
      expect(CAPABILITY_TIERS).toHaveLength(4)
    })

    it('should have correct tier order (code < generative < agentic < human)', () => {
      expect(TIER_ORDER.code).toBe(0)
      expect(TIER_ORDER.generative).toBe(1)
      expect(TIER_ORDER.agentic).toBe(2)
      expect(TIER_ORDER.human).toBe(3)
    })
  })

  describe('tier comparison', () => {
    it('should compare tiers correctly', () => {
      expect(compareTiers('code', 'generative')).toBeLessThan(0)
      expect(compareTiers('generative', 'code')).toBeGreaterThan(0)
      expect(compareTiers('code', 'code')).toBe(0)
      expect(compareTiers('agentic', 'human')).toBeLessThan(0)
    })

    it('should identify higher tiers', () => {
      expect(isHigherTier('generative', 'code')).toBe(true)
      expect(isHigherTier('agentic', 'generative')).toBe(true)
      expect(isHigherTier('human', 'agentic')).toBe(true)
      expect(isHigherTier('code', 'generative')).toBe(false)
      expect(isHigherTier('code', 'code')).toBe(false)
    })

    it('should identify lower tiers', () => {
      expect(isLowerTier('code', 'generative')).toBe(true)
      expect(isLowerTier('generative', 'agentic')).toBe(true)
      expect(isLowerTier('agentic', 'human')).toBe(true)
      expect(isLowerTier('generative', 'code')).toBe(false)
      expect(isLowerTier('code', 'code')).toBe(false)
    })

    it('should get next tier in escalation', () => {
      expect(getNextTier('code')).toBe('generative')
      expect(getNextTier('generative')).toBe('agentic')
      expect(getNextTier('agentic')).toBe('human')
      expect(getNextTier('human')).toBeNull()
    })

    it('should get previous tier in de-escalation', () => {
      expect(getPreviousTier('human')).toBe('agentic')
      expect(getPreviousTier('agentic')).toBe('generative')
      expect(getPreviousTier('generative')).toBe('code')
      expect(getPreviousTier('code')).toBeNull()
    })
  })
})

// ============================================================================
// Capability Profile Tests
// ============================================================================

describe('CapabilityProfile', () => {
  describe('profile creation', () => {
    it('should create a valid capability profile', () => {
      const profile = createCapabilityProfile({
        name: 'basic-code-executor',
        tier: 'code',
        complexityRating: 1,
        tools: ['calculate', 'lookup'],
      })

      expect(profile.name).toBe('basic-code-executor')
      expect(profile.tier).toBe('code')
      expect(profile.complexityRating).toBe(1)
      expect(profile.tools).toEqual(['calculate', 'lookup'])
    })

    it('should have required fields', () => {
      const profile = createCapabilityProfile({
        name: 'test-profile',
        tier: 'generative',
        complexityRating: 3,
        tools: [],
      })

      expect(profile).toHaveProperty('name')
      expect(profile).toHaveProperty('tier')
      expect(profile).toHaveProperty('complexityRating')
      expect(profile).toHaveProperty('tools')
    })

    it('should support optional description', () => {
      const profile = createCapabilityProfile({
        name: 'described-profile',
        tier: 'agentic',
        complexityRating: 7,
        tools: ['browse', 'execute'],
        description: 'An agentic profile with web and code capabilities',
      })

      expect(profile.description).toBe('An agentic profile with web and code capabilities')
    })

    it('should support optional constraints', () => {
      const profile = createCapabilityProfile({
        name: 'constrained-profile',
        tier: 'generative',
        complexityRating: 4,
        tools: ['generate'],
        constraints: {
          maxTokens: 4000,
          allowedDomains: ['internal'],
          requiresApproval: false,
        },
      })

      expect(profile.constraints?.maxTokens).toBe(4000)
      expect(profile.constraints?.allowedDomains).toEqual(['internal'])
    })
  })

  describe('profile validation', () => {
    it('should validate complexity rating is within tier bounds', () => {
      // Code tier: complexity 1-2
      expect(() => createCapabilityProfile({
        name: 'invalid',
        tier: 'code',
        complexityRating: 5, // Too high for code tier
        tools: [],
      })).toThrow()

      // Human tier: complexity 8-10
      expect(() => createCapabilityProfile({
        name: 'invalid',
        tier: 'human',
        complexityRating: 2, // Too low for human tier
        tools: [],
      })).toThrow()
    })

    it('should validate tier-appropriate tools', () => {
      // Code tier should not have agentic tools
      expect(() => createCapabilityProfile({
        name: 'invalid',
        tier: 'code',
        complexityRating: 1,
        tools: ['autonomous-browse'], // Agentic tool not allowed at code tier
      })).toThrow()
    })
  })
})

// ============================================================================
// Tier Configuration Tests
// ============================================================================

describe('TierConfig', () => {
  describe('getTierConfig', () => {
    it('should return config for code tier', () => {
      const config = getTierConfig('code')

      expect(config.tier).toBe('code')
      expect(config.minComplexity).toBe(1)
      expect(config.maxComplexity).toBe(2)
      expect(config.description).toBeDefined()
      expect(config.allowedTools).toBeDefined()
    })

    it('should return config for generative tier', () => {
      const config = getTierConfig('generative')

      expect(config.tier).toBe('generative')
      expect(config.minComplexity).toBe(3)
      expect(config.maxComplexity).toBe(5)
    })

    it('should return config for agentic tier', () => {
      const config = getTierConfig('agentic')

      expect(config.tier).toBe('agentic')
      expect(config.minComplexity).toBe(6)
      expect(config.maxComplexity).toBe(8)
    })

    it('should return config for human tier', () => {
      const config = getTierConfig('human')

      expect(config.tier).toBe('human')
      expect(config.minComplexity).toBe(9)
      expect(config.maxComplexity).toBe(10)
    })

    it('should include timeout configuration per tier', () => {
      const codeConfig = getTierConfig('code')
      const agenticConfig = getTierConfig('agentic')
      const humanConfig = getTierConfig('human')

      // Code should be fastest
      expect(codeConfig.defaultTimeout).toBeLessThan(agenticConfig.defaultTimeout)
      // Human should have longest timeout
      expect(humanConfig.defaultTimeout).toBeGreaterThan(agenticConfig.defaultTimeout)
    })
  })
})

// ============================================================================
// Tier Toolset Tests
// ============================================================================

describe('TierToolset', () => {
  describe('getToolsForTier', () => {
    it('should return deterministic tools for code tier', () => {
      const tools = getToolsForTier('code')

      expect(tools).toContain('calculate')
      expect(tools).toContain('lookup')
      expect(tools).toContain('validate')
      expect(tools).toContain('transform')
    })

    it('should return LLM tools for generative tier', () => {
      const tools = getToolsForTier('generative')

      expect(tools).toContain('generate')
      expect(tools).toContain('summarize')
      expect(tools).toContain('analyze')
      expect(tools).toContain('classify')
    })

    it('should return autonomous tools for agentic tier', () => {
      const tools = getToolsForTier('agentic')

      expect(tools).toContain('browse')
      expect(tools).toContain('execute')
      expect(tools).toContain('plan')
      expect(tools).toContain('delegate')
    })

    it('should return HITL tools for human tier', () => {
      const tools = getToolsForTier('human')

      expect(tools).toContain('approve')
      expect(tools).toContain('review')
      expect(tools).toContain('decide')
      expect(tools).toContain('escalate')
    })

    it('should include lower tier tools in higher tiers', () => {
      const generativeTools = getToolsForTier('generative')
      const agenticTools = getToolsForTier('agentic')
      const humanTools = getToolsForTier('human')

      // Generative should include code tools
      expect(generativeTools).toContain('calculate')

      // Agentic should include generative and code tools
      expect(agenticTools).toContain('calculate')
      expect(agenticTools).toContain('generate')

      // Human should include all lower tier tools
      expect(humanTools).toContain('calculate')
      expect(humanTools).toContain('generate')
      expect(humanTools).toContain('browse')
    })
  })
})

// ============================================================================
// Task Complexity Matching Tests
// ============================================================================

describe('Task Complexity Matching', () => {
  describe('matchTierToComplexity', () => {
    it('should match low complexity to code tier', () => {
      const result = matchTierToComplexity(1)
      expect(result.tier).toBe('code')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should match medium-low complexity to generative tier', () => {
      const result = matchTierToComplexity(4)
      expect(result.tier).toBe('generative')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should match medium-high complexity to agentic tier', () => {
      const result = matchTierToComplexity(7)
      expect(result.tier).toBe('agentic')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should match high complexity to human tier', () => {
      const result = matchTierToComplexity(10)
      expect(result.tier).toBe('human')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should handle boundary cases', () => {
      // Boundary between code and generative
      const result2_3 = matchTierToComplexity(2.5)
      expect(['code', 'generative']).toContain(result2_3.tier)

      // Boundary between generative and agentic
      const result5_6 = matchTierToComplexity(5.5)
      expect(['generative', 'agentic']).toContain(result5_6.tier)

      // Boundary between agentic and human
      const result8_9 = matchTierToComplexity(8.5)
      expect(['agentic', 'human']).toContain(result8_9.tier)
    })

    it('should include suggested tools in result', () => {
      const result = matchTierToComplexity(4)
      expect(result.suggestedTools).toBeDefined()
      expect(result.suggestedTools.length).toBeGreaterThan(0)
    })
  })

  describe('canExecuteAtTier', () => {
    it('should return true when tier matches or exceeds complexity', () => {
      expect(canExecuteAtTier('code', 1)).toBe(true)
      expect(canExecuteAtTier('generative', 3)).toBe(true)
      expect(canExecuteAtTier('agentic', 6)).toBe(true)
      expect(canExecuteAtTier('human', 10)).toBe(true)
    })

    it('should return true for higher tiers handling lower complexity', () => {
      expect(canExecuteAtTier('generative', 1)).toBe(true) // generative can do code work
      expect(canExecuteAtTier('agentic', 4)).toBe(true)    // agentic can do generative work
      expect(canExecuteAtTier('human', 2)).toBe(true)      // human can do any work
    })

    it('should return false for lower tiers handling higher complexity', () => {
      expect(canExecuteAtTier('code', 5)).toBe(false)       // code cannot do generative work
      expect(canExecuteAtTier('generative', 7)).toBe(false) // generative cannot do agentic work
      expect(canExecuteAtTier('agentic', 10)).toBe(false)   // agentic cannot do human work
    })
  })
})

// ============================================================================
// Tier Escalation Tests
// ============================================================================

describe('Tier Escalation', () => {
  describe('validateTierEscalation', () => {
    it('should allow valid escalation to next tier', () => {
      const escalation: TierEscalation = {
        fromTier: 'code',
        toTier: 'generative',
        reason: 'Task requires natural language understanding',
      }

      const result = validateTierEscalation(escalation)
      expect(result.valid).toBe(true)
    })

    it('should allow multi-level escalation with justification', () => {
      const escalation: TierEscalation = {
        fromTier: 'code',
        toTier: 'agentic',
        reason: 'Task requires autonomous decision making',
        skipJustification: 'Generative tier insufficient for task complexity',
      }

      const result = validateTierEscalation(escalation)
      expect(result.valid).toBe(true)
    })

    it('should reject multi-level escalation without justification', () => {
      const escalation: TierEscalation = {
        fromTier: 'code',
        toTier: 'agentic',
        reason: 'Task requires autonomous decision making',
      }

      const result = validateTierEscalation(escalation)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('skipJustification')
    })

    it('should reject de-escalation without explicit flag', () => {
      const escalation: TierEscalation = {
        fromTier: 'agentic',
        toTier: 'code',
        reason: 'Simpler approach found',
      }

      const result = validateTierEscalation(escalation)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('de-escalation')
    })

    it('should allow de-escalation with explicit flag', () => {
      const escalation: TierEscalation = {
        fromTier: 'agentic',
        toTier: 'code',
        reason: 'Simpler approach found',
        allowDeescalation: true,
      }

      const result = validateTierEscalation(escalation)
      expect(result.valid).toBe(true)
    })

    it('should require reason for any escalation', () => {
      const escalation: TierEscalation = {
        fromTier: 'code',
        toTier: 'generative',
        reason: '', // Empty reason
      }

      const result = validateTierEscalation(escalation)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('reason')
    })
  })
})

// ============================================================================
// Tier Registry Tests
// ============================================================================

describe('TierRegistry', () => {
  it('should register custom capability profiles', () => {
    const registry = new TierRegistry()

    registry.register({
      name: 'custom-analyst',
      tier: 'generative',
      complexityRating: 4,
      tools: ['summarize', 'classify', 'analyze'],
      description: 'Specialized text analysis profile',
    })

    const profile = registry.get('custom-analyst')
    expect(profile).toBeDefined()
    expect(profile?.tier).toBe('generative')
  })

  it('should list profiles by tier', () => {
    const registry = new TierRegistry()

    registry.register({
      name: 'gen-1',
      tier: 'generative',
      complexityRating: 3,
      tools: ['generate'],
    })

    registry.register({
      name: 'gen-2',
      tier: 'generative',
      complexityRating: 4,
      tools: ['summarize'],
    })

    registry.register({
      name: 'code-1',
      tier: 'code',
      complexityRating: 1,
      tools: ['calculate'],
    })

    const generativeProfiles = registry.listByTier('generative')
    expect(generativeProfiles).toHaveLength(2)
    expect(generativeProfiles.map(p => p.name)).toContain('gen-1')
    expect(generativeProfiles.map(p => p.name)).toContain('gen-2')
  })

  it('should find profiles matching complexity requirements', () => {
    const registry = new TierRegistry()

    registry.register({
      name: 'simple-code',
      tier: 'code',
      complexityRating: 1,
      tools: ['calculate'],
    })

    registry.register({
      name: 'advanced-agent',
      tier: 'agentic',
      complexityRating: 7,
      tools: ['browse', 'execute'],
    })

    const matches = registry.findByComplexity(7)
    expect(matches.length).toBeGreaterThan(0)
    expect(matches.some(m => m.name === 'advanced-agent')).toBe(true)
    expect(matches.some(m => m.name === 'simple-code')).toBe(false)
  })

  it('should find profiles with required tools', () => {
    const registry = new TierRegistry()

    registry.register({
      name: 'browser-agent',
      tier: 'agentic',
      complexityRating: 6,
      tools: ['browse', 'plan'],
    })

    registry.register({
      name: 'code-agent',
      tier: 'agentic',
      complexityRating: 7,
      tools: ['execute', 'delegate'],
    })

    const browserProfiles = registry.findByTools(['browse'])
    expect(browserProfiles).toHaveLength(1)
    expect(browserProfiles[0].name).toBe('browser-agent')
  })

  it('should support profile unregistration', () => {
    const registry = new TierRegistry()

    registry.register({
      name: 'temp-profile',
      tier: 'code',
      complexityRating: 1,
      tools: [],
    })

    expect(registry.get('temp-profile')).toBeDefined()

    registry.unregister('temp-profile')
    expect(registry.get('temp-profile')).toBeUndefined()
  })

  it('should prevent duplicate registrations', () => {
    const registry = new TierRegistry()

    registry.register({
      name: 'unique-profile',
      tier: 'code',
      complexityRating: 1,
      tools: [],
    })

    expect(() => registry.register({
      name: 'unique-profile',
      tier: 'generative',
      complexityRating: 3,
      tools: [],
    })).toThrow()
  })
})

// ============================================================================
// Type Tests
// ============================================================================

describe('Type Definitions', () => {
  it('should have correct CapabilityTier type', () => {
    const tier: CapabilityTier = 'code'
    expectTypeOf(tier).toMatchTypeOf<'code' | 'generative' | 'agentic' | 'human'>()
  })

  it('should have correct CapabilityProfile type', () => {
    const profile: CapabilityProfile = {
      name: 'test',
      tier: 'code',
      complexityRating: 1,
      tools: [],
    }
    expectTypeOf(profile).toHaveProperty('name')
    expectTypeOf(profile).toHaveProperty('tier')
    expectTypeOf(profile).toHaveProperty('complexityRating')
    expectTypeOf(profile).toHaveProperty('tools')
  })

  it('should have correct TierConfig type', () => {
    const config: TierConfig = {
      tier: 'code',
      minComplexity: 1,
      maxComplexity: 2,
      description: 'Code tier',
      allowedTools: ['calculate'],
      defaultTimeout: 5000,
    }
    expectTypeOf(config).toHaveProperty('tier')
    expectTypeOf(config).toHaveProperty('minComplexity')
    expectTypeOf(config).toHaveProperty('maxComplexity')
  })

  it('should have correct TaskComplexity type', () => {
    const complexity: TaskComplexity = 5
    expectTypeOf(complexity).toMatchTypeOf<number>()
  })
})
