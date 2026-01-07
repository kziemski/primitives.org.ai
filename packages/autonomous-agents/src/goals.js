/**
 * Goals - Define and track goals for agents and teams
 *
 * Goals provide direction and measurable outcomes for autonomous agents
 * and teams to work towards.
 *
 * @packageDocumentation
 */
/**
 * Create a goals configuration
 *
 * @example
 * ```ts
 * import { Goals } from 'autonomous-agents'
 *
 * const goals = Goals({
 *   goals: [
 *     {
 *       id: 'revenue-q1',
 *       description: 'Increase Q1 revenue by 20%',
 *       target: 120000,
 *       progress: 45000,
 *       priority: 'high',
 *       deadline: new Date('2024-03-31'),
 *       status: 'active',
 *     },
 *     {
 *       id: 'feature-launch',
 *       description: 'Launch new AI features',
 *       target: '100%',
 *       progress: '60%',
 *       priority: 'high',
 *       deadline: new Date('2024-02-15'),
 *       status: 'active',
 *       subgoals: [
 *         {
 *           id: 'feature-design',
 *           description: 'Complete feature designs',
 *           target: '100%',
 *           progress: '100%',
 *           status: 'completed',
 *         },
 *         {
 *           id: 'feature-dev',
 *           description: 'Implement features',
 *           target: '100%',
 *           progress: '80%',
 *           status: 'active',
 *         },
 *       ],
 *     },
 *   ],
 *   strategy: 'Focus on high-impact features that drive revenue growth',
 *   timeHorizon: 'Q1 2024',
 * })
 * ```
 */
export function Goals(config) {
    const state = {
        goals: config.goals,
        strategy: config.strategy,
        timeHorizon: config.timeHorizon,
    };
    return {
        ...state,
        addGoal,
        removeGoal,
        getGoal,
        getGoals,
        getActiveGoals,
        getCompletedGoals,
        getBlockedGoals,
        getGoalsByPriority,
        updateGoal,
        updateProgress,
        markCompleted,
        markBlocked,
        getProgress,
        getOverallProgress,
    };
    /**
     * Add a new goal
     */
    function addGoal(goal) {
        state.goals.push(goal);
    }
    /**
     * Remove a goal
     */
    function removeGoal(goalId) {
        const index = state.goals.findIndex(g => g.id === goalId);
        if (index === -1)
            return false;
        state.goals.splice(index, 1);
        return true;
    }
    /**
     * Get a specific goal
     */
    function getGoal(goalId) {
        return findGoalRecursive(state.goals, goalId);
    }
    /**
     * Get all goals
     */
    function getGoals() {
        return [...state.goals];
    }
    /**
     * Get active goals
     */
    function getActiveGoals() {
        return state.goals.filter(g => g.status === 'active');
    }
    /**
     * Get completed goals
     */
    function getCompletedGoals() {
        return state.goals.filter(g => g.status === 'completed');
    }
    /**
     * Get blocked goals
     */
    function getBlockedGoals() {
        return state.goals.filter(g => g.status === 'blocked');
    }
    /**
     * Get goals by priority
     */
    function getGoalsByPriority(priority) {
        return state.goals.filter(g => g.priority === priority);
    }
    /**
     * Update a goal
     */
    function updateGoal(goalId, updates) {
        const goal = findGoalRecursive(state.goals, goalId);
        if (!goal) {
            throw new Error(`Goal with id ${goalId} not found`);
        }
        Object.assign(goal, updates);
    }
    /**
     * Update goal progress
     */
    function updateProgress(goalId, progress) {
        const goal = findGoalRecursive(state.goals, goalId);
        if (!goal) {
            throw new Error(`Goal with id ${goalId} not found`);
        }
        goal.progress = progress;
        // Auto-complete if progress reaches target
        if (isGoalComplete(goal)) {
            goal.status = 'completed';
        }
    }
    /**
     * Mark goal as completed
     */
    function markCompleted(goalId) {
        const goal = findGoalRecursive(state.goals, goalId);
        if (!goal) {
            throw new Error(`Goal with id ${goalId} not found`);
        }
        goal.status = 'completed';
        goal.progress = goal.target;
    }
    /**
     * Mark goal as blocked
     */
    function markBlocked(goalId, reason) {
        const goal = findGoalRecursive(state.goals, goalId);
        if (!goal) {
            throw new Error(`Goal with id ${goalId} not found`);
        }
        goal.status = 'blocked';
    }
    /**
     * Get progress for a specific goal
     */
    function getProgress(goalId) {
        const goal = findGoalRecursive(state.goals, goalId);
        if (!goal)
            return 0;
        return calculateProgress(goal);
    }
    /**
     * Get overall progress across all goals
     */
    function getOverallProgress() {
        if (state.goals.length === 0)
            return 0;
        const totalProgress = state.goals.reduce((sum, goal) => sum + calculateProgress(goal), 0);
        return totalProgress / state.goals.length;
    }
}
/**
 * Find a goal recursively (including subgoals)
 */
function findGoalRecursive(goals, goalId) {
    for (const goal of goals) {
        if (goal.id === goalId)
            return goal;
        if (goal.subgoals) {
            const found = findGoalRecursive(goal.subgoals, goalId);
            if (found)
                return found;
        }
    }
    return undefined;
}
/**
 * Calculate progress percentage for a goal
 */
function calculateProgress(goal) {
    // If no progress set, return 0
    if (goal.progress === undefined)
        return 0;
    // If goal is completed, return 100
    if (goal.status === 'completed')
        return 100;
    // Handle numeric progress
    if (typeof goal.progress === 'number' && typeof goal.target === 'number') {
        return Math.min(100, (goal.progress / goal.target) * 100);
    }
    // Handle percentage strings
    if (typeof goal.progress === 'string' && typeof goal.target === 'string') {
        const progressMatch = goal.progress.match(/(\d+)%?/);
        const targetMatch = goal.target.match(/(\d+)%?/);
        if (progressMatch && targetMatch) {
            const progressNum = parseInt(progressMatch[1], 10);
            const targetNum = parseInt(targetMatch[1], 10);
            return Math.min(100, (progressNum / targetNum) * 100);
        }
    }
    // If we have subgoals, calculate from them
    if (goal.subgoals && goal.subgoals.length > 0) {
        const subgoalProgress = goal.subgoals.reduce((sum, subgoal) => sum + calculateProgress(subgoal), 0);
        return subgoalProgress / goal.subgoals.length;
    }
    return 0;
}
/**
 * Check if a goal is complete
 */
function isGoalComplete(goal) {
    // Check status
    if (goal.status === 'completed')
        return true;
    // Check numeric progress vs target
    if (typeof goal.progress === 'number' && typeof goal.target === 'number') {
        return goal.progress >= goal.target;
    }
    // Check percentage strings
    if (typeof goal.progress === 'string' && typeof goal.target === 'string') {
        const progressMatch = goal.progress.match(/(\d+)%?/);
        const targetMatch = goal.target.match(/(\d+)%?/);
        if (progressMatch && targetMatch) {
            return parseInt(progressMatch[1], 10) >= parseInt(targetMatch[1], 10);
        }
    }
    // Check subgoals
    if (goal.subgoals && goal.subgoals.length > 0) {
        return goal.subgoals.every(subgoal => isGoalComplete(subgoal));
    }
    return false;
}
/**
 * Create a simple goal
 */
export function createGoal(config) {
    return {
        id: config.id,
        description: config.description,
        target: config.target,
        priority: config.priority || 'medium',
        deadline: config.deadline,
        status: 'active',
    };
}
/**
 * Create a goal with subgoals
 */
export function createGoalWithSubgoals(config) {
    return {
        id: config.id,
        description: config.description,
        target: config.target,
        subgoals: config.subgoals,
        priority: config.priority || 'medium',
        deadline: config.deadline,
        status: 'active',
    };
}
/**
 * Check if a goal is overdue
 */
export function isGoalOverdue(goal) {
    if (!goal.deadline)
        return false;
    return new Date() > goal.deadline && goal.status !== 'completed';
}
/**
 * Get goals that are overdue
 */
export function getOverdueGoals(goals) {
    return goals.filter(isGoalOverdue);
}
/**
 * Get goals due soon (within specified days)
 */
export function getGoalsDueSoon(goals, days = 7) {
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return goals.filter(goal => {
        if (!goal.deadline || goal.status === 'completed')
            return false;
        return goal.deadline <= threshold && goal.deadline > now;
    });
}
/**
 * Get goals by status
 */
export function getGoalsByStatus(goals, status) {
    return goals.filter(g => g.status === status);
}
/**
 * Calculate time remaining until deadline
 */
export function getTimeRemaining(goal) {
    if (!goal.deadline)
        return null;
    const now = new Date();
    const diff = goal.deadline.getTime() - now.getTime();
    if (diff < 0)
        return { days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
}
