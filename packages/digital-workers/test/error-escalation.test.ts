/**
 * Error Escalation Tests
 *
 * TDD tests for multi-level error escalation between agent tiers.
 * Following RED-GREEN-REFACTOR methodology.
 *
 * ## Test Categories
 *
 * 1. Error Classification - Severity levels, categorization, context, chain tracking
 * 2. Escalation Routing - Path determination, tier rules, thresholds, circular prevention
 * 3. Recovery Patterns - Retry backoff, fallback agents, degradation, state management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { CapabilityTier } from '../src/capability-tiers.js'
import {
  // Error Classification
  type ErrorSeverity,
  type ErrorCategory,
  type ClassifiedError,
  type ErrorContext,
  type ErrorChain,
  classifyError,
  createClassifiedError,
  getErrorSeverity,
  getErrorCategory,
  isEscalatable,
  buildErrorChain,
  preserveContext,

  // Escalation Routing
  type EscalationPath,
  type EscalationPolicy,
  type EscalationThreshold,
  type EscalationResult,
  determineEscalationPath,
  getNextEscalationTier,
  shouldEscalate,
  validateEscalationPath,
  detectCircularEscalation,
  createEscalationPolicy,

  // Recovery Patterns
  type RetryConfig,
  type RetryState,
  type FallbackConfig,
  type RecoveryState,
  type DegradationLevel,
  calculateBackoff,
  createRetryState,
  shouldRetry,
  selectFallbackAgent,
  getDegradationLevel,
  createRecoveryState,
  updateRecoveryState,
  isRecoverable,

  // Escalation Engine
  EscalationEngine,
  createEscalationEngine,
} from '../src/error-escalation.js'

// ============================================================================
// Error Classification Tests
// ============================================================================

describe('Error Classification', () => {
  describe('ErrorSeverity', () => {
    it('should define four severity levels', () => {
      const severities: ErrorSeverity[] = ['low', 'medium', 'high', 'critical']
      expect(severities).toHaveLength(4)
    })

    it('should classify low severity for minor issues', () => {
      const error = new Error('Minor validation warning')
      const severity = getErrorSeverity(error, { isRetryable: true, impact: 'single-task' })
      expect(severity).toBe('low')
    })

    it('should classify medium severity for recoverable errors', () => {
      const error = new Error('Temporary service unavailable')
      const severity = getErrorSeverity(error, { isRetryable: true, impact: 'workflow' })
      expect(severity).toBe('medium')
    })

    it('should classify high severity for significant failures', () => {
      const error = new Error('Authentication failed')
      const severity = getErrorSeverity(error, { isRetryable: false, impact: 'workflow' })
      expect(severity).toBe('high')
    })

    it('should classify critical severity for system-wide issues', () => {
      const error = new Error('Database connection lost')
      const severity = getErrorSeverity(error, { isRetryable: false, impact: 'system' })
      expect(severity).toBe('critical')
    })
  })

  describe('ErrorCategory', () => {
    it('should categorize transient errors', () => {
      const error = new Error('Network timeout')
      error.name = 'TimeoutError'
      const category = getErrorCategory(error)
      expect(category).toBe('transient')
    })

    it('should categorize permanent errors', () => {
      const error = new Error('Invalid configuration')
      error.name = 'ConfigurationError'
      const category = getErrorCategory(error)
      expect(category).toBe('permanent')
    })

    it('should categorize escalatable errors', () => {
      const error = new Error('Requires human approval')
      error.name = 'ApprovalRequired'
      const category = getErrorCategory(error)
      expect(category).toBe('escalatable')
    })

    it('should categorize unknown errors as transient by default', () => {
      const error = new Error('Something went wrong')
      const category = getErrorCategory(error)
      expect(category).toBe('transient')
    })
  })

  describe('ClassifiedError', () => {
    it('should create a classified error with all properties', () => {
      const original = new Error('Test error')
      const classified = createClassifiedError(original, {
        severity: 'medium',
        category: 'transient',
        tier: 'generative',
        agentId: 'agent-1',
        taskId: 'task-123',
      })

      expect(classified.original).toBe(original)
      expect(classified.severity).toBe('medium')
      expect(classified.category).toBe('transient')
      expect(classified.tier).toBe('generative')
      expect(classified.agentId).toBe('agent-1')
      expect(classified.taskId).toBe('task-123')
      expect(classified.timestamp).toBeInstanceOf(Date)
      expect(classified.id).toBeDefined()
    })

    it('should auto-classify error when metadata not provided', () => {
      const error = new Error('Auto-classified error')
      const classified = classifyError(error)

      expect(classified.severity).toBeDefined()
      expect(classified.category).toBeDefined()
      expect(classified.original).toBe(error)
    })

    it('should preserve stack trace from original error', () => {
      const original = new Error('Original error')
      const classified = createClassifiedError(original, {
        severity: 'low',
        category: 'transient',
      })

      expect(classified.stack).toBe(original.stack)
    })
  })

  describe('ErrorContext', () => {
    it('should preserve context through escalation', () => {
      const context: ErrorContext = {
        workflowId: 'wf-123',
        stepId: 'step-1',
        attemptNumber: 1,
        startTime: new Date(),
        metadata: { custom: 'value' },
      }

      const preserved = preserveContext(context, { attemptNumber: 2 })

      expect(preserved.workflowId).toBe(context.workflowId)
      expect(preserved.stepId).toBe(context.stepId)
      expect(preserved.attemptNumber).toBe(2)
      expect(preserved.metadata).toEqual(context.metadata)
    })

    it('should merge metadata when preserving context', () => {
      const context: ErrorContext = {
        workflowId: 'wf-123',
        metadata: { key1: 'value1' },
      }

      const preserved = preserveContext(context, {
        metadata: { key2: 'value2' },
      })

      expect(preserved.metadata).toEqual({ key1: 'value1', key2: 'value2' })
    })
  })

  describe('ErrorChain', () => {
    it('should build error chain from escalation history', () => {
      const error1 = createClassifiedError(new Error('First error'), {
        severity: 'low',
        category: 'transient',
        tier: 'code',
      })

      const error2 = createClassifiedError(new Error('Second error'), {
        severity: 'medium',
        category: 'escalatable',
        tier: 'generative',
        previousError: error1,
      })

      const chain = buildErrorChain(error2)

      expect(chain.length).toBe(2)
      expect(chain[0]!.tier).toBe('code')
      expect(chain[1]!.tier).toBe('generative')
    })

    it('should track escalation path in chain', () => {
      const error1 = createClassifiedError(new Error('Error at code tier'), {
        severity: 'medium',
        category: 'escalatable',
        tier: 'code',
      })

      const error2 = createClassifiedError(new Error('Error at generative tier'), {
        severity: 'high',
        category: 'escalatable',
        tier: 'generative',
        previousError: error1,
      })

      const error3 = createClassifiedError(new Error('Error at agentic tier'), {
        severity: 'high',
        category: 'escalatable',
        tier: 'agentic',
        previousError: error2,
      })

      const chain = buildErrorChain(error3)

      expect(chain.map(e => e.tier)).toEqual(['code', 'generative', 'agentic'])
    })

    it('should limit chain depth to prevent memory issues', () => {
      let current: ClassifiedError | undefined

      // Create a very long chain
      for (let i = 0; i < 100; i++) {
        current = createClassifiedError(new Error(`Error ${i}`), {
          severity: 'low',
          category: 'transient',
          tier: 'code',
          previousError: current,
        })
      }

      const chain = buildErrorChain(current!, { maxDepth: 10 })
      expect(chain.length).toBeLessThanOrEqual(10)
    })
  })

  describe('isEscalatable', () => {
    it('should return true for escalatable category', () => {
      const error = createClassifiedError(new Error('Test'), {
        severity: 'medium',
        category: 'escalatable',
      })
      expect(isEscalatable(error)).toBe(true)
    })

    it('should return true for high severity transient errors', () => {
      const error = createClassifiedError(new Error('Test'), {
        severity: 'high',
        category: 'transient',
      })
      expect(isEscalatable(error)).toBe(true)
    })

    it('should return false for permanent low severity errors', () => {
      const error = createClassifiedError(new Error('Test'), {
        severity: 'low',
        category: 'permanent',
      })
      expect(isEscalatable(error)).toBe(false)
    })

    it('should return true for critical errors regardless of category', () => {
      const error = createClassifiedError(new Error('Test'), {
        severity: 'critical',
        category: 'permanent',
      })
      expect(isEscalatable(error)).toBe(true)
    })
  })
})

// ============================================================================
// Escalation Routing Tests
// ============================================================================

describe('Escalation Routing', () => {
  describe('EscalationPath', () => {
    it('should determine path from code to generative', () => {
      const error = createClassifiedError(new Error('Needs NLU'), {
        severity: 'medium',
        category: 'escalatable',
        tier: 'code',
      })

      const path = determineEscalationPath(error)

      expect(path.fromTier).toBe('code')
      expect(path.toTier).toBe('generative')
      expect(path.reason).toBeDefined()
    })

    it('should determine path from generative to agentic', () => {
      const error = createClassifiedError(new Error('Needs autonomous action'), {
        severity: 'high',
        category: 'escalatable',
        tier: 'generative',
      })

      const path = determineEscalationPath(error)

      expect(path.fromTier).toBe('generative')
      expect(path.toTier).toBe('agentic')
    })

    it('should determine path from agentic to human', () => {
      const error = createClassifiedError(new Error('Needs human judgment'), {
        severity: 'critical',
        category: 'escalatable',
        tier: 'agentic',
      })

      const path = determineEscalationPath(error)

      expect(path.fromTier).toBe('agentic')
      expect(path.toTier).toBe('human')
    })

    it('should stay at human tier when already at highest', () => {
      const error = createClassifiedError(new Error('Human cannot resolve'), {
        severity: 'critical',
        category: 'escalatable',
        tier: 'human',
      })

      const path = determineEscalationPath(error)

      expect(path.fromTier).toBe('human')
      expect(path.toTier).toBe('human')
      expect(path.isTerminal).toBe(true)
    })
  })

  describe('Tier-Based Routing Rules', () => {
    it('should route code errors to generative for NLU tasks', () => {
      const policy = createEscalationPolicy({
        rules: [
          {
            name: 'nlu-escalation',
            fromTier: 'code',
            toTier: 'generative',
            condition: (error) => error.original.message.includes('NLU'),
          },
        ],
      })

      const error = createClassifiedError(new Error('NLU processing failed'), {
        severity: 'medium',
        category: 'escalatable',
        tier: 'code',
      })

      const nextTier = getNextEscalationTier(error, policy)
      expect(nextTier).toBe('generative')
    })

    it('should route generative errors to agentic for tool usage', () => {
      const policy = createEscalationPolicy({
        rules: [
          {
            name: 'tool-escalation',
            fromTier: 'generative',
            toTier: 'agentic',
            condition: (error) => error.original.message.includes('tool'),
          },
        ],
      })

      const error = createClassifiedError(new Error('Requires external tool access'), {
        severity: 'high',
        category: 'escalatable',
        tier: 'generative',
      })

      const nextTier = getNextEscalationTier(error, policy)
      expect(nextTier).toBe('agentic')
    })

    it('should route agentic errors to human for approval', () => {
      const policy = createEscalationPolicy({
        rules: [
          {
            name: 'approval-escalation',
            fromTier: 'agentic',
            toTier: 'human',
            condition: (error) => error.original.message.includes('approval'),
          },
        ],
      })

      const error = createClassifiedError(new Error('Requires human approval'), {
        severity: 'critical',
        category: 'escalatable',
        tier: 'agentic',
      })

      const nextTier = getNextEscalationTier(error, policy)
      expect(nextTier).toBe('human')
    })

    it('should skip tiers when severity is critical', () => {
      const policy = createEscalationPolicy({
        allowSkipTiers: true,
        skipTierThreshold: 'critical',
      })

      const error = createClassifiedError(new Error('Critical failure'), {
        severity: 'critical',
        category: 'escalatable',
        tier: 'code',
      })

      const nextTier = getNextEscalationTier(error, policy)
      expect(nextTier).toBe('human')
    })
  })

  describe('EscalationThreshold', () => {
    it('should escalate when error count exceeds threshold', () => {
      const threshold: EscalationThreshold = {
        errorCount: 3,
        timeWindow: 60000, // 1 minute
      }

      const errorHistory = [
        { timestamp: Date.now() - 30000 },
        { timestamp: Date.now() - 20000 },
        { timestamp: Date.now() - 10000 },
      ]

      const shouldEsc = shouldEscalate(threshold, errorHistory)
      expect(shouldEsc).toBe(true)
    })

    it('should not escalate when below threshold', () => {
      const threshold: EscalationThreshold = {
        errorCount: 5,
        timeWindow: 60000,
      }

      const errorHistory = [
        { timestamp: Date.now() - 30000 },
        { timestamp: Date.now() - 20000 },
      ]

      const shouldEsc = shouldEscalate(threshold, errorHistory)
      expect(shouldEsc).toBe(false)
    })

    it('should not count errors outside time window', () => {
      const threshold: EscalationThreshold = {
        errorCount: 3,
        timeWindow: 60000,
      }

      const errorHistory = [
        { timestamp: Date.now() - 120000 }, // Outside window
        { timestamp: Date.now() - 30000 },
        { timestamp: Date.now() - 10000 },
      ]

      const shouldEsc = shouldEscalate(threshold, errorHistory)
      expect(shouldEsc).toBe(false)
    })

    it('should support severity-based thresholds', () => {
      const threshold: EscalationThreshold = {
        errorCount: 1,
        severityMultiplier: {
          low: 0,
          medium: 1,
          high: 2,
          critical: 5,
        },
      }

      // One critical error should exceed threshold of 1
      const errorHistory = [
        { timestamp: Date.now(), severity: 'critical' as ErrorSeverity },
      ]

      const shouldEsc = shouldEscalate(threshold, errorHistory)
      expect(shouldEsc).toBe(true)
    })
  })

  describe('Circular Escalation Prevention', () => {
    it('should detect simple circular escalation', () => {
      const path: EscalationPath = {
        fromTier: 'generative',
        toTier: 'code',
        reason: 'De-escalate for simpler handling',
      }

      const history: CapabilityTier[] = ['code', 'generative']

      const isCircular = detectCircularEscalation(path, history)
      expect(isCircular).toBe(true)
    })

    it('should detect complex circular escalation', () => {
      const path: EscalationPath = {
        fromTier: 'agentic',
        toTier: 'generative',
        reason: 'De-escalate',
      }

      const history: CapabilityTier[] = ['code', 'generative', 'agentic', 'human', 'agentic']

      const isCircular = detectCircularEscalation(path, history)
      expect(isCircular).toBe(true)
    })

    it('should allow valid escalation paths', () => {
      const path: EscalationPath = {
        fromTier: 'code',
        toTier: 'generative',
        reason: 'Escalate for NLU',
      }

      const history: CapabilityTier[] = ['code']

      const isCircular = detectCircularEscalation(path, history)
      expect(isCircular).toBe(false)
    })

    it('should track escalation depth', () => {
      const policy = createEscalationPolicy({
        maxEscalationDepth: 3,
      })

      const history: CapabilityTier[] = ['code', 'generative', 'agentic']

      const validation = validateEscalationPath(
        { fromTier: 'agentic', toTier: 'human', reason: 'test' },
        history,
        policy
      )

      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('depth')
    })
  })

  describe('EscalationPolicy', () => {
    it('should create policy with default values', () => {
      const policy = createEscalationPolicy({})

      expect(policy.maxEscalationDepth).toBeDefined()
      expect(policy.allowSkipTiers).toBe(false)
      expect(policy.rules).toEqual([])
    })

    it('should merge custom rules with defaults', () => {
      const policy = createEscalationPolicy({
        rules: [
          {
            name: 'custom-rule',
            fromTier: 'code',
            toTier: 'human',
            condition: () => true,
          },
        ],
      })

      expect(policy.rules).toHaveLength(1)
      expect(policy.rules[0]!.name).toBe('custom-rule')
    })

    it('should support tier-specific policies', () => {
      const policy = createEscalationPolicy({
        tierPolicies: {
          code: {
            maxRetries: 5,
            timeout: 1000,
          },
          generative: {
            maxRetries: 3,
            timeout: 5000,
          },
        },
      })

      expect(policy.tierPolicies?.code?.maxRetries).toBe(5)
      expect(policy.tierPolicies?.generative?.timeout).toBe(5000)
    })
  })
})

// ============================================================================
// Recovery Pattern Tests
// ============================================================================

describe('Recovery Patterns', () => {
  describe('Retry with Backoff', () => {
    it('should calculate exponential backoff', () => {
      const config: RetryConfig = {
        maxRetries: 5,
        baseDelayMs: 100,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      }

      expect(calculateBackoff(config, 0)).toBe(100)   // 100 * 2^0
      expect(calculateBackoff(config, 1)).toBe(200)   // 100 * 2^1
      expect(calculateBackoff(config, 2)).toBe(400)   // 100 * 2^2
      expect(calculateBackoff(config, 3)).toBe(800)   // 100 * 2^3
    })

    it('should cap delay at maxDelayMs', () => {
      const config: RetryConfig = {
        maxRetries: 10,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      }

      expect(calculateBackoff(config, 5)).toBe(5000) // Would be 32000, capped at 5000
    })

    it('should add jitter when configured', () => {
      const config: RetryConfig = {
        maxRetries: 5,
        baseDelayMs: 100,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        jitterPercent: 20,
      }

      const delays = Array.from({ length: 10 }, () => calculateBackoff(config, 2))
      const baseDelay = 400 // 100 * 2^2

      // With 20% jitter, delays should be between 320 and 480
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(baseDelay * 0.8)
        expect(delay).toBeLessThanOrEqual(baseDelay * 1.2)
      })

      // Not all delays should be identical (jitter is working)
      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(1)
    })

    it('should create retry state', () => {
      const state = createRetryState({
        maxRetries: 3,
        baseDelayMs: 100,
      })

      expect(state.attemptNumber).toBe(0)
      expect(state.lastAttemptTime).toBeNull()
      expect(state.nextRetryTime).toBeNull()
      expect(state.exhausted).toBe(false)
    })

    it('should determine if retry should occur', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 100,
      }

      const state1: RetryState = { attemptNumber: 2, exhausted: false, lastAttemptTime: null, nextRetryTime: null }
      expect(shouldRetry(config, state1)).toBe(true)

      const state2: RetryState = { attemptNumber: 3, exhausted: true, lastAttemptTime: null, nextRetryTime: null }
      expect(shouldRetry(config, state2)).toBe(false)
    })

    it('should not retry permanent errors', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 100,
        retryableCategories: ['transient'],
      }

      const error = createClassifiedError(new Error('Permanent'), {
        severity: 'high',
        category: 'permanent',
      })

      const state: RetryState = { attemptNumber: 0, exhausted: false, lastAttemptTime: null, nextRetryTime: null }
      expect(shouldRetry(config, state, error)).toBe(false)
    })
  })

  describe('Fallback to Alternative Agent', () => {
    it('should select fallback agent based on capability', () => {
      const config: FallbackConfig = {
        strategy: 'capability-match',
        requiredSkills: ['data-processing', 'validation'],
      }

      const agents = [
        { id: 'agent-1', skills: ['data-processing'], tier: 'code' as CapabilityTier },
        { id: 'agent-2', skills: ['data-processing', 'validation'], tier: 'code' as CapabilityTier },
        { id: 'agent-3', skills: ['validation'], tier: 'generative' as CapabilityTier },
      ]

      const fallback = selectFallbackAgent(config, agents)
      expect(fallback?.id).toBe('agent-2')
    })

    it('should select fallback agent based on load', () => {
      const config: FallbackConfig = {
        strategy: 'least-loaded',
      }

      const agents = [
        { id: 'agent-1', currentLoad: 8, maxLoad: 10, tier: 'code' as CapabilityTier },
        { id: 'agent-2', currentLoad: 3, maxLoad: 10, tier: 'code' as CapabilityTier },
        { id: 'agent-3', currentLoad: 5, maxLoad: 10, tier: 'code' as CapabilityTier },
      ]

      const fallback = selectFallbackAgent(config, agents)
      expect(fallback?.id).toBe('agent-2')
    })

    it('should prefer same tier when selecting fallback', () => {
      const config: FallbackConfig = {
        strategy: 'same-tier',
        currentTier: 'generative',
      }

      const agents = [
        { id: 'agent-1', tier: 'code' as CapabilityTier },
        { id: 'agent-2', tier: 'generative' as CapabilityTier },
        { id: 'agent-3', tier: 'agentic' as CapabilityTier },
      ]

      const fallback = selectFallbackAgent(config, agents)
      expect(fallback?.id).toBe('agent-2')
    })

    it('should exclude failed agents from fallback selection', () => {
      const config: FallbackConfig = {
        strategy: 'capability-match',
        requiredSkills: ['validation'],
        excludeAgentIds: ['agent-1'],
      }

      const agents = [
        { id: 'agent-1', skills: ['validation'], tier: 'code' as CapabilityTier },
        { id: 'agent-2', skills: ['validation'], tier: 'code' as CapabilityTier },
      ]

      const fallback = selectFallbackAgent(config, agents)
      expect(fallback?.id).toBe('agent-2')
    })

    it('should return null when no suitable fallback exists', () => {
      const config: FallbackConfig = {
        strategy: 'capability-match',
        requiredSkills: ['rare-skill'],
      }

      const agents = [
        { id: 'agent-1', skills: ['common-skill'], tier: 'code' as CapabilityTier },
      ]

      const fallback = selectFallbackAgent(config, agents)
      expect(fallback).toBeNull()
    })
  })

  describe('Graceful Degradation', () => {
    it('should determine degradation level based on severity', () => {
      expect(getDegradationLevel('low')).toBe('none')
      expect(getDegradationLevel('medium')).toBe('partial')
      expect(getDegradationLevel('high')).toBe('significant')
      expect(getDegradationLevel('critical')).toBe('full')
    })

    it('should determine degradation level based on error count', () => {
      const level = getDegradationLevel('medium', { errorCount: 5, threshold: 3 })
      expect(level).toBe('significant')
    })

    it('should apply degradation rules', () => {
      const level = getDegradationLevel('low', {
        rules: [
          { condition: (severity) => severity === 'low', level: 'partial' },
        ],
      })
      expect(level).toBe('partial')
    })
  })

  describe('Recovery State Management', () => {
    it('should create initial recovery state', () => {
      const state = createRecoveryState({
        errorId: 'err-123',
        tier: 'code',
      })

      expect(state.errorId).toBe('err-123')
      expect(state.tier).toBe('code')
      expect(state.retryState.attemptNumber).toBe(0)
      expect(state.escalated).toBe(false)
      expect(state.resolved).toBe(false)
    })

    it('should update recovery state after retry', () => {
      const initial = createRecoveryState({
        errorId: 'err-123',
        tier: 'code',
      })

      const updated = updateRecoveryState(initial, {
        type: 'retry',
        success: false,
      })

      expect(updated.retryState.attemptNumber).toBe(1)
      expect(updated.lastAction).toBe('retry')
    })

    it('should update recovery state after escalation', () => {
      const initial = createRecoveryState({
        errorId: 'err-123',
        tier: 'code',
      })

      const updated = updateRecoveryState(initial, {
        type: 'escalate',
        toTier: 'generative',
      })

      expect(updated.escalated).toBe(true)
      expect(updated.tier).toBe('generative')
      expect(updated.escalationPath).toContain('code')
      expect(updated.escalationPath).toContain('generative')
    })

    it('should update recovery state after fallback', () => {
      const initial = createRecoveryState({
        errorId: 'err-123',
        tier: 'code',
        agentId: 'agent-1',
      })

      const updated = updateRecoveryState(initial, {
        type: 'fallback',
        toAgentId: 'agent-2',
      })

      expect(updated.agentId).toBe('agent-2')
      expect(updated.lastAction).toBe('fallback')
      expect(updated.fallbackHistory).toContain('agent-1')
    })

    it('should mark state as resolved', () => {
      const initial = createRecoveryState({
        errorId: 'err-123',
        tier: 'code',
      })

      const updated = updateRecoveryState(initial, {
        type: 'resolve',
        resolution: 'Manually fixed by human',
      })

      expect(updated.resolved).toBe(true)
      expect(updated.resolution).toBe('Manually fixed by human')
    })

    it('should determine if error is recoverable', () => {
      const recoverableState = createRecoveryState({
        errorId: 'err-1',
        tier: 'code',
      })
      expect(isRecoverable(recoverableState)).toBe(true)

      const exhaustedState = updateRecoveryState(recoverableState, {
        type: 'retry',
        success: false,
        exhausted: true,
      })
      // Still recoverable via escalation
      expect(isRecoverable(exhaustedState)).toBe(true)

      const terminalState = createRecoveryState({
        errorId: 'err-2',
        tier: 'human',
      })
      const escalatedTerminal = updateRecoveryState(terminalState, {
        type: 'escalate',
        toTier: 'human', // Can't escalate further
        isTerminal: true,
      })
      // If retries exhausted and at human tier, not recoverable
      const fullyExhausted = updateRecoveryState(escalatedTerminal, {
        type: 'retry',
        success: false,
        exhausted: true,
      })
      expect(isRecoverable(fullyExhausted)).toBe(false)
    })
  })
})

// ============================================================================
// Escalation Engine Tests
// ============================================================================

describe('EscalationEngine', () => {
  let engine: EscalationEngine

  beforeEach(() => {
    engine = createEscalationEngine({
      policy: createEscalationPolicy({
        maxEscalationDepth: 5,
      }),
      retryConfig: {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('handleError', () => {
    it('should handle error and return escalation result', async () => {
      const error = new Error('Test error')
      const result = await engine.handleError(error, {
        tier: 'code',
        agentId: 'agent-1',
        taskId: 'task-123',
      })

      expect(result.handled).toBe(true)
      expect(result.classifiedError).toBeDefined()
      expect(result.action).toBeDefined()
    })

    it('should retry transient errors before escalating', async () => {
      const error = new Error('Transient error')
      error.name = 'TimeoutError'

      const result = await engine.handleError(error, {
        tier: 'code',
        agentId: 'agent-1',
      })

      expect(result.action).toBe('retry')
      expect(result.retryDelay).toBeDefined()
    })

    it('should escalate after retries exhausted', async () => {
      const error = new Error('Persistent error')

      // Simulate exhausted retries
      const result = await engine.handleError(error, {
        tier: 'code',
        agentId: 'agent-1',
        retryState: {
          attemptNumber: 3,
          exhausted: true,
          lastAttemptTime: new Date(),
          nextRetryTime: null,
        },
      })

      expect(result.action).toBe('escalate')
      expect(result.escalationPath).toBeDefined()
    })

    it('should fallback when escalation not possible', async () => {
      const error = new Error('Cannot escalate')

      const result = await engine.handleError(error, {
        tier: 'human', // Already at highest tier
        agentId: 'agent-1',
        retryState: {
          attemptNumber: 3,
          exhausted: true,
          lastAttemptTime: new Date(),
          nextRetryTime: null,
        },
        availableAgents: [
          { id: 'agent-2', tier: 'human' as CapabilityTier, skills: [] },
        ],
      })

      expect(result.action).toBe('fallback')
      expect(result.fallbackAgent).toBeDefined()
    })
  })

  describe('metrics', () => {
    it('should track error counts by severity', async () => {
      await engine.handleError(new Error('Low'), {
        tier: 'code',
        severity: 'low',
      })
      await engine.handleError(new Error('Medium'), {
        tier: 'code',
        severity: 'medium',
      })
      await engine.handleError(new Error('High'), {
        tier: 'code',
        severity: 'high',
      })

      const metrics = engine.getMetrics()

      expect(metrics.bySeverity.low).toBe(1)
      expect(metrics.bySeverity.medium).toBe(1)
      expect(metrics.bySeverity.high).toBe(1)
    })

    it('should track escalation counts by tier', async () => {
      await engine.handleError(new Error('Escalate'), {
        tier: 'code',
        retryState: { attemptNumber: 3, exhausted: true, lastAttemptTime: new Date(), nextRetryTime: null },
      })

      const metrics = engine.getMetrics()

      expect(metrics.escalationsByTier['code']).toBeGreaterThan(0)
    })

    it('should track retry success rate', async () => {
      // Successful retry
      await engine.handleError(new Error('Retry success'), {
        tier: 'code',
        simulateRetrySuccess: true,
      })

      // Failed retry
      await engine.handleError(new Error('Retry fail'), {
        tier: 'code',
        simulateRetryFailure: true,
      })

      const metrics = engine.getMetrics()

      expect(metrics.retrySuccessRate).toBeDefined()
    })
  })

  describe('policy enforcement', () => {
    it('should respect max escalation depth', async () => {
      const deepEngine = createEscalationEngine({
        policy: createEscalationPolicy({
          maxEscalationDepth: 2,
        }),
      })

      const result = await deepEngine.handleError(new Error('Deep error'), {
        tier: 'code',
        escalationHistory: ['code', 'generative'],
        retryState: { attemptNumber: 3, exhausted: true, lastAttemptTime: new Date(), nextRetryTime: null },
      })

      expect(result.action).not.toBe('escalate')
    })

    it('should apply tier-specific policies', async () => {
      const tierEngine = createEscalationEngine({
        policy: createEscalationPolicy({
          tierPolicies: {
            code: { maxRetries: 1 },
            generative: { maxRetries: 5 },
          },
        }),
      })

      const result = await tierEngine.handleError(new Error('Code tier'), {
        tier: 'code',
        retryState: { attemptNumber: 1, exhausted: false, lastAttemptTime: new Date(), nextRetryTime: null },
      })

      // Should escalate after 1 retry at code tier
      expect(result.action).toBe('escalate')
    })
  })

  describe('error context preservation', () => {
    it('should preserve workflow context through escalation', async () => {
      const result = await engine.handleError(new Error('Context test'), {
        tier: 'code',
        context: {
          workflowId: 'wf-123',
          stepId: 'step-1',
          metadata: { key: 'value' },
        },
        retryState: { attemptNumber: 3, exhausted: true, lastAttemptTime: new Date(), nextRetryTime: null },
      })

      expect(result.preservedContext?.workflowId).toBe('wf-123')
      expect(result.preservedContext?.stepId).toBe('step-1')
      expect(result.preservedContext?.metadata?.key).toBe('value')
    })

    it('should include error chain in result', async () => {
      const previousError = createClassifiedError(new Error('Previous'), {
        severity: 'low',
        category: 'transient',
        tier: 'code',
      })

      const result = await engine.handleError(new Error('Current'), {
        tier: 'generative',
        previousError,
      })

      expect(result.errorChain?.length).toBeGreaterThan(1)
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Error Escalation Integration', () => {
  it('should handle full escalation flow from code to human', async () => {
    const engine = createEscalationEngine({
      policy: createEscalationPolicy({
        maxEscalationDepth: 10,
      }),
      retryConfig: {
        maxRetries: 0, // Skip retries for this test
        baseDelayMs: 100,
      },
    })

    const tiers: CapabilityTier[] = ['code', 'generative', 'agentic', 'human']
    let currentTier: CapabilityTier = 'code'
    const escalationPath: CapabilityTier[] = [currentTier]

    while (currentTier !== 'human') {
      const result = await engine.handleError(new Error(`Error at ${currentTier}`), {
        tier: currentTier,
        retryState: { attemptNumber: 0, exhausted: true, lastAttemptTime: new Date(), nextRetryTime: null },
      })

      if (result.action === 'escalate' && result.escalationPath) {
        currentTier = result.escalationPath.toTier
        escalationPath.push(currentTier)
      } else {
        break
      }
    }

    expect(escalationPath).toEqual(tiers)
  })

  it('should handle concurrent errors without race conditions', async () => {
    const engine = createEscalationEngine({
      policy: createEscalationPolicy({}),
    })

    const errors = Array.from({ length: 10 }, (_, i) =>
      engine.handleError(new Error(`Concurrent error ${i}`), {
        tier: 'code',
        agentId: `agent-${i % 3}`,
      })
    )

    const results = await Promise.all(errors)

    results.forEach(result => {
      expect(result.handled).toBe(true)
      expect(result.classifiedError).toBeDefined()
    })

    const metrics = engine.getMetrics()
    expect(metrics.totalErrors).toBe(10)
  })
})
