/**
 * Orchestration Entity Types (Nouns)
 *
 * Service orchestration: ServiceWorkflow, WorkflowStep, ServiceTask, ServiceQueue, ServiceWorker
 *
 * @packageDocumentation
 */

import type { Noun } from 'ai-database'

// =============================================================================
// ServiceWorkflow
// =============================================================================

/**
 * ServiceWorkflow entity
 *
 * Multi-step service workflow.
 */
export const ServiceWorkflow: Noun = {
  singular: 'service-workflow',
  plural: 'service-workflows',
  description: 'A multi-step workflow for service delivery',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Workflow name',
    },
    slug: {
      type: 'string',
      optional: true,
      description: 'URL-friendly identifier',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Workflow description',
    },

    // Type
    type: {
      type: 'string',
      description: 'Workflow type',
      examples: ['sequential', 'parallel', 'conditional', 'loop', 'dag'],
    },
    trigger: {
      type: 'string',
      optional: true,
      description: 'What triggers workflow',
      examples: ['api', 'schedule', 'event', 'manual', 'condition'],
    },

    // Configuration
    config: {
      type: 'json',
      optional: true,
      description: 'Workflow configuration',
    },
    inputSchema: {
      type: 'json',
      optional: true,
      description: 'Input schema',
    },
    outputSchema: {
      type: 'json',
      optional: true,
      description: 'Output schema',
    },

    // Execution
    timeout: {
      type: 'number',
      optional: true,
      description: 'Workflow timeout (ms)',
    },
    maxRetries: {
      type: 'number',
      optional: true,
      description: 'Max retry attempts',
    },
    retryBackoff: {
      type: 'string',
      optional: true,
      description: 'Retry backoff strategy',
      examples: ['fixed', 'exponential', 'linear'],
    },

    // Concurrency
    maxConcurrent: {
      type: 'number',
      optional: true,
      description: 'Max concurrent executions',
    },
    queueBehavior: {
      type: 'string',
      optional: true,
      description: 'Queue behavior when at limit',
      examples: ['queue', 'reject', 'replace'],
    },

    // Versioning
    version: {
      type: 'string',
      optional: true,
      description: 'Workflow version',
    },
    isLatest: {
      type: 'boolean',
      optional: true,
      description: 'Is latest version',
    },

    // Metrics
    avgDurationMs: {
      type: 'number',
      optional: true,
      description: 'Average duration',
    },
    successRate: {
      type: 'number',
      optional: true,
      description: 'Success rate (0-1)',
    },
    totalExecutions: {
      type: 'number',
      optional: true,
      description: 'Total executions',
    },

    // Status
    status: {
      type: 'string',
      description: 'Workflow status',
      examples: ['draft', 'active', 'paused', 'deprecated', 'archived'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Parent service',
    },
    steps: {
      type: 'WorkflowStep[]',
      description: 'Workflow steps',
    },
    executions: {
      type: 'ServiceExecution[]',
      description: 'Workflow executions',
    },
    qualityGates: {
      type: 'QualityGate[]',
      description: 'Quality gates',
    },
  },

  actions: [
    'create',
    'update',
    'publish',
    'execute',
    'pause',
    'resume',
    'deprecate',
    'archive',
  ],

  events: [
    'created',
    'updated',
    'published',
    'executed',
    'paused',
    'resumed',
    'deprecated',
    'archived',
  ],
}

// =============================================================================
// WorkflowStep
// =============================================================================

/**
 * WorkflowStep entity
 *
 * Individual step in a workflow.
 */
export const WorkflowStep: Noun = {
  singular: 'workflow-step',
  plural: 'workflow-steps',
  description: 'An individual step in a service workflow',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Step name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Step description',
    },

    // Position
    order: {
      type: 'number',
      description: 'Step order',
    },
    phase: {
      type: 'string',
      optional: true,
      description: 'Workflow phase',
      examples: ['setup', 'process', 'validate', 'deliver', 'cleanup'],
    },

    // Type
    type: {
      type: 'string',
      description: 'Step type',
      examples: ['action', 'decision', 'wait', 'parallel', 'loop', 'human', 'ai'],
    },
    actionType: {
      type: 'string',
      optional: true,
      description: 'Type of action',
      examples: ['function', 'api-call', 'ai-inference', 'human-task', 'notification', 'delay'],
    },

    // Configuration
    config: {
      type: 'json',
      optional: true,
      description: 'Step configuration',
    },
    inputMapping: {
      type: 'json',
      optional: true,
      description: 'Input mapping from workflow',
    },
    outputMapping: {
      type: 'json',
      optional: true,
      description: 'Output mapping to workflow',
    },

    // AI Configuration
    aiEnabled: {
      type: 'boolean',
      optional: true,
      description: 'Uses AI for execution',
    },
    aiModel: {
      type: 'string',
      optional: true,
      description: 'AI model to use',
    },
    aiPrompt: {
      type: 'string',
      optional: true,
      description: 'AI prompt template',
    },
    confidenceRequired: {
      type: 'number',
      optional: true,
      description: 'Min confidence for auto-proceed',
    },

    // Execution
    timeout: {
      type: 'number',
      optional: true,
      description: 'Step timeout (ms)',
    },
    retryable: {
      type: 'boolean',
      optional: true,
      description: 'Step can be retried',
    },
    maxRetries: {
      type: 'number',
      optional: true,
      description: 'Max retry attempts',
    },

    // Conditions
    condition: {
      type: 'string',
      optional: true,
      description: 'Execution condition',
    },
    skipCondition: {
      type: 'string',
      optional: true,
      description: 'Skip condition',
    },

    // Error Handling
    onError: {
      type: 'string',
      optional: true,
      description: 'Error handling',
      examples: ['fail', 'retry', 'skip', 'fallback', 'escalate'],
    },
    fallbackStep: {
      type: 'string',
      optional: true,
      description: 'Fallback step name',
    },

    // Human Tasks
    requiresHuman: {
      type: 'boolean',
      optional: true,
      description: 'Requires human',
    },
    humanTaskType: {
      type: 'string',
      optional: true,
      description: 'Human task type',
      examples: ['approval', 'review', 'input', 'decision'],
    },

    // Status
    status: {
      type: 'string',
      description: 'Step status',
      examples: ['active', 'disabled', 'deprecated'],
    },
  },

  relationships: {
    workflow: {
      type: 'ServiceWorkflow',
      description: 'Parent workflow',
    },
    nextSteps: {
      type: 'WorkflowStep[]',
      description: 'Next steps',
    },
    previousSteps: {
      type: 'WorkflowStep[]',
      description: 'Previous steps',
    },
    qualityGate: {
      type: 'QualityGate',
      required: false,
      description: 'Quality gate at this step',
    },
  },

  actions: [
    'create',
    'update',
    'enable',
    'disable',
    'execute',
    'skip',
    'retry',
  ],

  events: [
    'created',
    'updated',
    'enabled',
    'disabled',
    'started',
    'completed',
    'failed',
    'skipped',
    'retried',
  ],
}

// =============================================================================
// ServiceTask
// =============================================================================

/**
 * ServiceTask entity
 *
 * Task within service execution.
 */
export const ServiceTask: Noun = {
  singular: 'service-task',
  plural: 'service-tasks',
  description: 'A task within a service execution',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Task ID',
    },
    name: {
      type: 'string',
      optional: true,
      description: 'Task name',
    },

    // Type
    type: {
      type: 'string',
      description: 'Task type',
      examples: ['automated', 'ai', 'human', 'approval', 'review', 'external'],
    },
    priority: {
      type: 'string',
      optional: true,
      description: 'Task priority',
      examples: ['low', 'normal', 'high', 'urgent'],
    },

    // Input/Output
    input: {
      type: 'json',
      optional: true,
      description: 'Task input',
    },
    output: {
      type: 'json',
      optional: true,
      description: 'Task output',
    },
    context: {
      type: 'json',
      optional: true,
      description: 'Task context',
    },

    // Assignment
    assignedTo: {
      type: 'string',
      optional: true,
      description: 'Assigned worker/agent',
    },
    assignedAt: {
      type: 'date',
      optional: true,
      description: 'Assignment time',
    },

    // AI Execution
    aiExecuted: {
      type: 'boolean',
      optional: true,
      description: 'Executed by AI',
    },
    aiConfidence: {
      type: 'number',
      optional: true,
      description: 'AI confidence',
    },
    aiIterations: {
      type: 'number',
      optional: true,
      description: 'AI iterations used',
    },

    // Human Execution
    humanRequired: {
      type: 'boolean',
      optional: true,
      description: 'Human required',
    },
    humanExecuted: {
      type: 'boolean',
      optional: true,
      description: 'Executed by human',
    },
    humanNotes: {
      type: 'string',
      optional: true,
      description: 'Human notes',
    },

    // Timing
    scheduledAt: {
      type: 'date',
      optional: true,
      description: 'Scheduled time',
    },
    startedAt: {
      type: 'date',
      optional: true,
      description: 'Start time',
    },
    completedAt: {
      type: 'date',
      optional: true,
      description: 'Completion time',
    },
    dueAt: {
      type: 'date',
      optional: true,
      description: 'Due date',
    },
    durationMs: {
      type: 'number',
      optional: true,
      description: 'Duration (ms)',
    },

    // Retries
    attempt: {
      type: 'number',
      optional: true,
      description: 'Current attempt number',
    },
    maxAttempts: {
      type: 'number',
      optional: true,
      description: 'Max attempts allowed',
    },
    lastError: {
      type: 'string',
      optional: true,
      description: 'Last error message',
    },

    // Status
    status: {
      type: 'string',
      description: 'Task status',
      examples: ['pending', 'queued', 'assigned', 'running', 'waiting', 'completed', 'failed', 'cancelled'],
    },
  },

  relationships: {
    execution: {
      type: 'ServiceExecution',
      description: 'Parent execution',
    },
    workflowStep: {
      type: 'WorkflowStep',
      required: false,
      description: 'Workflow step',
    },
    queue: {
      type: 'ServiceQueue',
      required: false,
      description: 'Task queue',
    },
    worker: {
      type: 'ServiceWorker',
      required: false,
      description: 'Assigned worker',
    },
    parentTask: {
      type: 'ServiceTask',
      required: false,
      description: 'Parent task',
    },
    subtasks: {
      type: 'ServiceTask[]',
      description: 'Subtasks',
    },
  },

  actions: [
    'create',
    'queue',
    'assign',
    'start',
    'complete',
    'fail',
    'retry',
    'cancel',
    'escalate',
  ],

  events: [
    'created',
    'queued',
    'assigned',
    'started',
    'completed',
    'failed',
    'retried',
    'cancelled',
    'escalated',
  ],
}

// =============================================================================
// ServiceQueue
// =============================================================================

/**
 * ServiceQueue entity
 *
 * Queue for service tasks.
 */
export const ServiceQueue: Noun = {
  singular: 'service-queue',
  plural: 'service-queues',
  description: 'A queue for service tasks',

  properties: {
    // Identity
    name: {
      type: 'string',
      description: 'Queue name',
    },
    description: {
      type: 'string',
      optional: true,
      description: 'Queue description',
    },

    // Type
    type: {
      type: 'string',
      description: 'Queue type',
      examples: ['fifo', 'lifo', 'priority', 'fair', 'round-robin'],
    },
    taskTypes: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Allowed task types',
    },

    // Configuration
    maxSize: {
      type: 'number',
      optional: true,
      description: 'Max queue size',
    },
    maxConcurrent: {
      type: 'number',
      optional: true,
      description: 'Max concurrent processing',
    },
    processingTimeout: {
      type: 'number',
      optional: true,
      description: 'Processing timeout (ms)',
    },

    // Behavior
    onFull: {
      type: 'string',
      optional: true,
      description: 'Behavior when full',
      examples: ['reject', 'drop-oldest', 'wait'],
    },
    retryFailed: {
      type: 'boolean',
      optional: true,
      description: 'Retry failed tasks',
    },
    deadLetterQueue: {
      type: 'string',
      optional: true,
      description: 'Dead letter queue name',
    },

    // Workers
    minWorkers: {
      type: 'number',
      optional: true,
      description: 'Minimum workers',
    },
    maxWorkers: {
      type: 'number',
      optional: true,
      description: 'Maximum workers',
    },
    autoScale: {
      type: 'boolean',
      optional: true,
      description: 'Auto-scale workers',
    },

    // Current State
    pendingCount: {
      type: 'number',
      optional: true,
      description: 'Pending task count',
    },
    processingCount: {
      type: 'number',
      optional: true,
      description: 'Processing task count',
    },
    completedCount: {
      type: 'number',
      optional: true,
      description: 'Completed task count',
    },
    failedCount: {
      type: 'number',
      optional: true,
      description: 'Failed task count',
    },

    // Metrics
    avgWaitTime: {
      type: 'number',
      optional: true,
      description: 'Average wait time (ms)',
    },
    avgProcessingTime: {
      type: 'number',
      optional: true,
      description: 'Average processing time (ms)',
    },
    throughput: {
      type: 'number',
      optional: true,
      description: 'Tasks per minute',
    },

    // Status
    status: {
      type: 'string',
      description: 'Queue status',
      examples: ['active', 'paused', 'draining', 'stopped'],
    },
  },

  relationships: {
    service: {
      type: 'ProductizedService',
      description: 'Parent service',
    },
    tasks: {
      type: 'ServiceTask[]',
      description: 'Queued tasks',
    },
    workers: {
      type: 'ServiceWorker[]',
      description: 'Queue workers',
    },
  },

  actions: [
    'create',
    'update',
    'pause',
    'resume',
    'drain',
    'clear',
    'scale',
  ],

  events: [
    'created',
    'updated',
    'paused',
    'resumed',
    'draining',
    'drained',
    'cleared',
    'scaled',
  ],
}

// =============================================================================
// ServiceWorker
// =============================================================================

/**
 * ServiceWorker entity
 *
 * Worker processing tasks.
 */
export const ServiceWorker: Noun = {
  singular: 'service-worker',
  plural: 'service-workers',
  description: 'A worker processing service tasks',

  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Worker ID',
    },
    name: {
      type: 'string',
      optional: true,
      description: 'Worker name',
    },

    // Type
    type: {
      type: 'string',
      description: 'Worker type',
      examples: ['ai', 'human', 'automated', 'hybrid'],
    },

    // Capabilities
    capabilities: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Worker capabilities',
    },
    taskTypes: {
      type: 'string',
      array: true,
      optional: true,
      description: 'Task types handled',
    },

    // Configuration
    concurrency: {
      type: 'number',
      optional: true,
      description: 'Max concurrent tasks',
    },
    pollInterval: {
      type: 'number',
      optional: true,
      description: 'Poll interval (ms)',
    },

    // AI Configuration
    aiModel: {
      type: 'string',
      optional: true,
      description: 'AI model used',
    },
    aiConfig: {
      type: 'json',
      optional: true,
      description: 'AI configuration',
    },

    // Current State
    currentTask: {
      type: 'string',
      optional: true,
      description: 'Current task ID',
    },
    tasksInProgress: {
      type: 'number',
      optional: true,
      description: 'Tasks in progress',
    },
    lastActiveAt: {
      type: 'date',
      optional: true,
      description: 'Last activity time',
    },
    heartbeatAt: {
      type: 'date',
      optional: true,
      description: 'Last heartbeat',
    },

    // Metrics
    tasksCompleted: {
      type: 'number',
      optional: true,
      description: 'Tasks completed',
    },
    tasksFailed: {
      type: 'number',
      optional: true,
      description: 'Tasks failed',
    },
    avgProcessingTime: {
      type: 'number',
      optional: true,
      description: 'Avg processing time (ms)',
    },
    successRate: {
      type: 'number',
      optional: true,
      description: 'Success rate (0-1)',
    },

    // Resource
    memoryUsage: {
      type: 'number',
      optional: true,
      description: 'Memory usage (MB)',
    },
    cpuUsage: {
      type: 'number',
      optional: true,
      description: 'CPU usage (%)',
    },

    // Status
    status: {
      type: 'string',
      description: 'Worker status',
      examples: ['idle', 'busy', 'paused', 'draining', 'offline', 'error'],
    },
  },

  relationships: {
    queue: {
      type: 'ServiceQueue',
      description: 'Assigned queue',
    },
    currentTasks: {
      type: 'ServiceTask[]',
      description: 'Current tasks',
    },
    agent: {
      type: 'AgentDelivery',
      required: false,
      description: 'AI agent (if AI worker)',
    },
  },

  actions: [
    'start',
    'stop',
    'pause',
    'resume',
    'drain',
    'assignTask',
    'completeTask',
    'failTask',
  ],

  events: [
    'started',
    'stopped',
    'paused',
    'resumed',
    'draining',
    'drained',
    'taskAssigned',
    'taskCompleted',
    'taskFailed',
    'error',
  ],
}

// =============================================================================
// Exports
// =============================================================================

export const OrchestrationEntities = {
  ServiceWorkflow,
  WorkflowStep,
  ServiceTask,
  ServiceQueue,
  ServiceWorker,
}

export const OrchestrationCategories = {
  workflows: ['ServiceWorkflow', 'WorkflowStep'],
  tasks: ['ServiceTask'],
  queues: ['ServiceQueue'],
  workers: ['ServiceWorker'],
} as const
