/**
 * Worker Actions - Workflow Integration
 *
 * Worker actions (notify, ask, approve, decide, do) are durable workflow actions
 * that integrate with ai-workflows. They can be invoked via:
 *
 * 1. `$.do('Worker.notify', data)` - Durable action
 * 2. `$.send('Worker.notify', data)` - Fire and forget
 * 3. `$.notify(target, message)` - Convenience method (when using withWorkers)
 *
 * @packageDocumentation
 */
// ============================================================================
// Action Handlers
// ============================================================================
/**
 * Handle Worker.notify action
 */
export async function handleNotify(data, $) {
    const { object: target, message, via, priority = 'normal' } = data;
    // Resolve target to get contacts
    const { contacts, recipients } = resolveTarget(target);
    // Determine which channels to use
    const channels = resolveChannels(via, contacts, priority);
    if (channels.length === 0) {
        return {
            sent: false,
            via: [],
            sentAt: new Date(),
            messageId: generateId('msg'),
        };
    }
    // Send to each channel
    const delivery = await Promise.all(channels.map(async (channel) => {
        try {
            await sendToChannel(channel, message, contacts, { priority });
            return { channel, status: 'sent' };
        }
        catch (error) {
            return {
                channel,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }));
    const sent = delivery.some((d) => d.status === 'sent');
    const result = {
        sent,
        via: channels,
        recipients,
        sentAt: new Date(),
        messageId: generateId('msg'),
        delivery,
    };
    // Emit result event
    if (sent) {
        await $.send('Worker.notified', { ...data, result });
    }
    return result;
}
/**
 * Handle Worker.ask action
 */
export async function handleAsk(data, $) {
    const { object: target, question, via, schema, timeout } = data;
    // Resolve target
    const { contacts, recipients } = resolveTarget(target);
    const recipient = recipients[0];
    // Determine channel
    const channel = resolveChannel(via, contacts);
    if (!channel) {
        throw new Error('No valid channel available for ask action');
    }
    // Send question and wait for response
    const answer = await sendQuestion(channel, question, contacts, { schema, timeout });
    const result = {
        answer,
        answeredBy: recipient,
        answeredAt: new Date(),
        via: channel,
    };
    // Emit result event
    await $.send('Worker.answered', { ...data, result });
    return result;
}
/**
 * Handle Worker.approve action
 */
export async function handleApprove(data, $) {
    const { object: target, request, via, context, timeout, escalate } = data;
    // Resolve target
    const { contacts, recipients } = resolveTarget(target);
    const approver = recipients[0];
    // Determine channel
    const channel = resolveChannel(via, contacts);
    if (!channel) {
        throw new Error('No valid channel available for approve action');
    }
    // Send approval request and wait for response
    const response = await sendApprovalRequest(channel, request, contacts, {
        context,
        timeout,
        escalate,
    });
    const result = {
        approved: response.approved,
        approvedBy: approver,
        approvedAt: new Date(),
        notes: response.notes,
        via: channel,
    };
    // Emit result event
    await $.send(result.approved ? 'Worker.approved' : 'Worker.rejected', { ...data, result });
    return result;
}
/**
 * Handle Worker.decide action
 */
export async function handleDecide(data, $) {
    const { options, context, criteria } = data;
    // Use AI to make decision
    const result = await makeDecision(options, context, criteria);
    // Emit result event
    await $.send('Worker.decided', { ...data, result });
    return result;
}
/**
 * Handle Worker.do action
 */
export async function handleDo(data, $) {
    const { object: target, instruction, timeout, maxRetries = 3 } = data;
    const startTime = Date.now();
    const steps = [];
    let lastError;
    let result;
    // Retry loop
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            steps.push({
                action: attempt === 0 ? 'start' : `retry_${attempt}`,
                result: { instruction },
                timestamp: new Date(),
            });
            // Execute the task (this would integrate with agent execution)
            result = await executeTask(target, instruction, { timeout });
            steps.push({
                action: 'complete',
                result,
                timestamp: new Date(),
            });
            const doResult = {
                result: result,
                success: true,
                duration: Date.now() - startTime,
                steps,
            };
            await $.send('Worker.done', { ...data, result: doResult });
            return doResult;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            steps.push({
                action: 'error',
                result: { error: lastError.message, attempt },
                timestamp: new Date(),
            });
        }
    }
    // All retries failed
    const failResult = {
        result: undefined,
        success: false,
        error: lastError?.message,
        duration: Date.now() - startTime,
        steps,
    };
    await $.send('Worker.failed', { ...data, result: failResult });
    return failResult;
}
// ============================================================================
// Workflow Extension
// ============================================================================
/**
 * Register Worker action handlers with a workflow
 *
 * @example
 * ```ts
 * import { Workflow } from 'ai-workflows'
 * import { registerWorkerActions } from 'digital-workers'
 *
 * const workflow = Workflow($ => {
 *   registerWorkerActions($)
 *
 *   $.on.Expense.submitted(async (expense, $) => {
 *     const approval = await $.do('Worker.approve', {
 *       actor: 'system',
 *       object: manager,
 *       request: `Expense: $${expense.amount}`,
 *       via: 'slack',
 *     })
 *   })
 * })
 * ```
 */
export function registerWorkerActions($) {
    // Register action handlers using the proxy pattern
    // The $ context provides event registration via $.on[Namespace][event]
    const on = $.on;
    if (on.Worker) {
        on.Worker.notify?.(handleNotify);
        on.Worker.ask?.(handleAsk);
        on.Worker.approve?.(handleApprove);
        on.Worker.decide?.(handleDecide);
        on.Worker.do?.(handleDo);
    }
}
/**
 * Extend WorkflowContext with convenience methods for worker actions
 *
 * @example
 * ```ts
 * const workflow = Workflow($ => {
 *   const worker$ = withWorkers($)
 *
 *   $.on.Expense.submitted(async (expense) => {
 *     await worker$.notify(finance, `New expense: ${expense.amount}`)
 *
 *     const approval = await worker$.approve(
 *       `Expense: $${expense.amount}`,
 *       manager,
 *       { via: 'slack' }
 *     )
 *   })
 * })
 * ```
 */
export function withWorkers($) {
    const workerContext = {
        async notify(target, message, options = {}) {
            return $.do('Worker.notify', {
                actor: 'system',
                object: target,
                action: 'notify',
                message,
                ...options,
            });
        },
        async ask(target, question, options = {}) {
            return $.do('Worker.ask', {
                actor: 'system',
                object: target,
                action: 'ask',
                question,
                ...options,
            });
        },
        async approve(request, target, options = {}) {
            // Convert ActionTarget to a suitable actor reference
            const actor = typeof target === 'string'
                ? target
                : 'id' in target
                    ? { id: target.id, type: 'type' in target ? target.type : undefined, name: 'name' in target ? target.name : undefined }
                    : 'system';
            return $.do('Worker.approve', {
                actor,
                object: target,
                action: 'approve',
                request,
                ...options,
            });
        },
        async decide(options) {
            return $.do('Worker.decide', {
                actor: 'ai',
                object: 'decision',
                action: 'decide',
                ...options,
            });
        },
    };
    return { ...$, ...workerContext };
}
// ============================================================================
// Standalone Functions (for use outside workflows)
// ============================================================================
/**
 * Send a notification (standalone, non-durable)
 */
export async function notify(target, message, options = {}) {
    const { contacts, recipients } = resolveTarget(target);
    const channels = resolveChannels(options.via, contacts, options.priority || 'normal');
    if (channels.length === 0) {
        return { sent: false, via: [], messageId: generateId('msg') };
    }
    const delivery = await Promise.all(channels.map(async (channel) => {
        try {
            await sendToChannel(channel, message, contacts, { priority: options.priority });
            return { channel, status: 'sent' };
        }
        catch (error) {
            return { channel, status: 'failed', error: String(error) };
        }
    }));
    return {
        sent: delivery.some((d) => d.status === 'sent'),
        via: channels,
        recipients,
        sentAt: new Date(),
        messageId: generateId('msg'),
        delivery,
    };
}
/**
 * Ask a question (standalone, non-durable)
 */
export async function ask(target, question, options = {}) {
    const { contacts, recipients } = resolveTarget(target);
    const channel = resolveChannel(options.via, contacts);
    if (!channel) {
        throw new Error('No valid channel available');
    }
    const answer = await sendQuestion(channel, question, contacts, options);
    return {
        answer,
        answeredBy: recipients[0],
        answeredAt: new Date(),
        via: channel,
    };
}
/**
 * Request approval (standalone, non-durable)
 */
export async function approve(request, target, options = {}) {
    const { contacts, recipients } = resolveTarget(target);
    const channel = resolveChannel(options.via, contacts);
    if (!channel) {
        throw new Error('No valid channel available');
    }
    const response = await sendApprovalRequest(channel, request, contacts, options);
    return {
        approved: response.approved,
        approvedBy: recipients[0],
        approvedAt: new Date(),
        notes: response.notes,
        via: channel,
    };
}
/**
 * Make a decision (standalone, non-durable)
 */
export async function decide(options) {
    return makeDecision(options.options, options.context, options.criteria);
}
// ============================================================================
// Internal Helpers
// ============================================================================
function resolveTarget(target) {
    if (typeof target === 'string') {
        return { contacts: {}, recipients: [{ id: target }] };
    }
    if ('contacts' in target) {
        const recipients = 'members' in target
            ? target.members
            : [{ id: target.id, type: target.type, name: target.name }];
        return { contacts: target.contacts, recipients };
    }
    return { contacts: {}, recipients: [target] };
}
function resolveChannels(via, contacts, priority) {
    if (via) {
        const requested = Array.isArray(via) ? via : [via];
        return requested.filter((c) => contacts[c] !== undefined);
    }
    const available = Object.keys(contacts);
    if (available.length === 0)
        return [];
    const firstChannel = available[0];
    if (!firstChannel)
        return [];
    if (priority === 'urgent') {
        const urgentChannels = ['slack', 'sms', 'phone'];
        const urgent = available.filter((c) => urgentChannels.includes(c));
        return urgent.length > 0 ? urgent : [firstChannel];
    }
    return [firstChannel];
}
function resolveChannel(via, contacts) {
    if (via) {
        const channel = Array.isArray(via) ? via[0] : via;
        if (channel && contacts[channel] !== undefined)
            return channel;
    }
    const available = Object.keys(contacts);
    const first = available[0];
    return first ?? null;
}
async function sendToChannel(channel, message, contacts, options) {
    // In a real implementation, this would send via Slack API, SendGrid, Twilio, etc.
    await new Promise((resolve) => setTimeout(resolve, 10));
}
async function sendQuestion(channel, question, contacts, options) {
    // In a real implementation, this would send the question and wait for response
    await new Promise((resolve) => setTimeout(resolve, 10));
    return 'Pending response...';
}
async function sendApprovalRequest(channel, request, contacts, options) {
    // In a real implementation, this would send approval request and wait
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { approved: false, notes: 'Pending approval...' };
}
async function makeDecision(options, context, criteria) {
    if (options.length === 0) {
        throw new Error('At least one option is required for a decision');
    }
    // In a real implementation, this would use AI to make a decision
    // For now, return first option with mock data
    const choice = options[0];
    return {
        choice,
        reasoning: 'Decision pending...',
        confidence: 0.5,
        alternatives: options.slice(1).map((opt, i) => ({
            option: opt,
            score: 50 - i * 10,
        })),
    };
}
async function executeTask(target, instruction, options) {
    // In a real implementation, this would execute the task via the target worker
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { completed: true, instruction };
}
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
