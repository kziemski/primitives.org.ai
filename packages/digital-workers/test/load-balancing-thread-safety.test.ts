/**
 * Thread-Safe Metrics Tests for Load Balancing
 *
 * TDD tests for ensuring metrics collection is thread-safe and isolated.
 * These tests verify that metrics can be collected per-instance without
 * race conditions or shared state pollution.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type {
  AgentInfo,
  TaskRequest,
  RoutingMetrics,
  MetricsCollector,
} from '../src/load-balancing.js'
import {
  createRoundRobinBalancer,
  createLeastBusyBalancer,
  createCapabilityRouter,
  createMetricsCollector,
  collectRoutingMetrics,
  resetRoutingMetrics,
} from '../src/load-balancing.js'
import type { WorkerStatus } from '../src/types.js'

// ============================================================================
// Test Fixtures
// ============================================================================

const createAgent = (
  id: string,
  skills: string[] = [],
  status: WorkerStatus = 'available',
  currentLoad = 0
): AgentInfo => ({
  id,
  name: `Agent ${id}`,
  type: 'agent',
  status,
  skills,
  currentLoad,
  maxLoad: 10,
  contacts: { api: `https://agent-${id}.example.com` },
  metadata: {},
})

const createTask = (
  id: string,
  requiredSkills: string[] = [],
  priority: number = 5
): TaskRequest => ({
  id,
  name: `Task ${id}`,
  requiredSkills,
  priority,
  metadata: {},
})

// ============================================================================
// MetricsCollector Isolation Tests
// ============================================================================

describe('MetricsCollector Thread Safety', () => {
  beforeEach(() => {
    // Reset the default global metrics for clean test state
    resetRoutingMetrics()
  })

  describe('should isolate metrics per collector instance', () => {
    it('two collectors should have independent state', () => {
      const collector1 = createMetricsCollector()
      const collector2 = createMetricsCollector()

      const agents = [createAgent('agent-1')]
      const balancer1 = createRoundRobinBalancer(agents, { metricsCollector: collector1 })

      // Route 3 tasks through balancer1 (using collector1)
      balancer1.route(createTask('t1'))
      balancer1.route(createTask('t2'))
      balancer1.route(createTask('t3'))

      // Collector1 should have 3 routed tasks
      const metrics1 = collector1.collect()
      expect(metrics1.totalRouted).toBe(3)

      // Collector2 should have 0 routed tasks (never used)
      const metrics2 = collector2.collect()
      expect(metrics2.totalRouted).toBe(0)
    })

    it('recording to one collector should not affect the other', () => {
      const collector1 = createMetricsCollector()
      const collector2 = createMetricsCollector()

      const agents = [createAgent('agent-1'), createAgent('agent-2')]

      // Create balancers with different collectors
      const balancer1 = createRoundRobinBalancer(agents, { metricsCollector: collector1 })
      const balancer2 = createRoundRobinBalancer(agents, { metricsCollector: collector2 })

      // Route tasks through balancer1
      balancer1.route(createTask('t1'))
      balancer1.route(createTask('t2'))

      // Route tasks through balancer2
      balancer2.route(createTask('t3'))

      // Verify isolation
      expect(collector1.collect().totalRouted).toBe(2)
      expect(collector2.collect().totalRouted).toBe(1)

      // Verify per-agent tracking is also isolated
      expect(collector1.collect().perAgent['agent-1']?.routedCount).toBe(1)
      expect(collector1.collect().perAgent['agent-2']?.routedCount).toBe(1)
      expect(collector2.collect().perAgent['agent-1']?.routedCount).toBe(1)
      expect(collector2.collect().perAgent['agent-2']).toBeUndefined()
    })
  })

  describe('should support concurrent metric recording without race conditions', () => {
    it('concurrent writes to the same collector should not lose data', async () => {
      const collector = createMetricsCollector()
      const agents = [createAgent('agent-1')]
      const balancer = createRoundRobinBalancer(agents, { metricsCollector: collector })

      // Simulate 100 concurrent routing operations
      const concurrentCount = 100
      const promises: Promise<void>[] = []

      for (let i = 0; i < concurrentCount; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            // Small random delay to simulate real concurrency
            setTimeout(() => {
              balancer.route(createTask(`t${i}`))
              resolve()
            }, Math.random() * 10)
          })
        )
      }

      await Promise.all(promises)

      // All 100 routings should be recorded
      const metrics = collector.collect()
      expect(metrics.totalRouted).toBe(concurrentCount)
      expect(metrics.perAgent['agent-1']?.routedCount).toBe(concurrentCount)
      expect(metrics.strategyUsage['round-robin']).toBe(concurrentCount)
    })

    it('concurrent writes to different collectors should remain isolated', async () => {
      const collector1 = createMetricsCollector()
      const collector2 = createMetricsCollector()

      const agents = [createAgent('agent-1')]
      const balancer1 = createRoundRobinBalancer(agents, { metricsCollector: collector1 })
      const balancer2 = createRoundRobinBalancer(agents, { metricsCollector: collector2 })

      const count1 = 50
      const count2 = 75
      const promises: Promise<void>[] = []

      // Concurrent writes to collector1
      for (let i = 0; i < count1; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              balancer1.route(createTask(`t1-${i}`))
              resolve()
            }, Math.random() * 10)
          })
        )
      }

      // Concurrent writes to collector2
      for (let i = 0; i < count2; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              balancer2.route(createTask(`t2-${i}`))
              resolve()
            }, Math.random() * 10)
          })
        )
      }

      await Promise.all(promises)

      expect(collector1.collect().totalRouted).toBe(count1)
      expect(collector2.collect().totalRouted).toBe(count2)
    })
  })

  describe('should provide thread-safe average latency calculation', () => {
    it('concurrent latency recordings should calculate correct average', async () => {
      const collector = createMetricsCollector()
      const agents = [createAgent('agent-1')]
      const balancer = createRoundRobinBalancer(agents, { metricsCollector: collector })

      // Route multiple tasks concurrently
      const concurrentCount = 50
      const promises: Promise<void>[] = []

      for (let i = 0; i < concurrentCount; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              balancer.route(createTask(`t${i}`))
              resolve()
            }, Math.random() * 5)
          })
        )
      }

      await Promise.all(promises)

      const metrics = collector.collect()

      // Average latency should be a reasonable positive number
      expect(metrics.averageLatencyMs).toBeGreaterThanOrEqual(0)
      expect(metrics.totalRouted).toBe(concurrentCount)

      // The average should be mathematically valid (totalLatency / count)
      // We verify indirectly by ensuring it's not NaN or Infinity
      expect(Number.isFinite(metrics.averageLatencyMs)).toBe(true)
    })

    it('reset should properly clear latency accumulator', () => {
      const collector = createMetricsCollector()
      const agents = [createAgent('agent-1')]
      const balancer = createRoundRobinBalancer(agents, { metricsCollector: collector })

      // Route some tasks
      balancer.route(createTask('t1'))
      balancer.route(createTask('t2'))

      const before = collector.collect()
      expect(before.totalRouted).toBe(2)
      expect(before.averageLatencyMs).toBeGreaterThanOrEqual(0)

      // Reset the collector
      collector.reset()

      const after = collector.collect()
      expect(after.totalRouted).toBe(0)
      expect(after.averageLatencyMs).toBe(0)

      // New routings should have fresh averages
      balancer.route(createTask('t3'))
      const final = collector.collect()
      expect(final.totalRouted).toBe(1)
      expect(final.averageLatencyMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('should accept metrics collector in constructor', () => {
    it('createRoundRobinBalancer should accept metricsCollector option', () => {
      const collector = createMetricsCollector()
      const agents = [createAgent('agent-1')]

      const balancer = createRoundRobinBalancer(agents, { metricsCollector: collector })

      balancer.route(createTask('t1'))

      expect(collector.collect().totalRouted).toBe(1)
      expect(collector.collect().strategyUsage['round-robin']).toBe(1)
    })

    it('createLeastBusyBalancer should accept metricsCollector option', () => {
      const collector = createMetricsCollector()
      const agents = [createAgent('agent-1')]

      const balancer = createLeastBusyBalancer(agents, { metricsCollector: collector })

      balancer.route(createTask('t1'))

      expect(collector.collect().totalRouted).toBe(1)
      expect(collector.collect().strategyUsage['least-busy']).toBe(1)
    })

    it('createCapabilityRouter should accept metricsCollector option', () => {
      const collector = createMetricsCollector()
      const agents = [createAgent('agent-1', ['code'])]

      const router = createCapabilityRouter(agents, { metricsCollector: collector })

      router.route(createTask('t1', ['code']))

      expect(collector.collect().totalRouted).toBe(1)
      expect(collector.collect().strategyUsage['capability']).toBe(1)
    })

    it('balancer without metricsCollector should use default global collector', () => {
      // Reset global metrics first
      resetRoutingMetrics()

      const agents = [createAgent('agent-1')]

      // Create balancer WITHOUT explicit collector (uses default)
      const balancer = createRoundRobinBalancer(agents)

      balancer.route(createTask('t1'))
      balancer.route(createTask('t2'))

      // Global metrics should be updated
      const globalMetrics = collectRoutingMetrics()
      expect(globalMetrics.totalRouted).toBe(2)
    })
  })

  describe('should allow balancers to share metrics collector', () => {
    it('two balancers sharing a collector should aggregate metrics', () => {
      const sharedCollector = createMetricsCollector()
      const agents = [createAgent('agent-1'), createAgent('agent-2')]

      // Create two balancers sharing the same collector
      const balancer1 = createRoundRobinBalancer(agents, { metricsCollector: sharedCollector })
      const balancer2 = createLeastBusyBalancer(agents, { metricsCollector: sharedCollector })

      // Route tasks through both balancers
      balancer1.route(createTask('t1'))
      balancer1.route(createTask('t2'))
      balancer2.route(createTask('t3'))
      balancer2.route(createTask('t4'))
      balancer2.route(createTask('t5'))

      const metrics = sharedCollector.collect()

      // Total should be combined
      expect(metrics.totalRouted).toBe(5)

      // Strategy usage should track both
      expect(metrics.strategyUsage['round-robin']).toBe(2)
      expect(metrics.strategyUsage['least-busy']).toBe(3)
    })

    it('shared collector should track per-agent metrics from all balancers', () => {
      const sharedCollector = createMetricsCollector()

      const agents = [createAgent('agent-1'), createAgent('agent-2')]

      const balancer1 = createRoundRobinBalancer(agents, { metricsCollector: sharedCollector })
      const balancer2 = createRoundRobinBalancer(agents, { metricsCollector: sharedCollector })

      // Both balancers route to the same agents
      balancer1.route(createTask('t1')) // -> agent-1
      balancer1.route(createTask('t2')) // -> agent-2
      balancer2.route(createTask('t3')) // -> agent-1
      balancer2.route(createTask('t4')) // -> agent-2

      const metrics = sharedCollector.collect()

      // Per-agent metrics should aggregate from both balancers
      expect(metrics.perAgent['agent-1']?.routedCount).toBe(2)
      expect(metrics.perAgent['agent-2']?.routedCount).toBe(2)
    })

    it('resetting shared collector should affect all balancers using it', () => {
      const sharedCollector = createMetricsCollector()
      const agents = [createAgent('agent-1')]

      const balancer1 = createRoundRobinBalancer(agents, { metricsCollector: sharedCollector })
      const balancer2 = createRoundRobinBalancer(agents, { metricsCollector: sharedCollector })

      balancer1.route(createTask('t1'))
      balancer2.route(createTask('t2'))

      expect(sharedCollector.collect().totalRouted).toBe(2)

      // Reset the shared collector
      sharedCollector.reset()

      // Both balancers' metrics should be cleared
      expect(sharedCollector.collect().totalRouted).toBe(0)

      // New routings from either balancer should work correctly
      balancer1.route(createTask('t3'))
      expect(sharedCollector.collect().totalRouted).toBe(1)
    })
  })

  describe('MetricsCollector interface', () => {
    it('should have collect() method returning RoutingMetrics', () => {
      const collector = createMetricsCollector()

      const metrics = collector.collect()

      expect(metrics).toHaveProperty('totalRouted')
      expect(metrics).toHaveProperty('failedRoutes')
      expect(metrics).toHaveProperty('averageLatencyMs')
      expect(metrics).toHaveProperty('perAgent')
      expect(metrics).toHaveProperty('strategyUsage')
    })

    it('should have reset() method', () => {
      const collector = createMetricsCollector()

      expect(typeof collector.reset).toBe('function')

      // Should not throw
      collector.reset()
    })

    it('collect() should return a copy, not the internal state', () => {
      const collector = createMetricsCollector()
      const agents = [createAgent('agent-1')]
      const balancer = createRoundRobinBalancer(agents, { metricsCollector: collector })

      balancer.route(createTask('t1'))

      const metrics1 = collector.collect()
      const metrics2 = collector.collect()

      // Should be equal values but different objects
      expect(metrics1).toEqual(metrics2)
      expect(metrics1).not.toBe(metrics2)

      // Mutating the returned object should not affect internal state
      metrics1.totalRouted = 999
      expect(collector.collect().totalRouted).toBe(1)
    })
  })

  describe('backward compatibility', () => {
    it('collectRoutingMetrics() should still work (using default collector)', () => {
      resetRoutingMetrics()

      const agents = [createAgent('agent-1')]
      const balancer = createRoundRobinBalancer(agents)

      balancer.route(createTask('t1'))

      const metrics = collectRoutingMetrics()
      expect(metrics.totalRouted).toBe(1)
    })

    it('resetRoutingMetrics() should still work (resetting default collector)', () => {
      const agents = [createAgent('agent-1')]
      const balancer = createRoundRobinBalancer(agents)

      balancer.route(createTask('t1'))
      resetRoutingMetrics()

      const metrics = collectRoutingMetrics()
      expect(metrics.totalRouted).toBe(0)
    })

    it('existing balancer factory functions should work without options', () => {
      // These should all work without providing metricsCollector
      const agents = [createAgent('agent-1', ['code'])]

      const rr = createRoundRobinBalancer(agents)
      const lb = createLeastBusyBalancer(agents)
      const cap = createCapabilityRouter(agents)

      // All should route successfully
      expect(rr.route(createTask('t1')).agent).not.toBeNull()
      expect(lb.route(createTask('t2')).agent).not.toBeNull()
      expect(cap.route(createTask('t3', ['code'])).agent).not.toBeNull()
    })
  })
})
