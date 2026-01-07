/**
 * Automation Entity Types (Nouns)
 *
 * Workflow automation entities for triggers, actions,
 * workflows, and integrations (Zapier, n8n, Make, etc.).
 *
 * @packageDocumentation
 */
// =============================================================================
// Workflow
// =============================================================================
/**
 * Workflow entity (Automation)
 *
 * Represents an automated workflow.
 */
export const AutomationWorkflow = {
    singular: 'automation-workflow',
    plural: 'automation-workflows',
    description: 'An automated workflow',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Workflow name',
        },
        description: {
            type: 'string',
            optional: true,
            description: 'Workflow description',
        },
        // Status
        status: {
            type: 'string',
            description: 'Workflow status',
            examples: ['draft', 'active', 'paused', 'error', 'archived'],
        },
        isActive: {
            type: 'boolean',
            description: 'Whether workflow is active',
        },
        // Configuration
        triggerType: {
            type: 'string',
            description: 'Type of trigger',
            examples: ['webhook', 'schedule', 'event', 'manual', 'app'],
        },
        triggerConfig: {
            type: 'json',
            optional: true,
            description: 'Trigger configuration',
        },
        // Execution
        lastRunAt: {
            type: 'datetime',
            optional: true,
            description: 'Last execution time',
        },
        lastRunStatus: {
            type: 'string',
            optional: true,
            description: 'Last run status',
        },
        runCount: {
            type: 'number',
            optional: true,
            description: 'Total run count',
        },
        successCount: {
            type: 'number',
            optional: true,
            description: 'Successful runs',
        },
        errorCount: {
            type: 'number',
            optional: true,
            description: 'Failed runs',
        },
        // Settings
        retryOnFailure: {
            type: 'boolean',
            optional: true,
            description: 'Retry on failure',
        },
        maxRetries: {
            type: 'number',
            optional: true,
            description: 'Max retry attempts',
        },
        timeout: {
            type: 'number',
            optional: true,
            description: 'Timeout in seconds',
        },
    },
    relationships: {
        triggers: {
            type: 'Trigger[]',
            description: 'Workflow triggers',
        },
        actions: {
            type: 'Action[]',
            description: 'Workflow actions',
        },
        runs: {
            type: 'WorkflowRun[]',
            description: 'Execution history',
        },
        owner: {
            type: 'User',
            description: 'Workflow owner',
        },
    },
    actions: [
        'create',
        'update',
        'activate',
        'pause',
        'archive',
        'duplicate',
        'run',
        'test',
    ],
    events: [
        'created',
        'updated',
        'activated',
        'paused',
        'archived',
        'duplicated',
        'runStarted',
        'runCompleted',
        'runFailed',
    ],
};
// =============================================================================
// Trigger
// =============================================================================
/**
 * Trigger entity
 *
 * Represents a workflow trigger.
 */
export const Trigger = {
    singular: 'trigger',
    plural: 'triggers',
    description: 'A workflow trigger',
    properties: {
        // Type
        type: {
            type: 'string',
            description: 'Trigger type',
            examples: ['webhook', 'schedule', 'event', 'manual', 'email', 'form'],
        },
        // Configuration
        config: {
            type: 'json',
            optional: true,
            description: 'Trigger configuration',
        },
        // Schedule (for scheduled triggers)
        schedule: {
            type: 'string',
            optional: true,
            description: 'Cron schedule expression',
        },
        timezone: {
            type: 'string',
            optional: true,
            description: 'Schedule timezone',
        },
        // Webhook (for webhook triggers)
        webhookUrl: {
            type: 'url',
            optional: true,
            description: 'Webhook URL',
        },
        webhookSecret: {
            type: 'string',
            optional: true,
            description: 'Webhook secret',
        },
        // Event (for event triggers)
        eventType: {
            type: 'string',
            optional: true,
            description: 'Event type to listen for',
        },
        eventSource: {
            type: 'string',
            optional: true,
            description: 'Event source app',
        },
        // Filters
        filters: {
            type: 'json',
            optional: true,
            description: 'Trigger filters/conditions',
        },
        // Status
        isActive: {
            type: 'boolean',
            description: 'Whether trigger is active',
        },
    },
    relationships: {
        workflow: {
            type: 'AutomationWorkflow',
            description: 'Parent workflow',
        },
    },
    actions: [
        'create',
        'update',
        'activate',
        'deactivate',
        'test',
    ],
    events: [
        'created',
        'updated',
        'activated',
        'deactivated',
        'fired',
    ],
};
// =============================================================================
// Action
// =============================================================================
/**
 * Action entity
 *
 * Represents a workflow action/step.
 */
export const Action = {
    singular: 'action',
    plural: 'actions',
    description: 'A workflow action or step',
    properties: {
        // Identity
        name: {
            type: 'string',
            optional: true,
            description: 'Action name',
        },
        // Type
        type: {
            type: 'string',
            description: 'Action type',
            examples: ['http', 'email', 'database', 'transform', 'condition', 'loop', 'delay', 'app'],
        },
        app: {
            type: 'string',
            optional: true,
            description: 'App/integration name',
        },
        operation: {
            type: 'string',
            optional: true,
            description: 'Operation to perform',
        },
        // Configuration
        config: {
            type: 'json',
            optional: true,
            description: 'Action configuration',
        },
        inputs: {
            type: 'json',
            optional: true,
            description: 'Input mappings',
        },
        // Position
        order: {
            type: 'number',
            optional: true,
            description: 'Order in workflow',
        },
        // Error handling
        continueOnError: {
            type: 'boolean',
            optional: true,
            description: 'Continue on error',
        },
        retryOnFailure: {
            type: 'boolean',
            optional: true,
            description: 'Retry on failure',
        },
    },
    relationships: {
        workflow: {
            type: 'AutomationWorkflow',
            description: 'Parent workflow',
        },
        nextAction: {
            type: 'Action',
            required: false,
            description: 'Next action',
        },
    },
    actions: [
        'create',
        'update',
        'delete',
        'test',
        'reorder',
    ],
    events: [
        'created',
        'updated',
        'deleted',
        'executed',
        'failed',
    ],
};
// =============================================================================
// AutomationRun
// =============================================================================
/**
 * AutomationRun entity
 *
 * Represents a workflow execution.
 */
export const AutomationRun = {
    singular: 'automation-run',
    plural: 'automation-runs',
    description: 'A workflow execution',
    properties: {
        // Status
        status: {
            type: 'string',
            description: 'Run status',
            examples: ['pending', 'running', 'completed', 'failed', 'cancelled', 'waiting'],
        },
        // Timing
        startedAt: {
            type: 'datetime',
            optional: true,
            description: 'Start time',
        },
        completedAt: {
            type: 'datetime',
            optional: true,
            description: 'Completion time',
        },
        duration: {
            type: 'number',
            optional: true,
            description: 'Duration in milliseconds',
        },
        // Input/Output
        triggerData: {
            type: 'json',
            optional: true,
            description: 'Trigger input data',
        },
        output: {
            type: 'json',
            optional: true,
            description: 'Final output',
        },
        // Progress
        currentStep: {
            type: 'number',
            optional: true,
            description: 'Current step number',
        },
        totalSteps: {
            type: 'number',
            optional: true,
            description: 'Total steps',
        },
        // Error
        error: {
            type: 'string',
            optional: true,
            description: 'Error message',
        },
        errorStep: {
            type: 'number',
            optional: true,
            description: 'Step that failed',
        },
        // Retry
        attempt: {
            type: 'number',
            optional: true,
            description: 'Attempt number',
        },
    },
    relationships: {
        workflow: {
            type: 'AutomationWorkflow',
            description: 'Parent workflow',
        },
        stepResults: {
            type: 'StepResult[]',
            description: 'Step execution results',
        },
    },
    actions: [
        'start',
        'cancel',
        'retry',
        'resume',
    ],
    events: [
        'started',
        'stepCompleted',
        'stepFailed',
        'completed',
        'failed',
        'cancelled',
        'retried',
    ],
};
// =============================================================================
// StepResult
// =============================================================================
/**
 * StepResult entity
 *
 * Represents the result of a workflow step execution.
 */
export const StepResult = {
    singular: 'step-result',
    plural: 'step-results',
    description: 'Result of a workflow step execution',
    properties: {
        // Status
        status: {
            type: 'string',
            description: 'Step status',
            examples: ['pending', 'running', 'completed', 'failed', 'skipped'],
        },
        // Step info
        stepNumber: {
            type: 'number',
            description: 'Step number',
        },
        actionType: {
            type: 'string',
            optional: true,
            description: 'Action type',
        },
        // Timing
        startedAt: {
            type: 'datetime',
            optional: true,
            description: 'Start time',
        },
        completedAt: {
            type: 'datetime',
            optional: true,
            description: 'Completion time',
        },
        duration: {
            type: 'number',
            optional: true,
            description: 'Duration in milliseconds',
        },
        // Data
        input: {
            type: 'json',
            optional: true,
            description: 'Step input',
        },
        output: {
            type: 'json',
            optional: true,
            description: 'Step output',
        },
        // Error
        error: {
            type: 'string',
            optional: true,
            description: 'Error message',
        },
    },
    relationships: {
        run: {
            type: 'AutomationRun',
            description: 'Parent run',
        },
        action: {
            type: 'Action',
            description: 'Related action',
        },
    },
    actions: [],
    events: [
        'started',
        'completed',
        'failed',
    ],
};
// =============================================================================
// Integration
// =============================================================================
/**
 * Integration entity
 *
 * Represents a connected app/service integration.
 */
export const Integration = {
    singular: 'integration',
    plural: 'integrations',
    description: 'A connected app or service integration',
    properties: {
        // Identity
        name: {
            type: 'string',
            description: 'Integration name',
        },
        app: {
            type: 'string',
            description: 'App identifier',
        },
        // Status
        status: {
            type: 'string',
            description: 'Connection status',
            examples: ['connected', 'disconnected', 'error', 'expired'],
        },
        isActive: {
            type: 'boolean',
            description: 'Whether integration is active',
        },
        // Auth
        authType: {
            type: 'string',
            optional: true,
            description: 'Authentication type',
            examples: ['oauth2', 'api_key', 'basic', 'token'],
        },
        expiresAt: {
            type: 'datetime',
            optional: true,
            description: 'Token expiration',
        },
        // Metadata
        accountName: {
            type: 'string',
            optional: true,
            description: 'Connected account name',
        },
        accountId: {
            type: 'string',
            optional: true,
            description: 'Connected account ID',
        },
        // Last activity
        lastUsedAt: {
            type: 'datetime',
            optional: true,
            description: 'Last used',
        },
    },
    relationships: {
        owner: {
            type: 'User',
            description: 'Integration owner',
        },
        workflows: {
            type: 'AutomationWorkflow[]',
            description: 'Workflows using this integration',
        },
    },
    actions: [
        'connect',
        'disconnect',
        'refresh',
        'test',
    ],
    events: [
        'connected',
        'disconnected',
        'refreshed',
        'expired',
        'error',
    ],
};
// =============================================================================
// Exports
// =============================================================================
export const AutomationEntities = {
    AutomationWorkflow,
    Trigger,
    Action,
    AutomationRun,
    StepResult,
    Integration,
};
export const AutomationCategories = {
    workflows: ['AutomationWorkflow'],
    triggers: ['Trigger'],
    actions: ['Action'],
    execution: ['AutomationRun', 'StepResult'],
    integrations: ['Integration'],
};
