/**
 * Project Management - Task workflows, dependencies, and execution modes
 *
 * Provides project management primitives for organizing tasks:
 * - Projects/TaskLists as containers
 * - Parallel vs Sequential execution
 * - Dependencies and dependants (bidirectional)
 * - Subtasks with inheritance
 *
 * ## Execution Modes
 *
 * Tasks can be organized for parallel or sequential execution:
 *
 * ```ts
 * // Parallel - all can run simultaneously
 * parallel(
 *   task('Design UI'),
 *   task('Write API specs'),
 *   task('Set up infrastructure'),
 * )
 *
 * // Sequential - must run in order
 * sequential(
 *   task('Implement backend'),
 *   task('Implement frontend'),
 *   task('Integration testing'),
 * )
 * ```
 *
 * ## Markdown Syntax
 *
 * Tasks map to markdown checklists:
 * - `- [ ]` = Parallel/unordered tasks
 * - `1. [ ]` = Sequential/ordered tasks
 *
 * @packageDocumentation
 */
import { createTask as createBaseTask } from './task.js';
// ============================================================================
// Task DSL Functions
// ============================================================================
/**
 * Create a task definition
 *
 * @example
 * ```ts
 * task('Implement feature')
 * task('Review PR', { priority: 'high', assignTo: { type: 'human', id: 'user_123' } })
 * task('Parent task', {
 *   subtasks: [
 *     task('Subtask 1'),
 *     task('Subtask 2'),
 *   ]
 * })
 * ```
 */
export function task(title, options) {
    return {
        __type: 'task',
        title,
        ...options,
    };
}
/**
 * Create a group of tasks that can run in parallel
 *
 * @example
 * ```ts
 * parallel(
 *   task('Design UI'),
 *   task('Write API specs'),
 *   task('Set up infrastructure'),
 * )
 * ```
 */
export function parallel(...tasks) {
    return {
        __type: 'parallel',
        tasks,
    };
}
/**
 * Create a group of tasks that must run sequentially
 *
 * @example
 * ```ts
 * sequential(
 *   task('Implement backend'),
 *   task('Implement frontend'),
 *   task('Integration testing'),
 * )
 * ```
 */
export function sequential(...tasks) {
    return {
        __type: 'sequential',
        tasks,
    };
}
// ============================================================================
// Project DSL Functions
// ============================================================================
/**
 * Generate a unique project ID
 */
function generateProjectId() {
    return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
/**
 * Create a new project
 *
 * @example
 * ```ts
 * const project = createProject({
 *   name: 'Launch New Feature',
 *   description: 'Ship the new dashboard feature',
 *   tasks: [
 *     parallel(
 *       task('Design mockups'),
 *       task('Write technical spec'),
 *     ),
 *     sequential(
 *       task('Implement backend API'),
 *       task('Implement frontend UI'),
 *       task('Write tests'),
 *       task('Deploy to staging'),
 *     ),
 *     task('QA testing'),
 *     task('Deploy to production'),
 *   ],
 * })
 * ```
 */
export function createProject(options) {
    const now = new Date();
    return {
        id: generateProjectId(),
        name: options.name,
        description: options.description,
        status: 'draft',
        tasks: options.tasks || [],
        defaultMode: options.defaultMode || 'sequential',
        owner: options.owner,
        tags: options.tags,
        createdAt: now,
        updatedAt: now,
        metadata: options.metadata,
    };
}
// ============================================================================
// Workflow Builder (Fluent API)
// ============================================================================
/**
 * Workflow builder for fluent task definition
 *
 * @example
 * ```ts
 * const workflow = workflow('Feature Launch')
 *   .parallel(
 *     task('Design'),
 *     task('Spec'),
 *   )
 *   .then(task('Implement'))
 *   .then(task('Test'))
 *   .parallel(
 *     task('Deploy staging'),
 *     task('Update docs'),
 *   )
 *   .then(task('Deploy production'))
 *   .build()
 * ```
 */
export function workflow(name, description) {
    const tasks = [];
    const builder = {
        /**
         * Add tasks that can run in parallel
         */
        parallel(...nodes) {
            tasks.push(parallel(...nodes));
            return builder;
        },
        /**
         * Add tasks that must run sequentially
         */
        sequential(...nodes) {
            tasks.push(sequential(...nodes));
            return builder;
        },
        /**
         * Add a single task (sequential with previous)
         */
        then(...nodes) {
            if (nodes.length === 1) {
                tasks.push(nodes[0]);
            }
            else {
                tasks.push(sequential(...nodes));
            }
            return builder;
        },
        /**
         * Add a task (alias for then)
         */
        task(title, options) {
            tasks.push(task(title, options));
            return builder;
        },
        /**
         * Build the project
         */
        build(options) {
            return createProject({
                name,
                description,
                tasks,
                ...options,
            });
        },
    };
    return builder;
}
// ============================================================================
// Task Materialization
// ============================================================================
/**
 * Flatten task nodes into actual Task objects with dependencies
 */
export async function materializeProject(project) {
    const tasks = [];
    let taskIndex = 0;
    async function processNode(node, parentId, previousIds = [], mode = 'sequential') {
        if (node.__type === 'task') {
            const taskDef = node;
            const taskId = `${project.id}_task_${taskIndex++}`;
            // Create dependencies based on mode (as string array for CreateTaskOptions)
            const dependencies = mode === 'sequential' && previousIds.length > 0
                ? previousIds
                : undefined;
            // Create a FunctionDefinition from the task definition
            // Default to generative function type for DSL tasks
            const functionDef = {
                type: taskDef.functionType || 'generative',
                name: taskDef.title,
                description: taskDef.description,
                args: {},
                output: 'string',
            };
            const newTask = await createBaseTask({
                function: functionDef,
                priority: taskDef.priority || 'normal',
                assignTo: taskDef.assignTo,
                tags: taskDef.tags,
                parentId,
                projectId: project.id,
                dependencies,
                metadata: {
                    ...taskDef.metadata,
                    _taskNodeIndex: taskIndex - 1,
                },
            });
            newTask.id = taskId;
            tasks.push(newTask);
            // Process subtasks
            if (taskDef.subtasks && taskDef.subtasks.length > 0) {
                let subtaskPrevIds = [];
                for (const subtask of taskDef.subtasks) {
                    subtaskPrevIds = await processNode(subtask, taskId, subtaskPrevIds, 'sequential');
                }
            }
            return [taskId];
        }
        if (node.__type === 'parallel') {
            const group = node;
            const allIds = [];
            // All tasks in parallel group can start simultaneously
            // They don't depend on each other, only on previousIds
            for (const child of group.tasks) {
                const childIds = await processNode(child, parentId, previousIds, 'parallel');
                allIds.push(...childIds);
            }
            return allIds;
        }
        if (node.__type === 'sequential') {
            const group = node;
            let currentPrevIds = previousIds;
            // Each task depends on the previous one
            for (const child of group.tasks) {
                currentPrevIds = await processNode(child, parentId, currentPrevIds, 'sequential');
            }
            return currentPrevIds;
        }
        return [];
    }
    // Process all root-level tasks
    let previousIds = [];
    for (const node of project.tasks) {
        previousIds = await processNode(node, undefined, previousIds, project.defaultMode || 'sequential');
    }
    return { project, tasks };
}
// ============================================================================
// Dependency Graph Utilities
// ============================================================================
/**
 * Get all tasks that depend on a given task (dependants)
 */
export function getDependants(taskId, allTasks) {
    return allTasks.filter(t => t.dependencies?.some(d => d.taskId === taskId && d.type === 'blocked_by'));
}
/**
 * Get all tasks that a given task depends on (dependencies)
 */
export function getDependencies(task, allTasks) {
    if (!task.dependencies)
        return [];
    const depIds = task.dependencies
        .filter(d => d.type === 'blocked_by')
        .map(d => d.taskId);
    return allTasks.filter(t => depIds.includes(t.id));
}
/**
 * Get tasks that are ready to execute (no unsatisfied dependencies)
 */
export function getReadyTasks(allTasks) {
    return allTasks.filter(t => {
        if (t.status !== 'queued' && t.status !== 'pending')
            return false;
        if (!t.dependencies || t.dependencies.length === 0)
            return true;
        return t.dependencies
            .filter(d => d.type === 'blocked_by')
            .every(d => d.satisfied);
    });
}
/**
 * Check if a task graph has cycles
 */
export function hasCycles(allTasks) {
    const visited = new Set();
    const recStack = new Set();
    function dfs(taskId) {
        visited.add(taskId);
        recStack.add(taskId);
        const task = allTasks.find(t => t.id === taskId);
        if (task?.dependencies) {
            for (const dep of task.dependencies) {
                if (dep.type === 'blocked_by') {
                    if (!visited.has(dep.taskId)) {
                        if (dfs(dep.taskId))
                            return true;
                    }
                    else if (recStack.has(dep.taskId)) {
                        return true;
                    }
                }
            }
        }
        recStack.delete(taskId);
        return false;
    }
    for (const task of allTasks) {
        if (!visited.has(task.id)) {
            if (dfs(task.id))
                return true;
        }
    }
    return false;
}
/**
 * Sort tasks by their dependencies (tasks with no dependencies first)
 */
export function sortTasks(allTasks) {
    const result = [];
    const visited = new Set();
    function visit(task) {
        if (visited.has(task.id))
            return;
        visited.add(task.id);
        // Visit dependencies first
        if (task.dependencies) {
            for (const dep of task.dependencies) {
                if (dep.type === 'blocked_by') {
                    const depTask = allTasks.find(t => t.id === dep.taskId);
                    if (depTask)
                        visit(depTask);
                }
            }
        }
        result.push(task);
    }
    for (const task of allTasks) {
        visit(task);
    }
    return result;
}
