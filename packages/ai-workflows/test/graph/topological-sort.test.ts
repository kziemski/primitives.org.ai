/**
 * Tests for Topological Sort Implementation
 *
 * TDD RED Phase: These tests define the expected behavior for topological sorting
 * of workflow step dependencies.
 */

import { describe, it, expect } from 'vitest'
import {
  topologicalSort,
  topologicalSortKahn,
  topologicalSortDFS,
  getExecutionLevels,
  CycleDetectedError,
  type SortableNode,
  type ExecutionLevel,
  type TopologicalSortResult,
} from '../../src/graph/topological-sort.js'

describe('Topological Sort', () => {
  describe('topologicalSort() - main function', () => {
    it('should sort a simple linear graph', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      const result = topologicalSort(nodes)

      expect(result.order).toEqual(['A', 'B', 'C'])
      expect(result.hasCycle).toBe(false)
    })

    it('should handle nodes with no dependencies', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: [] },
        { id: 'C', dependencies: [] },
      ]

      const result = topologicalSort(nodes)

      // All should appear (order may vary for equal nodes)
      expect(result.order).toHaveLength(3)
      expect(result.order).toContain('A')
      expect(result.order).toContain('B')
      expect(result.order).toContain('C')
      expect(result.hasCycle).toBe(false)
    })

    it('should handle diamond dependency pattern', () => {
      // A -> B, A -> C, B -> D, C -> D
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['A'] },
        { id: 'D', dependencies: ['B', 'C'] },
      ]

      const result = topologicalSort(nodes)

      expect(result.hasCycle).toBe(false)
      // A must come before B and C
      expect(result.order.indexOf('A')).toBeLessThan(result.order.indexOf('B'))
      expect(result.order.indexOf('A')).toBeLessThan(result.order.indexOf('C'))
      // B and C must come before D
      expect(result.order.indexOf('B')).toBeLessThan(result.order.indexOf('D'))
      expect(result.order.indexOf('C')).toBeLessThan(result.order.indexOf('D'))
    })

    it('should provide stable ordering for equal priority nodes', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: [] },
        { id: 'C', dependencies: [] },
      ]

      // Run multiple times to verify stability
      const result1 = topologicalSort(nodes)
      const result2 = topologicalSort(nodes)
      const result3 = topologicalSort(nodes)

      expect(result1.order).toEqual(result2.order)
      expect(result2.order).toEqual(result3.order)
    })

    it('should return empty array for empty input', () => {
      const result = topologicalSort([])

      expect(result.order).toEqual([])
      expect(result.hasCycle).toBe(false)
    })

    it('should handle single node', () => {
      const nodes: SortableNode[] = [{ id: 'A', dependencies: [] }]

      const result = topologicalSort(nodes)

      expect(result.order).toEqual(['A'])
      expect(result.hasCycle).toBe(false)
    })

    it('should handle complex multi-level dependencies', () => {
      // Level 0: A, B
      // Level 1: C (depends on A), D (depends on B)
      // Level 2: E (depends on C, D), F (depends on D)
      // Level 3: G (depends on E, F)
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: [] },
        { id: 'C', dependencies: ['A'] },
        { id: 'D', dependencies: ['B'] },
        { id: 'E', dependencies: ['C', 'D'] },
        { id: 'F', dependencies: ['D'] },
        { id: 'G', dependencies: ['E', 'F'] },
      ]

      const result = topologicalSort(nodes)

      expect(result.hasCycle).toBe(false)
      // Verify all dependency constraints
      expect(result.order.indexOf('A')).toBeLessThan(result.order.indexOf('C'))
      expect(result.order.indexOf('B')).toBeLessThan(result.order.indexOf('D'))
      expect(result.order.indexOf('C')).toBeLessThan(result.order.indexOf('E'))
      expect(result.order.indexOf('D')).toBeLessThan(result.order.indexOf('E'))
      expect(result.order.indexOf('D')).toBeLessThan(result.order.indexOf('F'))
      expect(result.order.indexOf('E')).toBeLessThan(result.order.indexOf('G'))
      expect(result.order.indexOf('F')).toBeLessThan(result.order.indexOf('G'))
    })
  })

  describe('Kahn\'s Algorithm Implementation', () => {
    it('should sort using Kahn\'s algorithm', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      const result = topologicalSortKahn(nodes)

      expect(result.order).toEqual(['A', 'B', 'C'])
      expect(result.hasCycle).toBe(false)
    })

    it('should detect cycles and return partial result', () => {
      // A -> B -> C -> A (cycle)
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: ['C'] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      const result = topologicalSortKahn(nodes)

      expect(result.hasCycle).toBe(true)
      expect(result.order.length).toBeLessThan(3) // Partial result
    })

    it('should provide in-degree information', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['A', 'B'] },
      ]

      const result = topologicalSortKahn(nodes)

      // A has in-degree 0, B has in-degree 1, C has in-degree 2
      expect(result.metadata?.inDegrees?.['A']).toBe(0)
      expect(result.metadata?.inDegrees?.['B']).toBe(1)
      expect(result.metadata?.inDegrees?.['C']).toBe(2)
    })
  })

  describe('DFS-based Topological Sort', () => {
    it('should sort using DFS algorithm', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      const result = topologicalSortDFS(nodes)

      expect(result.order).toEqual(['A', 'B', 'C'])
      expect(result.hasCycle).toBe(false)
    })

    it('should detect cycles during DFS', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: ['C'] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      const result = topologicalSortDFS(nodes)

      expect(result.hasCycle).toBe(true)
    })

    it('should provide cycle path in metadata when cycle detected', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: ['C'] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      const result = topologicalSortDFS(nodes)

      expect(result.hasCycle).toBe(true)
      expect(result.cyclePath).toBeDefined()
      expect(result.cyclePath!.length).toBeGreaterThan(0)
    })
  })

  describe('Cycle Detection Tests', () => {
    it('should detect direct cycle (A -> B -> A)', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: ['B'] },
        { id: 'B', dependencies: ['A'] },
      ]

      const result = topologicalSort(nodes)

      expect(result.hasCycle).toBe(true)
      expect(result.cyclePath).toBeDefined()
    })

    it('should detect indirect cycle (A -> B -> C -> A)', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: ['C'] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      const result = topologicalSort(nodes)

      expect(result.hasCycle).toBe(true)
      expect(result.cyclePath).toBeDefined()
      // Cycle path should contain all nodes in the cycle
      expect(result.cyclePath!.length).toBeGreaterThanOrEqual(3)
    })

    it('should detect self-referencing cycle (A -> A)', () => {
      const nodes: SortableNode[] = [{ id: 'A', dependencies: ['A'] }]

      const result = topologicalSort(nodes)

      expect(result.hasCycle).toBe(true)
      expect(result.cyclePath).toContain('A')
    })

    it('should provide appropriate error message with cycle path', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: ['C'] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      expect(() => {
        const result = topologicalSort(nodes, { throwOnCycle: true })
      }).toThrow(CycleDetectedError)
    })

    it('should include cycle path in CycleDetectedError', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: ['C'] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      try {
        topologicalSort(nodes, { throwOnCycle: true })
        expect.fail('Should have thrown CycleDetectedError')
      } catch (error) {
        expect(error).toBeInstanceOf(CycleDetectedError)
        const cycleError = error as CycleDetectedError
        expect(cycleError.cyclePath).toBeDefined()
        expect(cycleError.cyclePath.length).toBeGreaterThanOrEqual(3)
        expect(cycleError.message).toContain('->') // Shows path format
      }
    })

    it('should not detect cycle in valid DAG with shared dependencies', () => {
      // Diamond pattern: A -> B, A -> C, B -> D, C -> D
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['A'] },
        { id: 'D', dependencies: ['B', 'C'] },
      ]

      const result = topologicalSort(nodes)

      expect(result.hasCycle).toBe(false)
    })
  })

  describe('Execution Order Validation Tests', () => {
    it('should ensure dependencies execute before dependents', () => {
      const nodes: SortableNode[] = [
        { id: 'step1', dependencies: [] },
        { id: 'step2', dependencies: ['step1'] },
        { id: 'step3', dependencies: ['step2'] },
        { id: 'step4', dependencies: ['step3'] },
      ]

      const result = topologicalSort(nodes)

      // For every node, all its dependencies should appear earlier in the order
      for (const node of nodes) {
        const nodeIndex = result.order.indexOf(node.id)
        for (const dep of node.dependencies) {
          const depIndex = result.order.indexOf(dep)
          expect(depIndex).toBeLessThan(nodeIndex)
        }
      }
    })

    it('should identify parallel-safe ordering', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: [] },
        { id: 'C', dependencies: ['A'] },
        { id: 'D', dependencies: ['B'] },
      ]

      const levels = getExecutionLevels(nodes)

      // Level 0: A, B (can run in parallel)
      // Level 1: C, D (can run in parallel after level 0)
      expect(levels).toHaveLength(2)
      expect(levels[0].nodes).toContain('A')
      expect(levels[0].nodes).toContain('B')
      expect(levels[1].nodes).toContain('C')
      expect(levels[1].nodes).toContain('D')
    })

    it('should provide deterministic order for reproducibility', () => {
      const nodes: SortableNode[] = [
        { id: 'Z', dependencies: [] },
        { id: 'A', dependencies: [] },
        { id: 'M', dependencies: [] },
        { id: 'B', dependencies: ['Z', 'A'] },
      ]

      // Run 10 times to verify determinism
      const results: string[][] = []
      for (let i = 0; i < 10; i++) {
        const result = topologicalSort(nodes)
        results.push(result.order)
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0])
      }
    })

    it('should sort equal-priority nodes alphabetically for stability', () => {
      const nodes: SortableNode[] = [
        { id: 'C', dependencies: [] },
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: [] },
      ]

      const result = topologicalSort(nodes)

      // Should be sorted alphabetically since all have same priority (level 0)
      expect(result.order).toEqual(['A', 'B', 'C'])
    })
  })

  describe('getExecutionLevels() - Parallel Execution Groups', () => {
    it('should group nodes by execution level', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['B'] },
      ]

      const levels = getExecutionLevels(nodes)

      expect(levels).toHaveLength(3)
      expect(levels[0]).toEqual({ level: 0, nodes: ['A'] })
      expect(levels[1]).toEqual({ level: 1, nodes: ['B'] })
      expect(levels[2]).toEqual({ level: 2, nodes: ['C'] })
    })

    it('should identify parallelizable batches', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: [] },
        { id: 'C', dependencies: [] },
        { id: 'D', dependencies: ['A', 'B', 'C'] },
      ]

      const levels = getExecutionLevels(nodes)

      expect(levels).toHaveLength(2)
      expect(levels[0].level).toBe(0)
      expect(levels[0].nodes).toHaveLength(3)
      expect(levels[1].level).toBe(1)
      expect(levels[1].nodes).toEqual(['D'])
    })

    it('should return correct levels for complex graph', () => {
      // Level 0: A, B
      // Level 1: C, D (C depends on A, D depends on B)
      // Level 2: E (depends on C and D)
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: [] },
        { id: 'C', dependencies: ['A'] },
        { id: 'D', dependencies: ['B'] },
        { id: 'E', dependencies: ['C', 'D'] },
      ]

      const levels = getExecutionLevels(nodes)

      expect(levels).toHaveLength(3)

      const level0 = levels.find((l) => l.level === 0)!
      const level1 = levels.find((l) => l.level === 1)!
      const level2 = levels.find((l) => l.level === 2)!

      expect(level0.nodes.sort()).toEqual(['A', 'B'])
      expect(level1.nodes.sort()).toEqual(['C', 'D'])
      expect(level2.nodes).toEqual(['E'])
    })

    it('should handle empty input', () => {
      const levels = getExecutionLevels([])

      expect(levels).toEqual([])
    })

    it('should sort nodes within each level for determinism', () => {
      const nodes: SortableNode[] = [
        { id: 'Z', dependencies: [] },
        { id: 'A', dependencies: [] },
        { id: 'M', dependencies: [] },
      ]

      const levels = getExecutionLevels(nodes)

      expect(levels[0].nodes).toEqual(['A', 'M', 'Z'])
    })

    it('should throw on cycle when getting execution levels', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: ['B'] },
        { id: 'B', dependencies: ['A'] },
      ]

      expect(() => getExecutionLevels(nodes)).toThrow(CycleDetectedError)
    })
  })

  describe('Edge Cases', () => {
    it('should handle nodes with unknown dependencies (missing nodes)', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A', 'MISSING'] }, // MISSING doesn't exist
      ]

      // Should either throw or ignore missing dependencies
      // Implementation choice: throw MissingNodeError
      expect(() => topologicalSort(nodes, { strict: true })).toThrow()
    })

    it('should handle duplicate dependencies gracefully', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A', 'A', 'A'] }, // Duplicate deps
      ]

      const result = topologicalSort(nodes)

      expect(result.order).toEqual(['A', 'B'])
      expect(result.hasCycle).toBe(false)
    })

    it('should handle very deep dependency chains', () => {
      const nodes: SortableNode[] = []
      const depth = 100

      for (let i = 0; i < depth; i++) {
        nodes.push({
          id: `node${i}`,
          dependencies: i > 0 ? [`node${i - 1}`] : [],
        })
      }

      const result = topologicalSort(nodes)

      expect(result.hasCycle).toBe(false)
      expect(result.order).toHaveLength(depth)
      expect(result.order[0]).toBe('node0')
      expect(result.order[depth - 1]).toBe(`node${depth - 1}`)
    })

    it('should handle wide graphs efficiently', () => {
      const nodes: SortableNode[] = [{ id: 'root', dependencies: [] }]

      // Add 100 nodes all depending on root
      for (let i = 0; i < 100; i++) {
        nodes.push({ id: `child${i}`, dependencies: ['root'] })
      }

      const result = topologicalSort(nodes)

      expect(result.hasCycle).toBe(false)
      expect(result.order).toHaveLength(101)
      expect(result.order[0]).toBe('root')
    })
  })

  describe('Options and Configuration', () => {
    it('should support throwOnCycle option', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: ['B'] },
        { id: 'B', dependencies: ['A'] },
      ]

      // With throwOnCycle: false (default)
      const result = topologicalSort(nodes, { throwOnCycle: false })
      expect(result.hasCycle).toBe(true)

      // With throwOnCycle: true
      expect(() => topologicalSort(nodes, { throwOnCycle: true })).toThrow(
        CycleDetectedError
      )
    })

    it('should support algorithm selection', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
      ]

      const kahnResult = topologicalSort(nodes, { algorithm: 'kahn' })
      const dfsResult = topologicalSort(nodes, { algorithm: 'dfs' })

      expect(kahnResult.order).toEqual(['A', 'B'])
      expect(dfsResult.order).toEqual(['A', 'B'])
    })

    it('should support strict mode for missing dependencies', () => {
      const nodes: SortableNode[] = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['MISSING'] },
      ]

      // Strict mode should throw
      expect(() => topologicalSort(nodes, { strict: true })).toThrow()

      // Non-strict should ignore missing deps
      const result = topologicalSort(nodes, { strict: false })
      expect(result.order).toContain('A')
      expect(result.order).toContain('B')
    })
  })
})

describe('CycleDetectedError', () => {
  it('should contain cycle path', () => {
    const error = new CycleDetectedError(['A', 'B', 'C', 'A'])

    expect(error.cyclePath).toEqual(['A', 'B', 'C', 'A'])
  })

  it('should format message with cycle path', () => {
    const error = new CycleDetectedError(['A', 'B', 'C', 'A'])

    expect(error.message).toContain('A -> B -> C -> A')
  })

  it('should have correct error name', () => {
    const error = new CycleDetectedError(['A', 'B', 'A'])

    expect(error.name).toBe('CycleDetectedError')
  })
})
