/**
 * Business Roles - Bridges digital-workers and ai-database authorization
 *
 * Connects:
 * - WorkerRole (business role: CEO, Engineer, Manager)
 * - Authorization Role (FGA/RBAC: permissions, access control)
 * - Task Assignment (who handles what in workflows/processes)
 *
 * @packageDocumentation
 */
// =============================================================================
// Standard Business Roles
// =============================================================================
/**
 * Standard business roles with typical permissions
 */
export const StandardBusinessRoles = {
    // Executive
    ceo: {
        type: 'ceo',
        name: 'Chief Executive Officer',
        level: 10,
        permissions: { '*': ['manage'] },
        canApprove: ['*'],
        workerType: 'human',
    },
    cto: {
        type: 'cto',
        name: 'Chief Technology Officer',
        level: 10,
        department: 'Technology',
        permissions: {
            technology: ['manage'],
            repository: ['manage'],
            infrastructure: ['manage'],
        },
        canApprove: ['technical-decision', 'architecture', 'technology-budget'],
        workerType: 'human',
    },
    cfo: {
        type: 'cfo',
        name: 'Chief Financial Officer',
        level: 10,
        department: 'Finance',
        permissions: {
            finance: ['manage'],
            budget: ['manage'],
            expense: ['manage'],
        },
        canApprove: ['expense', 'budget', 'financial-decision'],
        workerType: 'human',
    },
    // Management
    director: {
        type: 'director',
        level: 8,
        permissions: {
            team: ['manage'],
            project: ['manage'],
            budget: ['read', 'edit'],
        },
        canApprove: ['hiring', 'budget-under-50k', 'project'],
        workerType: 'human',
    },
    manager: {
        type: 'manager',
        level: 6,
        permissions: {
            team: ['read', 'edit'],
            project: ['read', 'edit', 'manage'],
        },
        canApprove: ['expense-under-5k', 'time-off', 'code-review'],
        workerType: 'human',
    },
    lead: {
        type: 'lead',
        level: 5,
        permissions: {
            team: ['read'],
            project: ['read', 'edit'],
            repository: ['read', 'edit', 'act:merge'],
        },
        canDelegate: ['code-review', 'testing'],
        workerType: 'hybrid',
    },
    // Individual Contributors
    engineer: {
        type: 'engineer',
        level: 3,
        department: 'Engineering',
        permissions: {
            repository: ['read', 'edit'],
            project: ['read'],
        },
        canHandle: ['coding', 'code-review', 'bug-fix', 'testing'],
        workerType: 'hybrid',
    },
    analyst: {
        type: 'analyst',
        level: 3,
        permissions: {
            data: ['read'],
            report: ['read', 'edit'],
        },
        canHandle: ['data-analysis', 'reporting', 'research'],
        workerType: 'hybrid',
    },
    // Operations
    agent: {
        type: 'agent',
        level: 2,
        permissions: {
            ticket: ['read', 'edit', 'act:respond', 'act:escalate'],
            customer: ['read'],
        },
        canHandle: ['customer-inquiry', 'support-ticket', 'basic-troubleshooting'],
        workerType: 'ai', // AI-first
    },
    assistant: {
        type: 'assistant',
        level: 1,
        permissions: {
            calendar: ['read', 'edit'],
            email: ['read', 'act:draft'],
            task: ['read', 'edit'],
        },
        canHandle: ['scheduling', 'email-draft', 'task-management', 'research'],
        workerType: 'ai', // AI-first
    },
};
// =============================================================================
// Helper Functions
// =============================================================================
/**
 * Create a business role from a standard template
 */
export function createBusinessRole(id, template, overrides) {
    const standard = StandardBusinessRoles[template];
    if (!standard) {
        throw new Error(`Unknown role template: ${template}`);
    }
    return {
        id,
        name: standard.name || template,
        type: standard.type || template,
        ...standard,
        ...overrides,
    };
}
/**
 * Check if a role has permission for an action on a resource type
 */
export function hasPermission(role, resourceType, action) {
    if (!role.permissions)
        return false;
    // Check wildcard permissions
    const wildcardPerms = role.permissions['*'];
    if (wildcardPerms) {
        if (wildcardPerms.includes('manage') || wildcardPerms.includes('*'))
            return true;
        if (wildcardPerms.includes(action))
            return true;
    }
    // Check resource-specific permissions
    const resourcePerms = role.permissions[resourceType];
    if (!resourcePerms)
        return false;
    // Check for exact match
    if (resourcePerms.includes(action))
        return true;
    // Check for 'manage' which includes all actions
    if (resourcePerms.includes('manage') || resourcePerms.includes('*'))
        return true;
    // Check for act:* pattern
    if (action.startsWith('act:')) {
        if (resourcePerms.includes('act:*'))
            return true;
    }
    return false;
}
/**
 * Check if a role can handle a task type
 */
export function canHandleTask(role, taskType) {
    if (!role.canHandle)
        return false;
    return role.canHandle.includes(taskType) || role.canHandle.includes('*');
}
/**
 * Check if a role can approve a request type
 */
export function canApproveRequest(role, requestType) {
    if (!role.canApprove)
        return false;
    return role.canApprove.includes(requestType) || role.canApprove.includes('*');
}
/**
 * Check if a role can delegate a task type
 */
export function canDelegateTask(role, taskType) {
    if (!role.canDelegate)
        return false;
    return role.canDelegate.includes(taskType) || role.canDelegate.includes('*');
}
/**
 * Find the best role for a task based on routing rules
 */
export function findRoleForTask(taskType, rules, context) {
    const matchingRules = rules.filter(rule => rule.taskType === taskType);
    if (matchingRules.length === 0)
        return undefined;
    // If there's an amount and escalation rules, check those
    if (context?.amount) {
        for (const rule of matchingRules) {
            if (rule.escalateAbove && context.amount > rule.escalateAbove) {
                // Find the escalated rule
                const escalatedRule = rules.find(r => r.taskType === taskType && r.requiredRole === rule.escalateTo);
                if (escalatedRule)
                    return escalatedRule;
            }
        }
    }
    // Return the first matching rule
    return matchingRules[0];
}
/**
 * Create a task assignment
 */
export function createTaskAssignment(taskId, taskType, assignee, options) {
    return {
        id: `assign_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        taskId,
        taskType,
        assignee,
        status: 'assigned',
        assignedAt: new Date(),
        priority: 'normal',
        ...options,
    };
}
/**
 * Transition task assignment status
 */
export function transitionTaskStatus(assignment, newStatus, options) {
    const now = new Date();
    return {
        ...assignment,
        status: newStatus,
        ...(newStatus === 'in_progress' && !assignment.startedAt ? { startedAt: now } : {}),
        ...(newStatus === 'completed' || newStatus === 'failed' ? { completedAt: now } : {}),
        ...(options?.result ? { result: options.result } : {}),
        ...(options?.notes ? { notes: options.notes } : {}),
    };
}
