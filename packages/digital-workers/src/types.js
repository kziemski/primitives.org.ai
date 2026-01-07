/**
 * Type definitions for digital-workers
 *
 * Digital workers (Agents and Humans) communicate through Actions that integrate
 * with the ai-workflows system. Worker actions (notify, ask, approve, decide)
 * are durable workflow actions with Actor/Object semantics.
 *
 * ## Key Concepts
 *
 * - **Worker**: Common interface for Agent and Human
 * - **Contacts**: How a worker can be reached (email, slack, phone, etc.)
 * - **Action**: Durable workflow action (notify, ask, approve, decide)
 * - **Team**: Group of workers with shared contacts
 *
 * @packageDocumentation
 */
// ============================================================================
// Worker Verbs - Following ai-database Verb pattern
// ============================================================================
/**
 * Worker verbs following the ai-database conjugation pattern
 *
 * Each verb has:
 * - action: Base form (notify, ask, approve, decide)
 * - actor: Who does it (notifier, asker, approver, decider)
 * - activity: Gerund (notifying, asking, approving, deciding)
 * - reverse: Past forms (notifiedAt, notifiedBy, askedAt, etc.)
 */
export const WorkerVerbs = {
    notify: {
        action: 'notify',
        actor: 'notifier',
        act: 'notifies',
        activity: 'notifying',
        result: 'notification',
        reverse: { at: 'notifiedAt', by: 'notifiedBy', via: 'notifiedVia' },
    },
    ask: {
        action: 'ask',
        actor: 'asker',
        act: 'asks',
        activity: 'asking',
        result: 'question',
        reverse: { at: 'askedAt', by: 'askedBy', via: 'askedVia' },
    },
    approve: {
        action: 'approve',
        actor: 'approver',
        act: 'approves',
        activity: 'approving',
        result: 'approval',
        reverse: { at: 'approvedAt', by: 'approvedBy', via: 'approvedVia' },
        inverse: 'reject',
    },
    decide: {
        action: 'decide',
        actor: 'decider',
        act: 'decides',
        activity: 'deciding',
        result: 'decision',
        reverse: { at: 'decidedAt', by: 'decidedBy' },
    },
    do: {
        action: 'do',
        actor: 'doer',
        act: 'does',
        activity: 'doing',
        result: 'task',
        reverse: { at: 'doneAt', by: 'doneBy' },
    },
};
