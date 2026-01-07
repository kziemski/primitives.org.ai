/**
 * Human-in-the-loop primitives implementation
 */
import { InMemoryHumanStore } from './store.js';
/**
 * Human-in-the-loop manager
 *
 * Provides primitives for integrating human oversight and intervention
 * in AI workflows.
 *
 * @example
 * ```ts
 * const human = Human({
 *   defaultTimeout: 3600000, // 1 hour
 *   autoEscalate: true,
 * })
 *
 * // Request approval
 * const approval = await human.approve({
 *   title: 'Deploy to production',
 *   description: 'Approve deployment of v2.0.0',
 *   subject: 'Production Deployment',
 *   assignee: 'tech-lead@example.com',
 *   priority: 'high',
 * })
 *
 * if (approval.approved) {
 *   await deploy()
 * }
 * ```
 */
export class HumanManager {
    store;
    options;
    roles = new Map();
    teams = new Map();
    humans = new Map();
    escalationPolicies = new Map();
    workflows = new Map();
    constructor(options = {}) {
        this.store = options.store || new InMemoryHumanStore();
        this.options = {
            store: this.store,
            defaultTimeout: options.defaultTimeout || 0, // No timeout by default
            defaultPriority: options.defaultPriority || 'normal',
            escalationPolicies: options.escalationPolicies || [],
            autoEscalate: options.autoEscalate ?? false,
        };
        // Register escalation policies
        for (const policy of this.options.escalationPolicies) {
            this.escalationPolicies.set(policy.id, policy);
        }
    }
    /**
     * Define a role
     */
    defineRole(role) {
        this.roles.set(role.id, role);
        return role;
    }
    /**
     * Get a role by ID
     */
    getRole(id) {
        return this.roles.get(id);
    }
    /**
     * Define a team
     */
    defineTeam(team) {
        this.teams.set(team.id, team);
        return team;
    }
    /**
     * Get a team by ID
     */
    getTeam(id) {
        return this.teams.get(id);
    }
    /**
     * Register a human worker
     */
    registerHuman(human) {
        this.humans.set(human.id, human);
        return human;
    }
    /**
     * Get a human by ID
     */
    getHuman(id) {
        return this.humans.get(id);
    }
    /**
     * Request approval from a human
     *
     * @example
     * ```ts
     * const result = await human.approve({
     *   title: 'Approve expense',
     *   description: 'Employee expense claim for $150',
     *   subject: 'Expense Claim #1234',
     *   input: { amount: 150, category: 'Travel' },
     *   assignee: 'manager@example.com',
     *   priority: 'normal',
     * })
     * ```
     */
    async approve(params) {
        const request = await this.store.create({
            type: 'approval',
            status: 'pending',
            title: params.title,
            description: params.description,
            subject: params.subject,
            input: params.input,
            assignee: params.assignee,
            role: params.role,
            team: params.team,
            priority: params.priority || this.options.defaultPriority,
            timeout: params.timeout || this.options.defaultTimeout,
            escalatesTo: params.escalatesTo,
            requiresApproval: params.requiresApproval ?? true,
            approvers: params.approvers,
            currentApproverIndex: 0,
            metadata: params.metadata,
        });
        // In a real implementation, this would:
        // 1. Send notification to assignee
        // 2. Wait for response (polling, webhook, or event)
        // 3. Handle timeout and escalation
        // 4. Return the response
        // For now, return the request ID as a placeholder
        return this.waitForResponse(request);
    }
    /**
     * Ask a question to a human
     *
     * @example
     * ```ts
     * const answer = await human.ask({
     *   title: 'Product naming',
     *   question: 'What should we name the new feature?',
     *   context: { feature: 'AI Assistant' },
     *   assignee: 'product-manager@example.com',
     * })
     * ```
     */
    async ask(params) {
        const request = await this.store.create({
            type: 'question',
            status: 'pending',
            title: params.title,
            description: params.question,
            question: params.question,
            input: { question: params.question, context: params.context },
            context: params.context,
            suggestions: params.suggestions,
            assignee: params.assignee,
            role: params.role,
            team: params.team,
            priority: params.priority || this.options.defaultPriority,
            timeout: params.timeout || this.options.defaultTimeout,
            metadata: params.metadata,
        });
        return this.waitForResponse(request);
    }
    /**
     * Request a human to perform a task
     *
     * @example
     * ```ts
     * const result = await human.do({
     *   title: 'Review code',
     *   instructions: 'Review the PR and provide feedback',
     *   input: { prUrl: 'https://github.com/...' },
     *   assignee: 'senior-dev@example.com',
     * })
     * ```
     */
    async do(params) {
        const request = await this.store.create({
            type: 'task',
            status: 'pending',
            title: params.title,
            description: params.instructions,
            instructions: params.instructions,
            input: params.input,
            assignee: params.assignee,
            role: params.role,
            team: params.team,
            priority: params.priority || this.options.defaultPriority,
            timeout: params.timeout || this.options.defaultTimeout,
            tools: params.tools,
            estimatedEffort: params.estimatedEffort,
            metadata: params.metadata,
        });
        return this.waitForResponse(request);
    }
    /**
     * Request a human to make a decision
     *
     * @example
     * ```ts
     * const choice = await human.decide({
     *   title: 'Pick deployment strategy',
     *   options: ['blue-green', 'canary', 'rolling'],
     *   context: { risk: 'high', users: 100000 },
     *   assignee: 'devops-lead@example.com',
     * })
     * ```
     */
    async decide(params) {
        const request = await this.store.create({
            type: 'decision',
            status: 'pending',
            title: params.title,
            description: params.description || `Choose from: ${params.options.join(', ')}`,
            input: { options: params.options, context: params.context },
            options: params.options,
            context: params.context,
            criteria: params.criteria,
            assignee: params.assignee,
            role: params.role,
            team: params.team,
            priority: params.priority || this.options.defaultPriority,
            timeout: params.timeout || this.options.defaultTimeout,
            metadata: params.metadata,
        });
        return this.waitForResponse(request);
    }
    /**
     * Request a human to review content
     *
     * @example
     * ```ts
     * const review = await human.review({
     *   title: 'Review blog post',
     *   content: { title: 'My Post', body: '...' },
     *   reviewType: 'content',
     *   criteria: ['Grammar', 'Tone', 'Accuracy'],
     *   assignee: 'editor@example.com',
     * })
     * ```
     */
    async review(params) {
        const request = await this.store.create({
            type: 'review',
            status: 'pending',
            title: params.title,
            description: params.description || `Review requested: ${params.reviewType || 'other'}`,
            input: params.content,
            content: params.content,
            reviewType: params.reviewType,
            criteria: params.criteria,
            assignee: params.assignee,
            role: params.role,
            team: params.team,
            priority: params.priority || this.options.defaultPriority,
            timeout: params.timeout || this.options.defaultTimeout,
            metadata: params.metadata,
        });
        return this.waitForResponse(request);
    }
    /**
     * Send a notification to a human
     *
     * @example
     * ```ts
     * await human.notify({
     *   type: 'info',
     *   title: 'Deployment complete',
     *   message: 'Version 2.0.0 deployed successfully',
     *   recipient: 'team@example.com',
     *   channels: ['slack', 'email'],
     * })
     * ```
     */
    async notify(params) {
        const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: params.type,
            title: params.title,
            message: params.message,
            recipient: params.recipient,
            channels: params.channels,
            priority: params.priority,
            data: params.data,
            createdAt: new Date(),
        };
        // In a real implementation, this would:
        // 1. Send the notification via specified channels
        // 2. Track delivery status
        // 3. Handle failures and retries
        return notification;
    }
    /**
     * Get a review queue
     *
     * @example
     * ```ts
     * const queue = await human.getQueue({
     *   name: 'Pending Approvals',
     *   filters: {
     *     status: ['pending'],
     *     priority: ['high', 'critical'],
     *   },
     * })
     * ```
     */
    async getQueue(params) {
        const items = await this.store.list(params.filters, params.limit);
        return {
            id: `queue_${Date.now()}`,
            name: params.name,
            description: params.description,
            items,
            filters: params.filters,
            sortBy: params.sortBy,
            sortDirection: params.sortDirection,
        };
    }
    /**
     * Get a request by ID
     */
    async getRequest(id) {
        return this.store.get(id);
    }
    /**
     * Complete a request with a response
     */
    async completeRequest(id, response) {
        return this.store.complete(id, response);
    }
    /**
     * Reject a request
     */
    async rejectRequest(id, reason) {
        return this.store.reject(id, reason);
    }
    /**
     * Escalate a request
     */
    async escalateRequest(id, to) {
        return this.store.escalate(id, to);
    }
    /**
     * Cancel a request
     */
    async cancelRequest(id) {
        return this.store.cancel(id);
    }
    /**
     * Define or update goals
     */
    defineGoals(goals) {
        // In a real implementation, this would persist goals
        return goals;
    }
    /**
     * Track KPIs
     */
    trackKPIs(kpis) {
        // In a real implementation, this would persist KPIs
        return kpis;
    }
    /**
     * Define or update OKRs
     */
    defineOKRs(okrs) {
        // In a real implementation, this would persist OKRs
        return okrs;
    }
    /**
     * Create an approval workflow
     */
    createWorkflow(workflow) {
        this.workflows.set(workflow.id, workflow);
        return workflow;
    }
    /**
     * Get a workflow by ID
     */
    getWorkflow(id) {
        return this.workflows.get(id);
    }
    /**
     * Wait for a human response
     *
     * In a real implementation, this would:
     * 1. Poll the store for updates
     * 2. Listen for webhooks/events
     * 3. Handle timeouts and escalations
     * 4. Return the response when available
     *
     * For now, this throws an error to indicate manual completion is needed
     */
    async waitForResponse(request) {
        // Check if there's a timeout
        if (request.timeout && request.timeout > 0) {
            // Set up timeout handler
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Request ${request.id} timed out after ${request.timeout}ms`));
                }, request.timeout);
            });
            // Poll for completion
            const pollPromise = this.pollForCompletion(request.id);
            // Race between timeout and completion
            try {
                return await Promise.race([pollPromise, timeoutPromise]);
            }
            catch (error) {
                // On timeout, escalate if configured
                if (this.options.autoEscalate && request.escalatesTo) {
                    const escalateTo = Array.isArray(request.escalatesTo)
                        ? request.escalatesTo[0]
                        : request.escalatesTo;
                    if (escalateTo) {
                        await this.store.escalate(request.id, escalateTo);
                    }
                    else {
                        await this.store.update(request.id, { status: 'timeout' });
                    }
                }
                else {
                    await this.store.update(request.id, { status: 'timeout' });
                }
                throw error;
            }
        }
        // No timeout, just poll indefinitely
        return this.pollForCompletion(request.id);
    }
    /**
     * Poll for request completion
     */
    async pollForCompletion(requestId) {
        // In a real implementation, use webhooks, WebSockets, or event emitters
        // This is a simplified polling implementation
        const pollInterval = 1000; // 1 second
        while (true) {
            const request = await this.store.get(requestId);
            if (!request) {
                throw new Error(`Request ${requestId} not found`);
            }
            if (request.status === 'completed' && request.response) {
                return request.response;
            }
            if (request.status === 'rejected') {
                throw new Error(`Request ${requestId} was rejected: ${request.rejectionReason}`);
            }
            if (request.status === 'cancelled') {
                throw new Error(`Request ${requestId} was cancelled`);
            }
            // Wait before polling again
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
    }
}
/**
 * Create a Human-in-the-loop manager instance
 *
 * @example
 * ```ts
 * import { Human } from 'human-in-the-loop'
 *
 * const human = Human({
 *   defaultTimeout: 3600000, // 1 hour
 *   autoEscalate: true,
 * })
 * ```
 */
export function Human(options) {
    return new HumanManager(options);
}
