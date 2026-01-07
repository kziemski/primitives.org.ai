/**
 * Notification functionality for digital workers
 */
/**
 * Send a notification to a worker or team
 *
 * Routes notifications through the specified channel(s), falling back
 * to the target's preferred channel if not specified.
 *
 * @param target - The worker or team to notify
 * @param message - The notification message
 * @param options - Notification options
 * @returns Promise resolving to notification result
 *
 * @example
 * ```ts
 * // Notify a worker via their preferred channel
 * await notify(alice, 'Deployment completed successfully')
 *
 * // Notify via specific channel
 * await notify(alice, 'Urgent: Server down!', { via: 'slack' })
 *
 * // Notify via multiple channels
 * await notify(alice, 'Critical alert', { via: ['slack', 'sms'] })
 *
 * // Notify a team
 * await notify(engineering, 'Sprint planning tomorrow', { via: 'slack' })
 * ```
 */
export async function notify(target, message, options = {}) {
    const { via, priority = 'normal', fallback = false, timeout, context, metadata } = options;
    // Resolve target to get contacts
    const { contacts, recipients } = resolveTarget(target);
    // Determine which channels to use
    const channels = resolveChannels(via, contacts, priority);
    if (channels.length === 0) {
        return {
            sent: false,
            via: [],
            sentAt: new Date(),
            messageId: generateMessageId(),
            delivery: [],
        };
    }
    // Send to each channel
    const delivery = await Promise.all(channels.map(async (channel) => {
        try {
            await sendToChannel(channel, message, contacts, { priority, metadata });
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
    return {
        sent,
        via: channels,
        recipients,
        sentAt: new Date(),
        messageId: generateMessageId(),
        delivery,
    };
}
/**
 * Send a high-priority alert notification
 *
 * @example
 * ```ts
 * await notify.alert(oncallEngineer, 'Production is down!')
 * ```
 */
notify.alert = async (target, message, options = {}) => {
    return notify(target, message, { ...options, priority: 'urgent' });
};
/**
 * Send a low-priority info notification
 *
 * @example
 * ```ts
 * await notify.info(team, 'Weekly sync notes posted')
 * ```
 */
notify.info = async (target, message, options = {}) => {
    return notify(target, message, { ...options, priority: 'low' });
};
/**
 * Send a rich notification with title and body
 *
 * @example
 * ```ts
 * await notify.rich(alice, 'Deployment Complete', 'Version 2.1.0 deployed to production', {
 *   via: 'slack',
 *   metadata: { version: '2.1.0', environment: 'production' },
 * })
 * ```
 */
notify.rich = async (target, title, body, options = {}) => {
    const message = `**${title}**\n\n${body}`;
    return notify(target, message, options);
};
/**
 * Send notifications in batch
 *
 * @example
 * ```ts
 * await notify.batch([
 *   { target: alice, message: 'Task 1 complete' },
 *   { target: bob, message: 'Task 2 complete' },
 *   { target: team, message: 'All tasks done', options: { via: 'slack' } },
 * ])
 * ```
 */
notify.batch = async (notifications) => {
    return Promise.all(notifications.map(({ target, message, options }) => notify(target, message, options)));
};
/**
 * Schedule a notification for later
 *
 * @example
 * ```ts
 * // Schedule for specific time
 * await notify.schedule(alice, 'Meeting in 15 minutes', new Date('2024-01-15T14:45:00Z'))
 *
 * // Schedule with delay
 * await notify.schedule(alice, 'Reminder', 60000)  // 1 minute
 * ```
 */
notify.schedule = async (target, message, when, options = {}) => {
    const scheduledFor = when instanceof Date ? when : new Date(Date.now() + when);
    // In a real implementation, this would store the scheduled notification
    return {
        scheduled: true,
        scheduledFor,
        messageId: generateMessageId('scheduled'),
    };
};
// ============================================================================
// Internal Helpers
// ============================================================================
/**
 * Resolve an action target to contacts and recipients
 */
function resolveTarget(target) {
    if (typeof target === 'string') {
        // Just an ID - return empty contacts, would need to look up
        return {
            contacts: {},
            recipients: [{ id: target }],
        };
    }
    if ('contacts' in target) {
        // Worker or Team
        const recipients = 'members' in target
            ? target.members // Team
            : [{ id: target.id, type: target.type, name: target.name }]; // Worker
        return {
            contacts: target.contacts,
            recipients,
        };
    }
    // WorkerRef - no contacts available
    return {
        contacts: {},
        recipients: [target],
    };
}
/**
 * Determine which channels to use based on options and contacts
 */
function resolveChannels(via, contacts, priority) {
    // If specific channels requested, use those
    if (via) {
        const requested = Array.isArray(via) ? via : [via];
        // Filter to only channels that exist in contacts
        return requested.filter((channel) => contacts[channel] !== undefined);
    }
    // Otherwise, use available channels based on priority
    const available = Object.keys(contacts);
    if (available.length === 0) {
        return [];
    }
    const firstChannel = available[0];
    if (!firstChannel) {
        return [];
    }
    // For urgent, try multiple channels
    if (priority === 'urgent') {
        const urgentChannels = ['slack', 'sms', 'phone'];
        return available.filter((c) => urgentChannels.includes(c));
    }
    // Default to first available
    return [firstChannel];
}
/**
 * Send a notification to a specific channel
 */
async function sendToChannel(channel, message, contacts, options) {
    const contact = contacts[channel];
    if (!contact) {
        throw new Error(`No ${channel} contact configured`);
    }
    // In a real implementation, this would:
    // 1. Format the message for the channel
    // 2. Send via the appropriate API (Slack, SendGrid, Twilio, etc.)
    // 3. Handle delivery confirmation
    // For now, simulate success
    await new Promise((resolve) => setTimeout(resolve, 10));
}
/**
 * Generate a unique message ID
 */
function generateMessageId(prefix = 'msg') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
