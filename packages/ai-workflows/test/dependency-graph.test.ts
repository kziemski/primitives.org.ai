/**
 * Tests for DependencyGraph architecture
 *
 * TDD RED Phase: These tests define the expected behavior for workflow step dependencies.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  DependencyGraph,
  CircularDependencyError,
  MissingDependencyError,
  type DependencyConfig,
  type DependencyType,
  type GraphNode,
  type ParallelGroup,
} from '../src/dependency-graph.js'

describe('DependencyGraph', () => {
  let graph: DependencyGraph

  beforeEach(() => {
    graph = new DependencyGraph()
  })

  describe('DependencyConfig interface', () => {
    it('should support dependsOn as single string', () => {
      const config: DependencyConfig = {
        dependsOn: 'Step1.complete',
      }
      expect(config.dependsOn).toBe('Step1.complete')
    })

    it('should support dependsOn as array of strings', () => {
      const config: DependencyConfig = {
        dependsOn: ['Step1.complete', 'Step2.complete'],
      }
      expect(config.dependsOn).toEqual(['Step1.complete', 'Step2.complete'])
    })

    it('should support hard vs soft dependency types', () => {
      const hardDep: DependencyConfig = {
        dependsOn: 'Step1.complete',
        type: 'hard', // Must complete successfully
      }
      const softDep: DependencyConfig = {
        dependsOn: 'Step1.complete',
        type: 'soft', // Can proceed even if dependency fails
      }
      expect(hardDep.type).toBe('hard')
      expect(softDep.type).toBe('soft')
    })

    it('should default dependency type to hard', () => {
      const config: DependencyConfig = {
        dependsOn: 'Step1.complete',
      }
      // Implementation should default to 'hard' when type is not specified
      expect(config.type).toBeUndefined()
    })
  })

  describe('addNode()', () => {
    it('should add a node without dependencies', () => {
      graph.addNode('Step1.complete')

      const nodes = graph.getNodes()
      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.id).toBe('Step1.complete')
      expect(nodes[0]?.dependencies).toEqual([])
    })

    it('should add a node with single dependency', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })

      const step2 = graph.getNode('Step2.complete')
      expect(step2?.dependencies).toContain('Step1.complete')
    })

    it('should add a node with multiple dependencies', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete')
      graph.addNode('Step3.complete', {
        dependsOn: ['Step1.complete', 'Step2.complete'],
      })

      const step3 = graph.getNode('Step3.complete')
      expect(step3?.dependencies).toEqual(['Step1.complete', 'Step2.complete'])
    })

    it('should throw MissingDependencyError for non-existent dependency', () => {
      expect(() => {
        graph.addNode('Step2.complete', { dependsOn: 'NonExistent.complete' })
      }).toThrow(MissingDependencyError)
    })

    it('should throw on self-reference', () => {
      expect(() => {
        graph.addNode('Step1.complete', { dependsOn: 'Step1.complete' })
      }).toThrow(CircularDependencyError)
    })

    it('should store dependency type (hard/soft)', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', {
        dependsOn: 'Step1.complete',
        type: 'soft',
      })

      const step2 = graph.getNode('Step2.complete')
      expect(step2?.dependencyTypes?.['Step1.complete']).toBe('soft')
    })
  })

  describe('addEdge()', () => {
    it('should add an edge between existing nodes', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete')
      graph.addEdge('Step1.complete', 'Step2.complete')

      const step2 = graph.getNode('Step2.complete')
      expect(step2?.dependencies).toContain('Step1.complete')
    })

    it('should throw on non-existent source node', () => {
      graph.addNode('Step2.complete')
      expect(() => {
        graph.addEdge('NonExistent.complete', 'Step2.complete')
      }).toThrow(MissingDependencyError)
    })

    it('should throw on non-existent target node', () => {
      graph.addNode('Step1.complete')
      expect(() => {
        graph.addEdge('Step1.complete', 'NonExistent.complete')
      }).toThrow(MissingDependencyError)
    })

    it('should support specifying dependency type on edge', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete')
      graph.addEdge('Step1.complete', 'Step2.complete', 'soft')

      const step2 = graph.getNode('Step2.complete')
      expect(step2?.dependencyTypes?.['Step1.complete']).toBe('soft')
    })
  })

  describe('detectCycles()', () => {
    it('should return null for acyclic graph', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })
      graph.addNode('Step3.complete', { dependsOn: 'Step2.complete' })

      expect(graph.detectCycles()).toBeNull()
    })

    it('should detect direct cycle (A -> B -> A)', () => {
      graph.addNode('StepA.complete')
      graph.addNode('StepB.complete', { dependsOn: 'StepA.complete' })

      // Adding this edge would create a cycle
      expect(() => {
        graph.addEdge('StepB.complete', 'StepA.complete')
      }).toThrow(CircularDependencyError)
    })

    it('should detect indirect cycle (A -> B -> C -> A)', () => {
      graph.addNode('StepA.complete')
      graph.addNode('StepB.complete', { dependsOn: 'StepA.complete' })
      graph.addNode('StepC.complete', { dependsOn: 'StepB.complete' })

      expect(() => {
        graph.addEdge('StepC.complete', 'StepA.complete')
      }).toThrow(CircularDependencyError)
    })

    it('should include cycle path in error message', () => {
      graph.addNode('StepA.complete')
      graph.addNode('StepB.complete', { dependsOn: 'StepA.complete' })
      graph.addNode('StepC.complete', { dependsOn: 'StepB.complete' })

      try {
        graph.addEdge('StepC.complete', 'StepA.complete')
        expect.fail('Should have thrown CircularDependencyError')
      } catch (error) {
        expect(error).toBeInstanceOf(CircularDependencyError)
        const cycleError = error as CircularDependencyError
        expect(cycleError.cyclePath).toBeDefined()
        expect(cycleError.cyclePath).toContain('StepA.complete')
        expect(cycleError.cyclePath).toContain('StepB.complete')
        expect(cycleError.cyclePath).toContain('StepC.complete')
      }
    })

    it('should handle diamond dependencies without false positive', () => {
      // Diamond pattern: A -> B, A -> C, B -> D, C -> D
      // This is NOT a cycle
      graph.addNode('StepA.complete')
      graph.addNode('StepB.complete', { dependsOn: 'StepA.complete' })
      graph.addNode('StepC.complete', { dependsOn: 'StepA.complete' })
      graph.addNode('StepD.complete', {
        dependsOn: ['StepB.complete', 'StepC.complete'],
      })

      expect(graph.detectCycles()).toBeNull()
    })
  })

  describe('getParallelGroups()', () => {
    it('should identify single node as one group', () => {
      graph.addNode('Step1.complete')

      const groups = graph.getParallelGroups()
      expect(groups).toHaveLength(1)
      expect(groups[0]?.nodes).toContain('Step1.complete')
    })

    it('should group independent nodes together', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete')
      graph.addNode('Step3.complete')

      const groups = graph.getParallelGroups()
      expect(groups).toHaveLength(1)
      expect(groups[0]?.nodes).toHaveLength(3)
      expect(groups[0]?.level).toBe(0)
    })

    it('should separate dependent nodes into different levels', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })

      const groups = graph.getParallelGroups()
      expect(groups).toHaveLength(2)

      const level0 = groups.find((g) => g.level === 0)
      const level1 = groups.find((g) => g.level === 1)

      expect(level0?.nodes).toContain('Step1.complete')
      expect(level1?.nodes).toContain('Step2.complete')
    })

    it('should handle complex dependency graphs', () => {
      // Level 0: A, B (no dependencies)
      // Level 1: C (depends on A), D (depends on B)
      // Level 2: E (depends on C and D)
      graph.addNode('StepA.complete')
      graph.addNode('StepB.complete')
      graph.addNode('StepC.complete', { dependsOn: 'StepA.complete' })
      graph.addNode('StepD.complete', { dependsOn: 'StepB.complete' })
      graph.addNode('StepE.complete', {
        dependsOn: ['StepC.complete', 'StepD.complete'],
      })

      const groups = graph.getParallelGroups()
      expect(groups).toHaveLength(3)

      const level0 = groups.find((g) => g.level === 0)
      const level1 = groups.find((g) => g.level === 1)
      const level2 = groups.find((g) => g.level === 2)

      expect(level0?.nodes).toHaveLength(2)
      expect(level0?.nodes).toContain('StepA.complete')
      expect(level0?.nodes).toContain('StepB.complete')

      expect(level1?.nodes).toHaveLength(2)
      expect(level1?.nodes).toContain('StepC.complete')
      expect(level1?.nodes).toContain('StepD.complete')

      expect(level2?.nodes).toHaveLength(1)
      expect(level2?.nodes).toContain('StepE.complete')
    })

    it('should return groups sorted by level', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })
      graph.addNode('Step3.complete', { dependsOn: 'Step2.complete' })

      const groups = graph.getParallelGroups()

      for (let i = 1; i < groups.length; i++) {
        const prevLevel = groups[i - 1]?.level ?? -1
        const currLevel = groups[i]?.level ?? -1
        expect(currLevel).toBeGreaterThan(prevLevel)
      }
    })
  })

  describe('getDependencies()', () => {
    it('should return empty array for node without dependencies', () => {
      graph.addNode('Step1.complete')

      expect(graph.getDependencies('Step1.complete')).toEqual([])
    })

    it('should return direct dependencies only', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })
      graph.addNode('Step3.complete', { dependsOn: 'Step2.complete' })

      expect(graph.getDependencies('Step3.complete')).toEqual([
        'Step2.complete',
      ])
    })

    it('should throw for non-existent node', () => {
      expect(() => {
        graph.getDependencies('NonExistent.complete')
      }).toThrow(MissingDependencyError)
    })
  })

  describe('getAllDependencies()', () => {
    it('should return all transitive dependencies', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })
      graph.addNode('Step3.complete', { dependsOn: 'Step2.complete' })

      const allDeps = graph.getAllDependencies('Step3.complete')
      expect(allDeps).toContain('Step1.complete')
      expect(allDeps).toContain('Step2.complete')
      expect(allDeps).toHaveLength(2)
    })

    it('should handle diamond dependencies without duplicates', () => {
      graph.addNode('StepA.complete')
      graph.addNode('StepB.complete', { dependsOn: 'StepA.complete' })
      graph.addNode('StepC.complete', { dependsOn: 'StepA.complete' })
      graph.addNode('StepD.complete', {
        dependsOn: ['StepB.complete', 'StepC.complete'],
      })

      const allDeps = graph.getAllDependencies('StepD.complete')
      expect(allDeps).toHaveLength(3)
      expect(allDeps.filter((d) => d === 'StepA.complete')).toHaveLength(1)
    })
  })

  describe('getDependents()', () => {
    it('should return nodes that depend on given node', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })
      graph.addNode('Step3.complete', { dependsOn: 'Step1.complete' })

      const dependents = graph.getDependents('Step1.complete')
      expect(dependents).toContain('Step2.complete')
      expect(dependents).toContain('Step3.complete')
      expect(dependents).toHaveLength(2)
    })

    it('should return empty array for leaf nodes', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })

      expect(graph.getDependents('Step2.complete')).toEqual([])
    })
  })

  describe('getHardDependencies()', () => {
    it('should return only hard dependencies', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete')
      graph.addNode('Step3.complete', {
        dependsOn: ['Step1.complete', 'Step2.complete'],
      })
      // Make Step2 a soft dependency
      graph.addNode('Step4.complete', {
        dependsOn: 'Step2.complete',
        type: 'soft',
      })

      const hardDeps = graph.getHardDependencies('Step3.complete')
      expect(hardDeps).toContain('Step1.complete')
      expect(hardDeps).toContain('Step2.complete')
    })

    it('should exclude soft dependencies', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', {
        dependsOn: 'Step1.complete',
        type: 'soft',
      })

      const hardDeps = graph.getHardDependencies('Step2.complete')
      expect(hardDeps).toEqual([])
    })
  })

  describe('getSoftDependencies()', () => {
    it('should return only soft dependencies', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', {
        dependsOn: 'Step1.complete',
        type: 'soft',
      })

      const softDeps = graph.getSoftDependencies('Step2.complete')
      expect(softDeps).toContain('Step1.complete')
    })
  })

  describe('graph visualization helpers', () => {
    it('should export to DOT format', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })

      const dot = graph.toDot()
      expect(dot).toContain('digraph')
      expect(dot).toContain('Step1.complete')
      expect(dot).toContain('Step2.complete')
      expect(dot).toContain('->')
    })

    it('should export to JSON format', () => {
      graph.addNode('Step1.complete')
      graph.addNode('Step2.complete', { dependsOn: 'Step1.complete' })

      const json = graph.toJSON()
      expect(json.nodes).toHaveLength(2)
      expect(json.edges).toHaveLength(1)
    })
  })

  describe('fromEventRegistrations()', () => {
    it('should build graph from event registrations with dependencies', () => {
      const registrations = [
        {
          noun: 'Step1',
          event: 'complete',
          handler: () => {},
          source: '',
        },
        {
          noun: 'Step2',
          event: 'complete',
          handler: () => {},
          source: '',
          dependencies: { dependsOn: 'Step1.complete' } as DependencyConfig,
        },
      ]

      const graph = DependencyGraph.fromEventRegistrations(registrations)
      expect(graph.getNodes()).toHaveLength(2)
      expect(graph.getDependencies('Step2.complete')).toEqual([
        'Step1.complete',
      ])
    })

    it('should handle registrations without dependencies', () => {
      const registrations = [
        {
          noun: 'Step1',
          event: 'complete',
          handler: () => {},
          source: '',
        },
        {
          noun: 'Step2',
          event: 'complete',
          handler: () => {},
          source: '',
        },
      ]

      const graph = DependencyGraph.fromEventRegistrations(registrations)
      expect(graph.getNodes()).toHaveLength(2)
      expect(graph.getDependencies('Step1.complete')).toEqual([])
      expect(graph.getDependencies('Step2.complete')).toEqual([])
    })
  })
})

describe('CircularDependencyError', () => {
  it('should include cycle path in error', () => {
    const error = new CircularDependencyError([
      'StepA.complete',
      'StepB.complete',
      'StepA.complete',
    ])
    expect(error.cyclePath).toEqual([
      'StepA.complete',
      'StepB.complete',
      'StepA.complete',
    ])
    expect(error.message).toContain('Circular dependency detected')
  })

  it('should format cycle path in message', () => {
    const error = new CircularDependencyError([
      'StepA.complete',
      'StepB.complete',
      'StepC.complete',
      'StepA.complete',
    ])
    expect(error.message).toContain(
      'StepA.complete -> StepB.complete -> StepC.complete -> StepA.complete'
    )
  })
})

describe('MissingDependencyError', () => {
  it('should include dependency name in error', () => {
    const error = new MissingDependencyError(
      'NonExistent.complete',
      'Step2.complete'
    )
    expect(error.dependency).toBe('NonExistent.complete')
    expect(error.node).toBe('Step2.complete')
    expect(error.message).toContain('NonExistent.complete')
  })
})
