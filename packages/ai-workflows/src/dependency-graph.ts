/**
 * Dependency Graph Architecture for Workflow Steps
 *
 * Provides a directed acyclic graph (DAG) for managing workflow step dependencies.
 * Supports:
 * - Hard vs soft dependencies
 * - Cycle detection with path reporting
 * - Parallel group identification for concurrent execution
 * - Graph visualization (DOT, JSON)
 */

import type { EventRegistration } from './types.js'

/**
 * Dependency type: hard (must succeed) or soft (can proceed on failure)
 */
export type DependencyType = 'hard' | 'soft'

/**
 * Configuration for step dependencies
 */
export interface DependencyConfig {
  /**
   * Step(s) that must complete before this step runs
   * Can be a single step ID or array of step IDs
   */
  dependsOn: string | string[]

  /**
   * Type of dependency (default: 'hard')
   * - 'hard': Dependency must complete successfully
   * - 'soft': Step can proceed even if dependency fails
   */
  type?: DependencyType
}

/**
 * A node in the dependency graph
 */
export interface GraphNode {
  /** Unique identifier (e.g., 'Step1.complete') */
  id: string

  /** Direct dependencies (step IDs that must complete first) */
  dependencies: string[]

  /** Map of dependency ID to dependency type */
  dependencyTypes?: Record<string, DependencyType>

  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * A group of nodes that can execute in parallel
 */
export interface ParallelGroup {
  /** Execution level (0 = no dependencies, 1 = depends on level 0, etc.) */
  level: number

  /** Node IDs that can run concurrently at this level */
  nodes: string[]
}

/**
 * JSON representation of the graph
 */
export interface GraphJSON {
  nodes: GraphNode[]
  edges: Array<{
    from: string
    to: string
    type: DependencyType
  }>
}

/**
 * Error thrown when a circular dependency is detected
 */
export class CircularDependencyError extends Error {
  /** The path of nodes forming the cycle */
  cyclePath: string[]

  constructor(cyclePath: string[]) {
    const pathStr = cyclePath.join(' -> ')
    super(`Circular dependency detected: ${pathStr}`)
    this.name = 'CircularDependencyError'
    this.cyclePath = cyclePath
  }
}

/**
 * Error thrown when a referenced dependency doesn't exist
 */
export class MissingDependencyError extends Error {
  /** The missing dependency ID */
  dependency: string

  /** The node that references the missing dependency */
  node: string

  constructor(dependency: string, node: string) {
    super(
      `Missing dependency '${dependency}' referenced by '${node}'. ` +
        `Ensure '${dependency}' is added to the graph before '${node}'.`
    )
    this.name = 'MissingDependencyError'
    this.dependency = dependency
    this.node = node
  }
}

/**
 * Extended event registration with optional dependencies
 */
export interface EventRegistrationWithDeps extends EventRegistration {
  dependencies?: DependencyConfig
}

/**
 * Directed Acyclic Graph for workflow step dependencies
 */
export class DependencyGraph {
  private nodes: Map<string, GraphNode> = new Map()

  /**
   * Create a DependencyGraph from event registrations
   */
  static fromEventRegistrations(
    registrations: EventRegistrationWithDeps[]
  ): DependencyGraph {
    const graph = new DependencyGraph()

    // First pass: add all nodes without dependencies
    for (const reg of registrations) {
      const nodeId = `${reg.noun}.${reg.event}`
      if (!graph.hasNode(nodeId)) {
        // Add as placeholder first (will be updated with deps in second pass)
        graph.nodes.set(nodeId, {
          id: nodeId,
          dependencies: [],
          dependencyTypes: {},
        })
      }
    }

    // Second pass: add dependencies
    for (const reg of registrations) {
      const nodeId = `${reg.noun}.${reg.event}`
      if (reg.dependencies) {
        const deps = Array.isArray(reg.dependencies.dependsOn)
          ? reg.dependencies.dependsOn
          : [reg.dependencies.dependsOn]

        const depType = reg.dependencies.type || 'hard'

        for (const dep of deps) {
          if (!graph.hasNode(dep)) {
            throw new MissingDependencyError(dep, nodeId)
          }
          const node = graph.nodes.get(nodeId)!
          if (!node.dependencies.includes(dep)) {
            node.dependencies.push(dep)
            node.dependencyTypes = node.dependencyTypes || {}
            node.dependencyTypes[dep] = depType
          }
        }

        // Check for cycles after adding edges
        const cycle = graph.detectCycles()
        if (cycle) {
          throw new CircularDependencyError(cycle)
        }
      }
    }

    return graph
  }

  /**
   * Check if a node exists
   */
  hasNode(id: string): boolean {
    return this.nodes.has(id)
  }

  /**
   * Add a node to the graph
   */
  addNode(id: string, config?: DependencyConfig): void {
    // Check for self-reference
    if (config?.dependsOn) {
      const deps = Array.isArray(config.dependsOn)
        ? config.dependsOn
        : [config.dependsOn]

      if (deps.includes(id)) {
        throw new CircularDependencyError([id, id])
      }

      // Verify all dependencies exist
      for (const dep of deps) {
        if (!this.nodes.has(dep)) {
          throw new MissingDependencyError(dep, id)
        }
      }
    }

    const dependencies = config?.dependsOn
      ? Array.isArray(config.dependsOn)
        ? config.dependsOn
        : [config.dependsOn]
      : []

    const depType = config?.type || 'hard'
    const dependencyTypes: Record<string, DependencyType> = {}
    for (const dep of dependencies) {
      dependencyTypes[dep] = depType
    }

    this.nodes.set(id, {
      id,
      dependencies,
      dependencyTypes,
    })

    // Check for cycles after adding node with dependencies
    if (dependencies.length > 0) {
      const cycle = this.detectCycles()
      if (cycle) {
        // Remove the node we just added
        this.nodes.delete(id)
        throw new CircularDependencyError(cycle)
      }
    }
  }

  /**
   * Add an edge (dependency) between existing nodes
   */
  addEdge(from: string, to: string, type: DependencyType = 'hard'): void {
    if (!this.nodes.has(from)) {
      throw new MissingDependencyError(from, to)
    }
    if (!this.nodes.has(to)) {
      throw new MissingDependencyError(to, from)
    }

    const toNode = this.nodes.get(to)!

    // Check for self-reference
    if (from === to) {
      throw new CircularDependencyError([from, to])
    }

    // Add the dependency
    if (!toNode.dependencies.includes(from)) {
      toNode.dependencies.push(from)
      toNode.dependencyTypes = toNode.dependencyTypes || {}
      toNode.dependencyTypes[from] = type
    }

    // Check for cycles
    const cycle = this.detectCycles()
    if (cycle) {
      // Rollback the edge
      toNode.dependencies = toNode.dependencies.filter((d) => d !== from)
      if (toNode.dependencyTypes) {
        delete toNode.dependencyTypes[from]
      }
      throw new CircularDependencyError(cycle)
    }
  }

  /**
   * Get all nodes in the graph
   */
  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values())
  }

  /**
   * Get a specific node
   */
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id)
  }

  /**
   * Get direct dependencies of a node
   */
  getDependencies(id: string): string[] {
    const node = this.nodes.get(id)
    if (!node) {
      throw new MissingDependencyError(id, 'getDependencies()')
    }
    return [...node.dependencies]
  }

  /**
   * Get all transitive dependencies of a node
   */
  getAllDependencies(id: string): string[] {
    const node = this.nodes.get(id)
    if (!node) {
      throw new MissingDependencyError(id, 'getAllDependencies()')
    }

    const visited = new Set<string>()
    const stack = [...node.dependencies]

    while (stack.length > 0) {
      const current = stack.pop()!
      if (visited.has(current)) continue
      visited.add(current)

      const currentNode = this.nodes.get(current)
      if (currentNode) {
        for (const dep of currentNode.dependencies) {
          if (!visited.has(dep)) {
            stack.push(dep)
          }
        }
      }
    }

    return Array.from(visited)
  }

  /**
   * Get nodes that depend on a given node
   */
  getDependents(id: string): string[] {
    const dependents: string[] = []
    for (const node of this.nodes.values()) {
      if (node.dependencies.includes(id)) {
        dependents.push(node.id)
      }
    }
    return dependents
  }

  /**
   * Get only hard dependencies
   */
  getHardDependencies(id: string): string[] {
    const node = this.nodes.get(id)
    if (!node) {
      throw new MissingDependencyError(id, 'getHardDependencies()')
    }

    return node.dependencies.filter(
      (dep) => (node.dependencyTypes?.[dep] || 'hard') === 'hard'
    )
  }

  /**
   * Get only soft dependencies
   */
  getSoftDependencies(id: string): string[] {
    const node = this.nodes.get(id)
    if (!node) {
      throw new MissingDependencyError(id, 'getSoftDependencies()')
    }

    return node.dependencies.filter(
      (dep) => node.dependencyTypes?.[dep] === 'soft'
    )
  }

  /**
   * Detect cycles using DFS
   * Returns the cycle path if found, null otherwise
   */
  detectCycles(): string[] | null {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const path: string[] = []

    const dfs = (nodeId: string): string[] | null => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const node = this.nodes.get(nodeId)
      if (node) {
        for (const dep of node.dependencies) {
          if (!visited.has(dep)) {
            const cycle = dfs(dep)
            if (cycle) return cycle
          } else if (recursionStack.has(dep)) {
            // Found a cycle - construct the cycle path
            const cycleStart = path.indexOf(dep)
            const cyclePath = path.slice(cycleStart)
            cyclePath.push(dep) // Complete the cycle
            return cyclePath
          }
        }
      }

      path.pop()
      recursionStack.delete(nodeId)
      return null
    }

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const cycle = dfs(nodeId)
        if (cycle) return cycle
      }
    }

    return null
  }

  /**
   * Get parallel execution groups
   * Returns nodes grouped by execution level (0 = no deps, 1 = depends on 0, etc.)
   */
  getParallelGroups(): ParallelGroup[] {
    const levels = new Map<string, number>()

    // Calculate level for each node
    const calculateLevel = (nodeId: string): number => {
      if (levels.has(nodeId)) {
        return levels.get(nodeId)!
      }

      const node = this.nodes.get(nodeId)
      if (!node || node.dependencies.length === 0) {
        levels.set(nodeId, 0)
        return 0
      }

      let maxDepLevel = -1
      for (const dep of node.dependencies) {
        const depLevel = calculateLevel(dep)
        maxDepLevel = Math.max(maxDepLevel, depLevel)
      }

      const level = maxDepLevel + 1
      levels.set(nodeId, level)
      return level
    }

    // Calculate levels for all nodes
    for (const nodeId of this.nodes.keys()) {
      calculateLevel(nodeId)
    }

    // Group nodes by level
    const groups = new Map<number, string[]>()
    for (const [nodeId, level] of levels) {
      if (!groups.has(level)) {
        groups.set(level, [])
      }
      groups.get(level)!.push(nodeId)
    }

    // Convert to sorted array of ParallelGroups
    const result: ParallelGroup[] = []
    const sortedLevels = Array.from(groups.keys()).sort((a, b) => a - b)
    for (const level of sortedLevels) {
      result.push({
        level,
        nodes: groups.get(level)!,
      })
    }

    return result
  }

  /**
   * Export graph to DOT format for visualization
   */
  toDot(): string {
    const lines: string[] = ['digraph DependencyGraph {']
    lines.push('  rankdir=TB;')
    lines.push('  node [shape=box];')

    // Add nodes
    for (const node of this.nodes.values()) {
      const label = node.id.replace(/\./g, '\\n')
      lines.push(`  "${node.id}" [label="${label}"];`)
    }

    // Add edges
    for (const node of this.nodes.values()) {
      for (const dep of node.dependencies) {
        const style = node.dependencyTypes?.[dep] === 'soft' ? 'dashed' : 'solid'
        lines.push(`  "${dep}" -> "${node.id}" [style=${style}];`)
      }
    }

    lines.push('}')
    return lines.join('\n')
  }

  /**
   * Export graph to JSON format
   */
  toJSON(): GraphJSON {
    const nodes = this.getNodes()
    const edges: GraphJSON['edges'] = []

    for (const node of nodes) {
      for (const dep of node.dependencies) {
        edges.push({
          from: dep,
          to: node.id,
          type: node.dependencyTypes?.[dep] || 'hard',
        })
      }
    }

    return { nodes, edges }
  }
}
